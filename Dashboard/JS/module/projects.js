import { $, log } from './utils.js';
import { addProject, deleteProject as storageDelete, updateProject, getProjects, formatCurrency, escapeHtml } from './dataStorage.js';

export function initProjects() {
    const tbody = $('#projects-tbody');

    if (!tbody) {
        log('Projects tbody not found');
        return;
    }

    window.addProjectCallback = handleAddProject;
    window.editProjectCallback = handleEditProject;
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

    const editBtn = tr.querySelector('.edit-btn');
    const deleteBtn = tr.querySelector('.delete-btn');
    
    editBtn.addEventListener('click', () => {
        log('Edit button clicked for project: ' + project.id);
        handleEditProject(project.id);
    });
    deleteBtn.addEventListener('click', () => {
        log('Delete button clicked for project: ' + project.id);
        handleDeleteProject(project.id);
    });
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

function handleEditProject(id, projectData) {
    log(`handleEditProject called with id: ${id}`);
    if (projectData) {
        updateProject(id, projectData);
        log(`Project updated: ${projectData.projectName}`);
        renderProjects();
    } else {
        const projects = getProjects();
        const project = projects.find(p => p.id === id);
        if (project && window.openAddProjectEditModal) {
            window.openAddProjectEditModal(project);
        }
    }
}

export { getProjects };