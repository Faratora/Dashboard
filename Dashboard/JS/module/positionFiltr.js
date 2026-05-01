export function positionPopupRelativeToElement(popup, element, offsetX = 0, offsetY = 5) {
    if (!popup || !element) return;
    
    const rect = element.getBoundingClientRect();
    let left = rect.left + window.scrollX + offsetX;
    let top = rect.bottom + window.scrollY + offsetY;
    
    const popupRect = popup.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Корректировка по горизонтали
    if (left + popupRect.width > viewportWidth + window.scrollX) {
        left = viewportWidth + window.scrollX - popupRect.width - 10;
    }
    if (left < window.scrollX) {
        left = window.scrollX + 10;
    }
    
    // Корректировка по вертикали
    if (top + popupRect.height > viewportHeight + window.scrollY) {
        top = rect.top + window.scrollY - popupRect.height - offsetY;
    }
    if (top < window.scrollY) {
        top = window.scrollY + 10;
    }
    
    popup.style.left = left + 'px';
    popup.style.top = top + 'px';

    console.log('Popup positioned at:', { left, top });
    console.log('Element rect:', rect);
    console.log('Popup rect:', popupRect);
}


export function showFilterPopup(column, thElement, isProjectTable) {
   
    const existingPopup = document.getElementById('filter-modal');
    if (existingPopup && !existingPopup.classList.contains('hidden')) {
        closeFilterPopup();
    }
    
    const popup = document.getElementById('filter-modal');
    const title = document.getElementById('filter-modal-title');
    const input = document.getElementById('filter-input');
    const backdrop = document.getElementById('filter-backdrop');
    
    if (!popup || !title || !input) return;
    
    
    const columnNames = {
        name: 'Name',
        surname: 'Surname',
        age: 'Age', 
        position: 'Position',
        salary: 'Salary',
        estimatedPayment: 'Estimated Payment',
        project: 'Project',
        estimatedIncome: 'Projected Income',
        companyName: 'Company Name',
        projectName: 'Project Name',
        employeeCapacity: 'Employee Capacity',
        budget: 'Budget'
    };
    title.textContent = `Filter by ${columnNames[column] || column}`;
    
    
    let currentValue = '';
    if (isProjectTable) {
        currentValue = window.projectFilters?.[column] || '';
    } else {
        currentValue = window.employeeFilters?.[column] || '';
    }
    input.value = currentValue;
    
    
    popup.classList.remove('hidden');
    if (backdrop) backdrop.classList.remove('hidden');
    
    
    positionPopupRelativeToElement(popup, thElement, 0, 5);
    
    
    setTimeout(() => {
        input.focus();
        input.select();
    }, 50);
    
    const closePopup = () => {
        popup.classList.add('hidden');
        if (backdrop) backdrop.classList.add('hidden');
        document.removeEventListener('click', outsideClickHandler);
        window.removeEventListener('resize', reposition);
        window.removeEventListener('scroll', reposition);
    };
    
    
    const outsideClickHandler = (e) => {
        if (popup && !popup.contains(e.target) && 
        filterIconElement && !filterIconElement.contains(e.target) &&
            backdrop && !backdrop.contains(e.target)) {
            closePopup();
        }
    };
    
    
    const applyFilter = () => {
        const value = input.value.trim();
        if (isProjectTable) {
            if (!window.projectFilters) window.projectFilters = {};
            if (value) {
                window.projectFilters[column] = value;
            } else {
                delete window.projectFilters[column];
            }
            
            if (window.renderProjects) window.renderProjects();
        } else {
            if (!window.employeeFilters) window.employeeFilters = {};
            if (value) {
                window.employeeFilters[column] = value;
            } else {
                delete window.employeeFilters[column];
            }
            
            if (window.renderEmployees) window.renderEmployees();
        }
        
        
        if (window.renderFilterChips) window.renderFilterChips();
        
        closePopup();
    };
    
    
    const cancelFilter = () => {
        closePopup();
    };
    
    
    const applyBtn = document.getElementById('filter-apply-btn');
    const cancelBtn = document.getElementById('filter-cancel-btn');
    const closeBtn = document.getElementById('filter-modal-close');
    
    
    const newApplyBtn = applyBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    const newCloseBtn = closeBtn ? closeBtn.cloneNode(true) : null;
    
    if (applyBtn?.parentNode) {
        applyBtn.parentNode.replaceChild(newApplyBtn, applyBtn);
    }
    if (cancelBtn?.parentNode) {
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    }
    if (closeBtn?.parentNode && newCloseBtn) {
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    }
    
    
    newApplyBtn.onclick = applyFilter;
    newCancelBtn.onclick = cancelFilter;
    if (newCloseBtn) newCloseBtn.onclick = cancelFilter;
    if (backdrop) backdrop.onclick = cancelFilter;
    
    
    input.onkeypress = (e) => {
        if (e.key === 'Enter') {
            applyFilter();
        } else if (e.key === 'Escape') {
            cancelFilter();
        }
    };
    
    
    const reposition = () => {
        if (popup && !popup.classList.contains('hidden')) {
            positionPopupRelativeToElement(popup, thElement, 0, 5);
        }
    };
    
    window.addEventListener('resize', reposition, { passive: true });
    window.addEventListener('scroll', reposition, { passive: true });
    
    
    setTimeout(() => {
        document.addEventListener('click', outsideClickHandler, { passive: true });
    }, 100);
}


export function closeFilterPopup() {
    const popup = document.getElementById('filter-modal');
    const backdrop = document.getElementById('filter-backdrop');
    if (popup && !popup.classList.contains('hidden')) {
        popup.classList.add('hidden');
    }
    if (backdrop) backdrop.classList.add('hidden');
}


export function initFilterPositioning() {
    
    const projectsThead = document.querySelector('#projects-thead');
    if (projectsThead) {
        projectsThead.querySelectorAll('th.filterable').forEach(th => {
            const filterIcon = th.querySelector('.filter-icon');
            if (filterIcon) {
                filterIcon.style.cursor = 'pointer';
                filterIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const filterColumn = th.dataset.filter;
                    if (filterColumn) {
                        showFilterPopup(filterColumn, th, true);
                    }
                });
            }
        });
    }
    
   
    const employeesThead = document.querySelector('#employees-thead');
    if (employeesThead) {
        employeesThead.querySelectorAll('th.filterable').forEach(th => {
            const filterIcon = th.querySelector('.filter-icon');
            if (filterIcon) {
                filterIcon.style.cursor = 'pointer';
                filterIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const filterColumn = th.dataset.filter;
                    if (filterColumn) {
                        showFilterPopup(filterColumn, th, false);
                    }
                });
            }
        });
    }
}