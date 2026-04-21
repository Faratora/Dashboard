import { $, log } from './utils.js';
import { validateProject, validateEmployee } from './validator.js';

let editMode = null;
let editingId = null;

export function initModal() {
    const backdrop = $('#panel-backdrop');
    const panel = $('#add-project-panel');
    const closeBtn = $('#panel-close-btn');
    const cancelBtn = $('#cancel-panel-btn');
    const submitBtn = $('#submit-btn');
    const form = $('#add-project-form');

    if (!backdrop || !panel || !closeBtn || !cancelBtn || !form) {
        log('Panel elements not found');
        return;
    }

    const openPanel = (mode = 'add') => {
        editMode = mode;
        
        const allInputs = document.querySelectorAll('#add-project-form input, #add-project-form select');
        allInputs.forEach(input => {
            input.style.borderColor = '#ddd';
            input.style.boxShadow = 'none';
        });
        const allErrors = document.querySelectorAll('.field-error');
        allErrors.forEach(err => err.remove());
        
        backdrop.classList.remove('hidden');
        panel.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        const projectFormFields = $('#project-form-fields');
        const employeeFormFields = $('#employee-form-fields');
        const panelTitle = $('#panel-title');
        const submitBtn = $('#submit-btn');
        
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

        const projectFormFields = $('#project-form-fields');
        const employeeFormFields = $('#employee-form-fields');
        
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
                employeeCapacity: parseInt(employeeCapacity, 10)
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
            const capacity = $('#employee-capacity').value || 1;
            const fit = $('#employee-fit').value || 1;
            const vacation = $('#employee-vacation').value || 0;
            const project = $('#employee-project').value || '';

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
                capacity: parseFloat(capacity),
                fit: parseFloat(fit),
                vacationDays: parseInt(vacation, 10),
                project: project
            };

            if (editMode === 'edit' && editingId && window.editEmployeeCallback) {
                log('Editing employee: ' + editingId);
                window.editEmployeeCallback(editingId, employeeData);
            } else if (window.addEmployeeCallback) {
                window.addEmployeeCallback(employeeData);
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

    window.openAddProjectModal = () => openPanel('add');
    window.openAddProjectEditModal = (project) => {
        openPanel('edit');
        editingId = project.id;
        $('#project-name').value = project.projectName;
        $('#company-name').value = project.companyName;
        $('#project-budget').value = project.budget;
        $('#employee-capacity').value = project.employeeCapacity;
    };
    window.openAddEmployeeModal = () => openPanel('add');
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