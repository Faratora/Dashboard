import { $, log } from './utils.js';
import { addProject, deleteProject as storageDelete, getProjects, formatCurrency, escapeHtml } from './dataStorage.js';

export function initProjects() {
    const tbody = $('#projects-tbody');

    if (!tbody) {
        log('Projects tbody not found');
        return;
    }

    window.addProjectCallback = handleAddProject;
    renderProjects();
    log('Projects module initialized');
}

export function handleAddProject(projectData) {
    const newProject = addProject(projectData);
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
        <td>${project.employees?.length || 0}</td>
        <td>${formatCurrency(project.estimatedIncome)}</td>
        <td>
            <button class="edit-btn" data-id="${project.id}">Edit</button>
            <button class="delete-btn" data-id="${project.id}">Delete</button>
        </td>
    `;

    tbody.appendChild(tr);

    tr.querySelector('.edit-btn').addEventListener('click', () => handleEditProject(project.id));
    tr.querySelector('.delete-btn').addEventListener('click', () => handleDeleteProject(project.id));
}

export function renderProjects() {
    const tbody = $('#projects-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    const projects = getProjects();
    projects.forEach(project => {
        renderProjectRow(project);
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

function handleEditProject(id) {
    const projects = getProjects();
    const project = projects.find(p => p.id === id);
    if (project) {
        log(`Edit project: ${project.projectName}`);
    }
}

export { getProjects };