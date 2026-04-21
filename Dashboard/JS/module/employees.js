import { $, log, generateId, formatCurrency, escapeHtml } from './utils.js';

let employeesData = [];


export function initEmployees() {
    const tbody = $('#employees-tbody');
    
    if (!tbody) {
        log('Employees tbody not found');
        return;
    }

    
    window.addEmployeeCallback = addEmployee;

    renderEmployees();
    log('Employees module initialized');
}


export function addEmployee(employeeData) {
    const newEmployee = {
        id: generateId(),
        name: employeeData.name,
        surname: employeeData.surname,
        age: parseInt(employeeData.age) || 0,
        position: employeeData.position,
        salary: parseFloat(employeeData.salary) || 0,
        project: employeeData.project || '',
        estimatedPayment: 0,
        estimatedIncome: 0,
        availability: 1.0 
    };

    employeesData.push(newEmployee);
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
        <td>${escapeHtml(employee.project)}</td>
        <td>${formatCurrency(employee.estimatedIncome)}</td>
        <td>
            <button class="edit-btn" data-id="${employee.id}">Edit</button>
            <button class="delete-btn" data-id="${employee.id}">Delete</button>
        </td>
    `;

    tbody.appendChild(tr);

    
    tr.querySelector('.edit-btn').addEventListener('click', () => editEmployee(employee.id));
    tr.querySelector('.delete-btn').addEventListener('click', () => deleteEmployee(employee.id));
}


export function renderEmployees() {
    const tbody = $('#employees-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    employeesData.forEach(employee => {
        renderEmployeeRow(employee);
    });
}


function deleteEmployee(id) {
    const row = $(`tr[data-id="${id}"]`);
    if (row) {
        row.remove();
        employeesData = employeesData.filter(e => e.id !== id);
        log(`Employee deleted: ${id}`);
    }
}


function editEmployee(id) {
    const employee = employeesData.find(e => e.id === id);
    if (employee) {
        log(`Edit employee: ${employee.name} ${employee.surname}`);
        // TODO: Implement edit functionality
    }
}


export function getEmployees() {
    return [...employeesData];
}