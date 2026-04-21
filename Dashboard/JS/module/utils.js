export function $(selector) {
    return document.querySelector(selector);
}

export function log(message) {
    console.log(`[App] ${message}`);
}

export function error(message) {
    console.error(`[App Error] ${message}`);
}
