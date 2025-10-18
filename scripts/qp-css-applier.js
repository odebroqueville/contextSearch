/**
 * Quick Preview CSS Applier (document_start)
 * ---------------------------------------------------------------
 * Responsibilities:
 * 1. Detect whether this frame belongs to Quick Preview by locating a stable engine id:
 *    Detection cascade: window.name (csqp:<id>) -> URL search param (csqpid) -> hash param (csqpid)
 *    -> data-csqp-engine attribute -> localStorage('csqpEngineId'). On discovery the id is re-persisted
 *    across these channels to survive hostile redirects or name resets.
 * 2. For DuckDuckGo (ddg) quick preview frames, coerce a narrow "mobile" layout early (before site JS runs):
 *      - Minimal early style (prevent horizontal overflow + hide right rail) injected immediately.
 *      - Narrow viewport meta (width=330) inserted if missing / overridden if too wide.
 *      - Class reassert routine strips desktop-forcing classes (is-not-mobile-device, has-right-rail-module)
 *        and adds mobile indicators (is-mobile, is-mobile-device).
 *      - Short-lived enforcement loop (<= 20s) plus MutationObserver. Loop stops early once stable
 *        (no removed desktop classes for N consecutive intervals) to avoid perpetual timers.
 * 3. Inject layered CSS: generic fit rules, host-specific overrides (full DDG neutralization), then
 *    per-engine custom CSS defined by the user.
 * 4. Guarantee a constrained viewport for consistent bubble sizing (330px) regardless of the page's own meta.
 * 5. All logging is gated by DEBUG_VALUE via logToConsole to keep console noise low in production builds.
 * 6. Defensive: every external interaction is wrapped in try/catch to avoid impacting host page execution.
 */

/* eslint-env browser */
/* global qpLog, qpWarn, qpError, logToConsole */
// logToConsole & qpLog helpers provided by logging.js (loaded first via manifest)

// Inject user-defined Quick Preview CSS into this frame.
// Priority: generic fit rules, built-in host overrides, then per-engine CSS.
(async () => {
    try {
        // EARLY: if this is a DDG quick-preview frame, coerce a mobile layout before their JS runs
        try {
            let wn = window.name || '';
            let engineIdEarly = '';
            const nameHasQP = /^csqp:?/.test(wn);
            if (nameHasQP) {
                const raw = wn.replace(/^csqp:?/, '');
                try {
                    engineIdEarly = decodeURIComponent(raw);
                } catch (_) {
                    engineIdEarly = raw;
                }
            }
            // Detect explicit URL hints
            let hasQPUrlSignal = false;
            if (!engineIdEarly) {
                try {
                    const u = new URL(location.href);
                    engineIdEarly = u.searchParams.get('csqpid') || '';
                    if (u.searchParams.get('csqp') === '1' || engineIdEarly) hasQPUrlSignal = true;
                    if (!engineIdEarly) {
                        const hp = new URLSearchParams(u.hash.replace(/^#/, ''));
                        engineIdEarly = hp.get('csqpid') || '';
                        if (engineIdEarly) hasQPUrlSignal = true;
                    }
                } catch (_) {
                    /* ignore */
                }
            }
            // Only treat this as a Quick Preview context if we have a strong signal (window.name or URL params)
            const inSubframe = (() => {
                try {
                    return window.top !== window.self;
                } catch (_) {
                    return true;
                }
            })();
            const isStrongQPContext = inSubframe && (nameHasQP || hasQPUrlSignal);

            if (isStrongQPContext && engineIdEarly) {
                try {
                    document.documentElement.setAttribute('data-csqp-engine', engineIdEarly);
                } catch (_) {
                    /* ignore */
                }
                try {
                    const enc = (() => {
                        try {
                            return encodeURIComponent(engineIdEarly);
                        } catch (_) {
                            return engineIdEarly;
                        }
                    })();
                    if (window.name !== `csqp:${enc}`) window.name = `csqp:${enc}`;
                } catch (_) {
                    /* ignore */
                }
            }
            // Log only for confirmed QP frames; prefer current window.name for accuracy
            try {
                const currentName = typeof window.name === 'string' && window.name ? window.name : wn;
                if (logToConsole && (isStrongQPContext || /^csqp:/.test(currentName))) {
                    qpLog('QP CSS applier running', {
                        frameName: currentName,
                        detectedEngine: engineIdEarly || null,
                        href: location && location.href ? String(location.href) : '',
                    });
                }
            } catch (_) {
                /* ignore */
            }
            // Apply DDG coercion for any confirmed Quick Preview subframe targeting DDG
            // Trigger when we have a strong QP signal (name or URL) to survive engines that clear window.name
            // Re-check hostIsDDG dynamically since iframe may start on about:blank then navigate to DDG
            // Wrap enforcement in a function so we can re-run when document loads (handles about:blank → DDG navigation)
            const runDDGEnforcement = () => {
                const hostIsDDG = /(^|\.)duckduckgo\.com$/i.test(location.hostname || '');
                const isQPFrame = typeof window.name === 'string' && /^csqp:/.test(window.name);

                if (logToConsole) {
                    qpLog('[QP][DDG] runDDGEnforcement called', {
                        hostIsDDG,
                        isStrongQPContext,
                        isQPFrame,
                        alreadyRan: !!window.__csqpDDGEnforcementRan,
                        hostname: location.hostname,
                        windowName: window.name,
                    });
                }

                if (!hostIsDDG || !(isStrongQPContext || isQPFrame)) {
                    if (logToConsole) qpLog('[QP][DDG] Skipping enforcement - conditions not met');
                    return;
                }
                if (window.__csqpDDGEnforcementRan) {
                    if (logToConsole) qpLog('[QP][DDG] Skipping enforcement - already ran');
                    return;
                }
                window.__csqpDDGEnforcementRan = true;

                if (logToConsole) qpLog('[QP][DDG] ✓ Starting enforcement');

                const html = document.documentElement;
                const originalName = wn || `csqp:${engineIdEarly}`;
                // Track stability, but keep a persistent MutationObserver to counter late DDG flips
                let stableIntervals = 0;
                const REQUIRED_STABLE_INTERVALS = 8; // governs interval loop only
                const INTERVAL_MAX_DURATION_MS = 120000; // run interval assists up to 2 minutes
                const startTime = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
                let intervalLoopStopped = false;
                let mo = null;
                let debugClassLogCount = 0;

                // Define shared banned/required class lists
                const bannedClasses = new Set(['is-not-mobile-device', 'is-not-mobile', 'has-right-rail-module', 'has-right-rail']);
                const requiredClasses = ['is-mobile', 'is-mobile-device'];

                // Sanitize function used by reassert, setAttribute, and className/classList patchers
                const sanitizeClassValue = (value) => {
                    const tokens = new Set(
                        String(value || '')
                            .split(/\s+/)
                            .filter(Boolean)
                    );
                    for (const b of bannedClasses) tokens.delete(b);
                    for (const r of requiredClasses) tokens.add(r);
                    return Array.from(tokens).join(' ');
                };

                // IMMEDIATE: Sanitize existing classes on html/body before DDG scripts run
                // Use a synchronous busy-wait to catch classes set by inline scripts
                try {
                    const sanitizeNow = () => {
                        let changed = false;
                        if (html && html.className) {
                            const before = html.className;
                            const sanitized = sanitizeClassValue(before);
                            if (before !== sanitized) {
                                html.className = sanitized;
                                if (logToConsole) qpLog('[QP][DDG] IMMEDIATE html sanitized', { before, after: sanitized });
                                changed = true;
                            }
                        }
                        if (document.body && document.body.className) {
                            const before = document.body.className;
                            const sanitized = sanitizeClassValue(before);
                            if (before !== sanitized) {
                                document.body.className = sanitized;
                                if (logToConsole) qpLog('[QP][DDG] IMMEDIATE body sanitized', { before, after: sanitized });
                                changed = true;
                            }
                        }
                        return changed;
                    };
                    // Initial immediate check
                    sanitizeNow();
                    // Micro-task burst to catch classes set by inline scripts
                    for (let i = 0; i < 10; i++) {
                        Promise.resolve().then(sanitizeNow);
                    }
                } catch (_) {
                    /* ignore */
                }

                // Global setAttribute patch for html/body (runs once per frame)
                try {
                    const origSetAttribute = Element.prototype.setAttribute;
                    if (!Element.prototype.__csqpSetAttrPatched) {
                        Object.defineProperty(Element.prototype, '__csqpSetAttrPatched', {
                            value: true,
                            configurable: false,
                            enumerable: false,
                            writable: false,
                        });
                        Element.prototype.setAttribute = function (name, value) {
                            try {
                                if ((this === document.documentElement || this === document.body) && String(name).toLowerCase() === 'class') {
                                    const sanitized = sanitizeClassValue(value);
                                    if (logToConsole && value !== sanitized) {
                                        qpLog('[QP][DDG] setAttribute sanitized', { before: value, after: sanitized });
                                    }
                                    return origSetAttribute.call(this, name, sanitized);
                                }
                            } catch (_) {
                                /* ignore */
                            }
                            return origSetAttribute.call(this, name, value);
                        };
                    }
                } catch (_) {
                    /* ignore */
                }

                const observeAttrOptions = { attributes: true, attributeFilter: ['class'] };
                const observeStructureOptions = { childList: true, subtree: true };

                // Patch html/body className and classList BEFORE any reassert runs
                const patchNode = (node) => {
                    if (!node || node.__csqpClassPatched) return;
                    try {
                        Object.defineProperty(node, '__csqpClassPatched', { value: true, configurable: false, enumerable: false, writable: false });
                    } catch (_) {
                        return;
                    }

                    try {
                        // className property patch
                        const desc =
                            Object.getOwnPropertyDescriptor(node, 'className') ||
                            Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node), 'className');
                        const originalSetter = desc && desc.set;
                        const originalGetter = desc && desc.get;
                        if (originalSetter || originalGetter) {
                            Object.defineProperty(node, 'className', {
                                configurable: true,
                                enumerable: true,
                                get() {
                                    return originalGetter ? originalGetter.call(this) : this.getAttribute('class') || '';
                                },
                                set(v) {
                                    const sv = sanitizeClassValue(v);
                                    if (logToConsole && v !== sv) {
                                        qpLog('[QP][DDG] className sanitized', {
                                            node: node === document.documentElement ? 'html' : 'body',
                                            before: v,
                                            after: sv,
                                        });
                                    }
                                    if (originalSetter) originalSetter.call(this, sv);
                                    else this.setAttribute('class', sv);
                                },
                            });
                        }
                    } catch (_) {
                        /* ignore */
                    }

                    try {
                        // classList methods patch (add, remove, toggle)
                        const cl = node.classList;
                        if (cl && !cl.__csqpPatched) {
                            Object.defineProperty(cl, '__csqpPatched', { value: true, configurable: false, enumerable: false, writable: false });
                            const origAdd = cl.add.bind(cl);
                            const origRemove = cl.remove.bind(cl);
                            const origToggle = cl.toggle.bind(cl);
                            cl.add = (...args) => {
                                const filtered = args.filter((c) => !bannedClasses.has(String(c)));
                                if (logToConsole && args.length !== filtered.length) {
                                    qpLog('[QP][DDG] classList.add sanitized', {
                                        node: node === document.documentElement ? 'html' : 'body',
                                        blocked: args.filter((c) => bannedClasses.has(String(c))),
                                    });
                                }
                                const ret = filtered.length ? origAdd(...filtered) : undefined;
                                requiredClasses.forEach((r) => {
                                    if (!cl.contains(r)) origAdd(r);
                                });
                                return ret;
                            };
                            cl.remove = (...args) => {
                                const filtered = args.filter((c) => !requiredClasses.includes(String(c)));
                                if (logToConsole && args.length !== filtered.length) {
                                    qpLog('[QP][DDG] classList.remove blocked', {
                                        node: node === document.documentElement ? 'html' : 'body',
                                        blocked: args.filter((c) => requiredClasses.includes(String(c))),
                                    });
                                }
                                return origRemove(...filtered);
                            };
                            cl.toggle = (token, force) => {
                                const t = String(token);
                                if (bannedClasses.has(t)) return cl.contains(t);
                                if (requiredClasses.includes(t)) {
                                    if (force === false) return true; // refuse to remove required
                                    origAdd(t);
                                    return true;
                                }
                                return origToggle(token, force);
                            };
                        }
                    } catch (_) {
                        /* ignore */
                    }
                };

                // Patch html/body immediately
                patchNode(document.documentElement);
                if (document.body) patchNode(document.body);

                const reassert = (reason = 'interval') => {
                    const removeList = ['is-not-mobile-device', 'is-not-mobile', 'has-right-rail-module', 'has-right-rail'];
                    const addList = ['is-mobile', 'is-mobile-device'];
                    let removedDesktop = false;

                    const forceClasses = (node) => {
                        if (!node) return false;
                        let changed = false;
                        try {
                            // Prefer classList API for deterministic add/remove
                            if (node.classList) {
                                for (const cls of removeList) {
                                    if (node.classList.contains(cls)) {
                                        node.classList.remove(cls);
                                        changed = true;
                                        removedDesktop = true;
                                    }
                                }
                                for (const cls of addList) {
                                    if (!node.classList.contains(cls)) {
                                        node.classList.add(cls);
                                        changed = true;
                                    }
                                }
                                return changed;
                            }
                        } catch (_) {
                            /* fall through to string mode */
                        }
                        // Fallback: string token mode
                        try {
                            const before = node.className || '';
                            const tokens = new Set(String(before).split(/\s+/).filter(Boolean));
                            let removed = false;
                            removeList.forEach((c) => {
                                if (tokens.delete(c)) removed = true;
                            });
                            addList.forEach((c) => tokens.add(c));
                            const after = Array.from(tokens).join(' ');
                            if (after !== before) {
                                node.className = after;
                                changed = true;
                                if (removed) removedDesktop = true;
                            }
                        } catch (_) {
                            /* ignore */
                        }
                        return changed;
                    };

                    forceClasses(document.documentElement);
                    forceClasses(document.body);
                    const vp = document.querySelector('meta[name="viewport"]');
                    if (!vp) {
                        const meta = document.createElement('meta');
                        meta.name = 'viewport';
                        meta.content = 'width=330, initial-scale=1, maximum-scale=1, user-scalable=no';
                        document.head && document.head.appendChild(meta);
                    }
                    if (logToConsole && debugClassLogCount < 10) {
                        try {
                            qpLog('[QP][DDG] classes after', reason, {
                                html: (document.documentElement && document.documentElement.className) || '',
                                body: (document.body && document.body.className) || '',
                            });
                            debugClassLogCount += 1;
                        } catch (_) {
                            /* ignore */
                        }
                    }
                    if (removedDesktop && logToConsole) qpLog('[QP][DDG] reassert (', reason, ') removed desktop classes');
                    return removedDesktop;
                };
                if (html) reassert();
                if (!document.getElementById('csqp-ddg-early')) {
                    try {
                        const earlyStyle = document.createElement('style');
                        earlyStyle.id = 'csqp-ddg-early';
                        // Beefed-up early coercion to prevent desktop layout snap before our later CSS lands
                        earlyStyle.textContent = `
html,body{min-width:0!important;max-width:100%!important;width:auto!important;overflow-x:hidden!important;}
#right-rail,[id*='right-rail'],[class*='right-rail'],.results--sidebar,[class*='sidebar']{display:none!important;max-width:0!important;width:0!important;}
/* Common DDG wrappers */
body,.site-wrapper,.react-layout,.body-wrapper,.serp__body,.results,.results--main,.zcm-wrap,.zcm,.zcm__container,.header-wrap,.footer,.nav-menu--slideout,.nav-menu__slideout,main,#__next{min-width:0!important;max-width:100%!important;width:auto!important;overflow-x:hidden!important;margin-left:0!important;margin-right:0!important;}
/* Remove unexpected vertical scrollbar in DDG header */
#header_wrapper,
.header-wrap,
.header-wrap--fixed,
.header-wrap__inner,
[id*='header'][id*='wrap'],
[class*='header-wrap']{
    overflow-y: hidden !important;
    overflow-x: hidden !important;
    max-height: none !important;
    height: auto !important;
    -webkit-overflow-scrolling: auto !important;
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
}
#header_wrapper::-webkit-scrollbar,
.header-wrap::-webkit-scrollbar,
.header-wrap--fixed::-webkit-scrollbar,
.header-wrap__inner::-webkit-scrollbar,
[id*='header'][id*='wrap']::-webkit-scrollbar,
[class*='header-wrap']::-webkit-scrollbar{width:0!important;height:0!important;display:none!important;}
/* Additional guards against inline constraints */
[style*='min-width']{min-width:0!important;}
[style*='max-width']{max-width:100%!important;}
/* Prefer wrapping to avoid overflow */
.serp__body a,.serp__body p,.serp__body span,.results a,.results p,.results span{word-break:break-word!important;overflow-wrap:anywhere!important;}
/* Nuke wide flags early */
html.is-not-mobile-device,body.is-not-mobile-device,html.has-right-rail-module body,body.has-right-rail-module body{min-width:0!important;}
`;
                        (document.head || document.documentElement).appendChild(earlyStyle);
                    } catch (_) {
                        /* ignore */
                    }
                }
                // Prepend a narrow viewport as early as we can
                if (document.head && !document.querySelector('meta[name="viewport"]')) {
                    const meta = document.createElement('meta');
                    meta.name = 'viewport';
                    meta.content = 'width=330, initial-scale=1, maximum-scale=1, user-scalable=no';
                    document.head.appendChild(meta);
                }
                // Stability-limited enforcement (max 20s or early stop when stable)
                if (!window.__csqpDDGEnforcer) {
                    window.__csqpDDGEnforcer = true;
                    try {
                        // Persistently observe class flips to reassert mobile layout
                        mo = new MutationObserver(() => {
                            // On any structure/class change, reassert and ensure observers are attached to current nodes
                            const removed = reassert('mutation');
                            if (removed) stableIntervals = 0;
                            else stableIntervals++;
                            try {
                                if (document.documentElement) mo.observe(document.documentElement, observeAttrOptions);
                                if (document.body) mo.observe(document.body, observeAttrOptions);
                            } catch (_) {
                                /* ignore */
                            }
                        });
                        if (document.documentElement) mo.observe(document.documentElement, observeAttrOptions);
                        if (document.body) mo.observe(document.body, observeAttrOptions);
                        if (document.head) mo.observe(document.head, observeStructureOptions);
                        // Also observe the whole document for node replacements
                        mo.observe(document, observeStructureOptions);
                    } catch (_) {
                        /* ignore */
                    }

                    // Early rapid burst using requestAnimationFrame to outpace initial DDG class flips
                    try {
                        let frames = 0;
                        const maxFrames = 120; // ~2 seconds at 60fps
                        const rafTick = () => {
                            frames += 1;
                            reassert('raf');
                            if (frames < maxFrames) requestAnimationFrame(rafTick);
                        };
                        requestAnimationFrame(rafTick);
                    } catch (_) {
                        /* ignore */
                    }

                    // Hook lifecycle edges where DDG may toggle classes
                    try {
                        const hook = () => reassert('event');
                        document.addEventListener('readystatechange', hook, { passive: true });
                        document.addEventListener('DOMContentLoaded', hook, { passive: true, once: true });
                        window.addEventListener('load', hook, { passive: true, once: true });
                        document.addEventListener(
                            'visibilitychange',
                            () => {
                                if (!document.hidden) reassert('visibility');
                            },
                            { passive: true }
                        );
                    } catch (_) {
                        /* ignore */
                    }
                    const loop = () => {
                        if (intervalLoopStopped) return;
                        const removed = reassert('interval');
                        if (removed) {
                            stableIntervals = 0;
                        } else {
                            stableIntervals++;
                        }
                        try {
                            if (!window.name) window.name = originalName;
                        } catch (_) {
                            /* ignore */
                        }
                        const now = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
                        const elapsed = now - startTime;
                        // Stop only the periodic interval assists after a while; keep MutationObserver active
                        if (elapsed >= INTERVAL_MAX_DURATION_MS || stableIntervals >= REQUIRED_STABLE_INTERVALS) {
                            intervalLoopStopped = true;
                            if (logToConsole) qpLog('[QP][DDG] Interval enforcement stopped; observer remains active', { elapsed, stableIntervals });
                            return;
                        }
                        // Adaptive cadence: fast first second, then moderate
                        let delay = 180; // default fast
                        if (elapsed > 4000) delay = 350;
                        if (elapsed > 10000) delay = 500;
                        setTimeout(loop, delay);
                    };
                    loop();
                }
            };

            // Run immediately (works if already on DDG domain)
            runDDGEnforcement();

            // Re-run on readystatechange to catch navigation from about:blank → DDG
            if (isStrongQPContext) {
                document.addEventListener('readystatechange', () => {
                    if (document.readyState === 'interactive' || document.readyState === 'complete') {
                        runDDGEnforcement();
                    }
                });
                // Also try on DOMContentLoaded in case readystatechange fires before script loads
                document.addEventListener('DOMContentLoaded', runDDGEnforcement, { once: true });
            }
        } catch (_) {
            // ignore
        }

        // Decide if this is a Quick Preview frame (robustly), even before resolving engineId
        const isLikelyQPFrame = (() => {
            // Require subframe context to avoid touching top-level pages
            let inSubframe = false;
            try {
                inSubframe = window.top !== window.self;
            } catch (_) {
                inSubframe = true;
            }
            if (!inSubframe) return false;
            try {
                // Strong signal: window.name marked by quick-preview iframe
                if (typeof window.name === 'string' && /^csqp:/.test(window.name)) return true;
            } catch (_) {
                /* ignore */
            }
            try {
                // URL hint added by quick-preview retries
                const u = new URL(location.href);
                if (u.searchParams.get('csqp') === '1') return true;
            } catch (_) {
                /* ignore */
            }
            try {
                // Attribute propagated by applier if seen earlier
                if (document.documentElement.getAttribute('data-csqp-engine')) return true;
            } catch (_) {
                /* ignore */
            }
            return false;
        })();

        // Only proceed when this frame belongs to Quick Preview
        if (!isLikelyQPFrame) return;

        // Resolve engineId if available (optional)
        let engineId = '';
        const resolveFromUrl = () => {
            try {
                const u = new URL(location.href);
                let eid = u.searchParams.get('csqpid');
                if (!eid) {
                    const hp = new URLSearchParams(u.hash.replace(/^#/, ''));
                    eid = hp.get('csqpid');
                }
                return eid || '';
            } catch (_) {
                return '';
            }
        };

        // 1. Prefer encoded window.name (stable across redirects)
        if (!engineId) {
            const wname = window.name || '';
            if (/^csqp:?/.test(wname)) {
                const raw = wname.replace(/^csqp:?/, '');
                try {
                    engineId = decodeURIComponent(raw);
                } catch (_) {
                    engineId = raw; // best effort
                }
            }
        }

        // 2. Fallback to explicit URL parameter / hash (may be dropped by some engines)
        if (!engineId) engineId = resolveFromUrl();
        // 3. Then attribute
        if (!engineId) engineId = document.documentElement.getAttribute('data-csqp-engine') || '';
        // 4. Then localStorage (least reliable / may be stale) — only within confirmed QP subframes
        if (!engineId) {
            try {
                engineId = localStorage.getItem('csqpEngineId') || '';
            } catch (_) {
                /* ignore */
            }
        }

        // Capture initial hostname (reserved for future diagnostics if needed)
        // const initialHostname = location.hostname || '';
        if (engineId) {
            try {
                document.documentElement.setAttribute('data-csqp-engine', engineId);
            } catch (_) {
                /* ignore */
            }
            try {
                // Persist engine id for this origin only after we've positively identified a QP subframe
                localStorage.setItem('csqpEngineId', engineId);
            } catch (_) {
                /* ignore */
            }
            try {
                const encoded = (() => {
                    try {
                        return encodeURIComponent(engineId);
                    } catch (_) {
                        return engineId;
                    }
                })();
                if (window.name !== `csqp:${encoded}`) window.name = `csqp:${encoded}`;
            } catch (_) {
                /* ignore */
            }
        } else {
            return; // Not a quick preview frame we recognize
        }

        // Read per-engine CSS once (initial attempt)
        let engineSpecificCSS = '';
        // Use webextension polyfill (browser.*) provided in manifest; no chrome.* fallback needed
        const storageGet = async (key) => {
            try {
                return await browser.storage.local.get(key);
            } catch (_) {
                return {};
            }
        };
        const fetchEngineCSS = async (idOverride) => {
            try {
                const res = await storageGet('quickPreview');
                const qp = res && res.quickPreview ? res.quickPreview : {};
                return (qp.engines && qp.engines[idOverride] && qp.engines[idOverride].customCSS) || '';
            } catch (_) {
                return '';
            }
        };
        engineSpecificCSS = await fetchEngineCSS(engineId);

        // Always add a small generic fit stylesheet to improve narrow frame layout
        const genericFitCSS = `
html, body { max-width: 100% !important; overflow-x: hidden !important; }
img, video, canvas, svg { max-width: 100% !important; height: auto !important; }
table { width: 100% !important; table-layout: auto !important; overflow-x: auto !important; display: block; }
pre, code { white-space: pre-wrap !important; word-break: break-word !important; }
* { box-sizing: border-box !important; }
/* Hide vertical/horizontal scrollbars inside QP iframes while keeping scroll functional */
html, body { -ms-overflow-style: none !important; scrollbar-width: none !important; }
html::-webkit-scrollbar, body::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
/* Also hide on nested scroll containers to avoid secondary bars */
*::-webkit-scrollbar { width: 0 !important; height: 0 !important; }
`.trim();

        // Host-level overrides for stubborn layouts
        let hostSpecificCSS = '';
        // Minimal DDG safety net / extended neutralization
        try {
            if (/\.duckduckgo\.com$/i.test(location.hostname || '')) {
                hostSpecificCSS += `
/* DDG: enforce narrow responsive layout and kill horizontal overflow */
html, body { min-width: 0 !important; max-width: 100% !important; width: auto !important; overflow-x: hidden !important; overflow-x: clip !important; }
/* Hide right/complementary rails aggressively */
#right-rail, [id*='right-rail'], [class*='right-rail'], .results--sidebar, [class*='sidebar'], [class*='rail'], [role='complementary'], aside { display: none !important; max-width: 0 !important; width: 0 !important; }
/* Primary wrappers should never exceed frame width */
body, .site-wrapper, .react-layout, .body-wrapper, .serp__body, main, .results, .results--main, .zcm-wrap, .zcm, .zcm__container, .header-wrap, .nav-menu--slideout, .nav-menu__slideout, .footer, #__next {
    min-width: 0 !important; max-width: 100% !important; width: auto !important; overflow-x: hidden !important; margin-left: 0 !important; margin-right: 0 !important;
}
/* Remove unexpected vertical scrollbar in DDG header */
#header_wrapper,
.header-wrap,
.header-wrap--fixed,
.header-wrap__inner,
[id*='header'][id*='wrap'],
[class*='header-wrap'] {
    overflow-y: hidden !important;
    overflow-x: hidden !important;
    max-height: none !important;
    height: auto !important;
    -webkit-overflow-scrolling: auto !important;
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
}
#header_wrapper::-webkit-scrollbar,
.header-wrap::-webkit-scrollbar,
.header-wrap--fixed::-webkit-scrollbar,
.header-wrap__inner::-webkit-scrollbar,
[id*='header'][id*='wrap']::-webkit-scrollbar,
[class*='header-wrap']::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
/* Prevent grid/cards from forcing width */
.react-layout [class*='grid'], .react-layout [class*='module'], .result, .tile, .result__body, .results--main > *, .results > *, [class*='tile__'], [class*='module__'] {
    max-width: 100% !important; width: auto !important; overflow-x: hidden !important;
}
/* Collapse multi-column grids to a single column when possible */
.react-layout, [class*='layout'], [class*='grid'] { grid-template-columns: 1fr !important; }
.react-layout, [class*='layout'], .results--main, .serp__body { display: block !important; }
/* Clamp direct children of body and key containers */
body > *, .serp__body > *, .results--main > *, #__next > * { max-width: 100% !important; overflow-x: hidden !important; }
/* Last-resort guards to neutralize min-width constraints */
*, .serp__body *, .results *, #__next * { min-width: 0 !important; }
/* Clamp any lingering child widths inside main body to viewport */
.serp__body *, .results *, .results--main *, #__next * { max-width: 100% !important; }
/* Force long text to wrap to avoid overflow */
.serp__body a, .serp__body p, .serp__body span, .results a, .results p, .results span, #__next a, #__next p, #__next span { word-break: break-word !important; overflow-wrap: anywhere !important; }
/* Kill lingering desktop flags without relying on class removal */
html.is-not-mobile-device, body.is-not-mobile-device { min-width: 0 !important; }
html.has-right-rail-module #right-rail, body.has-right-rail-module #right-rail { display: none !important; }
html.has-right-rail-module .results--main, body.has-right-rail-module .results--main { max-width: 100% !important; }
/* Guard against inline width/min-width on key containers */
.results--main[style*='width'], .react-layout[style*='width'], .site-wrapper[style*='width'], .serp__body[style*='width'], #__next[style*='width'] { width: auto !important; max-width: 100% !important; }
[style*='min-width'] { min-width: 0 !important; }
[style*='max-width'] { max-width: 100% !important; }
/* Make sure table-like blocks and code wrap inside narrow frame */
pre, code, .module__item, .module, .tile__body { white-space: normal !important; word-break: break-word !important; }
`;
            }
            // DeepL: neutralize site-level pointer-event and scroll locks that can block interaction
            if (/(^|\.)deepl\.com$/i.test(location.hostname || '')) {
                hostSpecificCSS += `
/* DeepL: ensure the document is interactive and scrollable inside the narrow frame */
html, body {
    pointer-events: auto !important;
    overflow: auto !important;
    overflow-y: auto !important;
}
/* If DeepL applies pointer-events: none to body during modals/transitions, undo it here */
body[style*='pointer-events'] { pointer-events: auto !important; }
/* Common DeepL overlays that might block input: make them non-interactive in QP */
[class*='overlay'], [id*='overlay'], .dl_modal, .dl-screen, .dl__overlay {
    pointer-events: none !important;
}
/* Avoid fixed/locked body when their JS toggles it */
html[style*='overflow: hidden'], body[style*='overflow: hidden'] {
    overflow: auto !important;
}
/* Keep scrollbars functional even if DeepL tries to hide them */
* { -webkit-overflow-scrolling: touch !important; }
`;
            }
            // Google Search: clamp layout to narrow single-column and prevent horizontal overflow
            if (/google\.[a-z.]+$/i.test(location.hostname || '')) {
                hostSpecificCSS += `
/* Google Search narrow frame adjustments */
html, body { min-width: 0 !important; max-width: 100% !important; width: auto !important; overflow-x: hidden !important; overflow-x: clip !important; margin-left: 0 !important; margin-right: 0 !important; padding: 0 10px !important; }
/* Hide right rail / sidebars that force width */
#rhs, [role='complementary'], .commercial-unit-desktop-right, #tadsb, #tad-desktop { display: none !important; max-width: 0 !important; width: 0 !important; }
/* Override the grid system to collapse to single column */
.YNk70c, .NbTBrb, .GyAeWb, .tXI1nd, #rcnt { 
    display: block !important; 
    grid-template-columns: 1fr !important;
    max-width: 100% !important; 
    width: auto !important; 
    overflow-x: hidden !important; 
}
/* Force center column to full width instead of grid positioning */
.ufC5Cb, .s6JM6d { 
    grid-column: 1 !important; 
    grid-column-start: 1 !important;
    grid-column-end: 2 !important;
    min-width: 0 !important; 
    max-width: 100% !important; 
    width: 100% !important;
    margin: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
}
/* Clamp main containers to frame width */
#cnt, #rcnt, #center_col, #search, #rso, main, #res { max-width: 100% !important; width: auto !important; overflow-x: hidden !important; }
/* Prevent grids/cards from widening the layout */
#search *, #rso *, #res *, #center_col * { max-width: 100% !important; min-width: 0 !important; }
/* Common result blocks */
.g, .tF2Cxc, .IsZvec, .yuRUbf, .VwiC3b, .hlcw0c, .MjjYud, .kvH3mc { max-width: 100% !important; width: auto !important; overflow-x: hidden !important; }
/* Tighten header and appbar to avoid internal horizontal scroll */
#topabar, #appbar, #searchform, .sfbg, .minidiv, .appbar { overflow-x: hidden !important; max-width: 100% !important; }
/* Images and tables fit frame */
img, video, canvas, svg { max-width: 100% !important; height: auto !important; }
table { width: 100% !important; table-layout: auto !important; display: block !important; overflow-x: auto !important; }
/* Wrap long text to avoid overflow */
#search a, #search p, #search span, #search div { word-break: break-word !important; overflow-wrap: anywhere !important; }

/* Additional rules for knowledge panels and special content */
.kp-wholepage, .ss6qqb, .zLsiYe, .mnr-c { max-width: 100% !important; width: auto !important; overflow-x: hidden !important; }
.e8Ck0d, .VNzqVe, .e6hL7d { max-width: 100% !important; width: auto !important; overflow-x: hidden !important; }
/* Grid layouts in knowledge panels */
.e6hL7d { grid-template-columns: 1fr !important; }
.W0urI, .QejDDf { grid-column: span 1 !important; max-width: 100% !important; }
/* Featured snippets and special cards */
.xfX4Ac, .YpyODe, .JI5uCe, .pESs7c { max-width: 100% !important; width: auto !important; overflow-x: hidden !important; }
/* News carousel and image results */
.KFFQ0c, .WnHMEc, .zP82e { max-width: 100% !important; overflow-x: hidden !important; }
.O5OgBe, .lSfe4c { max-width: 100% !important; width: auto !important; }
/* Navigation and pagination */
.AaVjTc, .LLNLxf { max-width: 100% !important; overflow-x: auto !important; }
/* Specific overrides for container classes */
.ZPOWwb, .EYIWQc { max-width: 100% !important; width: auto !important; margin: 0 !important; }
`;
            }
        } catch (_) {
            /* ignore */
        }

        if (!engineSpecificCSS || typeof engineSpecificCSS !== 'string') engineSpecificCSS = '';
        if (logToConsole) qpLog('[QP][CSS] Engine CSS retrieved (initial)', { engineId, length: engineSpecificCSS.length });

        // Compose base style (generic + host) and a separate engine style to guarantee cascade priority
        const baseCss = [genericFitCSS, hostSpecificCSS.trim()].filter(Boolean).join('\n');
        const engineCss = (engineSpecificCSS || '').trim();

        let baseAppended = false;
        try {
            const baseStyle = document.createElement('style');
            baseStyle.setAttribute('data-cs-qp-style', 'base');
            baseStyle.setAttribute('data-csqp-engine', engineId);
            baseStyle.textContent = baseCss;
            (document.head || document.documentElement).appendChild(baseStyle);
            baseAppended = true;
        } catch (e) {
            if (logToConsole) qpWarn('[QP][CSS] Base style append failed', e);
        }
        if (!baseAppended) {
            try {
                if ('adoptedStyleSheets' in document) {
                    const sheet = new CSSStyleSheet();
                    sheet.replaceSync(baseCss);
                    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
                    baseAppended = true;
                    if (logToConsole) qpLog('[QP][CSS] Base adoptedStyleSheet applied');
                }
            } catch (e2) {
                if (logToConsole) qpError('[QP][CSS] Base adoptedStyleSheet failed', e2);
            }
        }

        const appendEngineStyle = (cssText, tagId = 'cs-qp-engine-style') => {
            try {
                // Remove any previous engine style to avoid duplicates
                const prev = document.getElementById(tagId);
                if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
            } catch (_) {
                /* ignore */
            }
            try {
                const engStyle = document.createElement('style');
                engStyle.id = tagId;
                engStyle.setAttribute('data-cs-qp-style', 'engine');
                engStyle.setAttribute('data-csqp-engine', engineId);
                engStyle.textContent = cssText;
                (document.head || document.documentElement).appendChild(engStyle);
                if (logToConsole) qpLog('[QP][CSS] Engine CSS injected', { engineId, length: cssText.length });
                return true;
            } catch (e) {
                if (logToConsole) qpWarn('[QP][CSS] Engine style append failed', e);
                return false;
            }
        };

        if (engineCss) {
            appendEngineStyle(engineCss);
        }

        // Live updates: if options page saves new customCSS, apply it without reload
        try {
            if (browser && browser.storage && browser.storage.onChanged) {
                const onChange = (changes, area) => {
                    if (area !== 'local' || !changes || !changes.quickPreview) return;
                    try {
                        const qp = changes.quickPreview.newValue || {};
                        const cssNew = qp && qp.engines && qp.engines[engineId] && qp.engines[engineId].customCSS;
                        if (typeof cssNew === 'string') {
                            appendEngineStyle(cssNew, 'cs-qp-engine-style');
                        }
                    } catch (_) {
                        /* ignore */
                    }
                };
                browser.storage.onChanged.addListener(onChange);
            }
        } catch (_) {
            /* ignore */
        }

        // Late reconciliation: if engineId derived from url differs from stored one or CSS was empty, retry a few times
        const urlEngineId = resolveFromUrl();
        const mismatch = urlEngineId && urlEngineId !== engineId;
        const needsRetry = mismatch || !engineSpecificCSS;
        if (needsRetry) {
            if (logToConsole) qpLog('[QP][CSS] Scheduling late CSS retries', { mismatch, initialEngineId: engineId, urlEngineId });
            let attempts = 0;
            const maxAttempts = 6; // ~ up to ~2s spread
            const schedule = [150, 300, 600, 1000, 1600];
            const lateInject = async () => {
                attempts++;
                let effectiveId = engineId;
                if (mismatch) {
                    effectiveId = urlEngineId; // trust explicit param later
                    try {
                        document.documentElement.setAttribute('data-csqp-engine', effectiveId);
                    } catch (_) {
                        /* ignore */
                    }
                }
                const cssNow = await fetchEngineCSS(effectiveId);
                if (cssNow && cssNow.trim().length) {
                    // Append/replace late engine style so it wins cascade
                    appendEngineStyle(cssNow, 'cs-qp-engine-style');
                    if (logToConsole) qpLog('[QP][CSS] Late engine CSS injected', { effectiveId, length: cssNow.length, attempts });
                    return;
                }
                if (attempts < maxAttempts) {
                    const delay = schedule[attempts - 1] || 2000;
                    setTimeout(lateInject, delay);
                } else if (logToConsole) {
                    qpWarn('[QP][CSS] Late retries exhausted – no custom CSS applied', { finalId: effectiveId });
                }
            };
            setTimeout(lateInject, 0);
        }

        // Ensure a viewport that caps width to the bubble (~330px) instead of device width
        try {
            if (document.head) {
                const style = document.createElement('style');
                style.id = 'lumetrium_css_vars';
                style.textContent =
                    ':root {  --v-primary-base: #a36600; --v-primary-lighten5: #ffec8d; --v-primary-lighten4: #ffcf72; --v-primary-lighten3: #feb458; --v-primary-lighten2: #df993e; --v-primary-lighten1: #c17f23; --v-primary-darken1: #864e00; --v-primary-darken2: #6a3700; --v-primary-darken3: #512000; --v-primary-darken4: #3d0900; --v-secondary-base: #455a64; --v-secondary-lighten5: #c6dde9; --v-secondary-lighten4: #abc2cd; --v-secondary-lighten3: #90a6b2; --v-secondary-lighten2: #768c97; --v-secondary-lighten1: #5d737d; --v-secondary-darken1: #2e434c; --v-secondary-darken2: #182c35; --v-secondary-darken3: #011820; --v-secondary-darken4: #000009; --v-accent-base: #fff8e1; --v-accent-lighten5: #ffffff; --v-accent-lighten4: #ffffff; --v-accent-lighten3: #ffffff; --v-accent-lighten2: #ffffff; --v-accent-lighten1: #fffffe; --v-accent-darken1: #e2dbc5; --v-accent-darken2: #c6c0aa; --v-accent-darken3: #aba58f; --v-accent-darken4: #908a76; --v-error-base: #f44336; --v-error-lighten5: #ffd6b5; --v-error-lighten4: #ffb89a; --v-error-lighten3: #ff9b80; --v-error-lighten2: #ff7e66; --v-error-lighten1: #ff614e; --v-error-darken1: #d31f1f; --v-error-darken2: #b30008; --v-error-darken3: #940000; --v-error-darken4: #760000; --v-warning-base: #ff5722; --v-warning-lighten5: #ffe7a5; --v-warning-lighten4: #ffc98a; --v-warning-lighten3: #ffac6f; --v-warning-lighten2: #ff9055; --v-warning-lighten1: #ff743c; --v-warning-darken1: #de3902; --v-warning-darken2: #bd1300; --v-warning-darken3: #9e0000; --v-warning-darken4: #800000; --v-info-base: #546e7a; --v-info-lighten5: #d8f5ff; --v-info-lighten4: #bcd8e6; --v-info-lighten3: #a1bdca; --v-info-lighten2: #87a2ae; --v-info-lighten1: #6d8794; --v-info-darken1: #3c5661; --v-info-darken2: #253e49; --v-info-darken3: #0d2933; --v-info-darken4: #00141e; --v-success-base: #4caf50; --v-success-lighten5: #dcffd6; --v-success-lighten4: #beffba; --v-success-lighten3: #a2ff9e; --v-success-lighten2: #85e783; --v-success-lighten1: #69cb69; --v-success-darken1: #2d9437; --v-success-darken2: #00791e; --v-success-darken3: #006000; --v-success-darken4: #004700; --v-ground-base: #343a40; --v-ground-lighten5: #b0b7be; --v-ground-lighten4: #959ca3; --v-ground-lighten3: #7b8289; --v-ground-lighten2: #636970; --v-ground-lighten1: #4b5157; --v-ground-darken1: #1f242a; --v-ground-darken2: #070f16; --v-ground-darken3: #000000; --v-ground-darken4: #000000; --v-text-base: #ffffff; --v-text-lighten5: #ffffff; --v-text-lighten4: #ffffff; --v-text-lighten3: #ffffff; --v-text-lighten2: #ffffff; --v-text-lighten1: #ffffff; --v-text-darken1: #e2e2e2; --v-text-darken2: #c6c6c6; --v-text-darken3: #ababab; --v-text-darken4: #919191; --v-ptext-base: #ffa000; --v-ptext-lighten5: #ffffa4; --v-ptext-lighten4: #ffff87; --v-ptext-lighten3: #fff36b; --v-ptext-lighten2: #ffd74e; --v-ptext-lighten1: #ffbb30; --v-ptext-darken1: #df8600; --v-ptext-darken2: #c06c00; --v-ptext-darken3: #a15400; --v-ptext-darken4: #843c00; --v-contrast-base: #ffffff; --v-contrast-lighten5: #ffffff; --v-contrast-lighten4: #ffffff; --v-contrast-lighten3: #ffffff; --v-contrast-lighten2: #ffffff; --v-contrast-lighten1: #ffffff; --v-contrast-darken1: #e2e2e2; --v-contrast-darken2: #c6c6c6; --v-contrast-darken3: #ababab; --v-contrast-darken4: #919191; --v-anchor-base: #a6d7ff; --v-anchor-lighten5: #ffffff; --v-anchor-lighten4: #ffffff; --v-anchor-lighten3: #fcffff; --v-anchor-lighten2: #dfffff; --v-anchor-lighten1: #c2f3ff; --v-anchor-darken1: #8abbe2; --v-anchor-darken2: #6fa0c6; --v-anchor-darken3: #5486ab; --v-anchor-darken4: #386d90; --v-border-base: rgba(var(--text-rgb), 0.12); --v-border-darken1: rgba(var(--text-rgb), 0.25); --v-border-darken2: rgba(var(--text-rgb), 0.4); --v-highlight-base: rgba(var(--text-rgb), 0.05); --font-family: "Roboto", sans-serif; --font-size: 16px; --font-weight: normal; --border-radius-left-top: 4px; --border-radius-right-top: 4px; --border-radius-right-bottom: 4px; --border-radius-left-bottom: 4px; --border-radius: 4px; --toolbar-height: 50px; --primary-rgb: 163, 102, 0; --secondary-rgb: 69, 90, 100; --accent-rgb: 255, 248, 225; --error-rgb: 244, 67, 54; --warning-rgb: 255, 87, 34; --info-rgb: 84, 110, 122; --success-rgb: 76, 175, 80; --ground-rgb: 52, 58, 64; --text-rgb: 255, 255, 255; --ptext-rgb: 255, 160, 0; --contrast-rgb: 255, 255, 255; --anchor-rgb: 166, 215, 255; }';
                const existing = document.querySelector('meta[name="viewport"]');
                const desired = 'width=330, initial-scale=1, maximum-scale=1, user-scalable=no';
                if (!existing) {
                    const meta = document.createElement('meta');
                    meta.name = 'viewport';
                    meta.content = desired;
                    document.head.appendChild(meta);
                } else {
                    // If an existing tag sets device-width, override it to our fixed width for better fit
                    const content = (existing.getAttribute('content') || '').toLowerCase();
                    if (content.includes('device-width') || !content.includes('width=')) {
                        existing.setAttribute('content', desired);
                    }
                }
                document.head.appendChild(style);
            }
        } catch (_) {
            // ignore
        }

        // Intentionally omit auto-scaling transform to keep logic simple and predictable.

        // DeepL-specific: restore wheel scrolling by redirecting wheel deltas to the nearest scrollable container.
        // This runs only inside confirmed QP frames and only on deepl.com. It's conservative: preventDefault
        // only when we actually scroll a target, so we don't interfere with page handlers unnecessarily.
        try {
            const hostIsDeepL = /(^|\.)deepl\.com$/i.test(location.hostname || '');
            if (hostIsDeepL) {
                const canScroll = (el, dy) => {
                    if (!el) return false;
                    try {
                        const sh = el.scrollHeight;
                        const ch = el.clientHeight;
                        if (!sh || !ch || sh <= ch) return false;
                        const st = el.scrollTop;
                        if (dy > 0) return st + ch < sh - 1; // allow small epsilon
                        if (dy < 0) return st > 0;
                        return false;
                    } catch (_) {
                        return false;
                    }
                };
                const hasScrollableOverflowY = (el) => {
                    try {
                        const cs = getComputedStyle(el);
                        const oy = cs && cs.overflowY ? cs.overflowY : '';
                        return /(auto|scroll)/i.test(oy);
                    } catch (_) {
                        return false;
                    }
                };
                const findScrollableTarget = (start, dy) => {
                    let el = start && start.nodeType === 1 ? start : null; // Element only
                    while (el && el !== document.body && el !== document.documentElement) {
                        if (hasScrollableOverflowY(el) && canScroll(el, dy)) return el;
                        el = el.parentElement;
                    }
                    const root = document.scrollingElement || document.documentElement || document.body;
                    if (canScroll(root, dy)) return root;
                    return null;
                };
                const onWheel = (e) => {
                    try {
                        const dy = e.deltaY || 0;
                        if (!dy) return; // nothing to do
                        const target = findScrollableTarget(e.target, dy);
                        if (target) {
                            target.scrollTop += dy;
                            e.preventDefault();
                        }
                    } catch (_) {
                        /* ignore */
                    }
                };
                // Capture early and be non-passive so we can preventDefault when we actually scroll
                window.addEventListener('wheel', onWheel, { capture: true, passive: false });
            }
        } catch (_) {
            /* ignore */
        }
    } catch (e) {
        // no-op
    }
})();
