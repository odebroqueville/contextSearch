// Quick Preview Bubble - Similar to Lumetrium Definer
// Shows a floating bubble with search engine icons when text is selected

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
let currentAbortController = null;
let isFetching = false; // Prevent simultaneous fetches
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
    console.log('[Quick Preview] (Debounced) Rebuilding tabs after storage changes');
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
    console.log('[Quick Preview] Initializing...');
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

        console.log('[Quick Preview] Loaded data:', {
            enabledEngines: Object.keys(quickPreviewData.engines || {}).filter((id) => quickPreviewData.engines[id]?.enabled),
            totalSearchEngines: Object.keys(allSearchEngines || {}).length,
            quickPreviewData: quickPreviewData,
            selectionLang: selectionLangCache,
        });

        // Verify we have valid data
        if (!quickPreviewData || !allSearchEngines) {
            console.error('[Quick Preview] Failed to load required data from storage');
            return;
        }

        // Listen for storage changes
        browser.storage.onChanged.addListener(handleStorageChange);

        // Listen for text selection
        document.addEventListener('mouseup', handleTextSelection);
        document.addEventListener('keyup', handleTextSelection);

        console.log('[Quick Preview] Event listeners registered');
    } catch (error) {
        console.error('[Quick Preview] Error initializing:', error);
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
        console.log('[Quick Preview] Event inside bubble, ignoring');
        return;
    }

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    console.log('[Quick Preview] Text selection:', { length: selectedText.length, text: selectedText.substring(0, 50) });

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
    console.log('[Quick Preview] showBubble called');

    // Respect user preference to disable Quick Preview
    if (optionsCache && optionsCache.disableQuickPreview) {
        hideBubble();
        return;
    }

    // Get enabled engines sorted by index
    const enabledEngines = getEnabledEngines();

    console.log('[Quick Preview] Enabled engines:', enabledEngines.length);

    if (enabledEngines.length === 0) {
        console.log('[Quick Preview] No enabled engines, hiding bubble');
        hideBubble();
        return;
    }

    // Create or update bubble
    if (!bubble) {
        console.log('[Quick Preview] Creating bubble');
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
            console.log('[Quick Preview] Auto-loading first tab:', firstEngineId);
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
    console.log('[Quick Preview] Bubble should now be visible');
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

    // Note: No blocked badge in the Quick Preview bubble per design

    item.addEventListener('click', (e) => {
        console.log('[Quick Preview] Tab clicked:', { id, engineName: engine.name, selectedText: currentSelectedText });
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
        console.error('[Quick Preview] quickPreviewData.engines is not available');
        return enabled;
    }

    // Validate that allSearchEngines exists
    if (!allSearchEngines) {
        console.error('[Quick Preview] allSearchEngines is not available');
        return enabled;
    }

    for (const id in quickPreviewData.engines) {
        const qpEngine = quickPreviewData.engines[id];

        if (!qpEngine.enabled) continue;

        const engine = allSearchEngines[id];
        if (!engine) {
            console.warn('[Quick Preview] Engine not found in allSearchEngines:', id);
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
    if (!eng) return false; // selection language exists but engine has none => exclude

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
    console.log('[Quick Preview] setActiveEngine called:', { engineId, selectedText, focusTab, hasTabItems: tabItems.has(engineId) });

    if (!tabItems.has(engineId)) {
        console.error('[Quick Preview] Engine not found in tabItems:', engineId);
        return;
    }

    const { element, engine } = tabItems.get(engineId);

    if (!engine || !engine.url) {
        console.error('[Quick Preview] Invalid engine data:', { engineId, engine });
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
            console.warn('[Quick Preview] Invalid/unstable engine base URL detected. Falling back to last good value.', {
                current: baseUrl,
                normalized: normalizedBaseUrl,
                fallback: lastGoodEngineUrls.get(engineId),
            });
            baseUrl = lastGoodEngineUrls.get(engineId);
        } else {
            console.error('[Quick Preview] Engine base URL invalid and no fallback available:', baseUrl);
        }
    } else {
        baseUrl = normalizedBaseUrl;
        lastGoodEngineUrls.set(engineId, baseUrl);
    }

    let searchUrl = baseUrl;
    const encodedText = encodeURIComponent(selectedText);

    console.log('[Quick Preview] DEBUG - Original engine.url:', engine.url);
    console.log('[Quick Preview] DEBUG - Selected text:', selectedText);
    console.log('[Quick Preview] DEBUG - Encoded text:', encodedText);

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

    // Add SafeSearch parameter for Bing if not already present
    if (engineId === 'bing' && !searchUrl.includes('adlt=')) {
        const urlObj = new URL(searchUrl);
        urlObj.searchParams.set('adlt', 'strict'); // Enable strict SafeSearch
        searchUrl = urlObj.toString();
    }

    // Note: Removed Google-specific URL parameter adjustments (gbv/igu)

    console.log('[Quick Preview] Loading search for engine ID:', engineId);
    console.log('[Quick Preview] Engine name:', engine.name);
    console.log('[Quick Preview] Final search URL:', searchUrl);

    // Fetch and display the content
    fetchAndDisplayContent(searchUrl, engineId);

    if (focusTab) {
        element.focus({ preventScroll: true });
    }
}

// Fetch content and display it
async function fetchAndDisplayContent(url, engineId) {
    console.log('[Quick Preview] fetchAndDisplayContent called:', { url, engineId, isFetching });

    // Prevent simultaneous fetches
    if (isFetching) {
        console.warn('[Quick Preview] Already fetching, ignoring duplicate request');
        return;
    }

    // Validate inputs
    if (!url) {
        console.error('[Quick Preview] No URL provided to fetchAndDisplayContent');
        showErrorInContent('No URL provided', url);
        return;
    }

    if (!engineId) {
        console.error('[Quick Preview] No engineId provided to fetchAndDisplayContent');
        showErrorInContent('No engine ID provided', url);
        return;
    }

    // Detect obvious domain corruption (accidental comma instead of dot) before sending message
    try {
        // This will throw if URL is invalid
        // eslint-disable-next-line no-new
        new URL(url);
        const domainPart = url.split('//')[1].split('/')[0];
        if (domainPart.includes(',')) {
            console.warn('[Quick Preview] Detected comma in domain – likely invalid URL:', domainPart);
        }
    } catch (e) {
        console.error('[Quick Preview] Invalid URL detected before fetch:', url, e);
        showErrorInContent('Invalid URL', url);
        return;
    }

    // Set fetching flag
    isFetching = true;

    // Cancel any pending fetch
    if (currentAbortController) {
        currentAbortController.abort();
    }

    currentAbortController = new AbortController();

    // Show loading state
    contentContainer.textContent = ''; // Clear existing content
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'qp-loading';

    const spinner = document.createElement('div');
    spinner.className = 'qp-spinner';
    loadingDiv.appendChild(spinner);

    const loadingText = document.createElement('p');
    loadingText.textContent = 'Loading...';
    loadingDiv.appendChild(loadingText);

    contentContainer.appendChild(loadingDiv);

    try {
        console.log('[Quick Preview] Fetching content from:', url);
        console.log('[Quick Preview] Sending message to background script...');

        // Auto-correct common punctuation mistakes in domains or query (commas, stray spaces)
        const corrected = url
            .replace(/([a-z0-9])[,]+(com|org|net|io|edu|gov)\b/gi, '$1.$2') // example: wikipedia,org -> wikipedia.org
            .replace(/\/windex,\s*php/gi, '/w/index.php') // specific observed corruption
            .replace(/,php/g, '.php')
            .replace(/\s+/g, (m) => (m.includes('\n') ? ' ' : ' '));
        if (corrected !== url) {
            console.warn('[Quick Preview] URL auto-corrected', { before: url, after: corrected });
            url = corrected; // eslint-disable-line no-param-reassign
        }

        // Helper: send message with small retry for transient failures (SW wake-up, race conditions)
        const sendWithRetry = async (theUrl, maxAttempts = 3) => {
            const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            const startedAt = performance.now();

            // Check if runtime is still valid
            if (!browser.runtime || !browser.runtime.sendMessage) {
                throw new Error('Browser runtime is not available. The extension may have been reloaded.');
            }

            let attempt = 0;
            let lastError;
            while (attempt < maxAttempts) {
                try {
                    let response = await browser.runtime.sendMessage({ action: 'fetchQuickPreview', url: theUrl, requestId });
                    // Normalize undefined to null for simpler checks
                    if (typeof response === 'undefined') response = null;

                    // Treat null/undefined as transient (e.g., competing listeners or SW wake-up)
                    if (response == null) {
                        console.warn('[Quick Preview] Undefined/null response (possible worker wake-up). Retrying...', { requestId, attempt });
                        attempt++;
                        await new Promise((r) => setTimeout(r, 100 * attempt));
                        continue;
                    }

                    // If response is not an object, consider it transient and retry
                    if (typeof response !== 'object') {
                        console.warn('[Quick Preview] Non-object response from background. Retrying...', { attempt, type: typeof response });
                        attempt++;
                        await new Promise((r) => setTimeout(r, 120 * attempt));
                        continue;
                    }

                    // At this point we have an object; check success flag safely
                    if (response.success !== true) {
                        // Transient errors to retry
                        const errText = String(response.error || '');
                        const transient =
                            errText.includes('Failed to fetch') ||
                            errText.includes('NetworkError') ||
                            errText.includes('The message port closed') ||
                            errText.includes('Extension context invalidated');
                        if (transient && attempt + 1 < maxAttempts) {
                            console.warn('[Quick Preview] Transient fetch error, retrying...', { attempt, errText });
                            attempt++;
                            await new Promise((r) => setTimeout(r, 120 * attempt));
                            continue;
                        }
                        // Non-transient or max attempts used
                        return response;
                    }
                    const rtt = (performance.now() - startedAt).toFixed(1);
                    console.log('[Quick Preview] Round-trip ms:', rtt, 'requestId:', requestId);
                    return response;
                } catch (e) {
                    lastError = e;
                    console.warn('[Quick Preview] sendMessage failed, retrying...', { attempt, error: String(e) });
                    attempt++;
                    await new Promise((r) => setTimeout(r, 150 * attempt));
                }
            }
            // Exhausted retries
            throw lastError || new Error('Failed to fetch content');
        };

        const resp = await sendWithRetry(url, 3);
        // Guard against unexpected shapes; only treat explicit { success: true } as success
        const isOk = !!(resp && typeof resp === 'object' && resp.success === true);
        if (!isOk) {
            const errMsg = resp && typeof resp === 'object' && typeof resp.error === 'string' ? resp.error : 'Failed to fetch content';
            throw new Error(errMsg);
        }

        const html = resp.html;
        console.log('[Quick Preview] Content fetched successfully, length:', html.length);

        // Create a sandboxed iframe to parse and display the content
        const sandboxedContent = createSandboxedContent(html, url, engineId);
        contentContainer.textContent = ''; // Clear existing content
        contentContainer.appendChild(sandboxedContent);
    } catch (error) {
        if (currentAbortController.signal.aborted) {
            console.log('[Quick Preview] Fetch aborted');
            return;
        }

        console.error('[Quick Preview] Error fetching content:', error);
        showErrorInContent(error.message, url);
    } finally {
        // Reset the fetching flag
        isFetching = false;
        console.log('[Quick Preview] Fetch complete, isFetching flag reset to false');
    }
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
function createSandboxedContent(html, baseUrl, engineId) {
    const iframe = document.createElement('iframe');
    iframe.className = 'qp-preview-frame';
    // Remove allow-scripts to prevent CSP violations and security issues
    iframe.setAttribute('sandbox', 'allow-same-origin allow-popups allow-forms');
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');

    // Clean the HTML to remove problematic scripts and external resources
    const cleanedHtml = cleanHtmlContent(html);

    // Apply custom CSS if available
    const quickPreviewEngine = quickPreviewData.engines[engineId];
    const customCSS = quickPreviewEngine?.customCSS || '';

    // Get base domain for relative URLs
    const baseUrlObj = new URL(baseUrl);
    const baseDomain = `${baseUrlObj.protocol}//${baseUrlObj.host}`;

    // Build the complete HTML document as a string
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
    <base href="${escapeHtml(baseDomain)}/">
    <meta charset="utf-8">
    <meta name="viewport" content="width=350, initial-scale=1, maximum-scale=1, user-scalable=no">
    <style>
        /* Reset and base styles */
        * { box-sizing: border-box; }
        
        html {
            max-width: 350px;
            overflow-x: hidden;
        }
        
        body { 
            margin: 0; 
            padding: 16px; 
            max-width: 350px;
            overflow-x: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
        }
        
        /* Prevent any element from overflowing */
        * {
            max-width: 100%;
        }
        
        /* Make images responsive */
        img {
            max-width: 100%;
            height: auto;
        }
        
        /* Clean up table styles */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1em 0;
        }
        
        /* Link styles */
        a {
            color: #2563eb;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        
        /* Custom CSS from engine configuration */
        ${customCSS}
    </style>
</head>
<body>
    ${cleanedHtml}
</body>
</html>`;

    // Use srcdoc for same-origin context
    iframe.setAttribute('srcdoc', fullHtml);

    // Add load handler for logging and detection of blocked content
    iframe.onload = () => {
        console.log('[Quick Preview] Content loaded into iframe via srcdoc');

        const tryDetect = () => {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (!iframeDoc) return false;

                // Note: Removed Google-host specific cleanup logic

                const body = iframeDoc.body;
                const bodyText = body?.textContent?.trim() || '';

                // Check for blocking indicators
                const isBlocked =
                    bodyText.includes("can't open this page") ||
                    bodyText.includes("Can't Open This Page") ||
                    bodyText.includes('denied by') ||
                    bodyText.includes('X-Frame-Options') ||
                    bodyText.includes('having trouble accessing') ||
                    bodyText.includes("If you're having trouble") ||
                    bodyText.includes('will not allow') ||
                    bodyText.length < 50;

                if (isBlocked) {
                    console.warn('[Quick Preview] Content appears to be blocked. Body text:', bodyText.substring(0, 200));
                    // Show fallback UI
                    showBlockedContentFallback(engineId, baseUrl);
                    // Persist blocked flag for this engine to improve UX next time
                    try {
                        if (quickPreviewData && quickPreviewData.engines && quickPreviewData.engines[engineId]) {
                            if (quickPreviewData.engines[engineId].blocked !== true) {
                                quickPreviewData.engines[engineId].blocked = true;
                                browser.storage.local.set({ [STORAGE_KEYS.QUICK_PREVIEW]: quickPreviewData });
                            }
                        }
                    } catch (e) {
                        // ignore storage issues
                    }
                } else {
                    console.log('[Quick Preview] Content appears to be OK. Body length:', bodyText.length);
                    // If it renders fine, clear previous blocked flag
                    try {
                        if (quickPreviewData && quickPreviewData.engines && quickPreviewData.engines[engineId]) {
                            if (quickPreviewData.engines[engineId].blocked === true) {
                                quickPreviewData.engines[engineId].blocked = false;
                                browser.storage.local.set({ [STORAGE_KEYS.QUICK_PREVIEW]: quickPreviewData });
                            }
                        }
                    } catch (e) {
                        // ignore storage issues
                    }
                }
                return true;
            } catch (e) {
                console.warn('[Quick Preview] Cannot access iframe content (possibly blocked):', e);
                showBlockedContentFallback(engineId, baseUrl);
                try {
                    if (quickPreviewData && quickPreviewData.engines && quickPreviewData.engines[engineId]) {
                        if (quickPreviewData.engines[engineId].blocked !== true) {
                            quickPreviewData.engines[engineId].blocked = true;
                            browser.storage.local.set({ [STORAGE_KEYS.QUICK_PREVIEW]: quickPreviewData });
                        }
                    }
                } catch (_) {
                    // no-op: ignore storage failure when marking blocked
                }
                return true;
            }
        };

        // Check if iframe content loaded successfully after a short delay
        setTimeout(() => {
            const done = tryDetect();
            if (!done) {
                // Try one more time shortly after (in case layout/styles apply late)
                setTimeout(() => {
                    tryDetect();
                }, 250);
            }
        }, 500); // Wait 500ms for content to render
    };

    // Add error handler for iframe loading issues
    iframe.onerror = (error) => {
        console.error('[Quick Preview] Iframe loading error:', error);
        showBlockedContentFallback(engineId, baseUrl);
    };

    return iframe;
}

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
function cleanHtmlContent(html) {
    // Create a temporary DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Unwrap <noscript> content so fallback HTML can render inside our sandboxed iframe
    const noscripts = doc.querySelectorAll('noscript');
    noscripts.forEach((noscript) => {
        try {
            const container = doc.createElement('div');
            // Use textContent to get the raw markup and reparse it as HTML
            container.innerHTML = noscript.textContent || '';
            // Replace <noscript> with its parsed children
            while (container.firstChild) {
                noscript.parentNode.insertBefore(container.firstChild, noscript);
            }
            noscript.remove();
        } catch (e) {
            // If anything goes wrong, keep the noscript element (it will render in the iframe where scripts are disabled)
        }
    });

    // Remove all script tags (after unwrapping noscript so we also strip scripts inside it)
    const scripts = doc.querySelectorAll('script');
    scripts.forEach((script) => script.remove());

    // List of domains to filter out (adult content, malicious sites, etc.)
    const blockedDomains = ['pornhub.com', 'xvideos.com', 'xnxx.com', 'redtube.com', 'youporn.com', 'porn', 'xxx', 'adult'];

    // Remove links to blocked domains
    const allLinks = doc.querySelectorAll('a[href]');
    allLinks.forEach((link) => {
        const href = link.getAttribute('href');
        if (href) {
            const lowerHref = href.toLowerCase();
            for (const domain of blockedDomains) {
                if (lowerHref.includes(domain)) {
                    link.remove();
                    break;
                }
            }
        }
    });

    // Remove inline event handlers
    const allElements = doc.querySelectorAll('*');
    allElements.forEach((element) => {
        // Remove onclick, onload, etc.
        const attributes = element.attributes;
        for (let i = attributes.length - 1; i >= 0; i--) {
            const attr = attributes[i];
            if (attr.name.startsWith('on')) {
                element.removeAttribute(attr.name);
            }
        }

        // Remove display:none from inline styles (helps show Google error messages)
        if (element.style && element.style.display === 'none') {
            element.style.display = '';
        }
    });

    // Remove meta refresh redirects (commonly used to bounce if not allowed)
    const metaRefresh = Array.from(doc.querySelectorAll('meta[http-equiv]')).filter(
        (m) => (m.getAttribute('http-equiv') || '').toLowerCase() === 'refresh'
    );
    metaRefresh.forEach((m) => m.remove());

    // Remove problematic iframes and embeds
    const iframes = doc.querySelectorAll('iframe, embed, object');
    iframes.forEach((el) => el.remove());

    // Relax aggressive CSS that hides all content
    const styles = doc.querySelectorAll('style');
    styles.forEach((styleEl) => {
        try {
            const css = styleEl.textContent || '';
            // Remove display:none for broad element groups
            const relaxed = css.replace(/(^|[{};\s])(?<selector>[a-zA-Z0-9_\-. ,\s]+)\s*\{[^}]*display\s*:\s*none\s*;?[^}]*\}/g, (...args) => {
                // Extract named group if available; otherwise use second capture group
                const maybeGroups = args[args.length - 1];
                let selector = '';
                if (maybeGroups && typeof maybeGroups === 'object' && 'selector' in maybeGroups) {
                    selector = maybeGroups.selector;
                } else {
                    selector = args[2];
                }
                const s = String(selector).toLowerCase();
                // If it targets very broad sets, drop the whole rule
                if (/(^|\s)(html|body|div|span|p|table|tr|td|ul|ol|li|section|article|main)(\s|,|$)/.test(s)) {
                    return '';
                }
                return args[0];
            });
            if (relaxed !== css) {
                styleEl.textContent = relaxed;
            }
        } catch (e) {
            // Ignore CSS parse issues
        }
    });

    // Serialize the cleaned body content safely
    const serializer = new XMLSerializer();
    let cleanedHtml = '';
    Array.from(doc.body.childNodes).forEach((node) => {
        cleanedHtml += serializer.serializeToString(node);
    });

    return cleanedHtml;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const textNode = document.createTextNode(text);
    const div = document.createElement('div');
    div.appendChild(textNode);
    return div.textContent;
}

// Hide the bubble
function hideBubble() {
    if (bubble) {
        bubble.classList.remove('qp-bubble-visible');
    }
}

// Initialize when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuickPreview);
} else {
    initQuickPreview();
}
