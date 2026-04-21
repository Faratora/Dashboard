//Slide-in panel for adding projects
import { $, log } from './utils.js';

let onProjectAddCallback = null;

export function initModal(callback) {
    const backdrop = $('#panel-backdrop');
    const panel = $('#add-project-panel');
    const closeBtn = $('#panel-close-btn');
    const cancelBtn = $('#cancel-panel-btn');
    const form = $('#add-project-form');

    if (!backdrop || !panel || !closeBtn || !cancelBtn || !form) {
        log('Panel elements not found');
        return;
    }

    if (callback) {
        onProjectAddCallback = callback;
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

    
    closeBtn.addEventListener('click', closePanel);

    
    cancelBtn.addEventListener('click', closePanel);

    
    backdrop.addEventListener('click', closePanel);

    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !panel.classList.contains('hidden')) {
            closePanel();
        }
    });

    
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const projectData = {
            companyName: $('#company-name').value.trim(),
            projectName: $('#project-name').value.trim(),
            budget: parseFloat($('#project-budget').value),
            employeeCapacity: parseInt($('#employee-capacity').value, 10)
        };

        if (onProjectAddCallback) {
            onProjectAddCallback(projectData);
        }

        closePanel();
    });

   
    window.openAddProjectModal = openPanel;
}

export function setOnProjectAdd(callback) {
    onProjectAddCallback = callback;
}