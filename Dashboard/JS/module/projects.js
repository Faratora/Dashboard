import { $, log } from './utils.js';

let projectsData = [];

export function initProjects() {
    const tbody = $('#projects-tbody');

    if (!tbody) {
        log('Projects tbody not found');
        return;
    }

    window.addProjectCallback = addProject;

    renderProjects();
    log('Projects module initialized');
}
export function addProject(projectData) {
    const newProject = {
        id: generateId(),
        companyName: projectData.companyName,
        projectName: projectData.projectName,
        budget: parseFloat(projectData.budget) || 0,
        employeeCapacity: parseInt(projectData.employeeCapacity) || 0,
        employees: [],
        estimatedIncome: 0
    };

    projectsData.push(newProject);
    renderProjectRow(newProject);
    log(`Project added: ${newProject.projectName}`);
}


function renderProjectRow(project) {
    const tbody = $('#projects-tbody');
    if (!tbody) return;

    const tr = document.createElement('tr');
    tr.dataset.id = project.id;
    tr.innerHTML = `
        <td>${escapeHtml(project.companyName)}</td>
        <td>${escapeHtml(project.projectName)}</td>
        <td>${formatCurrency(project.budget)}</td>
        <td>${project.employeeCapacity}</td>
        <td>${project.employees.length}</td>
        <td>${formatCurrency(project.estimatedIncome)}</td>
        <td>
            <button class="edit-btn" data-id="${project.id}">Edit</button>
            <button class="delete-btn" data-id="${project.id}">Delete</button>
        </td>
    `;

    tbody.appendChild(tr);


    tr.querySelector('.edit-btn').addEventListener('click', () => editProject(project.id));
    tr.querySelector('.delete-btn').addEventListener('click', () => deleteProject(project.id));
}


export function renderProjects() {
    const tbody = $('#projects-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    projectsData.forEach(project => {
        renderProjectRow(project);
    });
}


function deleteProject(id) {
    const row = $(`tr[data-id="${id}"]`);
    if (row) {
        row.remove();
        projectsData = projectsData.filter(p => p.id !== id);
        log(`Project deleted: ${id}`);
    }
}


function editProject(id) {
    const project = projectsData.find(p => p.id === id);
    if (project) {
        log(`Edit project: ${project.projectName}`);
        // TODO: TODO: Реализовать функцию редактирования
    }
}


export function getProjects() {
    return [...projectsData];
}


function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}


function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(value);
}


function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}