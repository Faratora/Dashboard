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
        currency: 'USD'
    }).format(value);
}

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
