import { $, log } from './utils.js';
import { addEmployee, deleteEmployee, updateEmployee, getEmployees, formatCurrency, escapeHtml } from './dataStorage.js';

export function initEmployees() {
    const tbody = $('#employees-tbody');
    
    if (!tbody) {
        log('Employees tbody not found');
        return;
    }

    window.addEmployeeCallback = handleAddEmployee;
    window.editEmployeeCallback = handleEditEmployee;
    renderEmployees();
    log('Employees module initialized');
}

export function handleAddEmployee(employeeData) {
    const newEmployee = addEmployee(employeeData);
    renderEmployeeRow(newEmployee);
    log(`Employee added: ${newEmployee.name} ${newEmployee.surname}`);
}

function renderEmployeeRow(employee) {
    const tbody = $('#employees-tbody');
    if (!tbody) return;

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
            <button class="edit-btn" data-id="${employee.id}">Edit</button>
            <button class="delete-btn" data-id="${employee.id}">Delete</button>
        </td>
    `;

    tbody.appendChild(tr);

    const editBtn = tr.querySelector('.edit-btn');
    const deleteBtn = tr.querySelector('.delete-btn');
    
    editBtn.addEventListener('click', () => {
        log('Edit button clicked for employee: ' + employee.id);
        handleEditEmployee(employee.id);
    });
    deleteBtn.addEventListener('click', () => {
        log('Delete button clicked for employee: ' + employee.id);
        handleDeleteEmployee(employee.id);
    });
}

export function renderEmployees() {
    const tbody = $('#employees-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    const employees = getEmployees();
    employees.forEach(employee => {
        renderEmployeeRow(employee);
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
        const employee = employees.find(e => e.id === id);
        if (employee && window.openAddEmployeeEditModal) {
            window.openAddEmployeeEditModal(employee);
        }
    }
}

export { getEmployees };