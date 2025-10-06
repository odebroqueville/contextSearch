// Quick Preview Bubble - Similar to Lumetrium Definer
// Shows a floating bubble with search engine icons when text is selected

// Storage keys (inlined to avoid module import issues)
const STORAGE_KEYS = {
    QUICK_PREVIEW: 'quickPreview',
    SEARCH_ENGINES: 'searchEngines',
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

// Initialize Quick Preview
async function initQuickPreview() {
    console.log('[Quick Preview] Initializing...');
    try {
        const result = await browser.storage.local.get([STORAGE_KEYS.QUICK_PREVIEW, STORAGE_KEYS.SEARCH_ENGINES]);

        quickPreviewData = result[STORAGE_KEYS.QUICK_PREVIEW] || { engines: {} };
        allSearchEngines = result[STORAGE_KEYS.SEARCH_ENGINES] || {};

        console.log('[Quick Preview] Loaded data:', {
            enabledEngines: Object.keys(quickPreviewData.engines || {}).filter((id) => quickPreviewData.engines[id]?.enabled),
            totalSearchEngines: Object.keys(allSearchEngines || {}).length,
        });

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
        const oldData = quickPreviewData;
        quickPreviewData = changes[STORAGE_KEYS.QUICK_PREVIEW].newValue || { engines: {} };

        // If the bubble is visible and the CSS for the active engine changed, reload content
        if (bubble && bubble.classList.contains('qp-bubble-visible') && activeEngineId) {
            const oldCSS = oldData?.engines?.[activeEngineId]?.customCSS || '';
            const newCSS = quickPreviewData?.engines?.[activeEngineId]?.customCSS || '';

            if (oldCSS !== newCSS) {
                console.log('[Quick Preview] CSS changed for active engine, reloading content...');
                // Reload the content with the new CSS
                setActiveEngine(activeEngineId, currentSelectedText, false);
            }
        }
    }

    if (changes[STORAGE_KEYS.SEARCH_ENGINES]) {
        allSearchEngines = changes[STORAGE_KEYS.SEARCH_ENGINES].newValue || {};
    }
}

// Handle text selection
function handleTextSelection(event) {
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

    for (const id in quickPreviewData.engines) {
        const qpEngine = quickPreviewData.engines[id];

        if (!qpEngine.enabled) continue;

        const engine = allSearchEngines[id];
        if (!engine) continue;

        enabled.push({
            id,
            engine,
            index: qpEngine.index ?? 999,
            customCSS: qpEngine.customCSS || '',
        });
    }

    // Sort by index
    enabled.sort((a, b) => a.index - b.index);

    return enabled;
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

    if (!tabItems.has(engineId)) return;

    const { element, engine } = tabItems.get(engineId);

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
    let searchUrl = engine.url;
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

        // Use background script to fetch content (bypasses CORS)
        const response = await browser.runtime.sendMessage({
            action: 'fetchQuickPreview',
            url: url,
        });

        if (!response || !response.success) {
            throw new Error(response?.error || 'Failed to fetch content');
        }

        const html = response.html;
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

        // Show error with fallback option
        contentContainer.textContent = ''; // Clear existing content

        const errorDiv = document.createElement('div');
        errorDiv.className = 'qp-error';

        const errorMessage = document.createElement('p');
        errorMessage.className = 'qp-error-message';
        errorMessage.textContent = 'Unable to display content';
        errorDiv.appendChild(errorMessage);

        const errorDetails = document.createElement('p');
        errorDetails.className = 'qp-error-details';
        errorDetails.textContent = error.message;
        errorDiv.appendChild(errorDetails);

        const openTabButton = document.createElement('button');
        openTabButton.className = 'qp-open-tab';
        openTabButton.textContent = 'Open in New Tab';
        openTabButton.addEventListener('click', () => {
            window.open(url, '_blank');
        });
        errorDiv.appendChild(openTabButton);

        contentContainer.appendChild(errorDiv);
    }
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

    // Write content to iframe using safer methods
    iframe.onload = () => {
        try {
            const doc = iframe.contentDocument || iframe.contentWindow.document;

            // Create the document structure programmatically
            const html = doc.createElement('html');
            const head = doc.createElement('head');
            const body = doc.createElement('body');

            // Add base tag
            const base = doc.createElement('base');
            base.href = escapeHtml(baseDomain) + '/';
            head.appendChild(base);

            // Add meta tags
            const metaCharset = doc.createElement('meta');
            metaCharset.setAttribute('charset', 'utf-8');
            head.appendChild(metaCharset);

            const metaViewport = doc.createElement('meta');
            metaViewport.setAttribute('name', 'viewport');
            metaViewport.setAttribute('content', 'width=device-width, initial-scale=1');
            head.appendChild(metaViewport);

            // Add styles
            const style = doc.createElement('style');
            const cssContent = doc.createTextNode(`
                /* Reset and base styles */
                * { box-sizing: border-box; }
                body { 
                    margin: 0; 
                    padding: 16px; 
                    overflow-x: hidden;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    line-height: 1.6;
                    color: #1f2937;
                }
                
                /* Hide common ad/tracking/navigation containers */
                iframe, script, noscript, nav, header, footer,
                [class*="banner"], [class*="cookie"], [class*="popup"],
                [class*="modal"], [class*="overlay"], [id*="cookie"],
                [class*="ad-"], [class*="ads-"], [id*="ads"],
                [class*="navigation"], [class*="menu"] { 
                    display: none !important; 
                }
                
                /* Make images responsive */
                img { max-width: 100%; height: auto; }
                
                /* Improve readability */
                h1, h2, h3, h4, h5, h6 { margin-top: 1em; margin-bottom: 0.5em; }
                p { margin-bottom: 1em; }
                a { color: #3b82f6; text-decoration: none; }
                a:hover { text-decoration: underline; }
                
                /* Custom CSS from user */
                ${customCSS}
            `);
            style.appendChild(cssContent);
            head.appendChild(style);

            // Set the body content using the cleaned HTML fragment
            const range = doc.createRange();
            range.selectNodeContents(body);
            const fragment = range.createContextualFragment(cleanedHtml);
            body.appendChild(fragment);

            // Append head and body to html
            html.appendChild(head);
            html.appendChild(body);

            // Replace the document's documentElement
            if (doc.documentElement) {
                doc.replaceChild(html, doc.documentElement);
            } else {
                doc.appendChild(html);
            }

            console.log('[Quick Preview] Content loaded into iframe');
        } catch (e) {
            console.error('[Quick Preview] Error writing to iframe:', e);
        }
    };

    iframe.src = 'about:blank';

    return iframe;
}

// Clean HTML content by removing scripts and problematic elements
function cleanHtmlContent(html) {
    // Create a temporary DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove all script tags
    const scripts = doc.querySelectorAll('script');
    scripts.forEach((script) => script.remove());

    // Remove all noscript tags
    const noscripts = doc.querySelectorAll('noscript');
    noscripts.forEach((noscript) => noscript.remove());

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
    });

    // Remove problematic iframes and embeds
    const iframes = doc.querySelectorAll('iframe, embed, object');
    iframes.forEach((el) => el.remove());

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
