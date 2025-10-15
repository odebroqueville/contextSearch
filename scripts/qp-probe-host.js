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
        if (!probeIframe) probeIframe = createIframe();

        let settled = false;
        const settle = (blocked) => {
            if (settled) return;
            settled = true;
            try {
                // Keep the iframe so the user can see the final page state; clear src to reduce CPU
                if (probeIframe) {
                    try {
                        probeIframe.src = 'about:blank';
                    } catch (ignore) {
                        // ignore cleanup errors
                    }
                }
            } catch (e) {
                /* ignore cleanup errors */
            }
            resolve(!!blocked);
        };

        const tuning = getHostTuning(url);
        const MAX_ATTEMPTS = Math.max(1, tuning.attempts);
        let attempts = 0;
        let timer = null;
        let hardWatch = null;

        const clearTimer = () => {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
        };

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
            try {
                const doc = probeIframe.contentDocument || probeIframe.contentWindow?.document;
                if (hasContent(doc)) {
                    settle(false);
                    return;
                }
                setTimeout(() => {
                    try {
                        const doc2 = probeIframe.contentDocument || probeIframe.contentWindow?.document;
                        if (hasContent(doc2)) settle(false);
                        else if (attempts < MAX_ATTEMPTS - 1) {
                            attempts += 1;
                            doLoad();
                        } else settle(true);
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
            clearTimer();
            try {
                const u = new URL(url);
                u.searchParams.set('_qpprobe', String(Date.now() % 100000));
                probeIframe.src = u.toString();
            } catch (_) {
                probeIframe.src = url;
            }
            timer = setTimeout(() => {
                if (attempts < MAX_ATTEMPTS - 1) {
                    attempts += 1;
                    doLoad();
                } else settle(true);
            }, tuning.timeoutMs);
            // Ensure a hard cap per probe regardless of events
            if (!hardWatch) {
                hardWatch = setTimeout(() => settle(true), tuning.hardLimitMs);
            }
        };

        probeIframe.onload = () => {
            clearTimer();
            setTimeout(onLoadCheck, 700);
        };
        probeIframe.onerror = () => {
            clearTimer();
            if (attempts < MAX_ATTEMPTS - 1) {
                attempts += 1;
                doLoad();
            } else settle(true);
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
