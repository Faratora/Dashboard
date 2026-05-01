import { initSidebar } from './module/sidebar.js';
import { initPeriodSelector } from './module/period.js';
import { initNavigation } from './module/menu.js';
import { initModal } from './module/modal.js';
import { initProjects, renderProjects } from './module/projects.js';
import { initEmployees, renderEmployees } from './module/employees.js';
import { initSeedData } from './module/seedData.js';
import { setupInputRestrictions } from './module/validator.js';
import { getCurrentPeriod } from './module/dataStorage.js';

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initPeriodSelector();
    initSeedData();
    initProjects();
    initEmployees();
    initModal();
    initNavigation();
    setupInputRestrictions();

    window.addEventListener('periodChanged', (e) => {
        const period = getCurrentPeriod();
        console.log('[periodChanged] Event fired, period:', period);
        if (e.detail) {
            console.log('[periodChanged] Detail:', e.detail);
        }
        renderProjects();
        renderEmployees();
    });

    window.addEventListener('editAssignment', (e) => {
        const { employeeId, employeeData } = e.detail;
        console.log('[editAssignment] Employee updated:', employeeId, employeeData);
        renderProjects();
        renderEmployees();
    });
});
