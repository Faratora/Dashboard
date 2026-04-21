import { initSidebar } from './module/sidebar.js';
import { initPeriodSelector } from './module/period.js';
import { initNavigation } from './module/menu.js';
import { initModal } from './module/modal.js';
import { initProjects } from './module/projects.js';
import { initEmployees } from './module/employees.js';

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initPeriodSelector();
    initProjects();
    initEmployees();
    initNavigation();
    initModal();
});
