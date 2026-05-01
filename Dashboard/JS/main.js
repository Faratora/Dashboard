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

    // Global error handler to catch Chrome extension errors
    window.onerror = function(message, source, lineno, colno, error) {
        console.log('[Global Error Handler]', message, source, lineno, colno);
        // Return true to prevent default error handling (which might be causing the issue)
        return false;
    };
    
    window.onunhandledrejection = function(event) {
        console.log('[Unhandled Rejection]', event.reason);
        // Prevent default
        event.preventDefault();
    };

    window.addEventListener('periodChanged', (e) => {
        try {
            const period = getCurrentPeriod();
            console.log('[periodChanged] Event fired, period:', period);
            if (e.detail) {
                console.log('[periodChanged] Detail:', e.detail);
            }
            renderProjects();
            renderEmployees();
        } catch (error) {
            console.error('[periodChanged] Error:', error);
        }
    }, { passive: true });
    
    window.addEventListener('editAssignment', (e) => {
        try {
            const { employeeId, employeeData } = e.detail;
            console.log('[editAssignment] Employee updated:', employeeId, employeeData);
            renderProjects();
            renderEmployees();
        } catch (error) {
            console.error('[editAssignment] Error:', error);
        }
    }, { passive: true });
});
