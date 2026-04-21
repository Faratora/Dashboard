// menu.js - Navigation between views
import { $, log } from './utils.js';

export function initNavigation() {
    const navProjects = $('#nav-projects');
    const navEmployees = $('#nav-employees');
    const projectsContent = $('#projects-content');
    const employeesContent = $('#employees-content');
    const addProjectBtn = $('#add-project-btn');
    const addEmployeeBtn = $('#add-employee-btn');
    const panelTitle = $('#panel-title');
    const projectFormFields = $('#project-form-fields');
    const employeeFormFields = $('#employee-form-fields');
    const submitBtn = $('#submit-btn');

    if (!navProjects || !navEmployees || !projectsContent || !employeesContent) {
        log('Navigation elements not found');
        return;
    }

    navProjects.addEventListener('click', (e) => {
        e.preventDefault();
        projectsContent.style.display = 'block';
        employeesContent.style.display = 'none';
        navProjects.classList.add('active');
        navEmployees.classList.remove('active');
        log('Switched to Projects view');
    });

    navEmployees.addEventListener('click', (e) => {
        e.preventDefault();
        projectsContent.style.display = 'none';
        employeesContent.style.display = 'block';
        navEmployees.classList.add('active');
        navProjects.classList.remove('active');
        log('Switched to Employees view');
    });

    // Open Add Project modal
    if (addProjectBtn) {
        addProjectBtn.addEventListener('click', () => {
            // Set form to project mode
            panelTitle.textContent = 'Add New Project';
            projectFormFields.style.display = 'block';
            employeeFormFields.style.display = 'none';
            submitBtn.textContent = 'Add Project';
            
            if (window.openAddProjectModal) {
                window.openAddProjectModal();
            }
        });
    }

    // Open Add Employee modal
    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener('click', () => {
            // Set form to employee mode
            panelTitle.textContent = 'Add New Employee';
            projectFormFields.style.display = 'none';
            employeeFormFields.style.display = 'block';
            submitBtn.textContent = 'Add Employee';
            
            if (window.openAddEmployeeModal) {
                window.openAddEmployeeModal();
            }
        });
    }
}
