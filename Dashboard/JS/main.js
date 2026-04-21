import { initSidebar } from './module/sidebar.js';
import { initPeriodSelector } from './module/period.js';
import { initNavigation } from './module/menu.js';
import { initModal } from './module/modal.js';
import { initProjects } from './module/projects.js';

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initPeriodSelector();
    initProjects();
    initNavigation();
    initModal();
});
