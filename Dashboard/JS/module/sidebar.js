
import { $, log } from './utils.js';

export function initSidebar() {
    const sidePanel = $('#side-panel');
    const toggleBtn = $('#toggle-button');
    const openBtn = $('#open-button');

    if (!sidePanel || !toggleBtn || !openBtn) {
        log('Sidebar elements not found');
        return;
    }

    
    toggleBtn.addEventListener('click', () => {
        sidePanel.classList.add('collapsed');
        document.body.classList.add('panel-collapsed');
        openBtn.classList.remove('hidden');
        log('Sidebar collapsed');
    });

    
    openBtn.addEventListener('click', () => {
        sidePanel.classList.remove('collapsed');
        document.body.classList.remove('panel-collapsed');
        openBtn.classList.add('hidden');
        log('Sidebar expanded');
    });

    
    document.body.classList.remove('panel-collapsed');
}