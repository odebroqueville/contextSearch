/// Import browser polyfill for compatibility with Chrome and other browsers
import '/libs/browser-polyfill.min.js';
import ExtPay from '/libs/ExtPay.js';

/// Import constants
import {
    bingUrl,
    ddgUrl,
    horseIconUrl,
    googleReverseImageSearchUrl,
    googleLensUrl,
    tineyeUrl,
    chatGPTUrl,
    googleAIStudioUrl,
    grokUrl,
    perplexityAIUrl,
    poeUrl,
    claudeUrl,
    andiUrl,
    aiUrls,
} from '/scripts/hosts.js';
import {
    base64chatGPT,
    base64GoogleAIStudio,
    base64Grok,
    base64perplexity,
    base64poe,
    base64claude,
    base64andi,
    base64ContextSearchIcon,
    base64FolderIcon,
} from '/scripts/favicons.js';
import {
    STORAGE_KEYS,
    DEFAULT_SEARCH_ENGINES,
    DEFAULT_OPTIONS,
    HEADER_RULES,
    UPDATE_CONFIG,
    titleMultipleSearchEngines,
    titleAISearch,
    titleSiteSearch,
    titleExactMatch,
    titleOptions,
    omniboxDescription,
    notifySearchEnginesLoaded,
    notifySearchEngineAdded,
    notifySearchEngineNotFound,
    notifyUsage,
    notifySearchEngineWithKeyword,
    notifyUnknown,
    notifySearchEngineUrlRequired,
    notifyMissingSearchEngine,
    notifyMissingBookmarkUrl,
    bookmarkPage,
    unbookmarkPage,
    addSearchEngine,
    subscriptionStatus,
} from '/scripts/constants.js';

// Utility function: debounce
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

/// Global variables

// Debug
// const logToConsole = DEBUG_VALUE;  // ORIGINAL - DEBUG_VALUE is undefined without build
const logToConsole = true; // TEMPORARY FIX - Enable logging for debugging

// ExtPay
const extpay = ExtPay('context-search');
extpay.startBackground();

// Helper for cross-browser context menu API
const contextMenus = browser.menus || browser.contextMenus;

// Create a debounced version of the update function (adjust delay as needed)
const delay = 500;
const debouncedUpdateAddonStateForActiveTab = debounce(updateAddonStateForActiveTab, delay);

// Browser type
const isFirefox = getBrowserType() === 'firefox';

// Subscription status
let paid, trialActive, trialStarted;

// Module-level variables for persistent data
let options = {};
let searchEngines = {};

// Module-level variables for temporary state during service worker lifetime
let selection = '';
// eslint-disable-next-line no-unused-vars
let selectionLang = '';
let targetUrl = '';
let imageUrl = '';
let lastAddressBarKeyword = '';
let historyItems, bookmarkItems;
let bookmarked = false;
let promptText;
let newSearchEngineUrl;
let formData;

// Check if polyfill is loaded
if (logToConsole) console.log(typeof browser === 'object' ? 'Polyfill loaded correctly' : 'Polyfill loaded incorrectly');

// Verify storage space occupied by local storage
if (logToConsole) {
    browser.storage.local
        .get()
        .then((items) => {
            console.log(`Bytes used by local storage: ${JSON.stringify(items).length} bytes.`);
        })
        .catch((err) => {
            console.error('Error getting storage data:', err);
        });
}

// Notifications (will be loaded from permissions)
let notificationsEnabled = false;

// Track initialization state
let isInitialized = false;

// Context menu creation in progress flag
let menuCreationInProgress = false;

// Track number of active click listeners
let clickListenerCounter = 0;

// Cache for OpenSearch support status per tab
const openSearchCache = new Map();

// Clear OpenSearch cache for a specific tab
function clearOpenSearchCache(tabId) {
    if (openSearchCache.has(tabId)) {
        openSearchCache.delete(tabId);
        if (logToConsole) console.log(`[OpenSearchCache] Cleared cache for tab ${tabId}`);
    }
}

// Get cached OpenSearch status or null if not cached
function getCachedOpenSearchStatus(tabId, url) {
    const cached = openSearchCache.get(tabId);
    if (cached && cached.url === url) {
        if (logToConsole) console.log(`[OpenSearchCache] Using cached result for tab ${tabId}: ${cached.hasOpenSearch}`);
        return cached.hasOpenSearch;
    }
    return null;
}

// Cache OpenSearch status for a tab
function setCachedOpenSearchStatus(tabId, url, hasOpenSearch) {
    openSearchCache.set(tabId, { url, hasOpenSearch });
    if (logToConsole) console.log(`[OpenSearchCache] Cached result for tab ${tabId}: ${hasOpenSearch}`);
}

// Clear all OpenSearch cache (useful for debugging or major state changes)
function clearAllOpenSearchCache() {
    const cacheSize = openSearchCache.size;
    openSearchCache.clear();
    if (logToConsole) console.log(`[OpenSearchCache] Cleared entire cache (${cacheSize} entries)`);
}

// Track when service worker was last active
let lastActivityTime = Date.now();

// Track Quick Preview probe host tab to detect hijacks
let probeTabInfo = null; // { tabId: number, hostUrl: string, recovering: boolean }

// Service worker wake-up detection
function onServiceWorkerWakeUp() {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityTime;

    // If more than 30 seconds have passed, assume the service worker was asleep
    if (timeSinceLastActivity > 30000) {
        if (logToConsole) console.log(`Service worker woke up after ${Math.round(timeSinceLastActivity / 1000)}s of inactivity`);

        // Reset initialization state to force proper reinitialization
        if (isInitialized) {
            isInitialized = false;
            if (logToConsole) console.log('Marking service worker as uninitialized due to wake-up');
        }
    }

    lastActivityTime = now;
}

// Call wake-up detection at the start of critical functions
function markActivity() {
    onServiceWorkerWakeUp();

    // Set up or update the keepalive alarm
    browser.alarms.create('keepalive', { delayInMinutes: 0.5 }); // 30 seconds
}

// Listen for alarm events to maintain service worker state
browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'keepalive') {
        markActivity();
        if (logToConsole) console.log('Service worker keepalive triggered');

        // Only create next alarm if we're actively being used
        const now = Date.now();
        if (now - lastActivityTime < 60000) {
            // If activity within last minute
            browser.alarms.create('keepalive', { delayInMinutes: 0.5 });
        }
    }
});

// Initialize service worker
(async function () {
    markActivity();

    // ({ paid, trialActive, trialStarted } = await getPaymentStatus());
    paid = true; // For testing purposes, set to true
    trialActive = false; // For testing purposes, set to false
    trialStarted = false; // For testing purposes, set to false

    if (logToConsole) {
        console.log(`isPaidUser: ${paid}`);
        console.log(`isTrialActive: ${trialActive}`);
        console.log(`isTrialStarted: ${trialStarted}`);
    }

    if (paid || trialActive) {
        try {
            await init();
            isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize storage:', error);
        }
    }
})();

/// Listeners

// Reload content scripts when extension is updated
browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'update') {
        if (logToConsole) console.log('Extension updated.');
        await initPerSubscriptionStatus();
    } else if (details.reason === 'install') {
        if (logToConsole) console.log('Extension installed.');
        await initPerSubscriptionStatus();
    }
    // After install/update, ensure default PromptCat prompts exist if library is empty
    await ensureDefaultPromptCatPrompts();
});

// Reload tabs to reload content scripts when extension is started
browser.runtime.onStartup.addListener(async () => {
    if (logToConsole) console.log('Extension started.');

    await initPerSubscriptionStatus();
    // On startup, ensure default PromptCat prompts exist if library is empty
    await ensureDefaultPromptCatPrompts();
});

// Listen for changes to the notifications permission
browser.permissions.onAdded.addListener(async (permissions) => {
    if (permissions.permissions.includes('notifications')) {
        notificationsEnabled = true;
        await setStoredData(STORAGE_KEYS.NOTIFICATIONS_ENABLED, true);
        if (logToConsole) console.log('Notifications permission granted.');
    }
});

browser.permissions.onRemoved.addListener(async (permissions) => {
    if (permissions.permissions.includes('notifications')) {
        notificationsEnabled = false;
        await setStoredData(STORAGE_KEYS.NOTIFICATIONS_ENABLED, false);
        if (logToConsole) console.log('Notifications permission revoked.');
    }
});

// listen to tab URL changes
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    // Clear cache if URL changed
    if (changeInfo.url) {
        clearOpenSearchCache(tabId);
    }
    // Detect hijack of the probe host tab: navigated away from hostUrl
    try {
        if (
            probeTabInfo &&
            probeTabInfo.tabId === tabId &&
            typeof changeInfo.url === 'string' &&
            probeTabInfo.hostUrl &&
            !changeInfo.url.startsWith(probeTabInfo.hostUrl)
        ) {
            if (!probeTabInfo.recovering) {
                probeTabInfo.recovering = true;
                // Notify options pages to handle current engine as hijacking/blocked
                browser.runtime.sendMessage({ action: 'probeTabHijacked', tabId, newUrl: changeInfo.url }).catch(() => {});
                // Recover by reloading the host page into the same tab
                browser.tabs
                    .update(tabId, { url: probeTabInfo.hostUrl, active: false })
                    .catch(() => {})
                    .finally(() => {
                        // small debounce; allow onUpdated to settle
                        setTimeout(() => {
                            if (probeTabInfo) probeTabInfo.recovering = false;
                        }, 300);
                    });
            }
        }
    } catch (e) {
        // ignore
        void e; // keep block non-empty for ESLint
    }
    if (paid || trialActive) debouncedUpdateAddonStateForActiveTab();
});

// listen to tab switching
browser.tabs.onActivated.addListener(() => {
    if (paid || trialActive) debouncedUpdateAddonStateForActiveTab();
});

// listen to tab removal to clean up cache
browser.tabs.onRemoved.addListener((tabId) => {
    clearOpenSearchCache(tabId);
});

// Listen for storage changes
browser.storage.onChanged.addListener(handleStorageChange);

// Listen for messages from the content or options script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    markActivity(); // Track service worker activity

    const action = message.action;
    const data = message.data;

    // Avoid using browser.runtime.lastError here; it’s not reliable in this context
    if (logToConsole) console.log('Message received from', sender?.url, message);
    // ALWAYS log fetchQuickPreview for debugging
    if (action === 'fetchQuickPreview') console.log('[SW] fetchQuickPreview received:', message.url);

    // Remove this block:
    // if (browser.runtime.lastError) {
    //     console.error('Extension context invalidated:', browser.runtime.lastError);
    //     return; // <-- This caused undefined responses
    // }

    if (action !== 'openPaymentPage' && action !== 'openTrialPage' && action !== 'openOptionsPage' && !paid && !trialActive) {
        sendResponse({ success: false, error: 'Subscription required' });
        return false; // Return false for synchronous response
    }

    // Ignore Quick Preview probe host messages (handled by the probe host page)
    if (message && typeof message.action === 'string' && message.action.startsWith('qpProbe:')) {
        // Do not respond; let the intended page handle it
        return false;
    }

    // Handle other actions
    switch (action) {
        case 'fetchQuickPreview': {
            // Fetch content for Quick Preview (bypasses CORS)
            if (logToConsole) console.log('[Service Worker] fetchQuickPreview action received:', message);
            const { url } = message;
            if (url) {
                try {
                    if (logToConsole) console.log('[Service Worker] Fetching URL:', url);

                    // Basic validation to avoid synchronous fetch() throws (which would skip sendResponse)
                    try {
                        // eslint-disable-next-line no-new
                        new URL(url);
                    } catch (e) {
                        console.error('[Service Worker] Invalid URL received:', url, e);
                        sendResponse({ success: false, error: 'Invalid URL' });
                        return false; // Synchronous response
                    }

                    // Add proper headers to get mobile-optimized content
                    // Using Android mobile user agent for mobile layout (fits 350px bubble) and better compatibility
                    const headers = {
                        'Accept-Language': 'en-US,en;q=0.9',
                        'User-Agent':
                            'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                    };

                    fetch(url, {
                        credentials: 'omit',
                        redirect: 'follow',
                        headers: headers,
                    })
                        .then((response) => {
                            if (logToConsole) console.log('[Service Worker] Fetch response status:', response.status);

                            // Check for X-Frame-Options header that would block iframe
                            const xFrameOptions = response.headers.get('X-Frame-Options');
                            const csp = response.headers.get('Content-Security-Policy');

                            // Capture header info to return to caller for probing
                            const headerInfo = {
                                xFrameOptions: xFrameOptions || null,
                                cspFrameAncestors: !!(csp && csp.includes('frame-ancestors')),
                            };

                            if (xFrameOptions) {
                                console.warn('[Service Worker] X-Frame-Options detected:', xFrameOptions);
                                console.warn('[Service Worker] This site may not display properly in iframe');
                            }

                            if (csp && csp.includes('frame-ancestors')) {
                                console.warn('[Service Worker] CSP frame-ancestors detected:', csp);
                            }

                            if (!response.ok) {
                                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                            }
                            return response.text().then((html) => ({ html, headerInfo }));
                        })
                        .then((payload) => {
                            const { html, headerInfo } = payload || {};
                            if (logToConsole) console.log('[Service Worker] Sending success response, HTML length:', html?.length);
                            sendResponse({ success: true, html, ...headerInfo });
                        })
                        .catch((error) => {
                            console.error('[Service Worker] Error fetching Quick Preview content (async):', error);
                            sendResponse({ success: false, error: error.message });
                        });
                    return true; // Keep message channel open for async response
                } catch (outerError) {
                    // Catch synchronous errors (e.g., fetch throwing before returning a promise)
                    console.error('[Service Worker] Synchronous error in fetchQuickPreview handler:', outerError);
                    try {
                        sendResponse({ success: false, error: outerError.message });
                    } catch (ignore) {
                        // Deliberately ignore secondary failures
                        void ignore; // keep block non-empty for ESLint
                    }
                    return false; // Synchronous response
                }
            }
            console.error('[Service Worker] No URL provided in fetchQuickPreview message');
            sendResponse({ success: false, error: 'No URL provided' });
            return false; // Synchronous response
        }
        case 'enableQuickPreviewMobileUA': {
            try {
                const tabId = sender?.tab?.id;
                if (typeof tabId !== 'number') {
                    sendResponse({ success: false, error: 'No tabId' });
                    return false;
                }
                const ruleId = 9000 + tabId; // unique per tab
                const MOBILE_UA =
                    'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
                // Allow caller to specify Accept-Language; default to en-US if not provided
                const acceptLanguage = (message && message.acceptLanguage) || 'en-US,en;q=0.9';

                browser.declarativeNetRequest
                    .updateSessionRules({
                        removeRuleIds: [ruleId],
                        addRules: [
                            {
                                id: ruleId,
                                priority: 10,
                                action: {
                                    type: 'modifyHeaders',
                                    requestHeaders: [
                                        { header: 'User-Agent', operation: 'set', value: MOBILE_UA },
                                        { header: 'Accept-Language', operation: 'set', value: acceptLanguage },
                                    ],
                                },
                                condition: {
                                    resourceTypes: ['sub_frame'],
                                    tabIds: [tabId],
                                },
                            },
                        ],
                    })
                    .then(() => sendResponse({ success: true }))
                    .catch((err) => {
                        console.error('enableQuickPreviewMobileUA failed:', err);
                        sendResponse({ success: false, error: err?.message || String(err) });
                    });
                return true; // async
            } catch (e) {
                sendResponse({ success: false, error: e?.message || String(e) });
                return false;
            }
        }
        case 'disableQuickPreviewMobileUA': {
            try {
                const tabId = sender?.tab?.id;
                if (typeof tabId !== 'number') {
                    sendResponse({ success: false, error: 'No tabId' });
                    return false;
                }
                const ruleId = 9000 + tabId;
                browser.declarativeNetRequest
                    .updateSessionRules({ removeRuleIds: [ruleId], addRules: [] })
                    .then(() => sendResponse({ success: true }))
                    .catch((err) => {
                        console.error('disableQuickPreviewMobileUA failed:', err);
                        sendResponse({ success: false, error: err?.message || String(err) });
                    });
                return true;
            } catch (e) {
                sendResponse({ success: false, error: e?.message || String(e) });
                return false;
            }
        }
        case 'openSearch': {
            // Quick Preview: open search URL in new tab
            const { url } = message;
            if (url) {
                browser.tabs
                    .create({ url, active: true })
                    .then(() => {
                        sendResponse({ success: true });
                    })
                    .catch((error) => {
                        console.error('Error opening Quick Preview search:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true; // Keep message channel open for async response
            }
            sendResponse({ success: false, error: 'No URL provided' });
            return false; // Synchronous response
        }
        case 'openBackgroundProbeTab': {
            try {
                const { url, timeoutMs } = message || {};
                if (!url) {
                    sendResponse({ success: false, error: 'No URL provided' });
                    return false;
                }
                browser.tabs
                    .create({ url, active: false })
                    .then((tab) => {
                        // Record this tab as the active probe host if it loads our probe host page
                        try {
                            const isProbeHost = typeof url === 'string' && url.includes('/html/qp-probe-host.html');
                            if (isProbeHost && tab && typeof tab.id === 'number') {
                                probeTabInfo = { tabId: tab.id, hostUrl: url, recovering: false };
                            }
                        } catch (ignore) {
                            // Deliberately ignore
                            void ignore; // keep block non-empty for ESLint
                        }
                        // Optionally auto-close after timeout; if timeoutMs <= 0, keep open until explicitly closed
                        const ms = typeof timeoutMs === 'number' ? timeoutMs : 0;
                        if (ms > 0) {
                            setTimeout(() => {
                                try {
                                    if (tab && tab.id) browser.tabs.remove(tab.id).catch(() => {});
                                } catch (ignore) {
                                    // Deliberately ignore
                                    void ignore; // keep block non-empty for ESLint
                                }
                            }, ms);
                        }
                        sendResponse({ success: true, tabId: tab?.id || null });
                    })
                    .catch((error) => {
                        console.error('Error opening background probe tab:', error);
                        sendResponse({ success: false, error: error?.message || String(error) });
                    });
                return true;
            } catch (e) {
                sendResponse({ success: false, error: e?.message || String(e) });
                return false;
            }
        }
        case 'closeTabs': {
            try {
                const { tabIds } = message || {};
                if (!Array.isArray(tabIds) || tabIds.length === 0) {
                    sendResponse({ success: false, error: 'No tab IDs provided' });
                    return false;
                }
                Promise.all(tabIds.map((id) => (typeof id === 'number' ? browser.tabs.remove(id).catch(() => {}) : Promise.resolve())))
                    .then(() => {
                        // If we closed the probe host tab, clear its tracking info
                        try {
                            if (probeTabInfo && tabIds.includes(probeTabInfo.tabId)) {
                                probeTabInfo = null;
                            }
                        } catch (ignore) {
                            // Deliberately ignore
                            void ignore; // keep block non-empty for ESLint
                        }
                        sendResponse({ success: true });
                    })
                    .catch((err) => {
                        console.error('Error closing tabs:', err);
                        sendResponse({ success: false, error: err?.message || String(err) });
                    });
                return true;
            } catch (e) {
                sendResponse({ success: false, error: e?.message || String(e) });
                return false;
            }
        }
        case 'navigateTab': {
            try {
                const { tabId, url } = message || {};
                if (typeof tabId !== 'number' || !url) {
                    sendResponse({ success: false, error: 'tabId or url missing' });
                    return false;
                }
                browser.tabs
                    .update(tabId, { url, active: false })
                    .then((tab) => sendResponse({ success: true, tabId: tab?.id || tabId }))
                    .catch((err) => {
                        console.error('Error navigating tab:', err);
                        sendResponse({ success: false, error: err?.message || String(err) });
                    });
                return true;
            } catch (e) {
                sendResponse({ success: false, error: e?.message || String(e) });
                return false;
            }
        }
        case 'savePromptToLibrary': {
            // Persist a prompt into the PromptCatDB (extension origin IndexedDB)
            const payload = data || {};
            savePromptToPromptCat(payload)
                .then((id) => {
                    sendResponse({ success: true, id });
                })
                .catch((error) => {
                    console.error('Error saving prompt to PromptCatDB:', error);
                    sendResponse({ success: false, error: error?.message || String(error) });
                });
            return true;
        }
        case 'openAiSearchPopup': {
            try {
                browser.windows.getCurrent({ populate: true }).then((currentWindow) => {
                    let tabIndex = sender.tab.index + 1;
                    if (!tabIndex || (options.tabMode === 'openNewTab' && options.lastTab)) {
                        tabIndex = currentWindow.tabs.length;
                    }
                    openAISearchPopup(tabIndex)
                        .then(() => {
                            sendResponse({ success: true });
                        })
                        .catch((error) => {
                            console.error('Error opening AI Search popup:', error);
                            sendResponse({ success: false, error: error.message || 'Unknown error' });
                        });
                });
            } catch (error) {
                console.error('Error opening AI Search popup:', error);
                sendResponse({ success: false, error: error.message || 'Unknown error' });
            }
            return true; // Indicate async response
        }
        case 'resetData':
            resetData(data)
                .then(() => {
                    sendResponse({ success: true });
                })
                .catch((error) => {
                    sendResponse({ success: false, error: error.message });
                });
            return true;
        case 'storeSelection':
            if (logToConsole) console.log('storeSelection message received with data:', data);
            // New handler for storing selection data reliably from the service worker
            if (data) {
                setStoredData(STORAGE_KEYS.SELECTION, data)
                    .then(() => {
                        if (logToConsole) console.log('Successfully stored selection:', data);
                        sendResponse({ success: true });
                    })
                    .catch((error) => {
                        console.error('Error storing selection data:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true; // Indicates we'll send a response asynchronously
            } else {
                if (logToConsole) console.log('storeSelection called with empty/null data');
                sendResponse({ success: false, error: 'No data provided' });
            }
            break;
        case 'storeSelectionLang':
            if (logToConsole) console.log('storeSelectionLang message received with data:', data);
            if (typeof data === 'string') {
                setStoredData(STORAGE_KEYS.SELECTION_LANG, data)
                    .then(() => {
                        if (logToConsole) console.log('Successfully stored selection language:', data);
                        sendResponse({ success: true });
                    })
                    .catch((error) => {
                        console.error('Error storing selection language:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            } else {
                sendResponse({ success: false, error: 'Invalid language value' });
            }
            break;
        case 'storeTargetUrl':
            if (data) {
                setStoredData(STORAGE_KEYS.TARGET_URL, data)
                    .then(() => {
                        sendResponse({ success: true });
                    })
                    .catch((error) => {
                        console.error('Error storing target URL:', error);
                        sendResponse({ success: false, error: error.message });
                    });
                return true;
            }
            break;
        case 'openModal':
            handleOpenModal(data)
                .then(() => {
                    sendResponse({ success: true });
                })
                .catch((error) => {
                    sendResponse({ success: false, error: error.message });
                });
            return true;
        case 'addNewPostSearchEngine':
            handleAddNewPostSearchEngine(data)
                .then((result) => {
                    if (result) {
                        sendResponse({ success: true });
                    } else {
                        sendResponse({ success: false });
                    }
                })
                .catch((error) => {
                    sendResponse({ error: error.message });
                });
            return true;
        case 'doSearch':
            handleDoSearch(data)
                .then(() => {
                    sendResponse({ success: true });
                })
                .catch((error) => {
                    sendResponse({ success: false, error: error.message });
                });
            return true;
        case 'openOptionsPage': {
            // Open extension options (always allowed)
            try {
                browser.runtime.openOptionsPage().catch((err) => {
                    if (logToConsole) console.warn('openOptionsPage failed, falling back:', err);
                    browser.tabs.create({ url: browser.runtime.getURL('/html/options.html') });
                });
                sendResponse({ success: true });
            } catch (e) {
                if (logToConsole) console.error('Failed to open options page:', e);
                try {
                    browser.tabs.create({ url: browser.runtime.getURL('/html/options.html') });
                    sendResponse({ success: true });
                } catch (e2) {
                    sendResponse({ success: false, error: e2.message || String(e2) });
                }
            }
            return false;
        }
        case 'executeAISearch':
            if (logToConsole) console.log('Received executeAISearch message:', message.data);
            // Execute the handler (don't await it here if it's long-running)
            handleExecuteAISearch(data);
            // Send acknowledgment immediately so popup can close
            sendResponse({ received: true });
            // Return false (or omit return) as response is sent synchronously
            return false;
        case 'executeCommandLine':
            if (logToConsole) console.log('Received executeCommandLine message:', message.data);
            if (message.data && typeof message.data.input === 'string') {
                // Fire and forget; no need to await
                processOmniboxInput(message.data.input.trim());
                sendResponse({ received: true });
                return false;
            }
            sendResponse({ received: false, error: 'No input supplied' });
            return false;
        case 'notify':
            if (notificationsEnabled) notify(data);
            break;
        case 'reset':
            handleReset()
                .then((result) => {
                    sendResponse(result);
                })
                .catch((error) => {
                    sendResponse({ error: error.message });
                });
            return true;
        case 'testSearchEngine':
            testSearchEngine(data)
                .then(() => {
                    sendResponse({ success: true });
                })
                .catch((error) => {
                    sendResponse({ success: false, error: error.message });
                });
            return true;
        case 'testPrompt':
            testPrompt()
                .then(() => {
                    sendResponse({ success: true });
                })
                .catch((error) => {
                    sendResponse({ success: false, error: error.message });
                });
            return true;
        case 'saveSearchEngines':
            handleSaveSearchEngines(data)
                .then(() => {
                    sendResponse({ success: true });
                })
                .catch((error) => {
                    sendResponse({ success: false, error: error.message });
                });
            return true;
        case 'saveAIEngine':
            handleSaveAIEngine(data)
                .then(() => {
                    sendResponse({ success: true });
                })
                .catch((error) => {
                    sendResponse({ success: false, error: error.message });
                });
            return true;
        case 'getFavicon':
            handleGetFavicon(data)
                .then((result) => {
                    if (result && typeof result.imageFormat !== 'undefined' && typeof result.base64 !== 'undefined') {
                        // Fix: Send imageFormat and base64 directly on the response object
                        sendResponse({ success: true, imageFormat: result.imageFormat, base64: result.base64 });
                    } else {
                        // Handle cases where favicon wasn't determined (e.g., missing searchEngine, no domain, folder, etc.)
                        sendResponse({ success: false, reason: 'Favicon could not be determined or is not applicable.' });
                    }
                })
                .catch((error) => {
                    // Fix: Add more detailed logging
                    console.error(`Error processing getFavicon for id '${data?.id}':`, error);
                    sendResponse({ success: false, error: error.message });
                });
            return true; // Indicate async response
        case 'updateOptions':
            handleOptionsUpdate(data.updateType, data.data)
                .then(() => {
                    sendResponse({ success: true });
                })
                .catch((error) => {
                    sendResponse({ success: false, error: error.message });
                });
            return true; // Indicate async response
        case 'saveSearchEnginesToDisk':
            handleSaveSearchEnginesToDisk(data)
                .then(() => {
                    sendResponse({ success: true });
                })
                .catch((error) => {
                    sendResponse({ success: false, error: error.message });
                });
            return true;
        case 'contentScriptLoaded':
            handleContentScriptLoaded(data)
                .then((result) => {
                    if (result) {
                        sendResponse(result);
                    }
                    // Ensure the addon state (including context menus) is updated
                    // now that we know the content script is loaded and ready.
                    if (logToConsole) console.log('Content script loaded, updating addon state...');
                    updateAddonStateForActiveTab();
                })
                .catch((error) => {
                    // Log any errors during content script loaded handling
                    console.error('Error processing contentScriptLoaded:', error);
                    // Still try to update the addon state as a fallback
                    updateAddonStateForActiveTab();
                });
            return true;
        case 'getImageUrl':
            sendImageUrl()
                .then((result) => {
                    if (result) {
                        sendResponse(result);
                    } else {
                        sendResponse({ success: false });
                    }
                })
                .catch((error) => {
                    sendResponse({ error: error.message });
                });
            return true;
        case 'getOS':
            getOS()
                .then(() => {
                    sendResponse({ success: true });
                })
                .catch((error) => {
                    sendResponse({ success: false, error: error.message });
                });
            return true;
        case 'reloadSearchEngines':
            reloadSearchEngines()
                .then(() => {
                    sendResponse({ success: true });
                })
                .catch((error) => {
                    sendResponse({ success: false, error: error.message });
                });
            return true;
        case 'openTrialPage':
            if (logToConsole) console.log('Received request to open trial page from popup.');
            extpay.openTrialPage('7-day');
            // No sendResponse needed here as the popup closes itself
            break;
        case 'openPaymentPage':
            if (logToConsole) console.log('Received request to open payment page from popup.');
            extpay.openPaymentPage();
            // No sendResponse needed here as the popup closes itself
            break;
        case 'getContentLanguageForUrl': {
            // Best-effort probe to read the Content-Language response header of a URL
            try {
                const url = (data && data.url) || (sender?.tab && sender.tab.url) || '';
                if (!url) {
                    sendResponse({ success: false, error: 'No URL provided' });
                    return false;
                }

                // Validate URL format early
                try {
                    // eslint-disable-next-line no-new
                    new URL(url);
                } catch (e) {
                    sendResponse({ success: false, error: 'Invalid URL' });
                    return false;
                }

                const headers = {
                    'Accept-Language': 'en-US,en;q=0.9',
                    'User-Agent':
                        'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
                };

                // Try HEAD first to minimize payload; some servers may not support HEAD, so fallback to GET with small Accept
                const doFetch = async (method) => {
                    return fetch(url, {
                        method,
                        credentials: 'omit',
                        redirect: 'follow',
                        headers: method === 'HEAD' ? headers : { ...headers, Accept: 'text/html;q=0.5,*/*;q=0.1' },
                    });
                };

                (async () => {
                    try {
                        let response = await doFetch('HEAD');
                        if (!response.ok || !response.headers) {
                            // Retry with GET
                            response = await doFetch('GET');
                        }
                        const cl = response.headers ? response.headers.get('Content-Language') : null;
                        sendResponse({ success: true, contentLanguage: cl || '' });
                    } catch (err) {
                        console.error('[Service Worker] getContentLanguageForUrl error:', err);
                        sendResponse({ success: false, error: err?.message || String(err) });
                    }
                })();
                return true; // async response
            } catch (err) {
                console.error('[Service Worker] getContentLanguageForUrl synchronous error:', err);
                sendResponse({ success: false, error: err?.message || String(err) });
                return false;
            }
        }
        default:
            if (logToConsole) console.log('Unexpected action:', action);
            sendResponse({ success: false });
            return false;
    }
    sendResponse({ success: true });
    return true;
});

/// Main functions

// Initialise extension as per payment or trial status
// This function is called when the extension is first installed or updated
async function initPerSubscriptionStatus() {
    if (logToConsole) console.log('Initializing extension...');

    if (!paid && !trialStarted) {
        // Show subscription choice popup instead of directly opening payment pages
        openSubscriptionChoicePopup();
    } else if (!paid && trialStarted) {
        // Open payments page
        extpay.openPaymentPage();
    }

    if (paid || trialActive) {
        await buildActionButtonMenus();
    } else {
        await buildSubscriptionStatusMenuItem();
    }
}

async function getPaymentStatus() {
    const now = new Date();
    const sevenDays = 1000 * 60 * 60 * 24 * 7; // in milliseconds
    const user = await extpay.getUser();
    const paid = user.paid;
    const trialStarted = user.trialStartedAt !== null;
    const trialActive = user.trialStartedAt !== null && now - user.trialStartedAt < sevenDays;
    return { paid, trialActive, trialStarted };
}

// Expose for debugging to avoid unused warnings in some packaging modes
globalThis.getPaymentStatus = getPaymentStatus;

async function resetData(data) {
    if (logToConsole) console.log('Resetting data...', data);
    if (Object.keys(data)[0] === 'options') {
        options = data.options;
    }
    if (Object.keys(data)[0] === 'searchEngines') {
        searchEngines = data.searchEngines;
    }
    await setStoredData(data);
}

async function reloadSearchEngines() {
    if (logToConsole) console.log('Reloading search engines...');
    await initialiseSearchEngines();
}

// Add platform detection handler
async function getOS() {
    try {
        const platform = await browser.runtime.getPlatformInfo();
        switch (platform.os) {
            case 'mac':
                return { os: 'macOS' };
            case 'win':
                return { os: 'Windows' };
            case 'android':
                return { os: 'Android' };
            case 'linux':
                return { os: 'Linux' };
            case 'ios':
                return { os: 'iOS' };
            default:
                return { os: 'Unknown' };
        }
    } catch (error) {
        console.error('Error detecting OS:', error);
        return { error: error.message };
    }
}

// Initialize header modification rules
async function initializeHeaderRules() {
    if (logToConsole) console.log('Initializing header rules...');

    // Remove any existing rules and add new ones
    await browser.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: HEADER_RULES.map((rule) => rule.id),
        addRules: HEADER_RULES,
    });

    if (logToConsole) console.log('Header rules initialized.');
}

// Function to get stored data
async function getStoredData(key) {
    try {
        if (key) {
            // Getting a specific key
            const result = await browser.storage.local.get(key);
            if (logToConsole) console.log(`Getting ${key} from storage:`, result[key]);

            // Handle the case where we get undefined for common keys
            if (result[key] === undefined) {
                // Return appropriate defaults for common keys
                if (key === STORAGE_KEYS.OPTIONS) return { ...DEFAULT_OPTIONS };
                if (key === STORAGE_KEYS.SEARCH_ENGINES) return {};
                if (key === STORAGE_KEYS.SELECTION) return '';
            }

            return result[key];
        } else {
            // Getting all data
            const result = await browser.storage.local.get(null);
            if (logToConsole) console.log('Getting all data from storage:', result);

            // Ensure critical keys have at least empty values
            const defaults = {
                [STORAGE_KEYS.OPTIONS]: { ...DEFAULT_OPTIONS },
                [STORAGE_KEYS.SEARCH_ENGINES]: {},
                [STORAGE_KEYS.SELECTION]: '',
            };

            // Merge with defaults for any missing keys
            for (const defaultKey in defaults) {
                if (result[defaultKey] === undefined) {
                    result[defaultKey] = defaults[defaultKey];
                }
            }

            return result;
        }
    } catch (error) {
        if (logToConsole && key) {
            console.error(`Error getting ${key} from storage:`, error);
        } else {
            console.error('Error getting stored data:', error);
        }

        // Return defaults instead of null on error
        if (key) {
            // Return appropriate defaults for common keys
            if (key === STORAGE_KEYS.OPTIONS) return { ...DEFAULT_OPTIONS };
            if (key === STORAGE_KEYS.SEARCH_ENGINES) return {};
            if (key === STORAGE_KEYS.SELECTION) return '';
            return null;
        } else {
            // Return a basic data structure with defaults
            return {
                [STORAGE_KEYS.OPTIONS]: { ...DEFAULT_OPTIONS },
                [STORAGE_KEYS.SEARCH_ENGINES]: {},
                [STORAGE_KEYS.SELECTION]: '',
            };
        }
    }
}

// Function to set stored data
async function setStoredData(key, value) {
    try {
        if (logToConsole) console.log(`Setting ${key} in storage with value:`, value);
        await browser.storage.local.set({ [key]: value });
    } catch (error) {
        console.error(`Error setting ${key} in storage:`, error);
    }
}

// Initialize stored data
async function initializeStoredData() {
    if (logToConsole) console.log('Initializing stored data...');
    try {
        // Initialize options
        const storedOptions = await getStoredData(STORAGE_KEYS.OPTIONS);
        options = {
            ...DEFAULT_OPTIONS,
            ...storedOptions,
        };

        // Chrome does not support favicons in context menus
        const browser_type = getBrowserType();
        if (browser_type === 'chrome') options.displayFavicons = false;

        await setStoredData(STORAGE_KEYS.OPTIONS, options);
        if (logToConsole) console.log('Options:', options);

        // Initialize selection
        selection = (await getStoredData(STORAGE_KEYS.SELECTION)) || '';

        // Initialize selection language
        selectionLang = (await getStoredData(STORAGE_KEYS.SELECTION_LANG)) || '';

        // Initialize target URL
        targetUrl = (await getStoredData(STORAGE_KEYS.TARGET_URL)) || '';

        // Initialize bookmarks
        bookmarkItems = (await getStoredData(STORAGE_KEYS.BOOKMARKS)) || [];

        // Initialize history
        historyItems = (await getStoredData(STORAGE_KEYS.HISTORY)) || [];
    } catch (error) {
        console.error('Error in initializeStoredData:', error);
        throw error;
    }
}

async function handleStorageChange(changes, areaName) {
    if (areaName === 'local' && changes) {
        // Check if options were changed
        if (changes.options) {
            if (logToConsole) console.log('Options changed:', changes.options.newValue);
            options = changes.options.newValue;
            // Mark that options have changed - content scripts will request updated options when needed
            // This is more efficient than broadcasting to all tabs
            if (logToConsole) console.log('Options updated, content scripts will request updated data when needed');
        }

        // Check if search engines were changed
        if (changes.searchEngines) {
            if (logToConsole) console.log('Search engines changed:', changes.searchEngines.newValue);
            searchEngines = changes.searchEngines.newValue;
            // Mark that search engines have changed - content scripts will request updated data when needed
            // This is more efficient than broadcasting to all tabs
            if (logToConsole) console.log('Search engines updated, content scripts will request updated data when needed');
        }

        // Check if selection was changed
        if (changes.selection) {
            selection = changes.selection.newValue;
        }

        // Check if selection language was changed
        if (changes.selectionLang) {
            selectionLang = changes.selectionLang.newValue;
        }

        // Check if target URL was changed
        if (changes.targetUrl) {
            targetUrl = changes.targetUrl.newValue;
        }
    }
}

// Function that determines if the browser being used is Chromium-based (e.g. Chrome) or is Gecko-based (e.g. Firefox)
function getBrowserType() {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes('chrome') ? 'chrome' : 'firefox';
}

// Functions used to handle incoming messages
async function queryAllTabs() {
    return await browser.tabs.query({ currentWindow: true });
}

async function isIdUnique(testId) {
    // Retrieve search engines from local storage
    for (let id in searchEngines) {
        if (id === testId) {
            return false;
        }
    }
    return true;
}

// Open popup (modal) for HTTP POST requests
async function handleOpenModal(data) {
    newSearchEngineUrl = data.url;
    formData = data.formData;
    const modalURL = browser.runtime.getURL('/html/addSearchEngineForPostRequest.html');
    const popupWidth = 400; // Width of the popup window
    const popupHeight = 420; // Height of the popup window
    // Get browser info directly
    const browserInfo = await browser.windows.getCurrent();
    const browserWidth = browserInfo.width;
    const browserHeight = browserInfo.height;
    const browserLeft = browserInfo.left;
    const browserTop = browserInfo.top;

    // Calculate the position to center the window in the browser with a vertical offset of 200px
    // Use the obtained browser dimensions and position
    const left = browserLeft + Math.floor((browserWidth - popupWidth) / 2);
    const top = browserTop + Math.floor((browserHeight - popupHeight) / 2) - 200;
    browser.windows.create({
        type: 'popup',
        top: top,
        left: left,
        width: popupWidth,
        height: popupHeight,
        url: modalURL,
    });
}

async function handleAddNewPostSearchEngine(data) {
    const searchEngineName = data.searchEngineName;
    const keyword = data.keyword;
    if (logToConsole) console.log(searchEngineName);
    if (logToConsole) console.log(keyword);

    // Define a unique ID for the new search engine
    let id = searchEngineName.replace(/\s/g, '-').toLowerCase();
    while (!isIdUnique(id)) {
        id = id + '-' + Date.now();
    }
    id = id.trim();

    // Add the new search engine
    const index = searchEngines['root']['children'].length;

    const formDataString = JSON.stringify(formData);

    const searchEngine = {
        index: index,
        name: searchEngineName,
        keyword: keyword,
        keyboardShortcut: '',
        multitab: false,
        url: newSearchEngineUrl,
        show: true,
        formData: formDataString,
    };

    if (logToConsole) console.log(searchEngine);

    searchEngines[id] = searchEngine;

    const domain = getDomain(newSearchEngineUrl);

    return await addNewSearchEngine(id, domain);
}

async function handleDoSearch(data) {
    // The id of the search engine, folder, AI prompt or 'multisearch'
    // The source is either the grid of icons (for multisearch) or a keyboard shortcut
    const id = data.id;
    const hasCurrentSelection = data.hasCurrentSelection !== false; // Default to true for backward compatibility

    // Refresh selection to ensure we have the latest text selection
    if (logToConsole) console.log('About to refresh selection from storage...');
    selection = (await getStoredData(STORAGE_KEYS.SELECTION)) || '';
    if (logToConsole) console.log("Current selection for search: '" + selection + "'");
    if (logToConsole) console.log('Selection length:', selection.length);
    if (logToConsole) console.log('Selection type:', typeof selection);
    if (logToConsole) console.log('Has current selection:', hasCurrentSelection);

    let multiTabArray = [];
    if (logToConsole) console.log('Search engine id: ' + id);
    if (logToConsole) console.log(options.tabMode === 'openSidebar');
    const activeTabs = await browser.tabs.query({ active: true, currentWindow: true });
    const activeTab = activeTabs[0];
    let tabPosition = activeTab.index + 1;
    if (options.multiMode === 'multiAfterLastTab' || options.lastTab) {
        const allTabs = await queryAllTabs();
        if (allTabs.length > 0) {
            const lastTab = allTabs[allTabs.length - 1];
            tabPosition = lastTab.index + 1;
        }
    }
    // If the search engine is a folder
    if (searchEngines[id] && searchEngines[id].isFolder) {
        multiTabArray.push(...(await processFolder(id, selection)));
    }

    if (id === 'multisearch' || (searchEngines[id] && searchEngines[id].isFolder)) {
        // If multisearch or the search engine is a folder
        let multiId;
        if (id === 'multisearch') {
            multiId = 'root';
        } else {
            multiId = id;
        }
        await processMultisearch(multiTabArray, multiId, tabPosition);
    } else {
        // If single search and search engine is a link, HTTP GET or POST request or AI prompt
        const multisearch = false;
        const windowInfo = await browser.windows.getCurrent();
        await displaySearchResults(id, tabPosition, multisearch, windowInfo.id, '', '', hasCurrentSelection);
    }
}

/// Reset extension
// Resets the options to the default settings if options.resetPreferences is set
// Resets the list of search engines to the default list if options.forceSearchEnginesReload is set
// Force favicons to be reloaded if options.forceFaviconsReload is set
async function handleReset() {
    if (logToConsole) {
        console.log("Resetting extension's preferences and search engines as per user reset preferences.");
    }
    await initialiseSearchEngines();
    return { action: 'resetCompleted' };
}

async function handleSaveSearchEngines(data) {
    searchEngines = data;
    const flagSaveSearchEngines = JSON.stringify(searchEngines) !== JSON.stringify(await getStoredData(STORAGE_KEYS.SEARCH_ENGINES));
    await initSearchEngines(flagSaveSearchEngines);
}

async function handleSaveAIEngine(data) {
    const id = data.id;
    const aiProvider = data.aiProvider;
    const { imageFormat, base64 } = getFaviconForPrompt(id, aiProvider);
    const flagSaveSearchEngines = true;

    searchEngines[id]['aiProvider'] = aiProvider;
    searchEngines[id]['imageFormat'] = imageFormat;
    searchEngines[id]['base64'] = base64;
    await initSearchEngines(flagSaveSearchEngines);
}

async function handleGetFavicon(data) {
    if (logToConsole) console.log('Getting favicon for search engine:', data);
    const id = data.id;
    const searchEngine = data.searchEngine;
    searchEngines[id] = { ...searchEngine };

    // --- Add this defensive check ---
    if (!searchEngine) {
        console.error(`handleGetFavicon called for id '${id}' but searchEngine is missing in data:`, data);
        return; // Return undefined/null, will lead to { success: false } response
    }
    // --- End check ---

    let domain;
    let imageFormat;
    let base64;

    if (!(id.startsWith('separator-') || id.startsWith('chatgpt-') || searchEngine.isFolder)) {
        domain = getDomain(searchEngine.url);
        if (logToConsole) {
            console.log('id: ' + id);
            console.log('url: ' + searchEngine.url);
            console.log('Getting favicon for ' + domain);
        }
    }

    // Add a favicon to the search engine except if it's a separator or a folder
    if (!id.startsWith('separator-')) {
        ({ imageFormat, base64 } = await getNewFavicon(id, domain));
    }

    return { imageFormat, base64 };
}

/**
 * Unified handler for updating options
 * @param {string} updateType - The type of update to perform
 * @param {Object} data - The data containing the new values
 * @returns {Promise<string|void>} Returns a custom string for certain update types
 */
async function handleOptionsUpdate(updateType, data) {
    const config = UPDATE_CONFIG[updateType];
    if (!config) {
        console.error(`Unknown update type: ${updateType}`);
        return;
    }

    // Handle special case for offset update
    if (updateType === 'offset') {
        if (data.offsetX) options.offsetX = data.offsetX;
        if (data.offsetY) options.offsetY = data.offsetY;
    }
    // Handle special case for resetOptions
    else if (updateType === 'resetOptions') {
        config.fields.forEach((field) => {
            options[field] = data.resetOptions[field];
        });
    }
    // Handle all other cases
    else {
        config.fields.forEach((field) => {
            options[field] = data[field];
        });
    }

    await saveOptions(config.requiresMenuRebuild);
    //return config.customReturn;
}

async function handleSaveSearchEnginesToDisk(data) {
    await browser.downloads.download({
        url: data,
        saveAs: true,
        filename: 'contextSearch-backup.json',
    });
}

async function handleContentScriptLoaded(data) {
    if (logToConsole) console.log('Content script loaded. Sending response.');
    // Send a response to the content script
    const { domain, tabUrl } = data;
    if (logToConsole) console.log(`Tab url: ${tabUrl}`);

    let trimmedUrl;
    if (tabUrl.endsWith('/')) {
        trimmedUrl = tabUrl.slice(0, -1);
    } else {
        trimmedUrl = tabUrl;
    }

    if (aiUrls.includes(trimmedUrl)) {
        if (logToConsole) console.log(`Prompt: ${promptText}`);
        return {
            action: 'askPrompt',
            data: { url: domain, prompt: promptText },
        };
    }

    // Check if tabUrl is in the list of search engine URLs
    for (let id in searchEngines) {
        if (id.startsWith('separator-') || id.startsWith('link-') || id.startsWith('chatgpt-') || searchEngines[id].isFolder) continue;
        const searchEngine = searchEngines[id];
        if (searchEngine.url.startsWith('https://' + domain) && searchEngine.formData) {
            let finalFormData;
            let formDataString = searchEngine.formData;
            if (formDataString.includes('{searchTerms}')) {
                formDataString = formDataString.replace('{searchTerms}', selection);
            } else if (formDataString.includes('%s')) {
                formDataString = formDataString.replace('%s', selection);
            }
            // Apply rich template expansion to action URL and form data
            const ctx = await getActiveTabTemplateContext({ selectionOverride: selection });
            const expandedActionUrl = expandTemplateString(searchEngine.url, ctx, { urlEncode: false });
            formDataString = expandTemplateString(formDataString, ctx, { urlEncode: false });
            const jsonFormData = JSON.parse(formDataString);
            const expandedJson = expandObjectStrings(jsonFormData, ctx, { urlEncode: false });
            finalFormData = jsonToFormData(expandedJson);
            // Set global targetUrl for submitForm
            targetUrl = expandedActionUrl;

            if (logToConsole) {
                console.log(`id: ${id}`);
                console.log('Form data string:');
                console.log(formDataString);
                console.log(`Selection: ${selection}`);
            }
            return submitForm(finalFormData);
        }
    }
    return {
        action: 'noAction',
        success: true,
        data: { message: 'No action needed for this page' },
    };
}

async function sendImageUrl() {
    if (targetUrl) {
        if (logToConsole) console.log(`Sending image URL: ${targetUrl}`);
        return {
            action: 'fillFormWithImageUrl',
            data: { imageUrl: imageUrl },
        };
    }
}

// Test if a search engine performing a search for the keyword 'test' returns valid results
async function testSearchEngine(engineData) {
    if (engineData.url != '') {
        let tempTargetUrl = await getSearchEngineUrl(engineData.url, 'test');
        browser.tabs.create({
            url: tempTargetUrl,
        });
    } else if (notificationsEnabled) {
        notify(notifySearchEngineUrlRequired);
    }
}

// test if an AI search engine perfoming an AI request with the prompt 'How old is the Universe' returns valid results
async function testPrompt() {
    const id = 'chatgpt-';
    const multisearch = false;
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    const tabPosition = activeTab.index + 1;
    const windowInfo = await browser.windows.getCurrent();
    await displaySearchResults(id, tabPosition, multisearch, windowInfo.id);
}

async function handleExecuteAISearch(data) {
    const { aiEngine, prompt, tabIndex } = data;
    const id = 'chatgpt-direct';
    const windowInfo = await browser.windows.getCurrent();

    try {
        // 1. Calculate tab position based on *freshly queried* data
        let tabPosition;
        if (options.tabMode === 'openNewTab' && options.lastTab) {
            // After the last tab in the target window
            tabPosition = windowInfo.tabs.length;
            if (logToConsole) console.log(`handleExecuteAISearch: Position set to end of window. Tab position: ${tabPosition}`);
        } else {
            // Right after the determined active tab in the target window
            // Convert tabIndex to a number if it's a string
            tabPosition = tabIndex !== undefined ? parseInt(tabIndex, 10) : windowInfo.tabs.length;
            if (logToConsole) console.log(`handleExecuteAISearch: Position set after active tab index: ${tabPosition}`);
        }

        // 2. Call displaySearchResults with the determined window and position
        displaySearchResults(id, tabPosition, false, windowInfo.id, aiEngine, prompt);
    } catch (error) {
        if (logToConsole) console.error(`handleExecuteAISearch: Error determining tab position: ${error.message}`, error);
        // Notify user or handle error
    }
}

// Initialize extension
// Initialize search engines, only setting to default if not previously set
// Check if options are set in sync storage and set to default if not
async function init() {
    if (isInitialized) {
        if (logToConsole) console.log('Extension already initialized, skipping...');
        return;
    }

    if (logToConsole) console.log('Initializing extension...');

    try {
        // Check if we somehow have active click listeners before initialization
        // This could happen if the service worker was reactivated
        if (clickListenerCounter > 0 && logToConsole) {
            console.log(`Warning: ${clickListenerCounter} click listeners are active before initialization`);
            // We don't remove them here because buildContextMenu will handle that
        }

        await initializeHeaderRules();
        await checkNotificationsPermission();
        await initializeStoredData();
        await initialiseSearchEngines();
        // Ensure PromptCat has defaults on first start/install
        await ensureDefaultPromptCatPrompts();
        await updateAddonStateForActiveTab();

        isInitialized = true;
        if (logToConsole) console.log('Service worker initialization complete.');
    } catch (error) {
        console.error('Error during initialization:', error);
        isInitialized = false; // Ensure we can retry initialization
        throw error; // Re-throw to allow caller to handle
    }
}

// Ensure default PromptCat prompts exist when the prompts library is empty
async function ensureDefaultPromptCatPrompts() {
    try {
        const DB_NAME = 'PromptCatDB';
        const DB_VERSION = 2; // must match scripts/promptcat.js

        const openDB = () =>
            new Promise((resolve, reject) => {
                const req = indexedDB.open(DB_NAME, DB_VERSION);
                req.onupgradeneeded = (e) => {
                    const db = e.target.result;
                    if (!db.objectStoreNames.contains('prompts')) db.createObjectStore('prompts', { keyPath: 'id' });
                    if (!db.objectStoreNames.contains('folders')) db.createObjectStore('folders', { keyPath: 'id' });
                    if (!db.objectStoreNames.contains('globalTags')) db.createObjectStore('globalTags', { keyPath: 'id' });
                    if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
                };
                req.onsuccess = (e) => resolve(e.target.result);
                req.onerror = () => reject(new Error('Failed to open PromptCatDB'));
            });

        const db = await openDB();

        // Count prompts
        const count = await new Promise((resolve) => {
            const tx = db.transaction('prompts', 'readonly');
            const store = tx.objectStore('prompts');
            const req = store.count();
            req.onsuccess = () => resolve(req.result || 0);
            req.onerror = () => resolve(0);
        });

        if (count > 0) {
            if (logToConsole) console.log(`[PromptCat] Library already has ${count} prompt(s); skipping defaults.`);
            return false;
        }

        // Fetch defaults from packaged JSON
        const url = browser.runtime.getURL('defaultPromptcatPrompts.json');
        const resp = await fetch(url);
        if (!resp.ok) {
            if (logToConsole) console.warn(`[PromptCat] Failed to fetch default prompts: HTTP ${resp.status}`);
            return false;
        }
        const defaults = await resp.json();
        const prompts = Array.isArray(defaults?.prompts) ? defaults.prompts : [];
        const folders = Array.isArray(defaults?.folders) ? defaults.folders : [];
        const globalTags = Array.isArray(defaults?.globalTags) ? defaults.globalTags : [];

        if (prompts.length === 0 && folders.length === 0 && globalTags.length === 0) {
            if (logToConsole) console.log('[PromptCat] Defaults JSON is empty; nothing to import.');
            return false;
        }

        // Insert defaults in a single transaction
        await new Promise((resolve, reject) => {
            const tx = db.transaction(['prompts', 'folders', 'globalTags'], 'readwrite');
            const promptStore = tx.objectStore('prompts');
            const folderStore = tx.objectStore('folders');
            const tagStore = tx.objectStore('globalTags');

            // Normalize and insert prompts
            for (const p of prompts) {
                const now = Date.now();
                const normalized = {
                    id: typeof p.id === 'number' ? p.id : now,
                    title: p.title || 'Untitled Prompt',
                    body: p.body || '',
                    notes: p.notes || '',
                    tags: Array.isArray(p.tags) ? p.tags : [],
                    folderId: p.folderId ?? null,
                    isFavorite: !!p.isFavorite,
                    isLocked: !!p.isLocked,
                    dateCreated: typeof p.dateCreated === 'number' ? p.dateCreated : now,
                    dateModified: typeof p.dateModified === 'number' ? p.dateModified : now,
                };
                promptStore.put(normalized);
            }

            // Insert folders if any
            for (const f of folders) {
                if (f && typeof f.id !== 'undefined') folderStore.put(f);
            }

            // Insert tags as { id: tag }
            for (const t of globalTags) {
                if (t) tagStore.put({ id: t });
            }

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(new Error('Failed importing default PromptCat data'));
        });

        if (logToConsole) console.log(`[PromptCat] Imported ${prompts.length} default prompt(s).`);
        return true;
    } catch (err) {
        console.error('[PromptCat] Error ensuring default prompts:', err);
        return false;
    }
}

// Check if notifications are enabled
async function checkNotificationsPermission() {
    if (logToConsole) console.log('Checking notifications permission...');
    notificationsEnabled = await browser.permissions.contains({
        permissions: ['notifications'],
    });
    await setStoredData(STORAGE_KEYS.NOTIFICATIONS_ENABLED, notificationsEnabled);
    if (logToConsole) console.log(`${notificationsEnabled ? 'Notifications enabled.' : 'Notifications disabled.'}`);
}

// Fetches a favicon for the new search engine
async function addNewSearchEngine(id, domain) {
    // Add a favicon to the search engine except if it's a separator or a folder
    if (!id.startsWith('separator-')) {
        const favicon = await getNewFavicon(id, domain);
        searchEngines[id]['imageFormat'] = favicon.imageFormat;
        searchEngines[id]['base64'] = favicon.base64;
    }
    searchEngines['root']['children'].push(id);
    // Save the search engine to local storage
    await setStoredData(STORAGE_KEYS.SEARCH_ENGINES, searchEngines);
    await buildContextMenu();
    if (notificationsEnabled) notify(notifySearchEngineAdded);
    return { searchEngine: searchEngines[id] };
}

async function handlePageAction(tab) {
    try {
        const message = { action: 'getSearchEngine', data: '' };
        const response = await sendMessageToTab(tab, message);
        if (logToConsole) console.log(response);
        if (response.action === 'addSearchEngine') {
            const id = response.data.id;
            const searchEngine = response.data.searchEngine;
            const domain = getDomain(searchEngine.url);
            searchEngines[id] = searchEngine;
            await addNewSearchEngine(id, domain);
        } else if (notificationsEnabled) notify(notifySearchEngineNotFound);
    } catch (error) {
        if (logToConsole) console.error('Error handling page action:', error);
    }
}

async function initialiseSearchEngines() {
    if (logToConsole) console.log('Initializing search engines...');
    try {
        let flagSaveSearchEngines = false;
        // Check for search engines in local storage
        searchEngines = (await getStoredData(STORAGE_KEYS.SEARCH_ENGINES)) || {};

        if (!searchEngines || isEmpty(searchEngines) || options.forceSearchEnginesReload) {
            // Load default search engines if force reload is set or if no search engines are stored in local storage
            await loadDefaultSearchEngines(DEFAULT_SEARCH_ENGINES);
            flagSaveSearchEngines = true;
        }

        await initSearchEngines(flagSaveSearchEngines);
        if (logToConsole) console.log('Search engines initialization complete');
    } catch (error) {
        console.error('Error initializing search engines:', error);
        throw error;
    }
}

async function initSearchEngines(flagSaveSearchEngines) {
    // Add root folder if missing
    if (!searchEngines.root) addRootFolderToSearchEngines();

    // Set default keyboard shortcuts to '' if they're undefined
    setKeyboardShortcuts();

    // Get favicons as base64 strings
    await getFaviconsAsBase64Strings();

    // If the contents of searchEngines have changed, save search engines to local storage
    if (flagSaveSearchEngines) {
        await saveSearchEnginesToLocalStorage();
    }

    // Always rebuild context menu after successful initialization
    await buildContextMenu();
}

function addRootFolderToSearchEngines() {
    searchEngines['root'] = {
        index: 0,
        name: 'Root',
        isFolder: true,
        children: [],
    };
    const n = Object.keys(searchEngines).length;
    for (let i = 0; i < n; i++) {
        for (let id in searchEngines) {
            if (id === 'root') continue;
            if (searchEngines[id]['index'] === i) {
                searchEngines['root']['children'].push(id);
                if (searchEngines[id]['isFolder'] === undefined) searchEngines[id]['isFolder'] = false;
            }
        }
    }
}

function setKeyboardShortcuts() {
    for (let id in searchEngines) {
        if (id === 'root' || id.startsWith('separator-')) continue;
        if (searchEngines[id].keyboardShortcut === undefined) {
            searchEngines[id]['keyboardShortcut'] = '';
            if (logToConsole) {
                console.log(`No keyboard shortcut has been set for search engine: ${searchEngines[id].name}`);
            }
        }
    }
}

async function saveOptions(blnBuildContextMenu) {
    try {
        await setStoredData(STORAGE_KEYS.OPTIONS, options);
        if (logToConsole) console.log(options);
        if (blnBuildContextMenu) await buildContextMenu();
        if (logToConsole) console.log('Successfully saved the options to local storage.');
    } catch (err) {
        if (logToConsole) {
            console.error(err);
            console.log('Failed to save options to local storage.');
        }
    }
}

/// Load default list of search engines
async function loadDefaultSearchEngines(jsonFile) {
    let reqHeader = new Headers();
    reqHeader.append('Content-Type', 'application/json');
    const initObject = {
        method: 'GET',
        headers: reqHeader,
    };
    let userRequest = new Request(jsonFile, initObject);
    try {
        const response = await fetch(userRequest);
        if (!response.ok) {
            const message = `The search engines could not be loaded. An error has occured: ${response.status}`;
            throw new Error(message);
        }
        const json = await response.json();
        searchEngines = json;
        if (notificationsEnabled) notify(notifySearchEnginesLoaded);
        if (logToConsole) console.log('Default search engines loaded.');
    } catch (error) {
        if (logToConsole) console.error(error.message);
    }
}

// Function to notify options pages when search engines are updated
async function notifyOptionsPages() {
    try {
        // Get all tabs
        const tabs = await browser.tabs.query({});

        // Find tabs with options.html
        const optionsTabs = tabs.filter((tab) => tab.url && tab.url.includes('options.html'));

        // Send message to each options tab
        for (const tab of optionsTabs) {
            try {
                await browser.tabs.sendMessage(tab.id, {
                    action: 'searchEnginesUpdated',
                });
                if (logToConsole) {
                    console.log('Notified options page in tab:', tab.id);
                }
            } catch (error) {
                // Tab might be closed or not ready to receive messages
                if (logToConsole) {
                    console.log('Could not notify options tab:', tab.id, error.message);
                }
            }
        }
    } catch (error) {
        if (logToConsole) {
            console.error('Error notifying options pages:', error);
        }
    }
}

async function saveSearchEnginesToLocalStorage() {
    if (logToConsole) {
        console.log('Saving search engines to local storage...');
    }

    try {
        // Save search engines to local storage
        await setStoredData(STORAGE_KEYS.SEARCH_ENGINES, searchEngines);
        if (logToConsole) {
            console.log('Search engines have been successfully saved to local storage.');
        }

        // Notify options pages about the update
        await notifyOptionsPages();
    } catch (error) {
        if (logToConsole) {
            console.error(error.message);
            console.log('Failed to save the search engines to local storage.');
        }
    }
}

/// Fetch and store favicon image format and base64 representation to searchEngines
async function getFaviconsAsBase64Strings() {
    if (logToConsole) console.log('Fetching missing favicons..');
    let arrayOfPromises = [];

    for (let id in searchEngines) {
        // If search engine is a separator or the root folder, skip it
        if (id.startsWith('separator-') || id === 'root') continue;

        // Fetch a new favicon only if there is no existing favicon or if a favicon reload is being forced
        if (!searchEngines[id].base64 || !searchEngines[id].imageFormat || options.forceFaviconsReload) {
            let domain;
            if (!(id.startsWith('chatgpt-') || searchEngines[id].isFolder)) {
                const seUrl = searchEngines[id].url;
                domain = getDomain(seUrl);
                if (logToConsole) {
                    console.log('id: ' + id);
                    console.log('url: ' + seUrl);
                    console.log('Getting favicon for ' + domain);
                }
            }
            arrayOfPromises.push(await getNewFavicon(id, domain));
        }
    }

    if (arrayOfPromises.length > 0) {
        // values is an array of {id:, imageFormat:, base64:}
        const values = await Promise.all(arrayOfPromises).catch((err) => {
            if (logToConsole) {
                console.error(err);
                console.log('Not ALL the favcions could be fetched.');
            }
            return;
        });
        if (logToConsole) console.log('ALL promises have completed.');
        if (values === undefined) return;
        for (let value of values) {
            if (logToConsole) {
                console.log('================================================');
                console.log('id is ' + value.id);
                console.log('------------------------------------------------');
                console.log('image format is ' + value.imageFormat);
                console.log('------------------------------------------------');
                console.log('base64 string is ' + value.base64);
                console.log('================================================');
            }
            searchEngines[value.id]['imageFormat'] = value.imageFormat;
            searchEngines[value.id]['base64'] = value.base64;
        }
        if (logToConsole) console.log('The favicons have ALL been fetched.');
    }
}

async function getNewFavicon(id, domain) {
    if (id.startsWith('chatgpt-')) {
        const aiProvider = searchEngines[id].aiProvider;
        return getFaviconForPrompt(id, aiProvider);
    }
    if (searchEngines[id].isFolder) {
        const imageFormat = 'image/png';
        const b64 = base64FolderIcon;
        if (logToConsole) console.log(id, imageFormat, b64);
        return { id: id, imageFormat: imageFormat, base64: b64 };
    }
    // First try to get favicon from DDG
    let reqHeader = new Headers();
    reqHeader.append('Content-Type', 'text/plain; charset=UTF-8');
    const initObject = {
        method: 'GET',
        headers: reqHeader,
    };
    const url = domain.replace('https://', '').replace('http://', '');
    const userRequest = new Request(ddgUrl + url + '.ico', initObject);
    try {
        const response = await fetch(userRequest);
        if (logToConsole) console.log(response);
        if (!response.ok) {
            if (logToConsole) console.log('Failed to retrieve favicon from DuckDuckGo, proceeding with Horse Icon.');
            return await getFaviconFromHorseIcon(id, domain);
        }
        // Check Content-Type header
        const contentType = response.headers.get('Content-Type');

        // Convert response to Blob
        const blob = await response.blob();

        // Convert Blob to Base64 using a Promise
        const base64data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const fullBase64data = reader.result;
                const base64part = fullBase64data.split(',')[1];
                if (logToConsole) console.log(contentType);
                if (logToConsole) console.log(base64part);
                resolve(base64part); // Resolve the promise with the base64 data
            };
            reader.onerror = (error) => {
                reject(error); // Reject the promise on error
            };
        });

        // Return the result object
        return { id: id, imageFormat: contentType, base64: base64data };
    } catch (error) {
        if (logToConsole) console.log('Failed to retrieve new favicon.', error.message);

        // Failed to retrieve a favicon from DDG, proceeding with Google Cloud hosted API
        return await getFaviconFromHorseIcon(id, domain);
    }
}

// Get favicon from Horse Icon
async function getFaviconFromHorseIcon(id, domain) {
    domain = domain.replace('https://', '').replace('http://', '');
    const url = horseIconUrl + domain;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const message = `Failed to fetch the favicon from Horse Icon. An error has occured: ${response.status}`;
            throw new Error(message);
        }
        const contentType = response.headers.get('Content-Type');
        const blob = await response.blob();
        const base64data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const fullBase64data = reader.result;
                const base64part = fullBase64data.split(',')[1];
                if (logToConsole) console.log(contentType);
                if (logToConsole) console.log(base64part);
                resolve(base64part);
            };
            reader.onerror = (error) => {
                reject(error);
            };
        });
        return { id: id, imageFormat: contentType, base64: base64data };
    } catch (error) {
        if (logToConsole) console.log('Failed to retrieve new favicon.', error.message);
        return { id: id, imageFormat: 'image/png', base64: base64ContextSearchIcon };
    }
}

function getFaviconForPrompt(id, aiProvider) {
    let imageFormat, b64;
    switch (aiProvider) {
        case 'chatgpt':
            imageFormat = 'image/png';
            b64 = base64chatGPT;
            break;
        case 'google':
        case 'gemini':
        case 'google-ai-studio':
            imageFormat = 'image/svg+xml';
            b64 = base64GoogleAIStudio;
            break;
        case 'grok':
            imageFormat = 'image/png';
            b64 = base64Grok;
            break;
        case 'perplexity':
            imageFormat = 'image/png';
            b64 = base64perplexity;
            break;
        case 'llama31':
        case 'poe':
            imageFormat = 'image/png';
            b64 = base64poe;
            break;
        case 'claude':
            imageFormat = 'image/png';
            b64 = base64claude;
            break;
        case 'andi':
            imageFormat = 'image/png';
            b64 = base64andi;
            break;
        default:
            imageFormat = 'image/svg+xml';
            b64 = base64ContextSearchIcon;
    }
    return { id: id, imageFormat: imageFormat, base64: b64 };
}

// Simple menu click handler
async function menuClickHandler(info, tab) {
    try {
        markActivity(); // Track service worker activity

        if (logToConsole) console.log('Menu click handler started for: ', info.menuItemId);

        // Special case for options page
        if (info.menuItemId === 'cs-options') {
            browser.runtime.openOptionsPage().catch((err) => {
                console.error('Failed to open options page:', err);
                // Try an alternative method
                browser.tabs.create({ url: browser.runtime.getURL('/html/options.html') });
            });
            return;
        }

        // Handle subscription status menu item
        if (info.menuItemId === 'subscription-status') {
            openSubscriptionStatusPopup();
            return;
        }

        // Ensure service worker is properly initialized before proceeding
        if (!isInitialized || isEmpty(searchEngines) || !hasClickListener()) {
            if (logToConsole) console.log('Service worker not properly initialized, reinitializing now');

            // Force re-initialization to ensure proper state
            isInitialized = false;

            try {
                await init();
                if (logToConsole) console.log('Service worker reinitialized successfully');
            } catch (err) {
                console.error('Error reinitializing service worker:', err);
                return;
            }
        }

        if (paid || trialActive) {
            // Proceed with normal handling
            await handleMenuClick(info, tab);
        }
    } catch (err) {
        console.error('Error in menu click handler:', err);
    }
}

async function handleMenuClick(info, tab) {
    try {
        const browser_type = getBrowserType();
        const multisearch = info.menuItemId.endsWith('-multisearch') || info.menuItemId === 'cs-multitab';

        if (logToConsole) console.log(`Handling menu click for ${info.menuItemId}, using ${browser_type} browser in ${options.tabMode} mode`);

        // For Chrome side panel, we need to open it immediately while in user gesture context
        // before any async operations that could break the gesture context
        if (options.tabMode === 'openSidebar' && !multisearch) {
            if (browser_type === 'chrome' && chrome.sidePanel) {
                if (logToConsole) console.log('Opening the side panel immediately.');
                try {
                    // Set up and open the side panel synchronously within user gesture
                    chrome.sidePanel.setOptions({
                        path: 'html/sidebar.html',
                        enabled: true,
                    });

                    chrome.sidePanel.open({
                        tabId: tab.id,
                        windowId: tab.windowId,
                    });

                    if (logToConsole) console.log('Chrome side panel opened successfully.');
                } catch (error) {
                    console.error('Error opening Chrome side panel:', error);
                }
            } else if (browser_type === 'firefox') {
                if (logToConsole) console.log('Opening the Firefox sidebar.');
                try {
                    // Open sidebar synchronously to preserve user gesture context
                    browser.sidebarAction.open();
                    if (logToConsole) console.log('Firefox sidebar opened successfully.');
                } catch (error) {
                    console.error('Error opening Firefox sidebar:', error);
                    // Still try to process search even if sidebar fails
                    processSearch(info, tab);
                }
            }
        } else {
            // Handle non-sidebar mode: close sidebar if open
            try {
                if (browser_type === 'firefox') {
                    if (logToConsole) console.log('Closing the sidebar.');
                    browser.sidebarAction.close();
                } else if (browser_type === 'chrome' && chrome.sidePanel) {
                    chrome.sidePanel.setOptions({
                        enabled: false,
                    });
                }
            } catch (error) {
                console.error('Error closing browser panel:', error);
            }
        }

        // Now we can safely do async operations
        // Ensure we have the latest selection data from storage
        selection = (await getStoredData(STORAGE_KEYS.SELECTION)) || '';

        if (options.tabMode === 'openSidebar' && !multisearch) {
            // Handle subsequent operations asynchronously
            setBrowserPanel()
                .then(() => {
                    processSearch(info, tab);
                })
                .catch((error) => {
                    console.error('Error setting browser panel:', error);
                    processSearch(info, tab);
                });
        } else {
            // Process search directly
            await processSearch(info, tab);
        }
    } catch (error) {
        console.error('Unexpected error in handleMenuClick:', error);
    }
}

function addClickListener() {
    try {
        // Remove any existing listener to prevent duplicates
        removeClickListener();

        // Add the click listener
        browser.contextMenus.onClicked.addListener(menuClickHandler);
        clickListenerCounter++; // Increment the counter

        if (logToConsole) console.log(`Context menu click listener added successfully. Total listeners: ${clickListenerCounter}`);
    } catch (error) {
        console.error('Error adding context menu click listener:', error);
        // Do not decrement counter here as removeClickListener was already called
    }
}

function removeClickListener() {
    try {
        browser.contextMenus.onClicked.removeListener(menuClickHandler);
        if (clickListenerCounter > 0) {
            clickListenerCounter--; // Decrement the counter only if it's greater than 0
        }
        if (logToConsole) console.log(`Context menu click listener removed. Remaining listeners: ${clickListenerCounter}`);
    } catch (error) {
        console.error('Error removing context menu click listener:', error);
        // We don't modify the counter here because the operation failed
    }
}

// Add a method that can be called via the browser console to check for listeners
// This is useful for debugging
function debugListenerStatus() {
    if (logToConsole) {
        console.log(`Click listener count from counter: ${clickListenerCounter}`);

        if (isFirefox && typeof browser.contextMenus.onClicked.hasListener === 'function') {
            const hasListener = browser.contextMenus.onClicked.hasListener(menuClickHandler);
            console.log(`menuClickHandler registered according to Firefox API: ${hasListener}`);

            if (clickListenerCounter > 0 !== hasListener) {
                console.warn(`Warning: Mismatch between clickListenerCounter (${clickListenerCounter}) and actual listener status (${hasListener})`);

                if (clickListenerCounter > 0 && !hasListener) {
                    console.warn('The counter says listeners exist, but Firefox says none are registered.');
                    console.warn('This could indicate that listeners were not properly removed or the counter was not properly decremented.');
                } else if (clickListenerCounter === 0 && hasListener) {
                    console.warn('Firefox reports a listener is registered, but the counter is 0.');
                    console.warn('This could indicate that a listener was added without incrementing the counter.');
                }
            }
        }
    }

    // Try to estimate actual listener count for Firefox
    let estimatedListenerCount = 0;
    if (isFirefox && typeof browser.contextMenus.onClicked.hasListener === 'function') {
        if (browser.contextMenus.onClicked.hasListener(menuClickHandler)) {
            // At least one listener exists, but we can't tell how many
            // The count in clickListenerCounter might be more accurate
            estimatedListenerCount = Math.max(1, clickListenerCounter);
        }
    }

    return {
        clickListenerCount: clickListenerCounter,
        estimatedActualListeners: isFirefox ? estimatedListenerCount : 'Unknown (only detectable in Firefox)',
        isFirefox,
        hasFirefoxCheck: isFirefox && typeof browser.contextMenus.onClicked.hasListener === 'function',
        menuHandlerRegistered:
            isFirefox && typeof browser.contextMenus.onClicked.hasListener === 'function'
                ? browser.contextMenus.onClicked.hasListener(menuClickHandler)
                : 'Unknown (only detectable in Firefox)',
    };
}

// Check if any click listeners are currently registered
function hasClickListener() {
    // The simplest approach is to check our tracking variable
    return clickListenerCounter > 0;
}

// Make debugging functions available to the browser console
// This allows them to be called from the console like: browser.runtime.getBackgroundPage().then(bg => bg.debugListenerStatus())
globalThis.debugListenerStatus = debugListenerStatus;
globalThis.hasClickListener = hasClickListener;
globalThis.clearAllOpenSearchCache = clearAllOpenSearchCache;

// === PromptCatDB minimal writer: save prompts from content pages ===
async function savePromptToPromptCat({ title, body, notes = '', tags = [], folderName = null, isFavorite = false, sourceUrl = '' }) {
    // Open (or create) the PromptCatDB database and stores if missing
    const DB_NAME = 'PromptCatDB';
    const DB_VERSION = 2; // must match promptcat.js
    const openDB = () =>
        new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('prompts')) db.createObjectStore('prompts', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('folders')) db.createObjectStore('folders', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('globalTags')) db.createObjectStore('globalTags', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
            };
            req.onsuccess = (e) => resolve(e.target.result);
            req.onerror = () => reject(new Error('Failed to open PromptCatDB'));
        });

    const db = await openDB();

    // Optionally create/find a folder by name
    let folderId = null;
    if (folderName) {
        const tx = db.transaction('folders', 'readwrite');
        const store = tx.objectStore('folders');
        const getAllReq = store.getAll();
        const existing = await new Promise((resolve) => {
            getAllReq.onsuccess = (e) => resolve(e.target.result || []);
            getAllReq.onerror = () => resolve([]);
        });
        const found = existing.find((f) => f.name === folderName);
        if (found) folderId = found.id;
        else {
            const newFolder = { id: Date.now(), name: folderName, isLocked: false };
            store.put(newFolder);
            folderId = newFolder.id;
            await new Promise((res) => (tx.oncomplete = () => res()));
        }
    }

    // Build prompt object
    const now = Date.now();
    const id = now; // simple unique id
    const prompt = {
        id,
        title: title || 'Untitled Prompt',
        body: body || '',
        notes: notes || sourceUrl || '',
        tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
        folderId: folderId,
        isFavorite: !!isFavorite,
        isLocked: false,
        dateCreated: now,
        dateModified: now,
    };

    // Persist prompt
    await new Promise((resolve, reject) => {
        const tx = db.transaction('prompts', 'readwrite');
        tx.objectStore('prompts').put(prompt);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(new Error('Failed to save prompt'));
    });

    return id;
}

/// Functions used to build the context menu
async function createMenuItem(id, title, contexts, parentId, faviconUrl) {
    const menuItem = {
        id: 'cs-' + (id === parentId ? id + '-multisearch' : id),
        title: title,
        contexts: contexts,
    };

    if (parentId !== 'root') {
        menuItem.parentId = 'cs-' + parentId;
    }

    if (options.displayFavicons === true && isFirefox) {
        menuItem.icons = { 20: faviconUrl };
    }

    await contextMenus.create(menuItem);
}

// Build a single context menu item
async function buildContextMenuItem(id, parentId) {
    if (id.startsWith('separator-')) {
        const separatorItem = {
            id: 'cs-' + id,
            type: 'separator',
            contexts: ['selection'],
        };
        if (parentId !== 'root') {
            separatorItem.parentId = 'cs-' + parentId;
        }
        await contextMenus.create(separatorItem);
        return;
    }

    const searchEngine = searchEngines[id];
    if (!searchEngine || !(searchEngine.show || searchEngine.isFolder)) return;

    const title = searchEngine.name;
    const imageFormat = searchEngine.imageFormat;
    const base64String = searchEngine.base64;
    const faviconUrl = `data:${imageFormat};base64,${base64String}`;

    // Determine context: use "all" for links or folders containing links, "selection" for others
    let contexts;
    if (id.startsWith('link-')) {
        contexts = ['all'];
    } else if (searchEngine.isFolder && searchEngine.children) {
        // Check if folder contains any bookmark links
        const hasBookmarks = searchEngine.children.some((childId) => childId.startsWith('link-'));
        contexts = hasBookmarks ? ['all'] : ['selection'];
    } else {
        contexts = ['selection'];
    }

    if (searchEngine.isFolder) {
        await createMenuItem(id, title, contexts, parentId, faviconUrl);
        if (id !== 'root' && id !== 'bookmark-page' && id !== 'add-search-engine') {
            await createMenuItem(id, 'Multisearch', contexts, id, faviconUrl);
        }
        for (let child of searchEngine.children) {
            await buildContextMenuItem(child, id);
        }
    } else {
        await createMenuItem(id, title, contexts, parentId, faviconUrl);
    }
}

// Build the options context menu
async function buildContextOptionsMenu() {
    if (options.optionsMenuLocation === 'bottom') {
        await contextMenus.create({
            id: 'cs-separator-bottom',
            type: 'separator',
            contexts: ['all'],
        });
    }

    await contextMenus.create({
        id: 'cs-match',
        type: 'checkbox',
        title: titleExactMatch,
        contexts: ['all'],
        checked: options.exactMatch,
    });

    await contextMenus.create({
        id: 'cs-multitab',
        title: titleMultipleSearchEngines,
        contexts: ['selection'],
    });

    // Only show AI search option if not disabled
    if (!options.disableAI) {
        await contextMenus.create({
            id: 'cs-ai-search',
            title: titleAISearch + '...',
            contexts: ['editable', 'frame', 'page', 'selection'],
        });
    }

    await contextMenus.create({
        id: 'cs-site-search',
        title: `${titleSiteSearch} ${options.siteSearch}`,
        contexts: ['selection'],
    });

    await contextMenus.create({
        id: 'cs-options',
        title: titleOptions + '...',
        contexts: ['all'],
    });

    if (options.optionsMenuLocation === 'top') {
        await contextMenus.create({
            id: 'cs-separator-top',
            type: 'separator',
            contexts: ['all'],
        });
    }
}

// Build the context menu for image searches
async function buildContextMenuForImages() {
    await contextMenus.create({
        id: 'cs-bing-image-search',
        title: 'Bing Image Search',
        contexts: ['image'],
    });

    await contextMenus.create({
        id: 'cs-reverse-image-search',
        title: 'Google Reverse Image Search',
        contexts: ['image'],
    });

    await contextMenus.create({
        id: 'cs-google-lens',
        title: 'Google Lens',
        contexts: ['image'],
    });

    await contextMenus.create({
        id: 'cs-tineye',
        title: 'TinEye',
        contexts: ['image'],
    });
}

/// End of functions for building the context menu

// Build the context menu using the search engines from local storage
async function buildContextMenu() {
    // Prevent concurrent menu creation
    if (menuCreationInProgress) {
        if (logToConsole) console.log('Menu creation already in progress, skipping...');
        return;
    }

    const MAX_RETRIES = 3;
    let retryCount = 0;
    let success = false;

    while (!success && retryCount < MAX_RETRIES) {
        try {
            menuCreationInProgress = true;
            if (logToConsole) console.log(`Building context menu (attempt ${retryCount + 1})...`);

            // First, remove any click listeners to prevent orphaned listeners
            if (clickListenerCounter > 0) {
                if (logToConsole) console.log(`Removing ${clickListenerCounter} click listeners before rebuilding menu`);
                // Reset listener count and remove listener
                while (clickListenerCounter > 0) {
                    removeClickListener();
                }
            }

            // Remove all existing context menu items and wait for completion
            await contextMenus.removeAll();

            const rootChildren = searchEngines['root']?.children || [];
            if (logToConsole) console.log('Root children:', rootChildren);

            // Create menus in sequence
            if (options.optionsMenuLocation === 'top') {
                await buildContextOptionsMenu();
            }

            // Build root menu items
            for (let id of rootChildren) {
                await buildContextMenuItem(id, 'root');
            }

            await buildContextMenuForImages();

            if (options.optionsMenuLocation === 'bottom') {
                await buildContextOptionsMenu();
            }

            await buildActionButtonMenus();

            // Add listener for context menu clicks
            addClickListener();

            success = true;
            if (logToConsole) console.log('Context menu built successfully');
        } catch (error) {
            retryCount++;
            console.error(`Error building context menu (attempt ${retryCount}):`, error);

            // Wait a moment before retrying
            if (retryCount < MAX_RETRIES) {
                await new Promise((resolve) => setTimeout(resolve, 500 * retryCount));
            }
        } finally {
            if (success || retryCount >= MAX_RETRIES) {
                menuCreationInProgress = false;
            }
        }
    }

    if (!success) {
        console.error(`Failed to build context menu after ${MAX_RETRIES} attempts`);
        // Reset the creation flag so future attempts can be made
        menuCreationInProgress = false;
    }
}

async function removeMenuItemIfExists(menuItemId) {
    try {
        // Try to remove the menu item directly
        await browser.contextMenus.remove(menuItemId);
        if (logToConsole) console.debug(`Successfully removed menu item: ${menuItemId}`);
    } catch (e) {
        // Silently handle the error if the item doesn't exist
        // This is expected behavior for first-time runs or when items don't exist
    }
}

// Build the action button menus
async function buildActionButtonMenus() {
    const bookmarkMenuItem = {
        id: 'bookmark-page',
        title: bookmarkPage,
        contexts: ['action'],
    };

    if (isFirefox) {
        bookmarkMenuItem.icons = { 16: '/icons/bookmark-grey-icon.svg' };
    }

    // Remove the existing menu item first to prevent duplicate ID errors
    await removeMenuItemIfExists('bookmark-page');

    await contextMenus.create(bookmarkMenuItem);

    const searchEngineMenuItem = {
        id: 'add-search-engine',
        title: addSearchEngine,
        contexts: ['action'],
        visible: false, // Initially hidden
    };

    if (isFirefox) {
        searchEngineMenuItem.icons = { 16: '/icons/search-icon.png' };
    }

    // Remove the existing menu item first to prevent duplicate ID errors
    await removeMenuItemIfExists('add-search-engine');

    await contextMenus.create(searchEngineMenuItem);

    //await buildSubscriptionStatusMenuItem();
}

async function buildSubscriptionStatusMenuItem() {
    // Add subscription status menu item
    const subscriptionStatusMenuItem = {
        id: 'subscription-status',
        title: subscriptionStatus,
        contexts: ['action'],
    };

    if (isFirefox) {
        subscriptionStatusMenuItem.icons = { 16: '/icons/subscription-status-icon.png' };
    }

    // Remove the existing menu item first to prevent duplicate ID errors
    await removeMenuItemIfExists('subscription-status');

    await contextMenus.create(subscriptionStatusMenuItem);
}

// Perform search based on selected search engine, i.e. selected context menu item
async function processSearch(info, tab) {
    try {
        if (logToConsole) console.log('Processing search with menu item:', info.menuItemId);

        const currentWindow = await browser.windows.getCurrent({ populate: true });
        const multisearch = info.menuItemId.endsWith('-multisearch') || info.menuItemId === 'cs-multitab';
        let id = info.menuItemId.startsWith('cs-') ? info.menuItemId.replace('cs-', '') : info.menuItemId;

        if (info.selectionText) {
            // Ask the content script to visually trim the selection (so the page selection matches the text we store)
            try {
                const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
                if (activeTab && activeTab.id !== undefined) {
                    const resp = await browser.tabs.sendMessage(activeTab.id, { action: 'trimVisibleSelection' });
                    const maybeTrimmed = resp && resp.trimmed;
                    if (typeof maybeTrimmed === 'string' && maybeTrimmed.length > 0) {
                        await setStoredData(STORAGE_KEYS.SELECTION, maybeTrimmed);
                    } else {
                        // Fallback: trim trailing whitespace and non-breaking spaces before storing selection
                        const cleaned = typeof info.selectionText === 'string' ? info.selectionText.replace(/[\s\u00A0]+$/u, '') : info.selectionText;
                        await setStoredData(STORAGE_KEYS.SELECTION, cleaned);
                    }
                }
            } catch (e) {
                // If messaging fails, fallback to local trim
                const cleaned = typeof info.selectionText === 'string' ? info.selectionText.replace(/[\s\u00A0]+$/u, '') : info.selectionText;
                await setStoredData(STORAGE_KEYS.SELECTION, cleaned);
            }
        }

        // By default, open the search results right after the active tab
        let tabIndex = tab.index + 1;

        // If search engines are set to be opened after the last tab, then adjust the tabIndex
        if (options.multiMode === 'multiAfterLastTab' || (options.tabMode === 'openNewTab' && options.lastTab)) {
            tabIndex = currentWindow.tabs.length;
        }
        if (logToConsole) console.log('Active tab (index, title):', tabIndex - 1, tab.title);

        // If the selected search engine is a folder, process it as a multisearch
        if (id.endsWith('-multisearch')) {
            id = id.replace('-multisearch', '');
            await processMultisearch([], id, tabIndex);
            return;
        }
        if (id === 'bookmark-page') {
            await toggleBookmark();
            return;
        }
        if (id === 'add-search-engine') {
            await handlePageAction(tab);
            return;
        }
        if (id === 'subscription-status') {
            await openSubscriptionStatusPopup();
            return;
        }
        if (id === 'options') {
            await browser.runtime.openOptionsPage();
            return;
        }
        if (id === 'multitab') {
            await processMultisearch([], 'root', tabIndex);
            return;
        }
        if (id === 'match') {
            if (logToConsole) console.log(`Preferences retrieved from sync storage: ${JSON.stringify(options)}`);
            options.exactMatch = !options.exactMatch;
            await saveOptions(true);
            return;
        }
        if (id === 'ai-search') {
            // Only open AI search popup if AI features are not disabled
            if (!options.disableAI) {
                await openAISearchPopup(tabIndex);
            }
            return;
        }

        // If search engine is none of the above and not a folder, then perform search
        // The search engine corresponds to an HTTP GET or POST request or an AI prompt
        if (!id.startsWith('separator-')) {
            const hasCurrentSelection = Boolean(info.selectionText);
            await displaySearchResults(id, tabIndex, multisearch, currentWindow.id, '', '', hasCurrentSelection);
        }
    } catch (error) {
        console.error('Error in processSearch function:', error);
    }
}

async function processMultisearch(arraySearchEngineUrls, folderId, tabPosition) {
    let windowInfo = await browser.windows.getCurrent();
    let folderName = '';
    let multisearchArray = [];
    let nonUrlArray = [];
    let postArray = [];
    let aiArray = [];
    let urlArray = [];
    if (folderId !== 'root') folderName = (searchEngines[folderId] && searchEngines[folderId].name) || 'Multi-search';
    let groupStartIndex = null; // Used when grouping in the current window

    // Helper function to log array contents
    const logArrayContents = (label, array) => {
        if (logToConsole) console.log(`${label}:`, array);
    };

    const getSearchEnginesFromFolder = async (folderId) => {
        for (const childId of searchEngines[folderId].children) {
            if (logToConsole) console.log(folderId, childId);
            // If id is for a separator, then skip it
            if (childId.startsWith('separator-')) continue;
            if (searchEngines[childId].isFolder) {
                await getSearchEnginesFromFolder(childId);
            } else if (searchEngines[childId].multitab) {
                if (searchEngines[childId].aiProvider) {
                    // This array will contain id items
                    aiArray.push(childId);
                } else if (searchEngines[childId].formData) {
                    // This array will contain {id, url} items
                    const data = await processSearchEngine(childId, selection);
                    postArray.push(data);
                } else {
                    // This array will contain url items
                    const url = await processSearchEngine(childId, selection);
                    urlArray.push(url);
                }
            }
        }
    };

    if (arraySearchEngineUrls.length > 0) {
        multisearchArray = arraySearchEngineUrls;
        // Split multisearchArray into 2 separate arrays:
        // urlArray for links and search engines using HTTP GET requests; items in multisearchArray corresponding to urls
        // nonUrlArray for AI prompts and search engines using HTTP POST requests; items in multisearchArray starting with 'chatgpt-' and items in multisearchArray saved as {id, url}
        for (let i = 0; i < multisearchArray.length; i++) {
            if (typeof multisearchArray[i] === 'string' && multisearchArray[i].startsWith('http')) {
                urlArray.push(multisearchArray[i]);
            } else if (typeof multisearchArray[i] === 'string' && multisearchArray[i].startsWith('chatgpt-')) {
                aiArray.push(multisearchArray[i]);
            } else if (typeof multisearchArray[i] === 'object' && multisearchArray[i].id && multisearchArray[i].url) {
                postArray.push(multisearchArray[i]);
            }
        }
    } else {
        // Create an array of search engine URLs for all multisearch engines (using HTTP GET requests or AI prompts)
        // If the search engine uses an HTTP POST request, then the array will contain {id, url} for that search engine instead of just a url
        // Sort search results in the order that search engines appear in the options page
        await getSearchEnginesFromFolder(folderId);
    }

    if (logToConsole) console.log('Before concatenation:');
    logArrayContents('urlArray', urlArray);
    logArrayContents('postArray', postArray);
    logArrayContents('aiArray', aiArray);

    // Directly concatenate arrays
    if (logToConsole) console.log('After concatenation:');
    nonUrlArray = joinArrays(postArray, aiArray);
    logArrayContents('nonUrlArray', nonUrlArray);
    multisearchArray = joinArrays(urlArray, nonUrlArray);
    logArrayContents('multisearchArray', multisearchArray);

    // If no search engines are selected, notify the user and exit
    if (notificationsEnabled && isEmpty(multisearchArray)) {
        notify(notifyMissingSearchEngine);
        return;
    }
    if (isEmpty(multisearchArray)) return;

    // Open search results in a new window
    if (options.multiMode === 'multiNewWindow') {
        // Open the window with the first URL (if any), then add the remaining URLs as tabs
        const firstUrl = urlArray.length > 0 ? urlArray[0] : undefined;
        const windowCreateData = {
            focused: options.tabActive,
            incognito: options.multiPrivateMode,
            ...(firstUrl ? { url: firstUrl } : {}),
        };
        if (firstUrl) {
            windowInfo = await browser.windows.create(windowCreateData);
        } else {
            // Create an empty window, we'll add tabs into it
            windowInfo = await browser.windows.create({ focused: options.tabActive, incognito: options.multiPrivateMode });
        }

        const remainingUrls = urlArray.slice(1);
        if (remainingUrls.length > 0) {
            // Start adding after the first tab in the new window
            await openTabsForUrls(remainingUrls, 1, windowInfo.id);
        }

        // Set the tab position in the new window to the last tab (after all GET URLs)
        try {
            const tabsInNewWindow = await browser.tabs.query({ windowId: windowInfo.id });
            tabPosition = tabsInNewWindow.length;
        } catch (e) {
            tabPosition = Math.max(1, urlArray.length);
        }
    } else if (options.multiMode !== 'multiNewWindow') {
        // Open search results in the current window
        const tabs = await queryAllTabs();
        const activeTabs = await browser.tabs.query({ active: true, currentWindow: true });
        const activeTab = activeTabs[0];
        if (logToConsole) console.log(tabs);
        // Capture the starting index where new tabs will be inserted, to group them later
        groupStartIndex = options.multiMode === 'multiAfterLastTab' ? tabs.length : activeTab.index + 1;
        if (options.multiMode === 'multiAfterLastTab') {
            // After the last tab
            tabPosition = tabs.length;
        } else {
            // Right after the active tab
            tabPosition = activeTab.index + 1;
        }
        if (logToConsole) console.log(tabPosition);
        if (urlArray.length > 0) {
            await openTabsForUrls(urlArray, tabPosition);
            tabPosition += urlArray.length;
        }
    }

    // Process the remaining non-URL array of search engines (using HTTP POST requests or AI prompts)
    if (nonUrlArray.length > 0) {
        if (logToConsole) console.log(`Opening HTTP POST requests & AI search results in window ${windowInfo.id} at tab position ${tabPosition}`);
        await processNonUrlArray(nonUrlArray, tabPosition, windowInfo.id);
    }

    // Group tabs into a named tab group where supported
    try {
        if (options.multiMode === 'multiNewWindow') {
            // Group all tabs in the newly created window
            await groupAllTabsInWindow(windowInfo.id, folderName);
        } else {
            const activeTabs = await browser.tabs.query({ active: true, currentWindow: true });
            const currentWindowId = activeTabs[0]?.windowId || (await browser.windows.getCurrent())?.id;
            const totalToGroup = urlArray.length + nonUrlArray.length;
            if (totalToGroup > 0 && groupStartIndex !== null && currentWindowId) {
                await groupTabsByIndices(currentWindowId, groupStartIndex, totalToGroup, folderName);
            }
        }
    } catch (e) {
        if (logToConsole) console.warn('Tab grouping failed or is not supported:', e);
    }
}

function joinArrays(...arrays) {
    return [...new Set(arrays.flat())];
}

async function openTabsForUrls(urls, tabPosition, windowId) {
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const newTabIndex = tabPosition + i;

        try {
            await browser.tabs.create({
                url: url,
                active: false,
                index: newTabIndex,
                ...(windowId ? { windowId } : {}),
            });
        } catch (error) {
            console.error(`Error opening tab for URL ${url}:`, error);
        }
    }
}

// ---- Tab Grouping Helpers ----
async function groupAllTabsInWindow(windowId, title) {
    // Check API support
    if (typeof browser?.tabs?.group !== 'function') return;
    const tabs = await browser.tabs.query({ windowId });
    const tabIds = tabs.map((t) => t.id).filter((id) => typeof id === 'number');
    if (tabIds.length === 0) return;
    const groupId = await browser.tabs.group({ tabIds, createProperties: { windowId } });
    await setGroupTitle(groupId, title);
}

async function groupTabsByIndices(windowId, startIndex, count, title) {
    if (typeof browser?.tabs?.group !== 'function') return;
    const end = startIndex + count;
    const tabs = await browser.tabs.query({ windowId });
    const tabIds = tabs
        .filter((t) => typeof t.index === 'number' && t.index >= startIndex && t.index < end)
        .map((t) => t.id)
        .filter((id) => typeof id === 'number');
    if (tabIds.length === 0) return;
    const groupId = await browser.tabs.group({ tabIds, createProperties: { windowId } });
    await setGroupTitle(groupId, title);
}

async function setGroupTitle(groupId, title) {
    const safeTitle = String(title || '').trim() || 'Multi-search';
    const color = chooseGroupColor(safeTitle);

    // Helper to verify if title is set (where supported)
    const isTitleApplied = async () => {
        try {
            if (typeof browser?.tabGroups?.get === 'function') {
                const group = await browser.tabGroups.get(groupId);
                return (group?.title || '').trim().length > 0;
            }
        } catch (e) {
            // Ignore
            void e; // keep block non-empty for ESLint
        }
        return false;
    };

    if (logToConsole) console.log(typeof browser?.tabGroups?.update === 'function');

    // Try browser.tabGroups.update first (WebExtensions/polyfill path), with color to make it visible
    if (typeof browser?.tabGroups?.update === 'function') {
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                if (logToConsole) console.log(`Setting tab group title to "${safeTitle}" with color "${color}" (attempt ${attempt + 1})`);
                await browser.tabGroups.update(groupId, { title: safeTitle, color });
                if (await isTitleApplied()) return;
            } catch (e) {
                if (logToConsole) console.warn('browser.tabGroups.update failed:', e);
            }
            // Short delay before retrying
            await new Promise((r) => setTimeout(r, 200));
        }
    }

    // Fallback to chrome.tabGroups.update (callback-style)
    if (globalThis.chrome?.tabGroups?.update && typeof globalThis.chrome.tabGroups.update === 'function') {
        await new Promise((resolve) => {
            try {
                globalThis.chrome.tabGroups.update(groupId, { title: safeTitle, color }, () => resolve());
            } catch (e) {
                void e; // keep block non-empty for ESLint
                resolve();
            }
        });
    }
}

function chooseGroupColor(name) {
    const colors = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange'];
    // Simple hash to pick a stable color based on name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = (hash << 5) - hash + name.charCodeAt(i);
        hash |= 0;
    }
    const idx = Math.abs(hash) % colors.length;
    return colors[idx];
}

async function processNonUrlArray(nonUrlArray, tabPosition, windowId) {
    const multisearch = true;
    const n = nonUrlArray.length;
    if (logToConsole) console.log(`Number of items (AI prompts & HTTP POST requests) left to process: ${n}`);
    for (let i = 0; i < n; i++) {
        if (logToConsole) console.log(`Processing item ${i + 1}...`);
        const tabIndex = tabPosition + i;
        if (!nonUrlArray[i].id) {
            // If the search engine is an AI search engine
            const id = nonUrlArray[i];
            await displaySearchResults(id, tabIndex, multisearch, windowId);
            await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
            // If the search engine uses HTTP POST request
            const id = nonUrlArray[i].id;
            const url = nonUrlArray[i].url;
            // Expand rich variables for POST action URL
            const ctx = await getActiveTabTemplateContext();
            targetUrl = expandTemplateString(url, ctx, { urlEncode: false });
            await displaySearchResults(id, tabIndex, multisearch, windowId);
        }
    }
}

// Handle search terms if there are any
async function getSearchEngineUrl(searchEngineUrl, sel) {
    const selection = (sel || '').trim();
    let quote = '';
    if (options.exactMatch) quote = '%22';
    let url = searchEngineUrl;
    // Legacy placeholders remain supported
    if (url.includes('{searchTerms}')) {
        url = url.replace(/{searchTerms}/g, encodeUrl(selection));
    } else if (url.includes('%s')) {
        url = url.replace(/%s/g, encodeUrl(selection));
    } else if (selection) {
        url = url + quote + encodeUrl(selection) + quote;
    }
    // Rich placeholders
    const ctx = await getActiveTabTemplateContext({ selectionOverride: selection });
    url = expandTemplateString(url, ctx, { urlEncode: true });
    return url;
}

async function setTargetUrl(id, aiEngine = '', hasCurrentSelection = true) {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    if (logToConsole) console.log('Active tab is:');
    if (logToConsole) console.log(activeTab);
    if (id === 'reverse-image-search') {
        return googleReverseImageSearchUrl + targetUrl;
    }
    if (id === 'google-lens') {
        return googleLensUrl + targetUrl;
    }
    if (id === 'tineye') {
        return tineyeUrl + '/search?url=' + encodeURIComponent(targetUrl);
    }
    if (id === 'bing-image-search') {
        return bingUrl;
    }
    if (id === 'site-search') {
        let quote = '';
        if (options.exactMatch) quote = '%22';
        const domain = getDomain(activeTab.url).replace(/https?:\/\//, '');
        return options.siteSearchUrl + encodeUrl(`site:https://${domain} ${quote}${selection}${quote}`);
    }
    if (id.startsWith('link-') && !searchEngines[id].url.startsWith('javascript:')) {
        // If there's no current selection, navigate directly to the bookmark URL
        if (!hasCurrentSelection || !selection) {
            return searchEngines[id].url;
        }
        // If there is a current selection, perform site search on the bookmark's domain
        let quote = '';
        if (options.exactMatch) quote = '%22';
        const domain = getDomain(searchEngines[id].url).replace(/https?:\/\//, '');
        return options.siteSearchUrl + encodeUrl(`site:https://${domain} ${quote}${selection.trim()}${quote}`);
    }
    if (!id.startsWith('chatgpt-')) {
        let searchEngineUrl = searchEngines[id].url;
        if (!id.startsWith('link-') && !searchEngines[id].formData) {
            // If the search engine uses HTTP GET
            searchEngineUrl = await getSearchEngineUrl(searchEngineUrl, selection);
            return searchEngineUrl;
        } else {
            // If the search engine uses HTTP POST or is a link
            return searchEngineUrl;
        }
    } else if (id === 'chatgpt-direct') {
        return getAIProviderBaseUrl(aiEngine);
    } else {
        // If the search engine is an AI prompt
        const provider = searchEngines[id].aiProvider;
        return getAIProviderBaseUrl(provider);
    }
}

function getAIProviderBaseUrl(provider) {
    let providerUrl;
    switch (provider) {
        case 'chatgpt':
            providerUrl = chatGPTUrl;
            break;
        case 'google':
        case 'gemini':
        case 'google-ai-studio':
            providerUrl = googleAIStudioUrl;
            break;
        case 'grok':
            providerUrl = grokUrl;
            break;
        case 'perplexity':
            providerUrl = perplexityAIUrl;
            break;
        case 'llama31':
        case 'poe':
            providerUrl = poeUrl;
            break;
        case 'claude':
            providerUrl = claudeUrl;
            break;
        case 'andi':
            providerUrl = andiUrl;
            break;
        default:
            providerUrl = chatGPTUrl;
    }
    return providerUrl;
}

// Display the search results for a single search (link, HTTP POST or GET request, or AI prompt)
async function displaySearchResults(id, tabPosition, multisearch, windowId, aiEngine = '', prompt = '', hasCurrentSelection = true) {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    const searchEngine = searchEngines[id];
    selection = await getStoredData(STORAGE_KEYS.SELECTION);
    imageUrl = targetUrl;
    targetUrl = await setTargetUrl(id, aiEngine, hasCurrentSelection);
    await setStoredData(STORAGE_KEYS.TARGET_URL, targetUrl);
    //const postDomain = getDomain(targetUrl);
    let url = targetUrl;
    if (id.startsWith('chatgpt-')) {
        promptText = await getPromptText(id, prompt);
        if (id !== 'chatgpt-direct') {
            if (searchEngine.aiProvider === 'chatgpt') {
                writeClipboardText(promptText);
            }
        }
    }

    if (logToConsole) console.log(`id: ${id}`);
    if (logToConsole) console.log(`prompt: ${promptText}`);
    if (logToConsole) console.log(`selection: ${selection}`);
    if (logToConsole) console.log(`targetUrl: ${targetUrl}`);

    // Ignore bookmarklets in multi-search
    if (multisearch && id.startsWith('link-') && url.startsWith('javascript:')) return;

    if (id.startsWith('link-') && url.startsWith('javascript:')) {
        // Strip protocol prefix
        url = url.replace('javascript:', '');
        // Legacy replacements
        if (url.includes('%s')) {
            url = url.replace('%s', selection);
        }
        if (url.includes('{searchTerms}')) {
            url = url.replace(/{searchTerms}/g, selection);
        }
        // Rich variable expansion (no URL encoding; raw strings for code)
        try {
            const ctx = await getActiveTabTemplateContext();
            url = expandTemplateString(url, ctx, { urlEncode: false });
        } catch (e) {
            if (logToConsole) console.warn('Failed to expand rich variables in bookmarklet:', e);
        }
        if (logToConsole) console.log(`Code: ${url}`);

        await browser.scripting.executeScript({
            target: { tabId: activeTab.id },
            world: 'MAIN',
            func: function (code) {
                const script = document.createElement('script');
                // Wrap the code in an IIFE using concatenation instead of a template literal
                script.textContent = '(function() {' + code + '})();';
                document.documentElement.appendChild(script);
                script.remove();
            },
            args: [url],
        });
        return;
    }

    if (logToConsole && searchEngine) console.log(`Opening tab at index ${tabPosition} for ${searchEngine.name} at ${url} in window ${windowId}`);

    if (!multisearch && options.tabMode === 'openSidebar') {
        const suffix = id === 'reverse-image-search' || id === 'google-lens' || id === 'tineye' || id.startsWith('chatgpt-') ? '' : '#_sidebar';
        if (suffix && url === getDomain(url)) {
            url += '/';
        }
        const tabUrl = url + suffix;

        if (logToConsole) console.log(tabUrl);

        // If single search and open in sidebar
        await setBrowserPanel(tabUrl);
    } else if (!multisearch && options.tabMode === 'openNewWindow') {
        // If single search and open in new window
        // If search engine is link, uses HTTP GET or POST request or is AI prompt
        if (logToConsole) console.log(`Make new tab or window active: ${options.tabActive}`);
        await browser.windows.create({
            focused: options.tabActive,
            url: url,
            incognito: options.privateMode,
        });

        // If the new window shouldn't be active, then make the old window active
        if (!options.tabActive) {
            browser.windows.update(windowId, { focused: true });
        }
    } else if (!multisearch && options.tabMode === 'openNewTab') {
        // If single search and open in current window
        // If search engine is a link, uses HTTP GET or POST request or is AI prompt
        if (logToConsole) console.log(`Opening search results in a new tab, url is ${url}`);
        await browser.tabs.create({
            active: options.tabActive,
            index: tabPosition,
            url: url,
        });
    } else if (multisearch) {
        await browser.tabs.create({
            active: options.tabActive,
            index: tabPosition,
            url: url,
            windowId: windowId,
        });
    } else {
        // Open search results in the same tab
        if (logToConsole) console.log(`Opening search results in same tab, url is ${url}`);
        await browser.tabs.update(activeTab.id, {
            url: url,
        });
    }
}

async function getPromptText(id, prompt) {
    const searchEngine = searchEngines[id];

    if (id === 'chatgpt-') {
        promptText = 'How old is the Universe';
    } else if (id === 'chatgpt-direct') {
        promptText = prompt;
    } else {
        promptText = searchEngine.prompt;
    }

    if (promptText.includes('{searchTerms}')) {
        promptText = promptText.replace(/{searchTerms}/g, selection);
    } else if (promptText.includes('%s')) {
        promptText = promptText.replace(/%s/g, selection);
    }
    // Enrich with rich variables (no URL encoding)
    const ctx = await getActiveTabTemplateContext();
    const expanded = expandTemplateString(promptText, ctx, { urlEncode: false });
    if (logToConsole) console.log(expanded);
    return expanded;
}

function jsonToFormData(jsonData) {
    const formData = new FormData();

    // Iterate through the JSON object
    for (const key in jsonData) {
        if (Object.prototype.hasOwnProperty.call(jsonData, key)) {
            formData.append(key, jsonData[key]);
        }
    }

    return formData;
}

async function submitForm(finalFormData) {
    let data = '';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout set to 10 seconds

    try {
        const response = await fetch(targetUrl, {
            method: 'POST',
            body: finalFormData,
            signal: controller.signal, // Signal for aborting the fetch on timeout
        });

        clearTimeout(timeoutId); // Clear timeout once response is received

        // Check if the response is successful (status code in the 200–299 range)
        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        data = await response.text();
        if (logToConsole) console.log('Data:', data);
        if (data) {
            return {
                action: 'displaySearchResults',
                data: data,
            };
        } else {
            return false;
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error('Request timed out');
        } else {
            console.error('Fetch error:', error);
        }
        throw error; // Re-throw the error to ensure the calling code handles it
    }
}

/// OMNIBOX
// Provide help text to the user
browser.omnibox.setDefaultSuggestion({
    description: omniboxDescription,
});

// Update the suggestions whenever the input is changed
browser.omnibox.onInputChanged.addListener(async (input, suggest) => {
    markActivity(); // Track service worker activity

    if (input.indexOf(' ') > 0) {
        const suggestion = await buildSuggestion(input);
        if (suggestion.length === 1) {
            suggest(suggestion);
        }
    }
});

// Open the page based on how the user clicks on a suggestion
// Reusable processor for omnibox-style input (also used by popup command window)
async function processOmniboxInput(input) {
    markActivity();
    if (logToConsole) console.log(`Processing command input: ${input}`);

    // Ensure extension is initialized before processing any command
    if (!isInitialized) {
        if (logToConsole) console.log('Extension not initialized, initializing...');
        await init();
    }

    const aiEngines = ['chatgpt', 'gemini', 'grok', 'perplexity', 'poe', 'claude', 'andi'];
    const multisearch = false;
    const keyword = input.split(' ')[0];
    const suggestion = await buildSuggestion(input);
    const windowInfo = await browser.windows.getCurrent({ populate: true });
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    let searchTerms = input.replace(keyword, '').trim();

    // Replace template placeholders in search terms with last selection
    if (searchTerms.includes('{searchTerms}')) {
        searchTerms = searchTerms.replace(/{searchTerms}/g, selection);
    } else if (searchTerms.includes('%s')) {
        searchTerms = searchTerms.replace(/%s/g, selection);
    }

    selection = searchTerms.trim();
    await setStoredData(STORAGE_KEYS.SELECTION, selection);

    let tabIndex,
        tabPosition,
        tabId,
        id,
        aiEngine = '';

    if (logToConsole) console.log(`Keyword is: ${keyword}`);
    if (logToConsole) console.log(`Search terms are: ${searchTerms}`);
    if (logToConsole) console.log('Suggestion is: ');
    if (logToConsole) console.log(suggestion);

    // Resolve search engine id by keyword
    for (const se in searchEngines) {
        if (searchEngines[se].keyword === keyword) {
            id = se;
            break;
        }
    }
    // Direct AI engine usage
    if (!id && aiEngines.includes(keyword)) {
        id = 'chatgpt-direct';
        aiEngine = keyword;
    }

    // Determine tab position
    tabIndex = activeTab.index;
    tabId = activeTab.id;
    tabPosition = tabIndex + 1;
    if (options.lastTab || options.multiMode === 'multiAfterLastTab') tabPosition = windowInfo.tabs.length;

    if (input.indexOf('://') > -1) {
        if (logToConsole) console.log('Processing direct URL search...');
        await displaySearchResults(id, tabPosition, multisearch, windowInfo.id);
        return;
    }

    try {
        switch (keyword) {
            case '.':
                if (isEmpty(searchEngines)) {
                    if (logToConsole) console.log('Search engines not loaded, initializing...');
                    await initialiseSearchEngines();
                    if (logToConsole) console.log('Search engines loaded successfully');
                }
                await browser.runtime.openOptionsPage();
                break;
            case '!':
                await processMultisearch([], 'root', tabPosition);
                break;
            case 'bookmarks':
            case '!b': {
                if (logToConsole) console.log('Processing bookmarks case with searchTerms:', searchTerms);
                const hasBookmarksPermission = await browser.permissions.contains({ permissions: ['bookmarks'] });
                if (logToConsole) console.log('Bookmarks permission:', hasBookmarksPermission);
                if (hasBookmarksPermission) {
                    if (searchTerms === 'recent') {
                        bookmarkItems = await browser.bookmarks.getRecent(10);
                    } else if (searchTerms && searchTerms.trim() !== '') {
                        const searchResults = await browser.bookmarks.search({ query: searchTerms });
                        bookmarkItems = searchResults.filter((item) => item.url && item.url.trim() !== '');
                    } else {
                        const allBookmarks = await browser.bookmarks.search({});
                        bookmarkItems = allBookmarks.filter((item) => item.url && item.url.trim() !== '');
                    }
                    await setStoredData(STORAGE_KEYS.BOOKMARKS, bookmarkItems);
                    await setStoredData(STORAGE_KEYS.SEARCH_TERMS, searchTerms);
                    await browser.tabs.update(activeTab.id, { url: '/html/bookmarks.html' });
                } else {
                    if (notificationsEnabled)
                        notify('Bookmarks permission not granted. Please enable Bookmarks permission in the extension settings.');
                }
                break;
            }
            case 'history':
            case '!h': {
                const hasHistoryPermission = await browser.permissions.contains({ permissions: ['history'] });
                if (hasHistoryPermission) {
                    const searchOptions = { text: searchTerms, maxResults: 10000, startTime: 0 };
                    historyItems = await browser.history.search(searchOptions);
                    await setStoredData(STORAGE_KEYS.HISTORY, historyItems);
                    await setStoredData(STORAGE_KEYS.SEARCH_TERMS, searchTerms);
                    await browser.tabs.update(activeTab.id, { url: '/html/history.html' });
                } else {
                    if (notificationsEnabled) notify('History permission not granted. Please enable History permission in the extension settings.');
                }
                break;
            }
            default:
                if (suggestion.length > 1) {
                    const arraySearchEngineUrls = suggestion.map((s) => s.content);
                    await processMultisearch(arraySearchEngineUrls, 'root', tabPosition);
                } else if (
                    suggestion.length === 1 &&
                    ((searchEngines[id] && !searchEngines[id].isFolder) || aiEngines.includes(suggestion[0].content))
                ) {
                    if (typeof suggestion[0].content === 'string') {
                        await displaySearchResults(id, tabPosition, multisearch, windowInfo.id, aiEngine, searchTerms);
                    }
                } else if (suggestion.length === 1 && searchEngines[id] && searchEngines[id].isFolder) {
                    const multiTabArray = await processFolder(id, searchTerms);
                    await processMultisearch(multiTabArray, 'root', tabPosition);
                } else {
                    browser.search.search({ query: searchTerms, tabId: tabId });
                    if (notificationsEnabled) notify(notifyUsage);
                }
                break;
        }
    } catch (error) {
        if (logToConsole) console.error(error);
        if (logToConsole) console.log('Failed to process ' + input);
    }
}

browser.omnibox.onInputEntered.addListener(async (input) => {
    await processOmniboxInput(input);
});

async function processFolder(id, searchTerms) {
    let multiTabArray = [];
    for (const childId of searchEngines[id].children) {
        if (searchEngines[childId].isFolder) {
            // If search engine is a folder
            multiTabArray.push(...(await processFolder(childId, searchTerms)));
        } else if (searchEngines[childId].multitab) {
            multiTabArray.push(await processSearchEngine(childId, searchTerms));
        }
    }
    return multiTabArray;
}

async function processSearchEngine(id, searchTerms) {
    let result;
    if (id.startsWith('chatgpt-')) {
        // If the search engine is an AI search engine
        result = id;
    } else {
        const searchEngineUrl = searchEngines[id].url;
        // If search engine is a link
        if (id.startsWith('link-') && !searchEngineUrl.startsWith('javascript:')) {
            const domain = getDomain(searchEngineUrl).replace(/https?:\/\//, '');
            const quote = options.exactMatch ? '%22' : '';
            result = options.siteSearchUrl + encodeUrl(`site:https://${domain} ${quote}${selection}${quote}`);
        } else if (!searchEngines[id].formData) {
            // If search engine uses GET request
            targetUrl = await getSearchEngineUrl(searchEngineUrl, searchTerms);
            result = targetUrl;
        } else {
            // If search engine uses POST request
            targetUrl = searchEngineUrl;
            result = { id: id, url: targetUrl };
        }
    }
    return result;
}

async function buildSuggestion(text) {
    const aiEngines = ['chatgpt', 'gemini', 'grok', 'perplexity', 'poe', 'claude', 'andi'];
    const keyword = text.split(' ')[0];
    const searchTerms = text.replace(keyword, '').trim();
    let result = [];
    let showNotification = true;

    // Only make suggestions available and check for existence of a search engine when there is a space
    if (text.indexOf(' ') === -1) {
        if (logToConsole) console.log('No space found');
        lastAddressBarKeyword = '';
        return result;
    }

    // Don't notify for the same keyword
    if (lastAddressBarKeyword === keyword) showNotification = false;
    lastAddressBarKeyword = keyword;

    if (keyword === '!') {
        const suggestion = [
            {
                content: 'multisearch ' + searchTerms,
                description: 'Perform multisearch for ' + searchTerms,
            },
        ];
        return suggestion;
    } else if (keyword === '.') {
        const suggestion = [
            {
                content: 'options',
                description: 'Open options page',
            },
        ];
        return suggestion;
    } else if (keyword === '!b' || keyword === 'bookmarks') {
        const suggestion = [
            {
                content: 'bookmarks ' + searchTerms,
                description: 'Search bookmarks',
            },
        ];
        return suggestion;
    } else if (keyword === '!h' || keyword === 'history') {
        const suggestion = [
            {
                content: 'history ' + searchTerms,
                description: 'Search history',
            },
        ];
        return suggestion;
    }

    // Check if keyword is that of a search engine
    // A same keyword may be used for different search engines
    for (let id in searchEngines) {
        if (searchEngines[id].keyword === keyword) {
            let suggestion = {};
            if (id.startsWith('chatgpt-')) {
                // If AI prompt
                const provider = searchEngines[id].aiProvider;
                targetUrl = getAIProviderBaseUrl(provider);
                suggestion['description'] = 'Search ' + searchEngines[id].name + ' ' + searchTerms;
                suggestion['content'] = targetUrl; // AI provider URL
            } else if (searchEngines[id].isFolder) {
                // If search engine is a folder
                suggestion['description'] = 'Perform multisearch using search engines in ' + searchEngines[id].name + ' for ' + searchTerms;
                suggestion['content'] = 'folder ' + keyword + ' ' + searchTerms;
            } else {
                const searchEngineUrl = searchEngines[id].url;
                suggestion['description'] = 'Search ' + searchEngines[id].name + ' for ' + searchTerms;
                if (!searchEngines[id].formData) {
                    // If search engine uses GET request
                    targetUrl = await getSearchEngineUrl(searchEngineUrl, searchTerms);
                    suggestion['content'] = targetUrl;
                } else {
                    // If search engine uses HTTP POST request
                    targetUrl = searchEngineUrl;
                    suggestion['content'] = { id: id, url: targetUrl };
                }
            }

            result.push(suggestion);
        }
    }

    // If no known search engine was found, then check if AI engine
    if (result.length === 0 && aiEngines.includes(keyword)) {
        const suggestion = {
            description: 'Search for ' + searchTerms + ' using ' + keyword,
            content: keyword,
        };
        result.push(suggestion);
    }

    // If no known keyword was found
    if (notificationsEnabled && showNotification && result.length === 0) {
        notify(notifySearchEngineWithKeyword + ' ' + keyword + ' ' + notifyUnknown);
    }

    // Return an array of suggestions
    return result;
}

/// Helper functions
/// Encode a url
function encodeUrl(url) {
    if (isEncoded(url)) {
        return url;
    }
    return encodeURIComponent(url);
}

/// Verify if uri is encoded
function isEncoded(uri) {
    let test = '';
    try {
        test = uri !== decodeURIComponent(uri);
        return test;
    } catch (e) {
        return false;
    }
}

// Send message to content scripts
async function sendMessageToTab(tab, message) {
    const tabId = tab.id;
    if (logToConsole) console.log('Sending message to tab:', tabId, message);
    try {
        const response = await browser.tabs.sendMessage(tabId, message);
        if (logToConsole) console.log('Message response from tab:', response);
        if (logToConsole) console.log(`Message sent successfully to tab ${tab.id}: ${tab.title}`);
        return response;
    } catch (err) {
        const errorMessage = err?.message || String(err);
        // Ignore the specific error "Receiving end does not exist"
        if (!errorMessage.includes('Receiving end does not exist')) {
            // Log other errors as errors
            if (logToConsole) {
                console.error(`Failed to send message to tab ${tabId} (${tab.title}): ${errorMessage}`);
                console.log('Message details:', message); // Log the message content for context
            }
        } else if (logToConsole) {
            // Optionally log the ignored error as info/warn for debugging, but less prominently
            console.info(`Attempted to send message to tab ${tabId} (${tab.title}) but receiving end did not exist. Message:`, message);
        }
        // Still return a consistent failure indicator
        return { success: false, error: errorMessage };
    }
}

// ---------------- Template expansion utilities -----------------
let lastKnownContext = null;

async function getActiveTabTemplateContext({ selectionOverride } = {}) {
    try {
        const tabs = await browser.tabs.query({ active: true, currentWindow: true });
        const activeTab = tabs && tabs[0];
        let ctx = null;
        if (activeTab) {
            try {
                const response = await sendMessageToTab(activeTab, { action: 'getTemplateContext' });
                if (response && response.success && response.data) {
                    ctx = response.data;
                }
            } catch (e) {
                // content script might not be available on this page
            }
        }
        // Fallback from tab info
        if (!ctx) {
            const url = activeTab?.url || '';
            let host = '';
            let origin = '';
            try {
                const u = new URL(url);
                host = u.host;
                origin = u.origin;
            } catch (e) {
                // invalid URL, ignore
            }
            ctx = {
                selection: selection || '',
                selection_html: '',
                page_title: activeTab?.title || '',
                url,
                host,
                origin,
                lang: '',
                referrer: '',
            };
        }
        if (typeof selectionOverride === 'string' && selectionOverride.length > 0) {
            ctx.selection = selectionOverride;
        }
        lastKnownContext = ctx;
        return ctx;
    } catch (e) {
        return (
            lastKnownContext || {
                selection: selection || '',
                selection_html: '',
                page_title: '',
                url: '',
                host: '',
                origin: '',
                lang: '',
                referrer: '',
            }
        );
    }
}

function expandTemplateStringSync(template, ctx, { urlEncode = false } = {}) {
    if (!template || typeof template !== 'string') return template;
    const map = {
        selection: ctx.selection || '',
        selection_html: ctx.selection_html || '',
        page_title: ctx.page_title || '',
        url: ctx.url || '',
        host: ctx.host || '',
        origin: ctx.origin || '',
        lang: ctx.lang || '',
        referrer: ctx.referrer || '',
    };
    /* eslint-disable-next-line no-unused-vars */
    return template.replace(/\{(selection_html|selection|page_title|url|host|origin|lang|referrer)\}/g, (match, key) => {
        const val = map[key] ?? '';
        return urlEncode ? encodeUrl(String(val)) : String(val);
    });
}

function expandObjectStrings(obj, ctx, { urlEncode = false } = {}) {
    if (!obj || typeof obj !== 'object') return obj;
    const result = Array.isArray(obj) ? [] : {};
    for (const k in obj) {
        const v = obj[k];
        if (typeof v === 'string') {
            result[k] = expandTemplateStringSync(v, ctx, { urlEncode });
        } else if (v && typeof v === 'object') {
            result[k] = expandObjectStrings(v, ctx, { urlEncode });
        } else {
            result[k] = v;
        }
    }
    return result;
}

function expandTemplateString(template, ctx, { urlEncode = false } = {}) {
    return expandTemplateStringSync(template, ctx, { urlEncode });
}

/// Notifications
function notify(message) {
    browser.notifications.create('', {
        type: 'basic',
        iconUrl: 'icons/icon_64.png',
        title: browser.i18n.getMessage('extensionName'),
        message: message,
    });
}

/// Get the domain of a given url
function getDomain(url) {
    let protocol = '';
    if (url.indexOf('://') !== -1) {
        protocol = url.split('://')[0] + '://';
    } else {
        // By default, set the protocol to 'https://' if it hasn't been set
        protocol = 'https://';
    }

    let urlParts = url.replace('http://', '').replace('https://', '').split(/[/?#]/);
    let domain = protocol + urlParts[0];
    return domain;
}

// Test if an object is empty
function isEmpty(value) {
    if (typeof value === 'number') return false;
    else if (typeof value === 'string') return value.trim().length === 0;
    else if (Array.isArray(value)) return value.length === 0;
    else if (typeof value === 'object') {
        return value === null || Object.keys(value).length === 0;
    } else if (typeof value === 'boolean') return false;
    else return !value;
}

async function openAISearchPopup(tabIndex) {
    const width = 700;
    const height = 500;
    // Get browser info directly
    const browserInfo = await browser.windows.getCurrent();
    const browserWidth = browserInfo.width;
    const browserHeight = browserInfo.height;
    const browserLeft = browserInfo.left;
    const browserTop = browserInfo.top;

    // Calculate the position to center the window in the browser with a vertical offset of 200px
    // Use the obtained browser dimensions and position
    const left = browserLeft + Math.floor((browserWidth - width) / 2);
    const top = browserTop + Math.floor((browserHeight - height) / 2);

    await browser.windows.create({
        url: browser.runtime.getURL(`/html/popup.html?tabIndex=${tabIndex}`), // Pass the tab index to the popup
        type: 'popup',
        width: width,
        height: height,
        left: left,
        top: top,
    });
}

async function openBookmarkPopup() {
    const width = 700;
    const height = 500; // Adjust the height as needed

    // Get browser info directly
    const browserInfo = await browser.windows.getCurrent();
    const browserWidth = browserInfo.width;
    const browserHeight = browserInfo.height;
    const browserLeft = browserInfo.left;
    const browserTop = browserInfo.top;

    // Calculate the position to center the window in the browser with a small offset
    // Use the obtained browser dimensions and position
    const left = browserLeft + Math.floor((browserWidth - width) / 2) + 50;
    const top = browserTop + Math.floor((browserHeight - height) / 2) - 150;

    const currentWindow = await browser.windows.getCurrent(); // Can potentially reuse browserInfo if no relevant state changed
    const currentWindowId = currentWindow.id;

    // Open a new window with the specified dimensions and position
    await browser.windows.create({
        url: `/html/bookmark.html?parentWindowId=${currentWindowId}`,
        type: 'popup',
        width: width,
        height: height,
        left: left,
        top: top,
    });
}

async function openBookmarkRemovalConfirmDialog() {
    const width = 500;
    const height = 180;

    // Get browser info directly
    const browserInfo = await browser.windows.getCurrent();
    const browserWidth = browserInfo.width;
    const browserHeight = browserInfo.height;
    const browserLeft = browserInfo.left;
    const browserTop = browserInfo.top;

    // Calculate the position to center the window in the browser with a vertical offset of 200px
    // Use the obtained browser dimensions and position
    const left = browserLeft + Math.floor((browserWidth - width) / 2);
    const top = browserTop + Math.floor((browserHeight - height) / 2) - 200;

    // Ensure activeTab is defined and has a URL before proceeding
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    const urlToBookmark = activeTab?.url;
    if (!urlToBookmark) {
        console.error('Cannot open bookmark removal dialog: activeTab or activeTab.url is undefined.');
        // Optionally notify the user
        if (notificationsEnabled) notify(notifyMissingBookmarkUrl);
        return;
    }

    await browser.windows.create({
        url: `/html/bookmarkRemoval.html?url=${encodeURIComponent(urlToBookmark)}`, // Ensure URL is encoded
        type: 'popup',
        width: width,
        height: height,
        left: left,
        top: top,
    });
}

/*
 * Update browser action context menu to reflect the currently active tab
 */
async function updateAddonStateForActiveTab() {
    function isSupportedProtocol(urlString) {
        const supportedProtocols = ['https:', 'http:', 'ftp:', 'file:', 'javascript:'];
        try {
            const url = new URL(urlString);
            return supportedProtocols.includes(url.protocol);
        } catch (e) {
            return false;
        }
    }

    async function updateActionMenu(activeTab) {
        let links = [];
        let searchEngineAdded = false;
        if (activeTab) {
            const domain = getDomain(activeTab.url).replace('http://', '').replace('https://', '');
            if (logToConsole) console.log(`[ActionMenu] Active tab url: ${activeTab.url}, Domain: ${domain}`); // Added log
            if (isSupportedProtocol(activeTab.url)) {
                // Store all the bookmarks in the links array
                for (const id in searchEngines) {
                    if (!searchEngines[id].url) continue;
                    const seUrl = searchEngines[id].url;
                    // Check if the URL is a bookmark and not a bookmarklet
                    if (id.startsWith('link-') && !seUrl.startsWith('javascript:')) {
                        links.push(seUrl);
                    } else if (seUrl.includes(domain)) {
                        // Check if domain is a substring of seUrl
                        searchEngineAdded = true;
                    }
                }

                // Check if any of the stored links contain the domain
                bookmarked = links.some((link) => link.includes(domain));

                if (logToConsole) console.log(`[ActionMenu] State: bookmarked=${bookmarked}`);

                if (logToConsole) console.log(`[ActionMenu] Updating bookmark-page with:`, { title: bookmarked ? unbookmarkPage : bookmarkPage });

                // Update menu item for bookmarking
                const updateProps = {
                    title: bookmarked ? unbookmarkPage : bookmarkPage,
                };
                if (isFirefox) {
                    updateProps.icons = bookmarked ? { 16: '/icons/bookmark-red-icon.svg' } : { 16: '/icons/bookmark-grey-icon.svg' };
                }

                try {
                    if (logToConsole) console.log(`[ActionMenu] Updating bookmark-page with:`, updateProps); // Added log
                    await contextMenus.update('bookmark-page', updateProps);
                } catch (error) {
                    // Log error if the menu item doesn't exist (e.g., during initialization)
                    const itemNotFound =
                        error.message.toLowerCase().includes('no matching menu item') ||
                        error.message.toLowerCase().includes('cannot find menu item');
                    if (itemNotFound) {
                        // Expected during startup race conditions, log warning if enabled
                        if (logToConsole)
                            console.warn(`[ActionMenu] Could not update menu item 'bookmark-page' (might not exist yet): ${error.message}`);
                    } else {
                        // Re-throw other unexpected errors
                        console.error(`[ActionMenu] Error updating bookmark-page:`, error); // Added log
                        throw error;
                    }
                }
                // Update menu item for adding a search engine
                let response = false; // Default to false
                // Only check for OpenSearch on http/https pages where content scripts run
                if (activeTab.url && (activeTab.url.startsWith('http:') || activeTab.url.startsWith('https:'))) {
                    // Check cache first
                    const cachedResult = getCachedOpenSearchStatus(activeTab.id, activeTab.url);
                    if (cachedResult !== null) {
                        // Use cached result
                        response = { hasOpenSearch: cachedResult };
                    } else {
                        // Cache miss - send message to content script
                        try {
                            response = await browser.tabs.sendMessage(activeTab.id, { action: 'getOpenSearchSupportStatus' });
                            // Cache the result if we got a valid response
                            if (response && typeof response === 'object' && 'hasOpenSearch' in response) {
                                setCachedOpenSearchStatus(activeTab.id, activeTab.url, response.hasOpenSearch);
                            }
                        } catch (error) {
                            // Log the specific error if sending message fails
                            if (logToConsole)
                                console.warn(
                                    `[ActionMenu] Failed to get OpenSearch status from content script for tab ${activeTab.id}: ${error.message}`
                                );
                            // Keep hasOpenSearch as false and cache the negative result
                            setCachedOpenSearchStatus(activeTab.id, activeTab.url, false);
                        }
                    }
                }

                // Ensure we're properly checking for the hasOpenSearch property
                if (logToConsole) console.log(`[ActionMenu] Response:`, response, `searchEngineAdded: ${searchEngineAdded}`);

                // Make sure we're accessing hasOpenSearch safely - response might be true/false instead of an object
                const hasOpenSearch = response && typeof response === 'object' && 'hasOpenSearch' in response ? response.hasOpenSearch : false; // Default to false if we can't confidently determine the status

                const addSeProps = {
                    // Defined props for logging
                    visible: hasOpenSearch && !searchEngineAdded,
                };
                try {
                    if (logToConsole) console.log(`[ActionMenu] Updating add-search-engine with:`, addSeProps); // Added log
                    await contextMenus.update('add-search-engine', addSeProps);
                } catch (error) {
                    // Log error if the menu item doesn't exist (e.g., during initialization)
                    const itemNotFound =
                        error.message.toLowerCase().includes('no matching menu item') ||
                        error.message.toLowerCase().includes('cannot find menu item');
                    if (itemNotFound) {
                        // Expected during startup race conditions, log warning if enabled
                        if (logToConsole)
                            console.warn(`[ActionMenu] Could not update menu item 'add-search-engine' (might not exist yet): ${error.message}`);
                    } else {
                        // Re-throw other unexpected errors
                        console.error(`[ActionMenu] Error updating add-search-engine:`, error); // Added log
                        throw error;
                    }
                }
            } else {
                if (logToConsole && activeTab.url !== 'about:blank') console.log(`[ActionMenu] The '${activeTab.url}' URL cannot be bookmarked.`);
            }
        } else {
            if (logToConsole) console.log('[ActionMenu] No active tab found.'); // Added log
        }
    }

    if (logToConsole) console.log('Updating addon state...');
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    await updateActionMenu(activeTab);
}

/*
 * Add or remove the bookmark on the current page.
 */
async function toggleBookmark() {
    if (bookmarked) {
        await openBookmarkRemovalConfirmDialog();
    } else {
        await openBookmarkPopup();
    }
}

async function writeClipboardText(text) {
    try {
        await navigator.clipboard.writeText(text);
    } catch (error) {
        if (logToConsole) console.error(error.message);
    }
}

// Function to open sidebar/side panel across different browsers
async function setBrowserPanel(url = 'about:blank', title = 'Search results') {
    const browser_type = getBrowserType();
    try {
        if (browser_type === 'firefox') {
            await browser.sidebarAction.setPanel({
                panel: url,
            });
            await browser.sidebarAction.setTitle({
                title: title,
            });
        } else if (browser_type === 'chrome') {
            // Chrome and other Chromium-based browsers use side panel API
            if (chrome.sidePanel) {
                try {
                    await chrome.sidePanel.setOptions({
                        path: url,
                        enabled: true,
                    });
                } catch (error) {
                    console.error('Error setting side panel options:', error);
                }
            } else {
                if (logToConsole) console.warn('Side panel API not available in this browser');
            }
        }
    } catch (error) {
        if (logToConsole) console.error('Error opening browser panel:', error);
    }
}

// Function to show subscription choice popup window
async function openSubscriptionChoicePopup() {
    const width = 500;
    const height = 500;
    const browserInfo = await browser.windows.getCurrent();
    const left = browserInfo.left + Math.floor((browserInfo.width - width) / 2);
    const top = browserInfo.top + Math.floor((browserInfo.height - height) / 2);
    await browser.windows.create({
        url: browser.runtime.getURL('/html/subscription_choice.html'),
        type: 'popup',
        width,
        height,
        left,
        top,
    });
}

// Function to show subscription status popup window
async function openSubscriptionStatusPopup() {
    const width = 400;
    const height = 300;
    const browserInfo = await browser.windows.getCurrent();
    const left = browserInfo.left + Math.floor((browserInfo.width - width) / 2);
    const top = browserInfo.top + Math.floor((browserInfo.height - height) / 2);
    await browser.windows.create({
        url: browser.runtime.getURL('/html/subscription_status.html'),
        type: 'popup',
        width,
        height,
        left,
        top,
    });
}
