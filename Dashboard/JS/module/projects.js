import { $, log, initSortFilter as initCommonSortFilter } from './utils.js';
import {
    addProject,
    deleteProject as storageDelete,
    updateProject,
    getProjects,
    getEmployees,
    formatCurrency,
    escapeHtml,
    getCurrentPeriod,
    getWeekdaysInMonth,
    getWeekdayVacationDays,
} from './dataStorage.js';

let sortColumn = null;
let sortDirection = 'asc';

function calculateUsedCapacity(projectName) {
    const employees = getEmployees();
    const period = getCurrentPeriod();
    const [currentYear, currentMonth] = period.split('-').map(Number);
    const weekdaysInMonth = getWeekdaysInMonth();
    
    const projectEmployees = employees.filter((e) => e.project === projectName);

    return projectEmployees.reduce((sum, emp) => {
        const capacity = emp.capacity || 1;
        const fit = emp.fit || 1;
        const weekdayVacations = getWeekdayVacationDays(emp.vacationDays || [], currentYear, currentMonth);
        const vacationCoefficient = weekdaysInMonth > 0 
            ? (weekdaysInMonth - weekdayVacations) / weekdaysInMonth 
            : 0;
        return sum + capacity * fit * vacationCoefficient;
    }, 0);
}

function calculateEstimatedIncome(projectName, budget) {
    const employees = getEmployees();
    const period = getCurrentPeriod();
    const [currentYear, currentMonth] = period.split('-').map(Number);
    const weekdaysInMonth = getWeekdaysInMonth();
    
    const projectEmployees = employees.filter((e) => e.project === projectName);

    // Calculate total effective capacity used
    const totalEffectiveCapacity = projectEmployees.reduce((sum, emp) => {
        const capacity = emp.capacity || 1;
        const fit = emp.fit || 1;
        const weekdayVacations = getWeekdayVacationDays(emp.vacationDays || [], currentYear, currentMonth);
        const vacationCoefficient = weekdaysInMonth > 0 
            ? (weekdaysInMonth - weekdayVacations) / weekdaysInMonth 
            : 0;
        return sum + capacity * fit * vacationCoefficient;
    }, 0);

    // Get project capacity from employeeCapacity field (project doesn't have separate capacity)
    const projectCapacity = 0;

    // Capacity for revenue = max(project capacity, total effective capacity used)
    const capacityForRevenue = Math.max(projectCapacity, totalEffectiveCapacity);

    // If no capacity, no revenue
    if (capacityForRevenue === 0) {
        return 0;
    }

    // Revenue per effective capacity = budget ÷ capacity for revenue
    const revenuePerEffectiveCapacity = budget / capacityForRevenue;

    // Total revenue = revenue per effective capacity × total effective capacity used
    const totalRevenue = revenuePerEffectiveCapacity * totalEffectiveCapacity;

    return totalRevenue;
}

function calculateProjectProfit(projectName, budget) {
    const employees = getEmployees();
    const period = getCurrentPeriod();
    const [currentYear, currentMonth] = period.split('-').map(Number);
    const weekdaysInMonth = getWeekdaysInMonth();
    
    const projectEmployees = employees.filter((e) => e.project === projectName);

    // Calculate total effective capacity
    const totalEffectiveCapacity = projectEmployees.reduce((sum, emp) => {
        const capacity = emp.capacity || 1;
        const fit = emp.fit || 1;
        const weekdayVacations = getWeekdayVacationDays(emp.vacationDays || [], currentYear, currentMonth);
        const vacationCoefficient = weekdaysInMonth > 0 
            ? (weekdaysInMonth - weekdayVacations) / weekdaysInMonth 
            : 0;
        return sum + capacity * fit * vacationCoefficient;
    }, 0);

    // Capacity for revenue
    const capacityForRevenue = totalEffectiveCapacity;

    if (capacityForRevenue === 0) {
        // All employees have bench cost
        return projectEmployees.reduce((sum, emp) => {
            const cost = (emp.salary || 0) * Math.max(0.5, emp.capacity || 1);
            return sum - cost;
        }, 0);
    }

    const revenuePerEffectiveCapacity = budget / capacityForRevenue;

    // Calculate total revenue and total cost
    let totalRevenue = 0;
    let totalCost = 0;

    projectEmployees.forEach((emp) => {
        const empCapacity = emp.capacity || 1;
        const empFit = emp.fit || 1;
        const weekdayVacations = getWeekdayVacationDays(emp.vacationDays || [], currentYear, currentMonth);
        const vacationCoefficient = weekdaysInMonth > 0 
            ? (weekdaysInMonth - weekdayVacations) / weekdaysInMonth 
            : 0;
        const empEffectiveCapacity = empCapacity * empFit * vacationCoefficient;
        
        const empRevenue = revenuePerEffectiveCapacity * empEffectiveCapacity;
        const empCost = (emp.salary || 0) * Math.max(0.5, empCapacity);
        
        totalRevenue += empRevenue;
        totalCost += empCost;
    });

    return totalRevenue - totalCost;
}

function sortAndFilterProjects(projects) {
    let result = [...projects];

    // Apply column-specific filters
    const filterableColumns = ['companyName', 'projectName'];
    filterableColumns.forEach((column) => {
        const columnFilter = window[`filter_${column}`];
        if (columnFilter) {
            result = result.filter((p) => {
                const value = p[column];
                return value && value.toLowerCase().includes(columnFilter);
            });
        }
    });

    if (sortColumn) {
        result.sort((a, b) => {
            let valA, valB;
            switch (sortColumn) {
                case 'companyName':
                    valA = a.companyName;
                    valB = b.companyName;
                    break;
                case 'projectName':
                    valA = a.projectName;
                    valB = b.projectName;
                    break;
                case 'budget':
                    valA = a.budget;
                    valB = b.budget;
                    break;
                case 'employeeCapacity':
                    valA = a.employeeCapacity;
                    valB = b.employeeCapacity;
                    break;
                case 'estimatedIncome':
                    valA = calculateProjectProfit(a.projectName, a.budget);
                    valB = calculateProjectProfit(b.projectName, b.budget);
                    break;
                default:
                    return 0;
            }

            if (typeof valA === 'string') {
                return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return sortDirection === 'asc' ? valA - valB : valB - valA;
        });
    }

    updateProjectTableSortIcons();
    return result;
}

function updateProjectTableSortIcons() {
    const thead = $('#projects-thead');
    if (!thead) return;

    const headers = thead.querySelectorAll('th.sortable');
    headers.forEach((th) => {
        const sortIcon = th.querySelector('.sort-icon');
        if (sortIcon) {
            if (th.dataset.sort === sortColumn) {
                sortIcon.textContent = sortDirection === 'asc' ? '↑' : '↓';
            } else {
                sortIcon.textContent = '⇅';
            }
        }
    });
}

function renderProjects() {
    const tbody = $('#projects-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const projects = sortAndFilterProjects(getProjects());
    log('renderProjects: got ' + projects.length + ' projects');
    projects.forEach((project) => {
        renderProjectRow(project);
    });

    renderProjectsSummary(projects);
}

function renderProjectsSummary(projects) {
    const summary = $('#projects-summary');
    if (!summary) return;

    const totalIncome = projects.reduce((sum, project) => {
        return sum + calculateProjectProfit(project.projectName, project.budget);
    }, 0);

    const totalClass = totalIncome > 0 ? 'income-positive' : totalIncome < 0 ? 'income-negative' : '';

    summary.innerHTML = `
        <span class="total-label">Total Projected Income:</span>
        <span class="total-value ${totalClass}">${formatCurrency(totalIncome)}</span>
    `;
}

function renderProjectRow(project) {
    const tbody = $('#projects-tbody');
    if (!tbody) return;

    const usedCapacity = calculateUsedCapacity(project.projectName);
    const totalCapacity = project.employeeCapacity || 0;
    const employeeCount = getEmployees().filter((e) => e.project === project.projectName).length;
    const projectProfit = calculateProjectProfit(project.projectName, project.budget);
    const overCapacity = usedCapacity > totalCapacity;

    const incomeClass = projectProfit > 0 ? 'income-positive' : projectProfit < 0 ? 'income-negative' : '';
    const capacityClass = overCapacity ? 'over-capacity' : '';

    const tr = document.createElement('tr');
    tr.dataset.id = project.id;
    tr.innerHTML = `
        <td>${escapeHtml(project.companyName)}</td>
        <td>${escapeHtml(project.projectName)}</td>
        <td>${formatCurrency(project.budget)}</td>
        <td class="${capacityClass}">${usedCapacity.toFixed(1)}/${totalCapacity}</td>
        <td><button class="show-employees-btn" data-id="${project.id}">Show Employees (${employeeCount})</button></td>
        <td class="${incomeClass}">${formatCurrency(projectProfit)}</td>
        <td>
            <button class="edit-btn" data-id="${project.id}">Edit</button>
            <button class="delete-btn" data-id="${project.id}">Delete</button>
        </td>
    `;

    tbody.appendChild(tr);

    const editBtn = tr.querySelector('.edit-btn');
    const showEmpBtn = tr.querySelector('.show-employees-btn');
    const deleteBtn = tr.querySelector('.delete-btn');

    editBtn.addEventListener('click', () => {
        log('Edit button clicked for project: ' + project.id);
        handleEditProject(project.id);
    });
    showEmpBtn.addEventListener('click', () => {
        log('Show employees for project: ' + project.id);
        window.dispatchEvent(new CustomEvent('showProjectEmployees', { detail: { projectId: project.id } }));
    });
    deleteBtn.addEventListener('click', () => {
        handleDeleteProject(project.id);
    });
}

function handleDeleteProject(id) {
    const row = $(`tr[data-id="${id}"]`);
    if (row) {
        row.remove();
        storageDelete(id);
        log(`Project deleted: ${id}`);
    }
}

function handleEditProject(id, projectData) {
    log(`handleEditProject called with id: ${id}`);
    if (projectData) {
        updateProject(id, projectData);
        log(`Project updated: ${projectData.projectName}`);
        renderProjects();
    } else {
        const projects = getProjects();
        const project = projects.find((p) => p.id === id);
        if (project && window.openAddProjectEditModal) {
            window.openAddProjectEditModal(project);
        }
    }
}

export function initProjects() {
    const tbody = $('#projects-tbody');

    if (!tbody) {
        log('Projects tbody not found');
        return;
    }

    window.addProjectCallback = handleAddProject;
    window.editProjectCallback = handleEditProject;

    initSortFilter();
    renderProjects();
    log('Projects module initialized');
}

function initSortFilter() {
    initCommonSortFilter({
        theadSelector: '#projects-thead',
        renderFunction: renderProjects,
        getSortState: () => ({ column: sortColumn, direction: sortDirection }),
        setSortState: ({ column, direction }) => {
            sortColumn = column;
            sortDirection = direction;
            updateClearButtonVisibility();
        },
    });

    // Show/hide clear button on initial load
    updateClearButtonVisibility();

    // Listen for column filter events
    window.addEventListener('applyColumnFilter', (e) => {
        const { column, value } = e.detail;
        applyColumnFilter(column, value);
        updateClearButtonVisibility();
    });

    // Reset filters button
    const clearBtn = $('#clear-project-filters-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            resetAllFilters();
        });
    }
}

function applyColumnFilter(column, value) {
    const thead = $('#projects-thead');
    if (!thead) return;

    const th = thead.querySelector(`th[data-filter="${column}"]`);
    if (!th) return;

    const sortIcon = th.querySelector('.sort-icon');
    const filterIcon = th.querySelector('.filter-icon');

    if (sortIcon) {
        sortIcon.textContent = value ? '↓' : '⇅';
    }
    if (filterIcon) {
        filterIcon.textContent = value ? '⌕' : '⌕';
        filterIcon.style.color = value ? '#1abc9c' : '';
    }

    // Store column-specific filter
    if (value) {
        window[`filter_${column}`] = value.toLowerCase();
    } else {
        window[`filter_${column}`] = '';
    }

    renderProjects();
}

function updateClearButtonVisibility() {
    const clearBtn = $('#clear-project-filters-btn');
    if (clearBtn) {
        const hasFilters = window.filter_companyName ||
            window.filter_projectName ||
            sortColumn;
        clearBtn.style.display = hasFilters ? 'flex' : 'none';
    }
}

function resetAllFilters() {
    sortColumn = null;
    sortDirection = 'asc';

    // Clear all column-specific filters
    const filterableColumns = ['companyName', 'projectName'];
    filterableColumns.forEach((column) => {
        window[`filter_${column}`] = '';
    });

    // Reset column filter icons
    const thead = $('#projects-thead');
    if (thead) {
        const filterableHeaders = thead.querySelectorAll('th.filterable');
        filterableHeaders.forEach((th) => {
            const filterIcon = th.querySelector('.filter-icon');
            if (filterIcon) {
                filterIcon.style.color = '';
            }
        });
    }

    renderProjects();
    updateClearButtonVisibility();
}

export function handleAddProject(projectData) {
    const newProject = addProject(projectData);
    renderProjectRow(newProject);
    log(`Project added: ${newProject.projectName}`);
}

export { getProjects, renderProjects };
