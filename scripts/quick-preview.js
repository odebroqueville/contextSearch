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
let optionsCache = { disableQuickPreview: false };
let selectionLangCache = '';

// Track last known good base engine URLs to fall back if corruption detected during live edits
const lastGoodEngineUrls = new Map();

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
        optionsCache = result[STORAGE_KEYS.OPTIONS] || { disableQuickPreview: false };
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
        optionsCache = changes[STORAGE_KEYS.OPTIONS].newValue || { disableQuickPreview: false };
        if (optionsCache.disableQuickPreview) {
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
    // Respect user preference to disable Quick Preview
    if (optionsCache && optionsCache.disableQuickPreview) {
        hideBubble();
        return;
    }
    // Ignore events that happen inside the bubble
    if (event && bubble && bubble.contains(event.target)) {
        qpLog('[Quick Preview] Event inside bubble, ignoring');
        return;
    }

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    qpLog('[Quick Preview] Text selection:', { length: selectedText.length, text: selectedText.substring(0, 50) });

    if (selectedText.length === 0) {
        hideBubble();
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
    if (optionsCache && optionsCache.disableQuickPreview) {
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

        // Automatically load the first tab's content
        if (enabledEngines.length > 0) {
            const firstEngineId = enabledEngines[0].id;
            qpLog('[Quick Preview] Auto-loading first tab:', firstEngineId);
            // Use setTimeout to ensure the bubble is fully rendered first
            setTimeout(() => {
                setActiveEngine(firstEngineId, selectedText, false);
            }, 0);
        }
    }

    // Position the bubble
    positionBubble(rect);

    // Show the bubble
    bubble.classList.add('qp-bubble-visible');
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
    if (quickPreviewEngine?.icon) {
        icon.src = quickPreviewEngine.icon;
    } else {
        icon.src = `data:${engine.imageFormat || 'image/png'};base64,${engine.base64}`;
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

    // Build search URL with proper placeholder handling
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
        }
    } else {
        baseUrl = normalizedBaseUrl;
        lastGoodEngineUrls.set(engineId, baseUrl);
    }

    let searchUrl = baseUrl;
    const encodedText = encodeURIComponent(selectedText);

    qpLog('[Quick Preview] DEBUG - Original engine.url:', engine.url);
    qpLog('[Quick Preview] DEBUG - Selected text:', selectedText);
    qpLog('[Quick Preview] DEBUG - Encoded text:', encodedText);

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

    // Add language/region hints for Google; add SafeSearch for Bing
    if (engineId.startsWith('google')) {
        try {
            const urlObj = new URL(searchUrl);
            // 'hl' = UI language, 'lr' = language restrict (optional), 'gl' = region
            // Use engine lang if set, else selectionLang, else leave default
            const desiredLang = (quickPreviewData?.engines?.[engineId]?.lang || selectionLangCache || '').trim().toLowerCase();
            // Map simple lang to region when possible (e.g., en -> US, fr -> FR) – conservative defaults
            const regionByLang = { en: 'US', fr: 'FR', es: 'ES', de: 'DE', it: 'IT', pt: 'PT', nl: 'NL', ja: 'JP', ko: 'KR', zh: 'CN', ru: 'RU' };
            if (desiredLang) {
                const primary = desiredLang.split('-')[0];
                urlObj.searchParams.set('hl', desiredLang);
                // Only set lr:lang_XX for simple language cases
                if (primary && primary.length === 2) urlObj.searchParams.set('lr', `lang_${primary}`);
                // Region hint
                const region = regionByLang[primary] || desiredLang.split('-')[1] || '';
                if (region) {
                    const r = region.toUpperCase();
                    urlObj.searchParams.set('gl', r);
                    // Also add country restrict to favor pages from this region when supported
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
            // Set safe search to off to allow all results
            urlObj.searchParams.set('kp', '-2');
            // Force web search results
            urlObj.searchParams.set('ia', 'web');
            searchUrl = urlObj.toString();
        } catch (_) {
            // ignore
        }
    }

    // Add SafeSearch parameter for Bing if not already present
    if (engineId === 'bing' && !searchUrl.includes('adlt=')) {
        const urlObj = new URL(searchUrl);
        urlObj.searchParams.set('adlt', 'strict'); // Enable strict SafeSearch
        searchUrl = urlObj.toString();
    }

    // Note: Removed Google-specific URL parameter adjustments (gbv/igu)

    qpLog('[Quick Preview] Loading search for engine ID:', engineId);
    qpLog('[Quick Preview] Engine name:', engine.name);
    qpLog('[Quick Preview] Final search URL:', searchUrl);

    // Directly frame the URL in an iframe; DNR strips blocking headers
    frameEngineUrl(searchUrl, engineId);

    if (focusTab) {
        element.focus({ preventScroll: true });
    }
}

// Directly frame the engine URL into an iframe
function frameEngineUrl(url, engineId) {
    qpLog('[Quick Preview] frameEngineUrl called:', { url, engineId });

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

    // Loading UI
    contentContainer.textContent = '';
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'qp-loading';
    const spinner = document.createElement('div');
    spinner.className = 'qp-spinner';
    const loadingText = document.createElement('p');
    loadingText.textContent = 'Loading...';
    loadingDiv.appendChild(spinner);
    loadingDiv.appendChild(loadingText);
    contentContainer.appendChild(loadingDiv);

    // Ask SW to apply a per-tab mobile UA for subframes (better 300px-fit layouts)
    try {
        // Thread an Accept-Language aligned with the engine/selection language for region-specific behavior
        const desiredLang = (quickPreviewData?.engines?.[engineId]?.lang || selectionLangCache || '').trim();
        const acceptLanguage = desiredLang ? `${desiredLang},en;q=0.8` : 'en-US,en;q=0.9';
        browser.runtime.sendMessage({ action: 'enableQuickPreviewMobileUA', acceptLanguage });
    } catch (e) {
        // Non-fatal: UA tweak failed or unsupported
    }

    // Build iframe
    const iframe = document.createElement('iframe');
    iframe.className = 'qp-preview-frame';
    // Marker persists across redirects; used by CSS applier to scope injection and engine-specific CSS
    // Encode engineId to avoid regex character exclusions (apostrophes, etc.) and allow robust decoding in CSS applier
    try {
        iframe.name = `csqp:${encodeURIComponent(engineId)}`;
    } catch (_) {
        iframe.name = `csqp:${engineId}`; // fallback
    }
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    iframe.setAttribute('allow', 'clipboard-read; clipboard-write;');
    // No sandbox to allow full site rendering; DNR will strip frame-blocking headers

    let attempts = 0;
    const MAX_ATTEMPTS = 2; // initial try + one retry
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
        // Remove only the loading overlay; keep iframe in place to avoid reloads
        try {
            if (loadingDiv && loadingDiv.parentNode === contentContainer) {
                contentContainer.removeChild(loadingDiv);
            }
        } catch (e) {
            // Non-fatal: loading overlay may already be gone
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
        if (attempts < MAX_ATTEMPTS - 1) {
            attempts += 1;
            tryReload();
        } else {
            handleBlocked();
        }
    };

    // Append iframe to DOM before setting src so some browsers can initiate load
    // Keep the loading overlay visible until onload/timeout
    contentContainer.appendChild(iframe);

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
            // Append fragment marker (survives some param strips)
            const hash = u.hash.replace(/^#/, '');
            const hashParams = new URLSearchParams(hash);
            if (!hashParams.get('csqpid')) hashParams.set('csqpid', engineId);
            const newHash = hashParams.toString();
            u.hash = newHash ? '#' + newHash : '';
            iframe.src = u.toString();
        } catch (_) {
            iframe.src = url;
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
        }, 4000);
    };

    // Initial load
    tryReload();
}

// Helper function to show error in content container
function showErrorInContent(errorMessage, url) {
    // Show error with fallback option
    contentContainer.textContent = ''; // Clear existing content

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
        container.innerHTML = '';
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
}

// Initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuickPreview);
} else {
    initQuickPreview();
}
