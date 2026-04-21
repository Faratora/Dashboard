// menu.js - Navigation between views
import { $, log } from './utils.js';

export function initNavigation() {
    const navProjects = $('#nav-projects');
    const navEmployees = $('#nav-employees');
    const projectsContent = $('#projects-content');
    const employeesContent = $('#employees-content');
    const addProjectBtn = $('#add-project-btn');

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
            if (window.openAddProjectModal) {
                window.openAddProjectModal();
            }
        });
    }
}