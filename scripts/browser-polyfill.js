// Simple polyfill for Chrome compatibility
globalThis.browser ??= chrome;

export default browser;
