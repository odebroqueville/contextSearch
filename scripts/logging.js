/* Shared logging bootstrap for all content scripts */
/* global DEBUG_VALUE */
(function initSharedLogging() {
    try {
        if (typeof globalThis.__CS_LOG_INIT === 'undefined') {
            globalThis.__CS_LOG_INIT = true;
            globalThis.__CS_LOG_FLAG = (typeof DEBUG_VALUE !== 'undefined' && DEBUG_VALUE) || false;
            const enabled = () => !!globalThis.__CS_LOG_FLAG;

            // Helper to get caller info (file:line)
            const getCallerInfo = () => {
                try {
                    const error = new Error();
                    const stack = error.stack;
                    if (!stack) return '';
                    const lines = stack.split('\n');
                    // Find the first line that is not from logging.js
                    for (let i = 2; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (!line.includes('logging.js')) {
                            // Match patterns like: at functionName (file.js:line:col) or at file.js:line:col
                            const match = line.match(/at\s+.*?\s+\((.*?):(\d+):(\d+)\)/) || line.match(/at\s+(.*?):(\d+):(\d+)/);
                            if (match) {
                                // Extract filename from path
                                let filePath = match[1];
                                try {
                                    const url = new URL(filePath);
                                    const fileName = url.pathname.split('/').pop();
                                    return `${fileName}:${match[2]}`;
                                } catch (_) {
                                    // If not a URL, try to get basename
                                    const parts = filePath.split(/[/\\]/);
                                    const fileName = parts[parts.length - 1];
                                    return `${fileName}:${match[2]}`;
                                }
                            }
                        }
                    }
                } catch (_) {
                    /* ignore */
                }
                return '';
            };

            if (!globalThis.qpLog)
                globalThis.qpLog = (...a) => {
                    if (enabled()) {
                        try {
                            const caller = getCallerInfo();
                            if (caller) {
                                console.log(`[${caller}]`, ...a);
                            } else {
                                console.log(...a);
                            }
                        } catch (err) {
                            /* ignore */
                        }
                    }
                };
            if (!globalThis.qpWarn)
                globalThis.qpWarn = (...a) => {
                    if (enabled()) {
                        try {
                            const caller = getCallerInfo();
                            if (caller) {
                                console.warn(`[${caller}]`, ...a);
                            } else {
                                console.warn(...a);
                            }
                        } catch (err) {
                            /* ignore */
                        }
                    }
                };
            if (!globalThis.qpError)
                globalThis.qpError = (...a) => {
                    if (enabled()) {
                        try {
                            const caller = getCallerInfo();
                            if (caller) {
                                console.error(`[${caller}]`, ...a);
                            } else {
                                console.error(...a);
                            }
                        } catch (err) {
                            /* ignore */
                        }
                    }
                };
            if (typeof globalThis.logToConsole === 'undefined') Object.defineProperty(globalThis, 'logToConsole', { get: enabled });
        }
    } catch (_) {
        /* silent */
    }
})();
