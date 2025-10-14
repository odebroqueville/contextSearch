/* Shared logging bootstrap for all content scripts */
/* global DEBUG_VALUE */
(function initSharedLogging() {
    try {
        if (typeof globalThis.__CS_LOG_INIT === 'undefined') {
            globalThis.__CS_LOG_INIT = true;
            globalThis.__CS_LOG_FLAG = (typeof DEBUG_VALUE !== 'undefined' && DEBUG_VALUE) || false;
            const enabled = () => !!globalThis.__CS_LOG_FLAG;
            if (!globalThis.qpLog)
                globalThis.qpLog = (...a) => {
                    if (enabled()) {
                        try {
                            console.log(...a);
                        } catch (err) {
                            /* ignore */
                        }
                    }
                };
            if (!globalThis.qpWarn)
                globalThis.qpWarn = (...a) => {
                    if (enabled()) {
                        try {
                            console.warn(...a);
                        } catch (err) {
                            /* ignore */
                        }
                    }
                };
            if (!globalThis.qpError)
                globalThis.qpError = (...a) => {
                    if (enabled()) {
                        try {
                            console.error(...a);
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
