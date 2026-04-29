import { $, log, initSortFilter as initCommonSortFilter, renderFilterChips, getFilterDisplayName } from './utils.js';
import {
    addEmployee,
    deleteEmployee,
    updateEmployee,
    getEmployees,
    getProjects,
    formatCurrency,
    escapeHtml,
    getCurrentPeriod,
    getWeekdaysInMonth,
    getWeekdayVacationDays,
} from './dataStorage.js';
import { renderProjects } from './projects.js';
import { initInlineEditListeners, setRenderCallback } from './inlineEdit.js';

let sortColumn = null;
let sortDirection = 'asc';
let projectFilter = '';

function sortAndFilterEmployees(employees) {
    let result = [...employees];

    if (projectFilter) {
        result = result.filter((e) => e.project && e.project.toLowerCase().includes(projectFilter.toLowerCase()));
    }

    const filterableColumns = [
        'name',
        'surname',
        'age',
        'position',
        'salary',
        'estimatedPayment',
        'project',
        'estimatedIncome',
    ];
    filterableColumns.forEach((column) => {
        if (column === 'project') return;
        const columnFilter = window[`filter_${column}`];
        if (columnFilter) {
            result = result.filter((e) => {
                let value;
                if (column === 'project') {
                    value = getProjectNameById(e.project);
                } else {
                    value = e[column];
                }
                return value != null && value.toString().toLowerCase().includes(columnFilter);
            });
        }
    });

    if (sortColumn) {
        result.sort((a, b) => {
            let valA, valB;
            switch (sortColumn) {
                case 'name':
                    valA = a.name;
                    valB = b.name;
                    break;
                case 'surname':
                    valA = a.surname;
                    valB = b.surname;
                    break;
                case 'age':
                    valA = a.age;
                    valB = b.age;
                    break;
                case 'position':
                    valA = a.position;
                    valB = b.position;
                    break;
                case 'salary':
                    valA = a.salary;
                    valB = b.salary;
                    break;
                case 'estimatedPayment':
                    valA = a.estimatedPayment || 0;
                    valB = b.estimatedPayment || 0;
                    break;
                case 'project':
                    valA = getProjectNameById(a.project);
                    valB = getProjectNameById(b.project);
                    break;
                case 'estimatedIncome':
                    valA = a.profit || 0;
                    valB = b.profit || 0;
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

    updateEmployeeTableSortIcons();
    return result;
}

function updateEmployeeTableSortIcons() {
    const thead = $('#employees-thead');
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

function renderEmployees() {
    const tbody = $('#employees-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const employees = sortAndFilterEmployees(getEmployees());
    log(`renderEmployees: found ${employees.length} employees`);
    employees.forEach((employee) => {
        renderEmployeeRow(employee);
    });

    updateEmployeeFilterChips();
}

function renderEmployeeRow(employee) {
    const tbody = $('#employees-tbody');
    if (!tbody) return;

    const assignedCapacity = parseFloat(employee.assignedCapacity) || 0;
    const isAssignDisabled = assignedCapacity >= 1.5;

    const allEmployees = getEmployees();
    let projectUsedCapacity = 0;
    let projectTotalCapacity = 0;
    const projectEmployees = employee.project ? allEmployees.filter((e) => e.project === employee.project) : [];
    const projectEmployeeCount = projectEmployees.length;

    if (employee.project) {
        const projects = getProjects();
        const project = projects.find((p) => p.projectName === employee.project);
        projectTotalCapacity = project ? project.employeeCapacity || 0 : 0;

        const period = getCurrentPeriod();
        const [currentYear, currentMonth] = period.split('-').map(Number);
        const weekdaysInMonth = getWeekdaysInMonth();

        projectUsedCapacity = projectEmployees.reduce((sum, emp) => {
            const capacity = emp.capacity || 1;
            const fit = emp.fit || 1;
            const weekdayVacations = getWeekdayVacationDays(emp.vacationDays || [], currentYear, currentMonth);
            const vacationCoefficient =
                weekdaysInMonth > 0 ? (weekdaysInMonth - weekdayVacations) / weekdaysInMonth : 0;
            return sum + capacity * fit * vacationCoefficient;
        }, 0);
    }

    const template = $('#employee-row-template');
    const tr = template.content.cloneNode(true).firstElementChild;
    tr.dataset.id = employee.id;

    const nameEl = tr.querySelector('.emp-name');
    const surnameEl = tr.querySelector('.emp-surname');
    const ageEl = tr.querySelector('.emp-age');
    const positionCell = tr.querySelector('.position-cell');
    const salaryCell = tr.querySelector('.salary-cell');
    const estimatedPaymentEl = tr.querySelector('.estimated-payment');
    const projectCell = tr.querySelector('.project-cell');
    const estimatedIncomeEl = tr.querySelector('.estimated-income');
    const actionsCell = tr.querySelector('.actions');

    if (nameEl) nameEl.textContent = employee.name;
    if (surnameEl) surnameEl.textContent = employee.surname;
    if (ageEl) ageEl.textContent = employee.age;

    if (positionCell) {
        const positionSpan = positionCell.querySelector('.position-value');
        const pencil = positionCell.querySelector('.edit-pencil');
        if (positionSpan) positionSpan.textContent = employee.position;
        if (pencil) {
            pencil.dataset.field = 'position';
            pencil.dataset.id = employee.id;
        }
    }

    if (salaryCell) {
        const salarySpan = salaryCell.querySelector('.salary-value');
        const pencil = salaryCell.querySelector('.edit-pencil');
        if (salarySpan) salarySpan.textContent = formatCurrency(employee.salary);
        if (pencil) {
            pencil.dataset.field = 'salary';
            pencil.dataset.id = employee.id;
        }
    }

    if (estimatedPaymentEl) estimatedPaymentEl.textContent = formatCurrency(employee.estimatedPayment);
    if (estimatedIncomeEl) {
        estimatedIncomeEl.textContent = formatCurrency(employee.profit);
        
        const profit = employee.profit || 0;
        estimatedIncomeEl.classList.remove('income-positive', 'income-negative');
        if (profit > 0) {
            estimatedIncomeEl.classList.add('income-positive');
        } else if (profit < 0) {
            estimatedIncomeEl.classList.add('income-negative');
        }
    }

    if (projectCell) {
        const projectNameSpan = projectCell.querySelector('.project-name');
        const showBtn = projectCell.querySelector('.show-assignments-btn');
        if (projectNameSpan) projectNameSpan.textContent = employee.project || '-';
        if (showBtn) {
            if (employee.project) {
                showBtn.style.display = '';
                showBtn.dataset.project = employee.project;
                showBtn.textContent = `Show Assignments (${projectEmployeeCount}) ${projectUsedCapacity.toFixed(1)}/${projectTotalCapacity}`;
            } else {
                showBtn.style.display = 'none';
            }
        }
    }

    const availBtn = tr.querySelector('.availability-btn');
    const assignBtn = tr.querySelector('.assign-btn');
    const editBtn = tr.querySelector('.edit-btn');
    const deleteBtn = tr.querySelector('.delete-btn');

    if (availBtn) {
        availBtn.dataset.id = employee.id;
        availBtn.addEventListener('click', () => {
            log('Availability button clicked for employee: ' + employee.id);
            window.dispatchEvent(new CustomEvent('showAvailabilityCalendar', { detail: { employeeId: employee.id } }));
        });
    }

    if (assignBtn) {
        assignBtn.dataset.id = employee.id;
        if (isAssignDisabled) {
            assignBtn.disabled = true;
            assignBtn.style.opacity = '0.5';
            assignBtn.style.cursor = 'not-allowed';
        } else {
            assignBtn.disabled = false;
            assignBtn.style.opacity = '';
            assignBtn.style.cursor = '';
        }
        assignBtn.addEventListener('click', (e) => {
            log('Assign button clicked for employee: ' + employee.id);
            const buttonRect = assignBtn.getBoundingClientRect();
            window.dispatchEvent(
                new CustomEvent('showAssignEmployee', {
                    detail: {
                        employeeId: employee.id,
                        buttonX: buttonRect.left + buttonRect.width / 2,
                        buttonY: buttonRect.top + buttonRect.height,
                        buttonWidth: buttonRect.width,
                        buttonHeight: buttonRect.height,
                    },
                })
            );
        });
    }

    if (editBtn) {
        editBtn.dataset.id = employee.id;
        editBtn.addEventListener('click', () => {
            log('Edit button clicked for employee: ' + employee.id);
            handleEditEmployee(employee.id);
        });
    }

    if (deleteBtn) {
        deleteBtn.dataset.id = employee.id;
        deleteBtn.addEventListener('click', () => {
            log('Delete button clicked for employee: ' + employee.id);
            handleDeleteEmployee(employee.id);
        });
    }

    const showAssignmentsBtn = tr.querySelector('.show-assignments-btn');
    if (showAssignmentsBtn && employee.project) {
        showAssignmentsBtn.addEventListener('click', () => {
            log('Show assignments button clicked for project: ' + employee.project);
            const projects = getProjects();
            const project = projects.find((p) => p.projectName === employee.project);
            if (project) {
                window.dispatchEvent(new CustomEvent('showProjectEmployees', { detail: { projectId: project.id } }));
            }
        });
    }

    tbody.appendChild(tr);
}

function handleDeleteEmployee(id) {
    const row = $(`tr[data-id="${id}"]`);
    if (row) {
        row.remove();
        deleteEmployee(id);
        log(`Employee deleted: ${id}`);
    }
}

function handleEditEmployee(id, employeeData) {
    log(`handleEditEmployee called with id: ${id}`);
    if (employeeData) {
        updateEmployee(id, employeeData);
        log(`Employee updated: ${employeeData.name} ${employeeData.surname}`);
        renderEmployees();
    } else {
        const employees = getEmployees();
        const employee = employees.find((e) => e.id === id);
        if (employee && window.openAddEmployeeEditModal) {
            window.openAddEmployeeEditModal(employee);
        }
    }
}

export function initEmployees() {
    const tbody = $('#employees-tbody');

    if (!tbody) {
        log('Employees tbody not found');
        return;
    }

    const filterableColumns = [
        'name',
        'surname',
        'age',
        'position',
        'salary',
        'estimatedPayment',
        'project',
        'estimatedIncome',
    ];
    filterableColumns.forEach((column) => {
        window[`filter_${column}`] = '';
    });

    
    const thead = $('#employees-thead');
    if (thead) {
        filterableColumns.forEach((column) => {
            const th = thead.querySelector(`th[data-filter="${column}"]`);
            if (th) {
                const filterIcon = th.querySelector('.filter-icon');
                if (filterIcon) {
                    filterIcon.style.color = '';
                }
            }
        });
    }

    window.addEmployeeCallback = handleAddEmployee;
    window.editEmployeeCallback = handleEditEmployee;

    log('addEmployeeCallback registered: ' + typeof window.addEmployeeCallback);
    log('editEmployeeCallback registered: ' + typeof window.editEmployeeCallback);

    
    setRenderCallback(renderEmployees);

    initSortFilter();
    initInlineEditListeners();
    renderEmployees();
    log('Employees module initialized');
}

function initSortFilter() {
    initCommonSortFilter({
        theadSelector: '#employees-thead',
        renderFunction: renderEmployees,
        getSortState: () => ({ column: sortColumn, direction: sortDirection }),
        setSortState: ({ column, direction }) => {
            sortColumn = column;
            sortDirection = direction;
            updateClearButtonVisibility();
        },
        extraListeners: {
            showProjectEmployees: (e) => {
                projectFilter = e.detail.projectId;
                updateClearButtonVisibility();
                renderEmployees();
                updateEmployeeFilterChips();
            },
        },
    });

    
    const clearBtn = $('#clear-employee-filters-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            resetAllFilters();
        });
    }

    
    updateClearButtonVisibility();

    
    window.addEventListener('applyColumnFilter', (e) => {
        const { column, value } = e.detail;
        applyColumnFilter(column, value);
        updateClearButtonVisibility();
    });

    
    window.addEventListener('assignEmployee', (e) => {
        const { employeeId, employeeData } = e.detail;
        log('Assigning employee: ' + employeeId);
        updateEmployee(employeeId, employeeData);
        renderEmployees();
        renderProjects();
    });

    
    window.addEventListener('setVacation', (e) => {
        const { employeeId, employeeData } = e.detail;
        log('Setting vacation for employee: ' + employeeId);
        log('Vacation days:', employeeData.vacationDays);
        updateEmployee(employeeId, employeeData);
        renderEmployees();
        renderProjects();
    });

    
    window.addEventListener('inlineEditEmployee', (e) => {
        const { employeeId, employeeData } = e.detail;
        log('Inline editing employee: ' + employeeId);
        updateEmployee(employeeId, employeeData);
        renderEmployees();
        renderProjects();
    });

    
    window.addEventListener('closeProjectEmployeesModal', () => {
        projectFilter = '';
        updateClearButtonVisibility();
        renderEmployees();
        updateEmployeeFilterChips();
    });
}

export { getEmployees, renderEmployees };

function applyColumnFilter(column, value) {
    const thead = $('#employees-thead');
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

    
    if (column === 'project') {
        projectFilter = value; 
    } else {
        if (value) {
            window[`filter_${column}`] = value.toLowerCase();
        } else {
            window[`filter_${column}`] = '';
        }
    }

    renderEmployees();
    updateEmployeeFilterChips();
}

function updateClearButtonVisibility() {
    const clearBtn = $('#clear-employee-filters-btn');
    if (clearBtn) {
        const filterableColumns = [
            'name',
            'surname',
            'age',
            'position',
            'salary',
            'estimatedPayment',
            'estimatedIncome',
        ];
        const activeColumnFilters = filterableColumns.filter((col) => window[`filter_${col}`]).length;
        const activeFiltersCount = activeColumnFilters + (projectFilter ? 1 : 0);

        clearBtn.style.display = activeFiltersCount >= 2 ? 'flex' : 'none';
    }
}

function resetAllFilters() {
    sortColumn = null;
    sortDirection = 'asc';
    projectFilter = '';

    
    const filterableColumns = [
        'name',
        'surname',
        'age',
        'position',
        'salary',
        'estimatedPayment',
        'project',
        'estimatedIncome',
    ];
    filterableColumns.forEach((column) => {
        window[`filter_${column}`] = '';
    });

    
    const thead = $('#employees-thead');
    if (thead) {
        const filterableHeaders = thead.querySelectorAll('th.filterable');
        filterableHeaders.forEach((th) => {
            const filterIcon = th.querySelector('.filter-icon');
            if (filterIcon) {
                filterIcon.style.color = '';
            }
        });
    }

    renderEmployees();
    updateClearButtonVisibility();
    updateEmployeeFilterChips();
}

function updateEmployeeFilterChips() {
    const container = $('#employee-filter-chips');
    if (!container) return;

    const filterableColumns = ['name', 'surname', 'age', 'position', 'salary', 'estimatedPayment', 'estimatedIncome'];
    const chips = [];

    
    filterableColumns.forEach((column) => {
        const value = window[`filter_${column}`];
        if (value) {
            chips.push({
                column,
                label: getFilterDisplayName(column),
                value: value,
            });
        }
    });

    
    if (projectFilter) {
        chips.push({
            column: 'project',
            label: 'Project',
            value: projectFilter,
        });
    }

    renderFilterChips(container, chips, (column) => {
        if (column === 'project') {
            projectFilter = '';
        } else {
            window[`filter_${column}`] = '';
        }
        renderEmployees();
        updateEmployeeFilterChips();
    });
}

export function handleAddEmployee(employeeData) {
    log(`handleAddEmployee called with data: ${JSON.stringify(employeeData)}`);
    const newEmployee = addEmployee(employeeData);
    log(`Employee added to storage: ${newEmployee.id}`);
    renderEmployees();
    log(`Employee added: ${newEmployee.name} ${newEmployee.surname}`);
}
