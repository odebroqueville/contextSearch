/* eslint-env browser, es2021 */
import '/libs/browser-polyfill.min.js';

// This page runs in a background tab. It owns a single sandboxed iframe and
// performs probes on behalf of the Options page via runtime messaging.

let probeIframe = null;
let inFlight = false;

function getHostTuning(url) {
    let host = '';
    try {
        host = new URL(url).hostname || '';
    } catch (_) {
        host = '';
    }
    const is = (re) => re.test(host);
    // Domain-specific tuning for troublemakers
    if (is(/(^|\.)wikiwand\.com$/i)) {
        return { attempts: 1, timeoutMs: 3000, hardLimitMs: 7000 };
    }
    if (is(/(^|\.)boursorama\.com$/i)) {
        return { attempts: 1, timeoutMs: 3500, hardLimitMs: 8000 };
    }
    // LinkedIn often frame-busts or stalls in iframes; keep attempts minimal
    if (is(/(^|\.)linkedin\.com$/i)) {
        return { attempts: 1, timeoutMs: 3000, hardLimitMs: 7000 };
    }
    // Merriam-Webster can be slow/iframe-hostile; avoid long retries
    if (is(/(^|\.)merriam-webster\.com$/i)) {
        return { attempts: 1, timeoutMs: 3500, hardLimitMs: 9000 };
    }
    // Defaults (more responsive than before)
    return { attempts: 2, timeoutMs: 5000, hardLimitMs: 12000 };
}

function getContainer() {
    let div = document.getElementById('container');
    if (!div) {
        div = document.createElement('div');
        div.id = 'container';
        document.body.appendChild(div);
    }
    return div;
}

function createIframe() {
    const container = getContainer();
    const iframe = document.createElement('iframe');
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    // Sandbox to prevent top navigation; allow-same-origin for better load detection
    iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-same-origin');
    iframe.width = '360';
    iframe.height = '520';
    container.appendChild(iframe);
    return iframe;
}

// No longer used: we keep iframe visible for debugging

async function probeOnce(url) {
    return new Promise((resolve) => {
        // Always start with a fresh iframe to avoid sticky state across probes
        try {
            if (probeIframe) {
                try { probeIframe.onload = null; probeIframe.onerror = null; } catch (_) { /* ignore */ }
                try { probeIframe.remove(); } catch (_) { /* ignore */ }
            }
        } catch (_) { /* ignore */ }
        probeIframe = createIframe();

        // Track all timers so they cannot fire after we've settled.
        const pendingTimers = new Set();
        const trackTimeout = (fn, ms) => {
            const id = setTimeout(() => {
                // Do nothing if we've already settled.
                if (settled) return;
                try {
                    fn();
                } catch (_) {
                    /* ignore */
                }
            }, ms);
            pendingTimers.add(id);
            return id;
        };
        const clearAllTimers = () => {
            for (const id of pendingTimers) clearTimeout(id);
            pendingTimers.clear();
        };

        let settled = false;
        const settle = (blocked) => {
            if (settled) return;
            settled = true;
            try {
                // Detach handlers first to avoid races from about:blank load.
                if (probeIframe) {
                    try {
                        probeIframe.onload = null;
                        probeIframe.onerror = null;
                    } catch (_) {
                        /* ignore */
                    }
                }
                // Clear any delayed callbacks from this probeOnce.
                clearAllTimers();
                // Fully remove the iframe to ensure no sticky content or pending navigations remain
                if (probeIframe) {
                    try { probeIframe.remove(); } catch (_) { /* ignore */ }
                    probeIframe = null;
                }
            } catch (e) {
                /* ignore cleanup errors */
            }
            resolve(!!blocked);
        };

        const tuning = getHostTuning(url);
        const MAX_ATTEMPTS = Math.max(1, tuning.attempts);
        let attempts = 0;

        const hasContent = (doc) => {
            try {
                if (!doc) return false;
                const bodyTextLen = (doc.body?.innerText || '').trim().length;
                const titleLen = (doc.title || '').trim().length;
                const childCount = doc.body?.children ? doc.body.children.length : 0;
                return bodyTextLen >= 10 || titleLen >= 1 || childCount >= 1;
            } catch (_) {
                return false;
            }
        };

        const onLoadCheck = () => {
            if (settled) return;
            try {
                const doc = probeIframe.contentDocument || probeIframe.contentWindow?.document;
                if (hasContent(doc)) {
                    settle(false);
                    return;
                }
                // Re-check shortly; if still empty, retry or mark blocked
                trackTimeout(() => {
                    if (settled) return;
                    try {
                        const doc2 = probeIframe.contentDocument || probeIframe.contentWindow?.document;
                        if (hasContent(doc2)) {
                            settle(false);
                        } else if (attempts < MAX_ATTEMPTS - 1) {
                            attempts += 1;
                            doLoad();
                        } else {
                            settle(true);
                        }
                    } catch (_) {
                        // Cross-origin access exception generally means it loaded; treat as unblocked
                        settle(false);
                    }
                }, 1000);
            } catch (_) {
                settle(false);
            }
        };

        const doLoad = () => {
            if (settled) return;
            try {
                const u = new URL(url);
                u.searchParams.set('_qpprobe', String(Date.now() % 100000));
                probeIframe.src = u.toString();
            } catch (_) {
                probeIframe.src = url;
            }
            // Attempt timeout
            trackTimeout(() => {
                if (settled) return;
                if (attempts < MAX_ATTEMPTS - 1) {
                    attempts += 1;
                    doLoad();
                } else {
                    settle(true);
                }
            }, tuning.timeoutMs);
            // Hard cap per probe regardless of events
            trackTimeout(() => settle(true), tuning.hardLimitMs);
        };

        // Fresh handlers for this probe; they will be detached in settle().
        probeIframe.onload = () => {
            // Delay a bit to allow dynamic DOM to render
            trackTimeout(onLoadCheck, 700);
        };
        probeIframe.onerror = () => {
            if (settled) return;
            if (attempts < MAX_ATTEMPTS - 1) {
                attempts += 1;
                doLoad();
            } else {
                settle(true);
            }
        };

        doLoad();
    });
}

function setStatus(text) {
    const el = document.getElementById('status');
    if (el) el.textContent = text;
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.action) return false;
    if (message.action !== 'qpProbe:probeUrl') return false;

    const { url } = message;
    if (!url) {
        sendResponse({ success: false, error: 'No URL' });
        return false;
    }
    // Touch sender to satisfy linter and for potential diagnostics
    try {
        // Access sender.url to keep reference and avoid unused warnings
        // eslint-disable-next-line no-unused-expressions
        sender && sender.url;
    } catch (ignore) {
        // ignore
    }
    if (inFlight) {
        sendResponse({ success: false, error: 'Busy' });
        return false;
    }
    inFlight = true;
    setStatus(`Probing: ${url}`);
    (async () => {
        try {
            const blocked = await probeOnce(url);
            setStatus(`Done: ${blocked ? 'BLOCKED' : 'OK'} :: ${url}`);
            sendResponse({ success: true, blocked });
        } catch (e) {
            setStatus(`Error: ${e?.message || String(e)} :: ${url}`);
            sendResponse({ success: false, error: e?.message || String(e) });
        } finally {
            inFlight = false;
        }
    })();
    return true; // async
});
