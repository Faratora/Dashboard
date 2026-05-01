export function $(selector) {
    return document.querySelector(selector);
}

export function log(message) {
    console.log(`[App] ${message}`);
}

export function error(message) {
    console.error(`[App Error] ${message}`);
}

export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        useGrouping: false,
    }).format(value);
}

export function formatNumber(value) {
    return '$' + new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        useGrouping: false,
    }).format(value);
}

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function getFilterDisplayName(column) {
    const names = {
        name: 'Name',
        surname: 'Surname',
        age: 'Age',
        position: 'Position',
        salary: 'Salary',
        estimatedPayment: 'Estimated Payment',
        project: 'Project',
        estimatedIncome: 'Projected Income',
        companyName: 'Company',
        projectName: 'Project'
    };
    return names[column] || column;
}

export function renderFilterChips(container, chips, onRemove) {
    container.innerHTML = '';

    if (chips.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'flex';
    chips.forEach(chip => {
        const chipEl = document.createElement('span');
        chipEl.className = 'filter-chip';
        chipEl.innerHTML = `
            <span class="chip-label">${chip.label}: "${chip.value}"</span>
            <span class="chip-remove" data-column="${chip.column}">&times;</span>
        `;
        container.appendChild(chipEl);
    });

    container.querySelectorAll('.chip-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const column = e.target.dataset.column;
            if (onRemove) {
                onRemove(column);
            }
        });
    });
}

export function initSortFilter(config) {
    const {
        theadSelector,
        filterInputId,
        renderFunction,
        extraListeners = {},
        getSortState,
        setSortState,
        getFilterText,
        setFilterText,
    } = config;

    const thead = $(theadSelector);
    if (!thead) return;

    // Sort functionality
    const headers = thead.querySelectorAll('th.sortable');
    headers.forEach((th) => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            const currentSort = getSortState();
            let newDirection;
            if (currentSort.column === column) {
                newDirection = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                newDirection = 'asc';
            }
            setSortState({ column, direction: newDirection });
            renderFunction();
        });
    });

    // Filter functionality
    if (filterInputId) {
        const filterInput = document.getElementById(filterInputId);
        if (filterInput) {
            filterInput.addEventListener('input', (e) => {
                setFilterText(e.target.value);
                renderFunction();
            });
        }
    }

         for (const [eventName, handler] of Object.entries(extraListeners)) {
            window.addEventListener(eventName, handler, { passive: true });
         }
}

