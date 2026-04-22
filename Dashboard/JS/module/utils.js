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
    }).format(value);
}

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
            if (currentSort.column === column) {
                setSortState({ column, direction: currentSort.direction === 'asc' ? 'desc' : 'asc' });
            } else {
                setSortState({ column, direction: 'asc' });
            }
            renderFunction();
        });
    });

    // Filter functionality
    const filterInput = document.getElementById(filterInputId);
    if (filterInput) {
        filterInput.addEventListener('input', (e) => {
            setFilterText(e.target.value);
            renderFunction();
        });
    }

    // Extra event listeners (e.g., showProjectEmployees)
    for (const [eventName, handler] of Object.entries(extraListeners)) {
        window.addEventListener(eventName, handler);
    }
}
