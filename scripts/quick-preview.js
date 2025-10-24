// Quick Preview Bubble - Similar to Lumetrium Definer
// Shows a floating bubble with search engine icons when text is selected

/* global qpLog, qpWarn, qpError */

// logToConsole + qpLog/qpWarn/qpError provided by shared logging.js

// Storage keys (inlined to avoid module import issues)
const STORAGE_KEYS = {
    QUICK_PREVIEW: 'quickPreview',
    SEARCH_ENGINES: 'searchEngines',
    OPTIONS: 'options',
    SELECTION_LANG: 'selectionLang',
};

let quickPreviewData = null;
let allSearchEngines = null; // Renamed to avoid conflict with selection.js
let bubble = null;
let tabTitlesContainer = null;
let contentContainer = null;
let currentSelectedText = '';
let activeEngineId = null;
const tabItems = new Map();
// No longer used: background fetch logic removed
// Options cache (to read disableQuickPreview)
let optionsCache = { enableQuickPreview: false };
let selectionLangCache = '';
let lastShownSelectedText = '';
// Suppress automatic reopen after Escape (global, not tied to specific selection)
let suppressAutoOpen = false;
// Remember last selection rect to position bubble on manual reopen
let lastSelectionRect = null;

// Iframe cache: stores preloaded iframes for faster switching between engines
// Key format: "selectedText|engineId" -> { iframe: HTMLIFrameElement, url: string, loaded: boolean }
const iframeCache = new Map();
let currentPageUrl = window.location.href;
let cacheInvalidationTimer = null;
const DIAG = {
    enabled: false,
};

// Global key handler guard (Escape to close)
let escapeHandlerAttached = false;

// Track last known good base engine URLs to fall back if corruption detected during live edits
const lastGoodEngineUrls = new Map();

// Generate cache key for iframe cache
function getCacheKey(selectedText, engineId) {
    return `${selectedText}|${engineId}`;
}

// Clear all cached iframes
function clearIframeCache() {
    qpLog('[Quick Preview] Clearing iframe cache');
    iframeCache.forEach((entry) => {
        if (entry.iframe && entry.iframe.parentNode) {
            entry.iframe.parentNode.removeChild(entry.iframe);
        }
    });
    iframeCache.clear();
}

function clearContentContainer(preserveIframes = true) {
    if (!contentContainer) return;
    const nodes = Array.from(contentContainer.childNodes);
    nodes.forEach((node) => {
        const isIframe = node.nodeType === 1 && node.tagName === 'IFRAME';
        if (preserveIframes && isIframe) {
            node.classList.add('qp-preview-frame-hidden');
        } else {
            contentContainer.removeChild(node);
        }
    });
}

// Setup cache invalidation on URL change or visibility change
function setupCacheInvalidation() {
    // Monitor URL changes (for SPAs and navigation)
    const urlCheckInterval = setInterval(() => {
        const newUrl = window.location.href;
        if (newUrl !== currentPageUrl) {
            qpLog('[Quick Preview] Page URL changed, clearing cache');
            currentPageUrl = newUrl;
            clearIframeCache();
            hideBubble();
        }
    }, 1000);

    // Clear cache when tab becomes hidden (user switches tabs)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Delay cache clear to avoid clearing if user quickly returns
            if (cacheInvalidationTimer) {
                clearTimeout(cacheInvalidationTimer);
            }
            cacheInvalidationTimer = setTimeout(() => {
                qpLog('[Quick Preview] Tab hidden for too long, clearing cache');
                clearIframeCache();
                hideBubble();
            }, 30000); // 30 seconds
        } else {
            // User returned to tab, cancel delayed clear
            if (cacheInvalidationTimer) {
                clearTimeout(cacheInvalidationTimer);
                cacheInvalidationTimer = null;
            }
        }
    });

    // Clear cache on page unload
    window.addEventListener('beforeunload', () => {
        clearIframeCache();
        clearInterval(urlCheckInterval);
    });
}

// Simple debounce utility (avoid external imports)
function debounce(fn, delay = 150) {
    let t;
    return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), delay);
    };
}

// Heuristic validation for engine base URL BEFORE adding search terms
function isLikelyValidEngineBaseUrl(url) {
    if (!url || typeof url !== 'string') return false;
    if (!/^https?:\/\//i.test(url)) return false;
    if (url.includes(' ')) return false;
    if (url.includes(',php')) return false;
    if (url.match(/w\/index,\s*php/i)) return false;
    if (url.includes(',,') || url.includes(',,,')) return false;
    try {
        const u = new URL(url.replace(/,/g, '.')); // test with commas fixed
        if (!u.hostname.includes('.')) return false;
    } catch (e) {
        return false;
    }
    return true;
}

// Normalize common corruption patterns produced while editing options (typos, commas, stray whitespace)
function normalizeEngineBaseUrl(url) {
    if (!url) return url;
    let out = url.trim();
    // Replace accidental commas before TLDs or between host / path
    out = out.replace(/([a-z0-9])[,]+(com|org|net|io|edu|gov)\b/gi, '$1.$2');
    out = out.replace(/,\.([a-z])/gi, '.$1');
    // Fix specific observed pattern
    out = out.replace(/w\/index,\s*php/gi, 'w/index.php');
    // Remove duplicated commas
    out = out.replace(/,{2,}/g, ',');
    // Collapse whitespace
    out = out.replace(/\s+/g, ' ');
    // Remove space before query or path separators
    out = out.replace(/\s+(?=[/?&=#])/g, '');
    return out;
}

// Debounced rebuild triggered by QUICK_PREVIEW storage changes to avoid storm during live CSS edits in options page
const debouncedRebuildQuickPreviewTabs = debounce((previousActiveEngineId) => {
    if (!bubble || !bubble.classList.contains('qp-bubble-visible')) return;
    qpLog('[Quick Preview] (Debounced) Rebuilding tabs after storage changes');
    const enabledEngines = getEnabledEngines();
    tabItems.clear();
    tabTitlesContainer.innerHTML = '';
    enabledEngines.forEach(({ id, engine, customCSS }) => {
        const item = createTabItem({ id, engine, customCSS });
        tabTitlesContainer.appendChild(item);
        tabItems.set(id, { element: item, engine });
    });
    activeEngineId = null;
    if (previousActiveEngineId && tabItems.has(previousActiveEngineId)) {
        setActiveEngine(previousActiveEngineId, currentSelectedText, false);
    } else if (enabledEngines.length > 0) {
        setActiveEngine(enabledEngines[0].id, currentSelectedText, false);
    }
}, 180);

// Initialize Quick Preview
async function initQuickPreview() {
    qpLog('[Quick Preview] Initializing...');
    try {
        const result = await browser.storage.local.get([
            STORAGE_KEYS.QUICK_PREVIEW,
            STORAGE_KEYS.SEARCH_ENGINES,
            STORAGE_KEYS.OPTIONS,
            STORAGE_KEYS.SELECTION_LANG,
        ]);

        quickPreviewData = result[STORAGE_KEYS.QUICK_PREVIEW] || { engines: {} };
        allSearchEngines = result[STORAGE_KEYS.SEARCH_ENGINES] || {};
        optionsCache = result[STORAGE_KEYS.OPTIONS] || { enableQuickPreview: false };
        selectionLangCache = (result[STORAGE_KEYS.SELECTION_LANG] || '').toLowerCase();

        qpLog('[Quick Preview] Loaded data:', {
            enabledEngines: Object.keys(quickPreviewData.engines || {}).filter((id) => quickPreviewData.engines[id]?.enabled),
            totalSearchEngines: Object.keys(allSearchEngines || {}).length,
            quickPreviewData: quickPreviewData,
            selectionLang: selectionLangCache,
        });

        // Verify we have valid data
        if (!quickPreviewData || !allSearchEngines) {
            qpError('[Quick Preview] Failed to load required data from storage');
            return;
        }

        // Listen for storage changes
        browser.storage.onChanged.addListener(handleStorageChange);

        // Listen for text selection
        document.addEventListener('mouseup', handleTextSelection);
        document.addEventListener('keyup', handleTextSelection);

        // Listen for Escape key to close the bubble (attach once)
        if (!escapeHandlerAttached) {
            const handleGlobalKeys = (e) => {
                qpLog(`[Quick Preview] handleGlobalKeys called on ${e.type} event`);
                qpLog('[Quick Preview] Global key event:', { key: e.key, code: e.code, ctrlKey: e.ctrlKey, altKey: e.altKey });
                // Close on Escape
                if (e.key === 'Escape' && bubble && bubble.classList.contains('qp-bubble-visible')) {
                    // Suppress automatic reopen until selection is cleared
                    suppressAutoOpen = true;
                    hideBubble();
                    return;
                }

                // Re-open on Ctrl+Alt+B, relying purely on the last shown position/content
                // Ignores current selection text; uses stored lastSelectionRect
                if (e.ctrlKey && e.altKey && e.code === 'KeyB') {
                    try {
                        qpLog('[Quick Preview] Manual reopen hotkey detected (Ctrl+Alt+B)');
                        if (optionsCache && !optionsCache.enableQuickPreview) return;
                        if (bubble && bubble.classList.contains('qp-bubble-visible')) return;

                        // Lift suppression on manual reopen
                        suppressAutoOpen = false;

                        // Determine rect: prefer lastSelectionRect; otherwise synthesize a viewport-centered rect
                        let rect = lastSelectionRect;
                        if (!rect || !Number.isFinite(rect.top) || !Number.isFinite(rect.left)) {
                            const top = Math.max(12, Math.floor(window.innerHeight * 0.3));
                            const left = Math.max(12, Math.floor(window.innerWidth / 2));
                            rect = { top, bottom: top, left, right: left, width: 0, height: 0 };
                        }

                        // Get current selection text, or use last shown
                        let selectedText = '';
                        try {
                            const sel = window.getSelection && window.getSelection();
                            selectedText = sel ? sel.toString().trim() : '';
                        } catch (_) {
                            selectedText = '';
                        }
                        const textToUse = selectedText || lastShownSelectedText || '';
                        if (!textToUse) return;

                        // Use showBubble to properly set up tabs and content
                        showBubble(textToUse, rect);

                        e.preventDefault();
                        e.stopPropagation();
                    } catch (_) {
                        // Non-fatal: ignore errors in hotkey handling
                    }
                }
            };
            // Register on keydown and keyup to improve reliability across sites
            document.addEventListener('keydown', handleGlobalKeys, true);
            document.addEventListener('keyup', handleGlobalKeys, true);
            escapeHandlerAttached = true;
        }

        // Setup cache invalidation
        setupCacheInvalidation();

        qpLog('[Quick Preview] Event listeners registered');
    } catch (error) {
        qpError('[Quick Preview] Error initializing:', error);
    }
}

// Handle storage changes
function handleStorageChange(changes, area) {
    if (area !== 'local') return;

    if (changes[STORAGE_KEYS.QUICK_PREVIEW]) {
        quickPreviewData = changes[STORAGE_KEYS.QUICK_PREVIEW].newValue || { engines: {} };
        const previousActiveEngineId = activeEngineId;
        // Debounce rebuild to avoid race / malformed transitional states
        debouncedRebuildQuickPreviewTabs(previousActiveEngineId);
    }

    if (changes[STORAGE_KEYS.SEARCH_ENGINES]) {
        allSearchEngines = changes[STORAGE_KEYS.SEARCH_ENGINES].newValue || {};
    }

    if (changes[STORAGE_KEYS.OPTIONS]) {
        optionsCache = changes[STORAGE_KEYS.OPTIONS].newValue || { enableQuickPreview: false };
        if (!optionsCache.enableQuickPreview) {
            // If disabled while visible, hide now
            hideBubble();
        }
        // If language filter setting changed and bubble is visible, rebuild
        if (bubble && bubble.classList.contains('qp-bubble-visible')) {
            debouncedRebuildQuickPreviewTabs(activeEngineId);
        }
    }

    if (changes[STORAGE_KEYS.SELECTION_LANG]) {
        selectionLangCache = (changes[STORAGE_KEYS.SELECTION_LANG].newValue || '').toLowerCase();
        // If bubble is visible, rebuild tabs to reflect language filter
        if (bubble && bubble.classList.contains('qp-bubble-visible')) {
            debouncedRebuildQuickPreviewTabs(activeEngineId);
        }
    }
}

// Handle text selection
function handleTextSelection(event) {
    qpLog('[Quick Preview] handleTextSelection called');
    qpLog('[Quick Preview] Event:', event ? { type: event.type, key: event.key } : 'none');
    // Respect user preference to disable Quick Preview
    if (optionsCache && !optionsCache.enableQuickPreview) {
        hideBubble();
        return;
    }
    // Ignore events that happen inside the bubble
    if (event && bubble && bubble.contains(event.target)) {
        qpLog('[Quick Preview] Event inside bubble, ignoring');
        return;
    }
    // Ignore Escape keyup as it's handled by handleGlobalKeys
    if (event && event.type === 'keyup' && event.key === 'Escape') {
        qpLog('[Quick Preview] Escape keyup detected (ignoring)');
        return;
    }
    // Ignore modifier keyups as they don't change selection
    if (event && event.type === 'keyup' && (event.key === 'Control' || event.key === 'Alt' || event.key === 'Shift' || event.key === 'Meta')) {
        return;
    }
    // Ignore Ctrl+Alt+B keyup as it's handled by handleGlobalKeys
    if (event && event.type === 'keyup' && event.code === 'KeyB' && event.ctrlKey && event.altKey) {
        qpLog('[Quick Preview] Manual reopen hotkey detected (Ctrl+Alt+B) (ignoring)');
        return;
    }

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    // If auto-open is suppressed after Escape, do not auto re-open until selection is cleared
    if (suppressAutoOpen) {
        if (selectedText.length === 0) {
            // Clear suppression when selection is cleared
            suppressAutoOpen = false;
        } else {
            qpLog('[Quick Preview] Auto-open suppressed after Escape');
            return;
        }
    }

    qpLog('[Quick Preview] Text selection:', { length: selectedText.length, text: selectedText.substring(0, 50) });

    if (selectedText.length === 0) {
        hideBubble();
        // Clear suppression when no selection remains
        suppressAutoOpen = false;
        return;
    }

    // Get the selection range and position
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Show bubble near the selection
    showBubble(selectedText, rect);
}

// Show the Quick Preview bubble
function showBubble(selectedText, rect) {
    qpLog('[Quick Preview] showBubble called');

    // Respect user preference to disable Quick Preview
    if (optionsCache && !optionsCache.enableQuickPreview) {
        hideBubble();
        return;
    }

    // Sync selectionLangCache with current page <html lang> if needed (prefer explicit page signal)
    try {
        const htmlLangRaw = (document.documentElement && document.documentElement.lang) || '';
        const htmlPrimary = htmlLangRaw.trim().toLowerCase().split('-')[0];
        if (htmlPrimary) {
            if (!selectionLangCache || selectionLangCache !== htmlPrimary) {
                qpLog('[Quick Preview] Overriding selection language with page html lang', { prev: selectionLangCache, htmlPrimary });
                selectionLangCache = htmlPrimary;
                try {
                    browser.runtime.sendMessage({ action: 'storeSelectionLang', data: htmlPrimary });
                } catch (_) {
                    /* ignore */
                }
            }
        }
    } catch (_) {
        /* ignore */
    }

    // Get enabled engines sorted by index (after potential override)
    const enabledEngines = getEnabledEngines();

    qpLog('[Quick Preview] Enabled engines:', enabledEngines.length);

    if (enabledEngines.length === 0) {
        qpLog('[Quick Preview] No enabled engines, hiding bubble');
        hideBubble();
        return;
    }

    // Create or update bubble
    if (!bubble) {
        qpLog('[Quick Preview] Creating bubble');
        createBubble();
    }

    const previousSelectedText = currentSelectedText;
    currentSelectedText = selectedText;

    // Only recreate tabs if bubble is not visible (first time showing)
    if (!bubble.classList.contains('qp-bubble-visible')) {
        // Reset tab containers
        tabItems.clear();
        tabTitlesContainer.innerHTML = '';

        enabledEngines.forEach(({ id, engine, customCSS }) => {
            const item = createTabItem({ id, engine, customCSS });
            tabTitlesContainer.appendChild(item);
            tabItems.set(id, { element: item, engine });
        });

        activeEngineId = null;

        // Preload iframes for all engines in the background
        preloadIframes(selectedText, enabledEngines);

        // Automatically load the first tab's content
        if (enabledEngines.length > 0) {
            const firstEngineId = enabledEngines[0].id;
            qpLog('[Quick Preview] Auto-loading first tab:', firstEngineId);
            // Use setTimeout to ensure the bubble is fully rendered first
            setTimeout(() => {
                setActiveEngine(firstEngineId, selectedText, false);
            }, 0);
        }
    } else {
        // Bubble is already visible - check if selected text changed
        if (previousSelectedText !== selectedText) {
            qpLog('[Quick Preview] Selected text changed, clearing old cache and preloading new');
            clearIframeCache();
            preloadIframes(selectedText, enabledEngines);

            // Reload the active engine with new text
            if (activeEngineId) {
                setActiveEngine(activeEngineId, selectedText, false);
            }
        }
    }

    // Position the bubble
    positionBubble(rect);
    // Remember last selection rect for manual reopen (viewport coordinates)
    try {
        lastSelectionRect = rect
            ? {
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                  right: rect.right,
                  bottom: rect.bottom,
              }
            : null;
    } catch (_) {
        lastSelectionRect = rect || null;
    }

    // Show the bubble
    bubble.classList.add('qp-bubble-visible');
    lastShownSelectedText = selectedText;
    // Showing the bubble is a positive signal; ensure suppression is lifted
    suppressAutoOpen = false;
    qpLog('[Quick Preview] Bubble should now be visible');
}

// Create the bubble element
function createBubble() {
    bubble = document.createElement('div');
    bubble.id = 'quick-preview-bubble';
    bubble.className = 'qp-bubble';

    const container = document.createElement('div');
    container.className = 'qp-bubble-container';

    const titlesContainer = document.createElement('div');
    titlesContainer.className = 'qp-tab-titles';
    titlesContainer.setAttribute('role', 'tablist');
    titlesContainer.setAttribute('aria-orientation', 'vertical');

    const content = document.createElement('div');
    content.className = 'qp-tab-content';
    content.id = 'qp-content-display';

    container.appendChild(titlesContainer);
    container.appendChild(content);
    bubble.appendChild(container);

    tabTitlesContainer = titlesContainer;
    contentContainer = content;

    document.body.appendChild(bubble);
}

// Create a single tab item
function createTabItem({ id, engine, customCSS }) {
    const item = document.createElement('button');
    item.className = 'qp-tab-item';
    item.type = 'button';
    item.dataset.engineId = id;
    item.title = engine.name;
    item.setAttribute('role', 'tab');
    item.setAttribute('aria-selected', 'false');
    item.setAttribute('tabindex', '-1');

    // Apply custom CSS if provided
    if (customCSS) {
        item.style.cssText += `;${customCSS}`;
    }

    const icon = document.createElement('img');
    icon.className = 'qp-tab-icon';
    icon.alt = engine.name;

    const quickPreviewEngine = quickPreviewData.engines[id];
    const fallbackSrc = `data:${engine.imageFormat || 'image/png'};base64,${engine.base64}`;
    // Default to fallback until we resolve custom icon
    icon.src = fallbackSrc;
    icon.onerror = () => {
        if (icon.src !== fallbackSrc) icon.src = fallbackSrc;
    };

    if (quickPreviewEngine?.icon) {
        const custom = (quickPreviewEngine.icon || '').trim();
        if (/^data:/i.test(custom)) {
            icon.src = custom;
        } else if (/^https?:\/\//i.test(custom) || /^\//.test(custom)) {
            // Fetch via background to bypass CSP and convert to data URL, then persist
            try {
                const url =
                    /^\//.test(custom) && typeof browser !== 'undefined' && browser.runtime?.getURL
                        ? browser.runtime.getURL(custom.replace(/^\/+/, '/'))
                        : custom;
                browser.runtime
                    .sendMessage({ action: 'fetchImageAsDataUrl', url })
                    .then((resp) => {
                        if (resp && resp.success && resp.dataUrl) {
                            icon.src = resp.dataUrl;
                            try {
                                if (quickPreviewData && quickPreviewData.engines && quickPreviewData.engines[id]) {
                                    quickPreviewData.engines[id].icon = resp.dataUrl;
                                    // Persist silently
                                    try {
                                        browser.storage.local.set({ [STORAGE_KEYS.QUICK_PREVIEW]: quickPreviewData }).catch(() => {});
                                    } catch (_) {
                                        // ignore
                                    }
                                }
                            } catch (_) {
                                // ignore
                            }
                        }
                    })
                    .catch(() => {
                        // keep fallback
                    });
            } catch (_) {
                // keep fallback
            }
        } else {
            // Unrecognized format, try to set and rely on onerror fallback
            icon.src = custom;
        }
    }

    item.appendChild(icon);

    // No badge UI in the bubble; blocked state is surfaced in Options page

    item.addEventListener('click', (e) => {
        qpLog('[Quick Preview] Tab clicked:', { id, engineName: engine.name, selectedText: currentSelectedText });
        e.preventDefault();
        e.stopPropagation();
        setActiveEngine(id, currentSelectedText, true);
    });

    item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setActiveEngine(id, currentSelectedText, true);
        }
    });

    return item;
}

// Get enabled engines sorted by index
function getEnabledEngines() {
    const enabled = [];

    // Validate that quickPreviewData exists
    if (!quickPreviewData || !quickPreviewData.engines) {
        qpError('[Quick Preview] quickPreviewData.engines is not available');
        return enabled;
    }

    // Validate that allSearchEngines exists
    if (!allSearchEngines) {
        qpError('[Quick Preview] allSearchEngines is not available');
        return enabled;
    }

    for (const id in quickPreviewData.engines) {
        const qpEngine = quickPreviewData.engines[id];

        if (!qpEngine.enabled) continue;

        const engine = allSearchEngines[id];
        if (!engine) {
            qpWarn('[Quick Preview] Engine not found in allSearchEngines:', id);
            continue;
        }

        // Language filtering (enabled by option): include only matching languages
        if (!optionsCache.filterQuickPreviewByLanguage || shouldIncludeByLanguage(qpEngine?.lang, selectionLangCache)) {
            enabled.push({
                id,
                engine,
                index: qpEngine.index ?? 999,
                customCSS: qpEngine.customCSS || '',
            });
        }
    }

    // Sort by index
    enabled.sort((a, b) => a.index - b.index);

    // Fallback rule: if selection language exists and filtering is enabled but no engines matched,
    // fall back to showing all enabled engines
    const sel = (selectionLangCache || '').trim().toLowerCase();
    if (optionsCache.filterQuickPreviewByLanguage && sel && enabled.length === 0) {
        const all = [];
        for (const id in quickPreviewData.engines) {
            const qpEngine = quickPreviewData.engines[id];
            if (!qpEngine.enabled) continue;
            const engine = allSearchEngines[id];
            if (!engine) continue;
            all.push({ id, engine, index: qpEngine.index ?? 999, customCSS: qpEngine.customCSS || '' });
        }
        all.sort((a, b) => a.index - b.index);
        return all;
    }

    return enabled;
}

// Determine if engineLang matches the current selection language.
// Rules:
// - If selectionLang is empty/falsy: no filtering (include)
// - If engineLang is empty/falsy and selectionLang exists: exclude
// - Normalize both to lowercase; match exact or by primary subtag (e.g., zh vs zh-cn)
function shouldIncludeByLanguage(engineLang, selectionLang) {
    const sel = (selectionLang || '').trim().toLowerCase();
    if (!sel) return true; // no selection language => include all
    const eng = (engineLang || '').trim().toLowerCase();
    // If engine has no language specified, always include it
    if (!eng) return true;

    // Primary subtags (before '-') for coarse matching
    const selPrimary = sel.split('-')[0];
    const engPrimary = eng.split('-')[0];

    if (eng === sel) return true;
    if (engPrimary && selPrimary && engPrimary === selPrimary) return true;
    return false;
}

// Preload iframes for all enabled engines with the selected text
function preloadIframes(selectedText, enabledEngines) {
    qpLog('[Quick Preview] Preloading iframes for', enabledEngines.length, 'engines');

    enabledEngines.forEach(({ id, engine }) => {
        const cacheKey = getCacheKey(selectedText, id);

        // Skip if already cached
        if (iframeCache.has(cacheKey)) {
            qpLog('[Quick Preview] Already cached:', id);
            return;
        }

        // Build search URL
        const searchUrl = buildSearchUrl(id, engine, selectedText);
        if (!searchUrl) {
            qpError('[Quick Preview] Failed to build URL for engine:', id);
            return;
        }

        // Create cache entry first
        const cacheEntry = {
            iframe: null,
            url: searchUrl,
            loaded: false,
        };
        iframeCache.set(cacheKey, cacheEntry);

        // Create and preload iframe, passing the cache entry so it can update loaded status
        const iframe = createPreloadedIframe(id, searchUrl, cacheEntry);
        cacheEntry.iframe = iframe;

        qpLog('[Quick Preview] Preloaded iframe for engine:', id);
    });
}

// Build search URL for an engine
function buildSearchUrl(engineId, engine, selectedText) {
    let baseUrl = engine.url;
    const normalizedBaseUrl = normalizeEngineBaseUrl(baseUrl);
    if (!isLikelyValidEngineBaseUrl(normalizedBaseUrl)) {
        if (lastGoodEngineUrls.has(engineId)) {
            qpWarn('[Quick Preview] Invalid/unstable engine base URL detected. Falling back to last good value.', {
                current: baseUrl,
                normalized: normalizedBaseUrl,
                fallback: lastGoodEngineUrls.get(engineId),
            });
            baseUrl = lastGoodEngineUrls.get(engineId);
        } else {
            qpError('[Quick Preview] Engine base URL invalid and no fallback available:', baseUrl);
            return null;
        }
    } else {
        baseUrl = normalizedBaseUrl;
        lastGoodEngineUrls.set(engineId, baseUrl);
    }

    let searchUrl = baseUrl;
    const encodedText = encodeURIComponent(selectedText);

    // Handle different URL placeholder formats
    if (searchUrl.includes('{searchTerms}')) {
        searchUrl = searchUrl.replace(/{searchTerms}/g, encodedText);
    } else if (searchUrl.includes('{selection}')) {
        searchUrl = searchUrl.replace(/{selection}/g, encodedText);
    } else if (searchUrl.includes('%s')) {
        searchUrl = searchUrl.replace(/%s/g, encodedText);
    } else if (selectedText) {
        // If no placeholder found, append the search term to the end
        searchUrl = searchUrl + encodedText;
    }

    // Add language/region hints for Google
    if (engineId.startsWith('google')) {
        try {
            const urlObj = new URL(searchUrl);
            const desiredLang = (quickPreviewData?.engines?.[engineId]?.lang || selectionLangCache || '').trim().toLowerCase();
            const regionByLang = { en: 'US', fr: 'FR', es: 'ES', de: 'DE', it: 'IT', pt: 'PT', nl: 'NL', ja: 'JP', ko: 'KR', zh: 'CN', ru: 'RU' };
            if (desiredLang) {
                const primary = desiredLang.split('-')[0];
                urlObj.searchParams.set('hl', desiredLang);
                if (primary && primary.length === 2) urlObj.searchParams.set('lr', `lang_${primary}`);
                const region = regionByLang[primary] || desiredLang.split('-')[1] || '';
                if (region) {
                    const r = region.toUpperCase();
                    urlObj.searchParams.set('gl', r);
                    urlObj.searchParams.set('cr', `country${r}`);
                }
            }
            searchUrl = urlObj.toString();
        } catch (_) {
            // ignore
        }
    }

    // Add region/language hints for DuckDuckGo
    if (searchUrl.includes('duckduckgo.com')) {
        try {
            const urlObj = new URL(searchUrl);
            const desiredLang = (quickPreviewData?.engines?.[engineId]?.lang || selectionLangCache || '').trim().toLowerCase();
            if (desiredLang) {
                urlObj.searchParams.set('kl', desiredLang);
            } else {
                urlObj.searchParams.set('kl', 'en-us');
            }
            urlObj.searchParams.set('kp', '-2');
            urlObj.searchParams.set('ia', 'web');
            searchUrl = urlObj.toString();
        } catch (_) {
            // ignore
        }
    }

    // Add SafeSearch parameter for Bing if not already present
    if (engineId === 'bing' && !searchUrl.includes('adlt=')) {
        const urlObj = new URL(searchUrl);
        urlObj.searchParams.set('adlt', 'strict');
        searchUrl = urlObj.toString();
    }

    return searchUrl;
}

// Create a preloaded iframe (hidden, attached to body)
function createPreloadedIframe(engineId, url, cacheEntry) {
    const iframe = document.createElement('iframe');
    iframe.className = 'qp-preview-frame qp-preview-frame-hidden';
    try {
        iframe.name = `csqp:${encodeURIComponent(engineId)}`;
    } catch (_) {
        iframe.name = `csqp:${engineId}`;
    }
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    iframe.setAttribute('allow', 'clipboard-read; clipboard-write;');

    if (contentContainer) {
        contentContainer.appendChild(iframe);
    } else {
        document.body.appendChild(iframe);
    }

    // Set the src to start loading
    try {
        const u = new URL(url);
        u.searchParams.set('csqp', '1');
        u.searchParams.set('csqpid', engineId);
        u.searchParams.set('_csr', String(Date.now() % 100000));
        iframe.src = u.toString();
    } catch (_) {
        iframe.src = url;
    }

    // Mark as loaded when it loads
    iframe.addEventListener('load', () => {
        if (DIAG.enabled) {
            qpLog('[Quick Preview][DIAG] preloaded iframe load', { engineId, src: iframe.src });
        }
        if (cacheEntry) {
            cacheEntry.loaded = true;
            qpLog('[Quick Preview] Preloaded iframe finished loading:', iframe.name);
        }
    });

    return iframe;
}

// Position the bubble near the selection
function positionBubble(rect) {
    if (!bubble) return;

    const bubbleRect = bubble.getBoundingClientRect();
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    // Position above the selection by default
    let top = rect.top + scrollY - bubbleRect.height - 10;
    let left = rect.left + scrollX + rect.width / 2 - bubbleRect.width / 2;

    // Adjust if bubble would go off-screen
    if (top < scrollY) {
        // Position below if not enough space above
        top = rect.bottom + scrollY + 10;
    }

    if (left < scrollX) {
        left = scrollX + 10;
    } else if (left + bubbleRect.width > scrollX + window.innerWidth) {
        left = scrollX + window.innerWidth - bubbleRect.width - 10;
    }

    bubble.style.top = `${top}px`;
    bubble.style.left = `${left}px`;
}

// Set the active engine and load results
function setActiveEngine(engineId, selectedText, focusTab) {
    qpLog('[Quick Preview] setActiveEngine called:', { engineId, selectedText, focusTab, hasTabItems: tabItems.has(engineId) });

    if (!tabItems.has(engineId)) {
        qpError('[Quick Preview] Engine not found in tabItems:', engineId);
        return;
    }

    const { element, engine } = tabItems.get(engineId);

    if (!engine || !engine.url) {
        qpError('[Quick Preview] Invalid engine data:', { engineId, engine });
        return;
    }

    if (activeEngineId && tabItems.has(activeEngineId)) {
        const previous = tabItems.get(activeEngineId);
        previous.element.classList.remove('qp-tab-item-active');
        previous.element.setAttribute('aria-selected', 'false');
        previous.element.setAttribute('tabindex', '-1');
    }

    element.classList.add('qp-tab-item-active');
    element.setAttribute('aria-selected', 'true');
    element.setAttribute('tabindex', '0');

    activeEngineId = engineId;

    // Check if we have a cached iframe for this engine + selected text
    const cacheKey = getCacheKey(selectedText, engineId);
    const cachedEntry = iframeCache.get(cacheKey);

    qpLog('[Quick Preview] Cache lookup for', engineId, ':', {
        cacheKey,
        hasCachedEntry: !!cachedEntry,
        isLoaded: cachedEntry?.loaded,
        totalCached: iframeCache.size,
    });

    if (cachedEntry && cachedEntry.iframe) {
        qpLog('[Quick Preview] Using cached iframe for engine:', engineId, 'loaded:', cachedEntry.loaded);
        if (DIAG.enabled) {
            qpLog('[Quick Preview][DIAG] reuse cached iframe', {
                engineId,
                loaded: cachedEntry.loaded,
                src: cachedEntry.iframe?.src,
                name: cachedEntry.iframe?.name,
            });
        }

        // Show the cached iframe
        displayCachedIframe(cachedEntry);

        if (focusTab) {
            element.focus({ preventScroll: true });
        }
        return;
    }

    // No cached iframe - build URL and create new one
    qpLog('[Quick Preview] No cached iframe, building new one for engine:', engineId);
    const searchUrl = buildSearchUrl(engineId, engine, selectedText);

    if (!searchUrl) {
        qpError('[Quick Preview] Failed to build search URL');
        showErrorInContent('Failed to build search URL', null);
        if (focusTab) {
            element.focus({ preventScroll: true });
        }
        return;
    }

    qpLog('[Quick Preview] Loading search for engine ID:', engineId);
    qpLog('[Quick Preview] Engine name:', engine.name);
    qpLog('[Quick Preview] Final search URL:', searchUrl);

    // Directly frame the URL in an iframe; DNR strips blocking headers
    frameEngineUrl(searchUrl, engineId);

    if (focusTab) {
        element.focus({ preventScroll: true });
    }
}

// Display a cached iframe in the content container
function displayCachedIframe(cacheEntry) {
    if (!cacheEntry || !cacheEntry.iframe) {
        qpWarn('[Quick Preview] Attempted to display cached iframe without entry');
        return;
    }

    const { iframe } = cacheEntry;
    const isLoaded = Boolean(cacheEntry.loaded);

    // Clear any lingering loading overlays before switching iframes
    try {
        const overlays = contentContainer.querySelectorAll('.qp-loading');
        overlays.forEach((el) => el.remove());
    } catch (_) {
        /* ignore */
    }

    // Clear current content
    clearContentContainer(true);

    if (!isLoaded) {
        // Show loading state while iframe finishes loading
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'qp-loading';
        const spinner = document.createElement('div');
        spinner.className = 'qp-spinner';
        const loadingText = document.createElement('p');
        loadingText.textContent = 'Loading...';
        loadingDiv.appendChild(spinner);
        loadingDiv.appendChild(loadingText);
        contentContainer.appendChild(loadingDiv);

        // Wait for iframe to load, then show it
        const onLoadHandler = () => {
            cacheEntry.loaded = true;
            if (loadingDiv.parentNode === contentContainer) {
                contentContainer.removeChild(loadingDiv);
            }
            // Reveal the iframe only after it has loaded
            try {
                iframe.classList.remove('qp-preview-frame-hidden');
            } catch (_) {
                /* ignore */
            }
            iframe.removeEventListener('load', onLoadHandler);
        };
        iframe.addEventListener('load', onLoadHandler);

        // If iframe loads before we can attach the handler, mark it loaded and show immediately
        if (iframe.contentDocument || iframe.contentWindow?.document) {
            try {
                // Check if iframe is actually loaded
                if (iframe.contentWindow?.document?.readyState === 'complete') {
                    cacheEntry.loaded = true;
                    onLoadHandler();
                }
            } catch (e) {
                // Cross-origin, can't check - wait for load event
            }
        }

        // Ensure iframe is in the container but keep it hidden until load completes
        if (contentContainer && iframe.parentNode !== contentContainer) {
            contentContainer.appendChild(iframe);
        }
        return; // Do not unhide yet
    }

    // Already loaded: ensure iframe is visible in the container now
    showIframeInContainer(iframe);
}

// Move iframe into the content container and make it visible
function showIframeInContainer(iframe) {
    // Remove preloaded class and reset positioning to make it visible in the container
    iframe.classList.remove('qp-preview-frame-hidden');
    // Avoid tweaking inline styles to minimize layout thrash and accidental reloads

    // Add to content container
    if (contentContainer && iframe.parentNode !== contentContainer) {
        contentContainer.appendChild(iframe);
    }
}

// Directly frame the engine URL into an iframe
function frameEngineUrl(url, engineId) {
    qpLog('[Quick Preview] frameEngineUrl called:', { url, engineId });

    // Safety guard: if a cached iframe already exists for this engine+text, reuse it
    try {
        const cacheKey = getCacheKey(currentSelectedText, engineId);
        const cached = iframeCache.get(cacheKey);
        if (cached && cached.iframe) {
            qpWarn('[Quick Preview] frameEngineUrl invoked but cached iframe exists; reusing instead of creating new', {
                engineId,
                cacheKey,
                loaded: cached.loaded,
            });
            if (DIAG.enabled) {
                qpLog('[Quick Preview][DIAG] frameEngineUrl short-circuit reuse', {
                    engineId,
                    src: cached.iframe?.src,
                    loaded: cached.loaded,
                });
            }
            displayCachedIframe(cached);
            return;
        }
    } catch (_) {
        // non-fatal
    }

    // Validate inputs
    if (!url) {
        showErrorInContent('No URL provided', url);
        return;
    }
    try {
        // eslint-disable-next-line no-new
        new URL(url);
    } catch (e) {
        qpError('[Quick Preview] Invalid URL detected:', url, e);
        showErrorInContent('Invalid URL', url);
        return;
    }

    // Loading UI (do not remove existing iframes; only add overlay)
    // Keep any preloaded/cached iframes in place to avoid reflow or detachment
    const existingOverlay = contentContainer.querySelector('.qp-loading');
    if (existingOverlay) existingOverlay.remove();
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'qp-loading';
    const spinner = document.createElement('div');
    spinner.className = 'qp-spinner';
    const loadingText = document.createElement('p');
    loadingText.textContent = 'Loading...';
    loadingDiv.appendChild(spinner);
    loadingDiv.appendChild(loadingText);
    contentContainer.appendChild(loadingDiv);

    // Decide whether to use a compact/mobile UA for this engine.
    // DeepL (and a few SPA apps) rely on desktop wheel behavior; forcing a mobile UA can break mouse-wheel scrolling.
    const shouldUseMobileUA = (() => {
        try {
            const h = new URL(url).hostname.toLowerCase();
            // Known exceptions where desktop UA yields better UX in a tiny iframe
            const exceptions = [
                'deepl.com', // breaks wheel scrolling under mobile UA
            ];
            if (exceptions.some((ex) => h === ex || h.endsWith(`.${ex}`))) return false;
        } catch (_) {
            // If URL parsing fails, fall back to enabling mobile UA
        }
        return true;
    })();

    try {
        const desiredLang = (quickPreviewData?.engines?.[engineId]?.lang || selectionLangCache || '').trim();
        const acceptLanguage = desiredLang ? `${desiredLang},en;q=0.8` : 'en-US,en;q=0.9';
        if (shouldUseMobileUA) {
            browser.runtime.sendMessage({ action: 'enableQuickPreviewMobileUA', acceptLanguage });
        } else {
            // Ensure any previously enabled mobile UA is turned off for this tab before loading the frame
            browser.runtime.sendMessage({ action: 'disableQuickPreviewMobileUA' });
        }
    } catch (e) {
        // Non-fatal: UA tweak failed or unsupported
    }

    // Build iframe
    const iframe = document.createElement('iframe');
    // Start hidden; reveal only after load completes
    iframe.className = 'qp-preview-frame qp-preview-frame-hidden';
    // Marker persists across redirects; used by CSS applier to scope injection and engine-specific CSS
    // Encode engineId to avoid regex character exclusions (apostrophes, etc.) and allow robust decoding in CSS applier
    try {
        iframe.name = `csqp:${encodeURIComponent(engineId)}`;
    } catch (_) {
        iframe.name = `csqp:${engineId}`; // fallback
    }
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    iframe.setAttribute('allow', 'clipboard-read; clipboard-write;');
    // Hint that vertical panning is intended; helps some engines with nested gesture handling
    try {
        iframe.style.touchAction = 'pan-y';
    } catch (_) {
        /* ignore */
    }
    // No sandbox to allow full site rendering; DNR will strip frame-blocking headers

    let attempts = 0;
    const MAX_ATTEMPTS = 3; // initial try + two retries (some sites are slow/SPA)
    // Watchdog timer must be declared before closures use it
    let watchdog = null;

    const handleBlocked = () => {
        qpWarn('[Quick Preview] Iframe seems blocked or empty. Showing fallback.');
        showBlockedContentFallback(engineId, url);
        try {
            // Only persist blocked=true after retry has failed to reduce false positives
            if (attempts >= MAX_ATTEMPTS - 1 && quickPreviewData?.engines?.[engineId]) {
                quickPreviewData.engines[engineId].blocked = true;
                browser.storage.local.set({ [STORAGE_KEYS.QUICK_PREVIEW]: quickPreviewData });
                // Badge is only shown on Options page; no UI change here
            }
        } catch (e) {
            // ignore storage failure
        }
    };

    let loadHandled = false;
    const clearWatchdog = () => {
        if (watchdog) {
            clearTimeout(watchdog);
            watchdog = null;
        }
    };

    iframe.onload = () => {
        loadHandled = true;
        clearWatchdog();
        qpLog('[Quick Preview] Iframe loaded for', url);
        if (DIAG.enabled) {
            try {
                qpLog('[Quick Preview][DIAG] frameEngineUrl load', {
                    engineId,
                    src: iframe.src,
                    name: iframe.name,
                });
            } catch (_) {
                // ignore
            }
        }

        // Cache this iframe for future use
        const cacheKey = getCacheKey(currentSelectedText, engineId);
        if (!iframeCache.has(cacheKey)) {
            qpLog('[Quick Preview] Caching newly created iframe for:', engineId);
            iframeCache.set(cacheKey, {
                iframe: iframe,
                url: url,
                loaded: true,
            });
        }

        // Remove only the loading overlay; keep iframe in place to avoid reloads
        try {
            if (loadingDiv && loadingDiv.parentNode === contentContainer) {
                contentContainer.removeChild(loadingDiv);
            }
        } catch (e) {
            // Non-fatal: loading overlay may already be gone
        }

        // Reveal the iframe now that it has loaded
        try {
            iframe.classList.remove('qp-preview-frame-hidden');
        } catch (_) {
            /* ignore */
        }

        // Best-effort detection of blank/blocked content
        setTimeout(() => {
            try {
                const doc = iframe.contentDocument || iframe.contentWindow?.document;
                const bodyLen = (doc?.body?.innerText || '').trim().length;
                if (!doc || bodyLen < 10) {
                    // If appears empty after load, attempt one retry before declaring blocked
                    if (attempts < MAX_ATTEMPTS - 1) {
                        attempts += 1;
                        tryReload();
                    } else {
                        handleBlocked();
                    }
                } else {
                    // Clear previous blocked flag
                    if (quickPreviewData?.engines?.[engineId]?.blocked) {
                        quickPreviewData.engines[engineId].blocked = false;
                        browser.storage.local.set({ [STORAGE_KEYS.QUICK_PREVIEW]: quickPreviewData });
                        // Badge removal handled by Options page render
                    }
                }
            } catch (e) {
                // Cross-origin access throws when framed successfully; assume success
                qpLog('[Quick Preview] Cross-origin iframe loaded; assuming success.');
                if (quickPreviewData?.engines?.[engineId]?.blocked) {
                    quickPreviewData.engines[engineId].blocked = false;
                    browser.storage.local.set({ [STORAGE_KEYS.QUICK_PREVIEW]: quickPreviewData });
                    // Badge removal handled by Options page render
                }
            }
        }, 500);
    };

    iframe.onerror = () => {
        loadHandled = true;
        clearWatchdog();
        if (DIAG.enabled) {
            qpWarn('[Quick Preview][DIAG] iframe error', { engineId, src: iframe.src });
        }
        if (attempts < MAX_ATTEMPTS - 1) {
            attempts += 1;
            tryReload();
        } else {
            handleBlocked();
        }
    };

    // Append iframe to DOM before setting src so some browsers can initiate load
    // Keep the loading overlay visible until onload/timeout
    // Append only if not already present (avoid DOM churn that may cause reloads in some engines)
    if (iframe.parentNode !== contentContainer) {
        contentContainer.appendChild(iframe);
    }

    const tryReload = () => {
        // Reset handlers state and watchdog for a retry
        loadHandled = false;
        clearWatchdog();
        try {
            const u = new URL(url);
            u.searchParams.set('csqp', '1');
            u.searchParams.set('csqpid', engineId);
            // Cache-buster per attempt
            u.searchParams.set('_csr', String(Date.now() % 100000));
            // Do NOT modify hash: some engines (e.g., DeepL) encode query in hash path segments
            iframe.src = u.toString();
            if (DIAG.enabled) {
                qpLog('[Quick Preview][DIAG] tryReload set src', { engineId, src: iframe.src });
            }
        } catch (_) {
            iframe.src = url;
            if (DIAG.enabled) {
                qpLog('[Quick Preview][DIAG] tryReload raw src', { engineId, src: iframe.src });
            }
        }
        // Start a new watchdog for the retry
        watchdog = setTimeout(() => {
            if (loadHandled) return;
            qpWarn('[Quick Preview] Iframe load watchdog triggered; attempt', attempts + 1, 'of', MAX_ATTEMPTS);
            if (attempts < MAX_ATTEMPTS - 1) {
                attempts += 1;
                tryReload();
            } else {
                handleBlocked();
            }
        }, 6000);
    };

    // Initial load
    tryReload();

    // Cache newly created primary iframe for this engine+text to prevent future re-creations
    try {
        const cacheKey = getCacheKey(currentSelectedText, engineId);
        if (!iframeCache.has(cacheKey)) {
            if (DIAG.enabled) {
                qpLog('[Quick Preview][DIAG] caching primary iframe from frameEngineUrl', { engineId, cacheKey });
            }
            iframeCache.set(cacheKey, { iframe, url, loaded: false });
        }
    } catch (_) {
        // ignore
    }
}

// Helper function to show error in content container
function showErrorInContent(errorMessage, url) {
    // Show error with fallback option
    clearContentContainer(true); // Clear existing content while keeping cached iframes

    const errorDiv = document.createElement('div');
    errorDiv.className = 'qp-error';

    const errorTitle = document.createElement('p');
    errorTitle.className = 'qp-error-message';
    errorTitle.textContent = 'Unable to display content';
    errorDiv.appendChild(errorTitle);

    const errorDetails = document.createElement('p');
    errorDetails.className = 'qp-error-details';
    errorDetails.textContent = errorMessage;
    errorDiv.appendChild(errorDetails);

    if (url) {
        const openTabButton = document.createElement('button');
        openTabButton.className = 'qp-open-tab';
        openTabButton.textContent = 'Open in New Tab';
        openTabButton.addEventListener('click', () => {
            window.open(url, '_blank');
        });
        errorDiv.appendChild(openTabButton);
    }

    contentContainer.appendChild(errorDiv);
}

// Create sandboxed iframe to display content with custom CSS
// Removed createSandboxedContent and HTML cleaning: not needed when framing directly

// Show fallback UI when content is blocked by X-Frame-Options
// eslint-disable-next-line no-unused-vars
function showBlockedContentFallback(engineId, url) {
    const fallbackDiv = document.createElement('div');
    fallbackDiv.className = 'qp-blocked-fallback';

    const icon = document.createElement('div');
    icon.className = 'qp-blocked-icon';
    icon.textContent = '🔒';

    const title = document.createElement('p');
    title.className = 'qp-blocked-title';
    title.textContent = 'Content Blocked';

    const message = document.createElement('p');
    message.className = 'qp-blocked-message';
    message.textContent = 'This site prevents embedding in frames';

    const button = document.createElement('button');
    button.className = 'qp-open-tab-button';
    button.textContent = 'Open in New Tab';
    button.addEventListener('click', () => {
        window.open(url, '_blank');
    });

    fallbackDiv.appendChild(icon);
    fallbackDiv.appendChild(title);
    fallbackDiv.appendChild(message);
    fallbackDiv.appendChild(button);

    // Replace iframe with fallback
    const container = contentContainer;
    if (container) {
        clearContentContainer(true);
        container.appendChild(fallbackDiv);
    }
}

// Clean HTML content by removing scripts and problematic elements
// Removed cleanHtmlContent helper: no longer transforming HTML

// Escape HTML to prevent XSS
// escapeHtml no longer needed

// Hide the bubble
function hideBubble() {
    if (bubble) {
        bubble.classList.remove('qp-bubble-visible');
    }
    // Best-effort: disable the temporary mobile UA rule for this tab
    try {
        browser.runtime.sendMessage({ action: 'disableQuickPreviewMobileUA' });
    } catch (e) {
        // ignore
    }

    // Don't immediately clear cache - let the visibility change handler deal with it
    // This allows quick re-opening of bubble without reloading
}

// Initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuickPreview);
} else {
    initQuickPreview();
}
