//Slide-in panel for adding projects and employees
import { $, log } from './utils.js';

let onProjectAddCallback = null;
let onEmployeeAddCallback = null;

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

    const openPanel = () => {
        backdrop.classList.remove('hidden');
        panel.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        log('Panel opened');
    };

    const closePanel = () => {
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
            const companyName = $('#company-name').value.trim();
            const projectName = $('#project-name').value.trim();
            const budget = $('#project-budget').value;
            const employeeCapacity = $('#employee-capacity').value;

            if (!companyName || !projectName || !budget || !employeeCapacity) {
                log('Please fill all required fields');
                return;
            }

            const projectData = {
                companyName: companyName,
                projectName: projectName,
                budget: parseFloat(budget),
                employeeCapacity: parseInt(employeeCapacity, 10)
            };

            if (window.addProjectCallback) {
                log('Adding project: ' + JSON.stringify(projectData));
                window.addProjectCallback(projectData);
            } else {
                log('addProjectCallback not found');
            }
        } else if (employeeFormFields && employeeFormFields.style.display !== 'none') {
            const name = $('#employee-name').value.trim();
            const surname = $('#employee-surname').value.trim();
            const age = $('#employee-age').value;
            const position = $('#employee-position').value.trim();
            const salary = $('#employee-salary').value;

            if (!name || !surname || !age || !position || !salary) {
                log('Please fill all required fields');
                return;
            }

            const employeeData = {
                name: name,
                surname: surname,
                age: parseInt(age, 10),
                position: position,
                salary: parseFloat(salary)
            };

            if (window.addEmployeeCallback) {
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

    window.openAddProjectModal = openPanel;
    window.openAddEmployeeModal = openPanel;
}

export function setOnProjectAdd(callback) {
    onProjectAddCallback = callback;
}

export function setOnEmployeeAdd(callback) {
    onEmployeeAddCallback = callback;
}
