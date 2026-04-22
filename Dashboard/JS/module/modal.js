import { $, log } from './utils.js';
import { validateProject, validateEmployee } from './validator.js';
import { getProjects, getEmployees } from './dataStorage.js';

let editMode = null;
let editingId = null;
let currentProjectId = null;

function populateEmployeeProjectSelect() {
    const projectSelect = $('#employee-project');
    if (!projectSelect) return;

    projectSelect.innerHTML = '<option value="">Select project</option>';
    const projects = getProjects();
    projects.forEach((project) => {
        const option = document.createElement('option');
        option.value = project.projectName;
        option.textContent = project.projectName;
        projectSelect.appendChild(option);
    });
}

function openEmployeesModal(projectId) {
    const modalBackdrop = $('#employees-modal-backdrop');
    const modal = $('#employees-modal');
    const modalTitle = $('#employees-modal-title');
    const tbody = $('#project-employees-tbody');

    if (!modalBackdrop || !modal || !modalTitle || !tbody) {
        log('Employees modal elements not found');
        return;
    }

    currentProjectId = projectId;
    const projects = getProjects();
    const project = projects.find((p) => p.id === projectId);

    if (project) {
        modalTitle.textContent = `Employees on ${project.projectName}`;
    }

    tbody.innerHTML = '';
    const allEmployees = getEmployees();
    const employees = allEmployees.filter((e) => e.project === project.projectName);

    if (employees.length === 0) {
        tbody.innerHTML =
            '<tr><td colspan="9" style="text-align: center; padding: 20px;">No employees assigned</td></tr>';
    } else {
        employees.forEach((employee) => {
            const capacity = employee.capacity || 1;
            const fit = employee.fit || 1;
            const vacation = employee.vacationDays || 0;
            const availability = ((20 - vacation) / 20) * fit * 100;
            const effectiveRevenue = employee.salary * (availability / 100);
            const cost = employee.salary;
            const profit = effectiveRevenue - cost;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${employee.name} ${employee.surname}</td>
                <td>${capacity}</td>
                <td>${fit}</td>
                <td>${vacation}</td>
                <td>${availability.toFixed(1)}%</td>
                <td>$${effectiveRevenue.toFixed(2)}</td>
                <td>$${cost.toFixed(2)}</td>
                <td>$${profit.toFixed(2)}</td>
                <td>
                    <button class="modal-edit-employee" data-id="${employee.id}">Edit</button>
                    <button class="modal-delete-employee" data-id="${employee.id}">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    modalBackdrop.classList.remove('hidden');
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
        tbody.querySelectorAll('.modal-edit-employee').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const empId = e.target.dataset.id;
                const employee = allEmployees.find((emp) => emp.id === empId);
                if (employee) {
                    closeEmployeesModal();
                    window.openAddEmployeeEditModal(employee);
                }
            });
        });

        tbody.querySelectorAll('.modal-delete-employee').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const empId = e.target.dataset.id;
                if (window.editEmployeeCallback) {
                    const employee = allEmployees.find((emp) => emp.id === empId);
                    if (employee) {
                        window.editEmployeeCallback(empId, { ...employee, project: '' });
                    }
                }
                openEmployeesModal(projectId);
            });
        });
    }, 0);
}

function closeEmployeesModal() {
    const modalBackdrop = $('#employees-modal-backdrop');
    const modal = $('#employees-modal');

    if (modalBackdrop && modal) {
        modalBackdrop.classList.add('hidden');
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        currentProjectId = null;
    }
}

export function initModal() {
    const backdrop = $('#panel-backdrop');
    const panel = $('#add-project-panel');
    const closeBtn = $('#panel-close-btn');
    const cancelBtn = $('#cancel-panel-btn');
    const submitBtn = $('#submit-btn');
    const form = $('#add-project-form');
    const projectFormFields = $('#project-form-fields');
    const employeeFormFields = $('#employee-form-fields');

    if (!backdrop || !panel || !closeBtn || !cancelBtn || !submitBtn || !form) {
        log('Panel elements not found');
        return;
    }

    const openPanel = (mode = 'add') => {
        editMode = mode;
        const panelTitle = $('#panel-title');

        const allInputs = document.querySelectorAll('#add-project-form input, #add-project-form select');
        allInputs.forEach((input) => {
            input.style.borderColor = '#ddd';
            input.style.boxShadow = 'none';
        });
        const allErrors = document.querySelectorAll('.field-error');
        allErrors.forEach((err) => err.remove());

        backdrop.classList.remove('hidden');
        panel.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        if (projectFormFields && projectFormFields.style.display !== 'none') {
            panelTitle.textContent = mode === 'edit' ? 'Edit Project' : 'Add New Project';
            submitBtn.textContent = mode === 'edit' ? 'Update Project' : 'Add Project';
        } else if (employeeFormFields && employeeFormFields.style.display !== 'none') {
            panelTitle.textContent = mode === 'edit' ? 'Edit Employee' : 'Add New Employee';
            submitBtn.textContent = mode === 'edit' ? 'Update Employee' : 'Add Employee';
        }

        log('Panel opened in ' + mode + ' mode');
    };

    const closePanel = () => {
        editMode = null;
        editingId = null;
        backdrop.classList.add('hidden');
        panel.classList.add('hidden');
        form.reset();
        document.body.style.overflow = '';
        log('Panel closed');
    };

    const handleSubmit = () => {
        log('Form submit triggered');

        if (projectFormFields && projectFormFields.style.display !== 'none') {
            log('checking project form');
            if (!validateProject()) {
                log('project validation failed, returning');
                return;
            }
            log('project validation passed');

            const companyName = $('#company-name').value.trim();
            const projectName = $('#project-name').value.trim();
            const budget = $('#project-budget').value;
            const employeeCapacity = $('#employee-capacity').value;

            const projectData = {
                companyName: companyName,
                projectName: projectName,
                budget: parseFloat(budget),
                employeeCapacity: parseInt(employeeCapacity, 10),
            };

            if (editMode === 'edit' && editingId && window.editProjectCallback) {
                log('Editing project: ' + editingId);
                window.editProjectCallback(editingId, projectData);
            } else if (window.addProjectCallback) {
                log('Adding project: ' + JSON.stringify(projectData));
                window.addProjectCallback(projectData);
            } else {
                log('addProjectCallback not found');
            }
        } else if (employeeFormFields && employeeFormFields.style.display !== 'none') {
            if (!validateEmployee()) {
                return;
            }

            const name = $('#employee-name').value.trim();
            const surname = $('#employee-surname').value.trim();
            const birthDate = $('#employee-age').value;
            const position = $('#employee-position').value;
            const salary = $('#employee-salary').value;

            const birth = new Date(birthDate);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }

            const employeeData = {
                name: name,
                surname: surname,
                age: age,
                birthDate: birthDate,
                position: position,
                salary: parseFloat(salary),
                capacity: 1,
                fit: 1,
                vacationDays: 0,
                project: '',
            };

            if (editMode === 'edit' && editingId && window.editEmployeeCallback) {
                log('Editing employee: ' + editingId);
                window.editEmployeeCallback(editingId, employeeData);
            } else if (window.addEmployeeCallback) {
                log('Adding employee: ' + JSON.stringify(employeeData));
                window.addEmployeeCallback(employeeData);
            } else {
                log('addEmployeeCallback not found');
            }
        }

        closePanel();
    };

    closeBtn.addEventListener('click', closePanel);
    cancelBtn.addEventListener('click', closePanel);
    backdrop.addEventListener('click', closePanel);
    submitBtn.addEventListener('click', handleSubmit);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !panel.classList.contains('hidden')) {
            closePanel();
        }
    });

    // Employees modal close buttons
    const employeesModalCloseX = $('#employees-modal-close-x');
    const employeesModalCloseBtn = $('#employees-modal-close-btn');
    const employeesModalBackdrop = $('#employees-modal-backdrop');

    if (employeesModalCloseX) {
        employeesModalCloseX.addEventListener('click', closeEmployeesModal);
    }
    if (employeesModalCloseBtn) {
        employeesModalCloseBtn.addEventListener('click', closeEmployeesModal);
    }
    if (employeesModalBackdrop) {
        employeesModalBackdrop.addEventListener('click', closeEmployeesModal);
    }

    // Listen for showProjectEmployees event
    window.addEventListener('showProjectEmployees', (e) => {
        log('showProjectEmployees event received for project: ' + e.detail.projectId);
        openEmployeesModal(e.detail.projectId);
    });

    window.openAddProjectModal = () => openPanel('add');
    window.openAddProjectEditModal = (project) => {
        openPanel('edit');
        editingId = project.id;
        $('#project-name').value = project.projectName;
        $('#company-name').value = project.companyName;
        $('#project-budget').value = project.budget;
        $('#employee-capacity').value = project.employeeCapacity;
    };
    window.openAddEmployeeModal = () => {
        populateEmployeeProjectSelect();
        openPanel('add');
    };
    window.openAddEmployeeEditModal = (employee) => {
        openPanel('edit');
        editingId = employee.id;
        $('#employee-name').value = employee.name;
        $('#employee-surname').value = employee.surname;
        $('#employee-age').value = employee.age;
        $('#employee-position').value = employee.position;
        $('#employee-salary').value = employee.salary;
    };
}
