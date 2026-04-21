import { initSidebar } from './module/sidebar.js';
import { initPeriodSelector } from './module/period.js';
import { initNavigation } from './module/menu.js';
import { initModal } from './module/modal.js';
import { initProjects, renderProjects } from './module/projects.js';
import { initEmployees, renderEmployees } from './module/employees.js';
import { initSeedData } from './module/seedData.js';


document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initPeriodSelector();
    initProjects();
    initEmployees();
    initNavigation();
    initModal();
    initSeedData();

    window.addEventListener('periodChanged', () => {
        renderProjects();
        renderEmployees();
    });
});