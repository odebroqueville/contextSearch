// Simple polyfill for Chrome/Firefox compatibility
if (typeof browser === 'undefined') {
    globalThis.browser = chrome;
}

export default browser;
