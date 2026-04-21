import { $, log } from './utils.js';
import {
    addEmployee,
    deleteEmployee,
    updateEmployee,
    getEmployees,
    formatCurrency,
    escapeHtml,
} from './dataStorage.js';

let sortColumn = null;
let sortDirection = 'asc';
let filterText = '';
let projectFilter = '';

function sortAndFilterEmployees(employees) {
    let result = [...employees];

    if (filterText) {
        const search = filterText.toLowerCase();
        result = result.filter(
            (e) =>
                e.name.toLowerCase().includes(search) ||
                e.surname.toLowerCase().includes(search) ||
                e.position.toLowerCase().includes(search)
        );
    }

    if (projectFilter) {
        result = result.filter((e) => e.project === projectFilter);
    }

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
                case 'project':
                    valA = a.project || '';
                    valB = b.project || '';
                    break;
                case 'estimatedIncome':
                    valA = a.estimatedIncome;
                    valB = b.estimatedIncome;
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

    return result;
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

    const tr = document.createElement('tr');
    tr.dataset.id = employee.id;
    tr.innerHTML = `
        <td>${escapeHtml(employee.name)}</td>
        <td>${escapeHtml(employee.surname)}</td>
        <td>${employee.age}</td>
        <td>${escapeHtml(employee.position)}</td>
        <td>${formatCurrency(employee.salary)}</td>
        <td>${formatCurrency(employee.estimatedPayment)}</td>
        <td>${escapeHtml(employee.project || '-')}</td>
        <td>${formatCurrency(employee.estimatedIncome)}</td>
        <td>
            
            <button class="availability-btn" data-id="${employee.id}">Availability</button>
            <button class="assign-btn" data-id="${employee.id}">Assign</button>
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

    window.addEmployeeCallback = handleAddEmployee;
    window.editEmployeeCallback = handleEditEmployee;

    log('addEmployeeCallback registered: ' + typeof window.addEmployeeCallback);
    log('editEmployeeCallback registered: ' + typeof window.editEmployeeCallback);

    initSortFilter();
    renderEmployees();
    log('Employees module initialized');
}

function initSortFilter() {
    const thead = $('#employees-thead');
    if (!thead) return;

    const headers = thead.querySelectorAll('th.sortable');
    headers.forEach((th) => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            if (sortColumn === column) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortColumn = column;
                sortDirection = 'asc';
            }
            renderEmployees();
        });
    });

    const filterInput = document.getElementById('employee-filter-input');
    if (filterInput) {
        filterInput.addEventListener('input', (e) => {
            filterText = e.target.value;
            renderEmployees();
        });
    }

    window.addEventListener('showProjectEmployees', (e) => {
        projectFilter = e.detail.projectId;
        renderEmployees();
    });
}

export function handleAddEmployee(employeeData) {
    log(`handleAddEmployee called with data: ${JSON.stringify(employeeData)}`);
    const newEmployee = addEmployee(employeeData);
    log(`Employee added to storage: ${newEmployee.id}`);
    renderEmployees();
    log(`Employee added: ${newEmployee.name} ${newEmployee.surname}`);
}

export { getEmployees, renderEmployees };
