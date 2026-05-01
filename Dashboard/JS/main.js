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
    initNavigation();
    initModal();
    initProjects();
    initEmployees();
    initSeedData();
    setupInputRestrictions();

    // Global error handler to catch Chrome extension errors
    window.onerror = function(message, source, lineno, colno, error) {
        // Ignore IndexedDB errors (they're from extensions or old data)
        if (message.includes('NotFoundError') && message.includes('object stores')) {
            console.debug('[Ignored] IndexedDB error:', message);
            return true;
        }
        console.log('[Global Error Handler]', message, source, lineno, colno);
        return false;
    };
    
    window.onunhandledrejection = function(event) {
        // Ignore IndexedDB rejections
        if (event.reason && event.reason.message && event.reason.message.includes('NotFoundError')) {
            event.preventDefault();
            return;
        }
        console.log('[Unhandled Rejection]', event.reason);
        event.preventDefault();
    };

    // Check if localStorage has data, if not, force initialization
    const stored = localStorage.getItem('monthlyData');
    if (!stored) {
        console.log('[Main] No localStorage data found, triggering initialization...');
        // Trigger getProjects to force loadData() to create sample data
        import('./module/dataStorage.js').then(module => {
            const projects = module.getProjects();
            console.log('[Main] Initialized projects:', projects?.length || 0);
        });
    }

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
