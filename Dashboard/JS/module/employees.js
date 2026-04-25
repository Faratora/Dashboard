import { $, log, initSortFilter as initCommonSortFilter } from './utils.js';
import {
    addEmployee,
    deleteEmployee,
    updateEmployee,
    getEmployees,
    formatCurrency,
    escapeHtml,
} from './dataStorage.js';
import { initInlineEditListeners, setRenderCallback } from './inlineEdit.js';

let sortColumn = null;
let sortDirection = 'asc';
let projectFilter = '';

function sortAndFilterEmployees(employees) {
    let result = [...employees];

    if (projectFilter) {
        result = result.filter((e) => e.project === projectFilter);
    }

    // Apply column-specific filters
    const filterableColumns = ['name', 'surname', 'age', 'position', 'salary', 'estimatedPayment', 'project', 'estimatedIncome'];
    filterableColumns.forEach((column) => {
        const columnFilter = window[`filter_${column}`];
        if (columnFilter) {
            result = result.filter((e) => {
                let value;
                if (column === 'project') {
                    // Filter by project name instead of id
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
                    valA = a.salary;
                    valB = b.salary;
                    break;
                case 'project':
                    valA = getProjectNameById(a.project);
                    valB = getProjectNameById(b.project);
                    break;
                case 'estimatedIncome':
                    valA = a.estimatedIncome || 0;
                    valB = b.estimatedIncome || 0;
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
}

function calculateAvailability(employee) {
    const vacation = employee.vacationDays || 0;
    const fit = employee.fit || 1;
    return ((20 - vacation) / 20) * fit * 100;
}

function renderEmployeeRow(employee) {
    const tbody = $('#employees-tbody');
    if (!tbody) return;

    const availability = calculateAvailability(employee);
    const effectiveCapacity = (employee.capacity || 1) * (employee.fit || 1) * ((20 - (employee.vacationDays || 0)) / 20);
    const assignedCapacity = parseFloat(employee.assignedCapacity) || 0;
    const isAssignDisabled = assignedCapacity >= 1.5;

    const tr = document.createElement('tr');
    tr.dataset.id = employee.id;
    tr.innerHTML = `
        <td>${escapeHtml(employee.name)}</td>
        <td>${escapeHtml(employee.surname)}</td>
        <td>${employee.age}</td>
        <td class="position-cell">${escapeHtml(employee.position)}<span class="edit-pencil" data-field="position" data-id="${employee.id}">✎</span></td>
        <td class="salary-cell">${formatCurrency(employee.salary)}<span class="edit-pencil" data-field="salary" data-id="${employee.id}">✎</span></td>
        <td>${formatCurrency(employee.estimatedPayment)}</td>
        <td>${escapeHtml(employee.project || '-')}</td>
        <td>${formatCurrency(employee.estimatedIncome)}</td>
        <td>
            <button class="availability-btn" data-id="${employee.id}">Availability</button>
            <button class="assign-btn" data-id="${employee.id}" ${isAssignDisabled ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>Assign</button>
            <button class="edit-btn" data-id="${employee.id}">Edit</button>
            <button class="delete-btn" data-id="${employee.id}">Delete</button>
        </td>
    `;

    tbody.appendChild(tr);

    const editBtn = tr.querySelector('.edit-btn');
    const deleteBtn = tr.querySelector('.delete-btn');
    const availBtn = tr.querySelector('.availability-btn');
    const assignBtn = tr.querySelector('.assign-btn');

    availBtn.addEventListener('click', () => {
        log('Availability button clicked for employee: ' + employee.id);
        window.dispatchEvent(new CustomEvent('showAvailabilityCalendar', { detail: { employeeId: employee.id } }));
    });

    assignBtn.addEventListener('click', () => {
        log('Assign button clicked for employee: ' + employee.id);
        window.dispatchEvent(new CustomEvent('showAssignEmployee', { detail: { employeeId: employee.id } }));
    });

    editBtn.addEventListener('click', () => {
        log('Edit button clicked for employee: ' + employee.id);
        handleEditEmployee(employee.id);
    });
    deleteBtn.addEventListener('click', () => {
        log('Delete button clicked for employee: ' + employee.id);
        handleDeleteEmployee(employee.id);
    });
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

    // Clear column filters on initialization so filters don't persist across sessions
    const filterableColumns = ['name', 'surname', 'age', 'position', 'salary', 'estimatedPayment', 'project', 'estimatedIncome'];
    filterableColumns.forEach((column) => {
        window[`filter_${column}`] = '';
    });

    // Reset filter icon colors
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

    // Set render callback for inline edit
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
            },
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

    // Listen for assign employee event
    window.addEventListener('assignEmployee', (e) => {
        const { employeeId, employeeData } = e.detail;
        log('Assigning employee: ' + employeeId);
        updateEmployee(employeeId, employeeData);
        renderEmployees();
    });

    // Listen for set vacation event
    window.addEventListener('setVacation', (e) => {
        const { employeeId, employeeData } = e.detail;
        log('Setting vacation for employee: ' + employeeId);
        log('Vacation days:', employeeData.vacationDays);
        updateEmployee(employeeId, employeeData);
        renderEmployees();
    });

    // Listen for inline edit event
    window.addEventListener('inlineEditEmployee', (e) => {
        const { employeeId, employeeData } = e.detail;
        log('Inline editing employee: ' + employeeId);
        updateEmployee(employeeId, employeeData);
        renderEmployees();
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

    // Store column-specific filter
    if (value) {
        window[`filter_${column}`] = value.toLowerCase();
    } else {
        window[`filter_${column}`] = '';
    }

    renderEmployees();
}

function updateClearButtonVisibility() {
    const clearBtn = $('#clear-employee-filters-btn');
    if (clearBtn) {
        const hasFilters = window.filter_name ||
            window.filter_surname ||
            window.filter_age ||
            window.filter_position ||
            window.filter_salary ||
            window.filter_estimatedPayment ||
            window.filter_project ||
            window.filter_estimatedIncome ||
            projectFilter ||
            sortColumn;
        clearBtn.style.display = hasFilters ? 'flex' : 'none';
    }
}

function resetAllFilters() {
    sortColumn = null;
    sortDirection = 'asc';
    projectFilter = '';

    // Clear all column-specific filters
    const filterableColumns = ['name', 'surname', 'age', 'position', 'salary', 'estimatedPayment', 'project', 'estimatedIncome'];
    filterableColumns.forEach((column) => {
        window[`filter_${column}`] = '';
    });

    // Reset column filter icons
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
}

export function handleAddEmployee(employeeData) {
    log(`handleAddEmployee called with data: ${JSON.stringify(employeeData)}`);
    const newEmployee = addEmployee(employeeData);
    log(`Employee added to storage: ${newEmployee.id}`);
    renderEmployees();
    log(`Employee added: ${newEmployee.name} ${newEmployee.surname}`);
}