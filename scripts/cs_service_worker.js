/// Import constants
import {
    bingUrl,
    googleReverseImageSearchUrl,
    googleLensUrl,
    yandexUrl,
    tineyeUrl,
    chatGPTUrl,
    googleAIStudioUrl,
    perplexityAIUrl,
    poeUrl,
    claudeUrl,
    youUrl,
    andiUrl,
    aiUrls,
} from "./hosts.js";
import {
    base64chatGPT,
    base64GoogleAIStudio,
    base64perplexity,
    base64poe,
    base64claude,
    base64you,
    base64andi,
    base64exa,
    base64ContextSearchIcon,
    base64FolderIcon,
} from "./favicons.js";
import {
    STORAGE_KEYS,
    BACKUP_ALARM_NAME,
    DEFAULT_SEARCH_ENGINES,
    DEFAULT_OPTIONS,
    HEADER_RULES,
    UPDATE_CONFIG,
    titleMultipleSearchEngines,
    titleAISearch,
    titleSiteSearch,
    titleExactMatch,
    titleOptions,
    windowTitle,
    omniboxDescription,
    notifySearchEnginesLoaded,
    notifySearchEngineAdded,
    notifyUsage,
    notifySearchEngineWithKeyword,
    notifyUnknown,
    notifySearchEngineUrlRequired
} from "./constants.js";

/// Global variables

// Helper for cross-browser context menu API
const contextMenus = browser.menus || browser.contextMenus;

// Module-level variables for persistent data
let options = {};
let searchEngines = {};

// Module-level variables for temporary state during service worker lifetime
let selection = "";
let targetUrl = "";
let imageUrl = "";
let lastAddressBarKeyword = "";
let historyItems, bookmarkItems;
let bookmarked = false;
let activeTab;
let promptText;
let newSearchEngineUrl;
let formData;

// Debug (will be loaded from storage)
let logToConsole = false;

// Notifications (will be loaded from storage)
let notificationsEnabled = false;

// Store the listener function for context menu clicks in a variable
let menuClickHandler = null;

/// Listeners
// Listen for alarm
async function initializeExtension() {
    try {
        // Set up alarm listener
        if (browser.alarms) {
            browser.alarms.onAlarm.addListener(async (alarm) => {
                if (alarm.name === BACKUP_ALARM_NAME) {
                    await persistData();
                }
            });
        } else {
            console.warn('Alarms API not available');
        }

        // Continue with the rest of the initialization
        await init();
    } catch (error) {
        console.error('Failed to initialize extension:', error);
    }
}

// Set debugging mode and initialize when extension is installed or updated
browser.runtime.onInstalled.addListener((details) => {
    // Enable debugging for temporary installations
    if (details.temporary) {
        logToConsole = true;
        console.log("Debugging enabled for temporary installation");
    }
    handleServiceWorkerInit(`install: ${details.reason}`);
});

// Initialize when service worker starts
browser.runtime.onStartup.addListener(() => handleServiceWorkerInit('startup'));

// Initialize when service worker becomes active
self.addEventListener('activate', () => handleServiceWorkerInit('activate'));

// Listen for service worker termination
self.addEventListener('freeze', async () => {
    if (logToConsole) console.log("Service worker freezing, persisting data...");
    await persistData();
});

// Listen for changes to the notifications permission
browser.permissions.onAdded.addListener(async (permissions) => {
    if (permissions.permissions.includes("notifications")) {
        notificationsEnabled = true;
        if (logToConsole) console.log("Notifications permission granted.");
    }
});

browser.permissions.onRemoved.addListener(async (permissions) => {
    if (permissions.permissions.includes("notifications")) {
        notificationsEnabled = false;
        if (logToConsole) console.log("Notifications permission revoked.");
    }
});

// listen to tab URL changes
browser.tabs.onUpdated.addListener(updateAddonStateForActiveTab);

// listen to tab switching
browser.tabs.onActivated.addListener(updateAddonStateForActiveTab);

// Listen for tab moves
browser.tabs.onMoved.addListener(updateAddonStateForActiveTab);

// listen for window switching
browser.windows.onFocusChanged.addListener(updateAddonStateForActiveTab);

// Listen for storage changes
browser.storage.onChanged.addListener(handleStorageChange);

// Handle addon shortcut to launch icons grid or open the AI search window
browser.commands.onCommand.addListener(async (command) => {
    if (command === "launch-icons-grid") {
        if (logToConsole) console.log("Launching Icons Grid...");
        await sendMessageToTab(activeTab, { action: "launchIconsGrid" });
    } else if (command === "open-popup") {
        openAISearchPopup();
    }
});

// Listen for messages from the content or options script
browser.runtime.onMessage.addListener((message) => {
    const action = message.action;
    const data = message.data;
    if (logToConsole)
        console.log(
            `Message received: action=${action}, data=${JSON.stringify(data)}`,
        );
    switch (action) {
        case "openModal":
            return handleOpenModal(data);
        case "addNewPostSearchEngine":
            return handleAddNewPostSearchEngine(data);
        case "doSearch":
            return handleDoSearch(data);
        case "executeAISearch":
            return handleExecuteAISearch(data);
        case "notify":
            if (notificationsEnabled) notify(data);
            break;
        case "setSelection":
            // Escape single and double quotes from the selection
            if (data) selection = data.selection.replace(/["']/g, "\\$&");
            if (logToConsole) console.log(`Selected text: ${selection}`);
            //if (data) selections[sender.tab.id] = data.selection;
            //if (logToConsole) console.log(`Selected text from tab ${sender.tab.id}: ${selections[sender.tab.id]}`);
            break;
        case "reset":
            return handleReset();
        case "setTargetUrl":
            return handleSetTargetUrl(data);
        case "testSearchEngine":
            return testSearchEngine(data);
        case "testPrompt":
            return testPrompt();
        case "saveSearchEngines":
            return handleSaveSearchEngines(data);
        case "saveAIEngine":
            return handleSaveAIEngine(data);
        case "addNewSearchEngine":
            return handleAddNewSearchEngine(data);
        case "addNewPrompt":
            return handleAddNewPrompt(data);
        case "updateOptions":
            return handleOptionUpdate(data.updateType, data.data);
        case "saveSearchEnginesToDisk":
            return handleSaveSearchEnginesToDisk(data);
        case "updateOpenSearchSupport":
            return handleUpdateOpenSearchSupport(data);
        case "contentScriptLoaded":
            return handleContentScriptLoaded(data);
        case "getImageUrl":
            return sendImageUrl();
        case "getStoredData":
        case "setStoredData":
            return handleStorageMessage(message);
        default:
            console.error("Unexpected action:", action);
            return false;
    }
});

// Add message listener for storage operations
async function handleStorageMessage(message) {
    if (message.action === 'getStoredData') {
        try {
            const data = await getStoredData(message.key);
            return { data };
        } catch (error) {
            console.error('Error in getStoredData:', error);
            return { error: error.message };
        }
    } else if (message.action === 'setStoredData') {
        try {
            await setStoredData(message.key, message.value);
            return { success: true };
        } catch (error) {
            console.error('Error in setStoredData:', error);
            return { error: error.message };
        }
    }
}

/// Main functions
// Initialize header modification rules
async function initializeHeaderRules() {
    // Only set up rules if we're in sidebar mode
    if (options.tabMode !== "openSidebar") {
        // Remove any existing rules if not in sidebar mode
        await browser.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: HEADER_RULES.map(rule => rule.id)
        });
        return;
    }

    if (logToConsole) {
        console.log("Initializing header rules for sidebar mode");
    }

    // Remove any existing rules
    await browser.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: HEADER_RULES.map(rule => rule.id)
    });

    // Add our new rules
    await browser.declarativeNetRequest.updateDynamicRules({
        addRules: HEADER_RULES
    });

    if (logToConsole) {
        console.log("Header rules initialized");
    }
}

// Service Worker Lifecycle Management
async function handleServiceWorkerInit(reason = 'unknown') {
    try {
        if (logToConsole) {
            console.log(`Initializing service worker (reason: ${reason})`);
        }
        await initializeExtension();
    } catch (error) {
        console.error(`Error during ${reason} initialization:`, error);
    }
}

// Function to get stored data
async function getStoredData(key) {
    try {
        const result = await browser.storage.local.get(key);
        if (logToConsole) console.log(`Getting ${key} from storage:`, result[key]);
        return result[key];
    } catch (error) {
        console.error(`Error getting ${key} from storage:`, error);
        return null;
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
        // Initialize notifications setting
        let notifEnabled = await getStoredData(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
        if (!notifEnabled) {
            await setStoredData(STORAGE_KEYS.NOTIFICATIONS_ENABLED, false);
        }
        notificationsEnabled = notifEnabled ?? false;

        // Initialize debug setting
        let debugEnabled = await getStoredData(STORAGE_KEYS.LOG_TO_CONSOLE);
        if (!debugEnabled) {
            await setStoredData(STORAGE_KEYS.LOG_TO_CONSOLE, logToConsole);
        }
        logToConsole = debugEnabled ?? logToConsole;

        // Initialize options if not exist
        const storedOptions = await getStoredData(STORAGE_KEYS.OPTIONS);
        if (!storedOptions || isEmpty(storedOptions)) {
            const browser_type = getBrowserType();
            options = { ...DEFAULT_OPTIONS };  // Use spread to create a new object
            // Chrome does not support favicons in context menus
            if (browser_type === 'chrome') options.displayFavicons = false;
            options.logToConsole = logToConsole;
            if (logToConsole) console.log('Options before initialization:', options);
            await setStoredData(STORAGE_KEYS.OPTIONS, options);
        } else {
            options = storedOptions;  // Assign to global options
        }

        const retrievedOptions = await getStoredData(STORAGE_KEYS.OPTIONS);

        if (logToConsole) console.log('Stored options:', storedOptions);
        if (logToConsole) console.log('Retrieved options:', retrievedOptions);

        // Initialize search engines if not exist
        searchEngines = await getStoredData(STORAGE_KEYS.SEARCH_ENGINES) || {};

        if (logToConsole) console.log('Options after initialization:', options);
        if (logToConsole) console.log('Search engines after initialization:', searchEngines);
    } catch (error) {
        console.error('Error in initializeStoredData:', error);
        throw error;
    }
}

// Function to persist critical data before service worker becomes inactive
async function persistData() {
    try {
        await Promise.all([
            setStoredData(STORAGE_KEYS.OPTIONS, options),
            setStoredData(STORAGE_KEYS.SEARCH_ENGINES, searchEngines)
        ]);
    } catch (error) {
        console.error('Error persisting data:', error);
    }
}

async function handleStorageChange(changes, areaName) {
    if (areaName === "local" && changes) {
        // Check if options were changed
        if (changes.options) {
            options = changes.options.newValue;
        }
        // Check if search engines were changed
        if (changes.searchEngines) {
            searchEngines = changes.searchEngines.newValue;
        }
    }
}

// Function that determines if the browser being used is Chromium-based (e.g. Chrome) or is Gecko-based (e.g. Firefox)
function getBrowserType() {
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes("chrome") ? "chrome" : "firefox";
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
function handleOpenModal(data) {
    newSearchEngineUrl = data.url;
    formData = data.formData;
    const modalURL = browser.runtime.getURL(
        "/html/addSearchEngineForPostRequest.html",
    );
    const popupWidth = 400; // Width of the popup window
    const popupHeight = 420; // Height of the popup window
    const left = Math.floor((window.screen.width - popupWidth) / 2);
    const top = Math.floor((window.screen.height - popupHeight) / 2);
    browser.windows.create({
        allowScriptsToClose: true,
        type: "popup",
        top: top,
        left: left,
        width: popupWidth,
        height: popupHeight,
        url: modalURL,
    });
}

function handleAddNewPostSearchEngine(data) {
    const searchEngineName = data.searchEngineName;
    const keyword = data.keyword;
    const keyboardShortcut = data.keyboardShortcut;
    if (logToConsole) console.log(searchEngineName);
    if (logToConsole) console.log(keyword);
    if (logToConsole) console.log(keyboardShortcut);

    // Define a unique ID for the new search engine
    let id = searchEngineName.replace(/\s/g, "-").toLowerCase();
    while (!isIdUnique(id)) {
        id = id + "-" + Math.floor(Math.random() * 1000000000000);
    }
    id = id.trim();

    // Add the new search engine
    const numberOfSearchEngines = Object.keys(searchEngines).length;

    const formDataString = JSON.stringify(formData);

    const searchEngine = {
        index: numberOfSearchEngines,
        name: searchEngineName,
        keyword: keyword,
        keyboardShortcut: keyboardShortcut,
        multitab: false,
        url: newSearchEngineUrl,
        show: true,
        base64: "",
        formData: formDataString,
    };

    if (logToConsole) console.log(searchEngine);

    handleAddNewSearchEngine({ id: id, searchEngine: searchEngine });
}

async function handleDoSearch(data) {
    // The id of the search engine, folder, AI prompt or 'multisearch'
    // The source is either the grid of icons (for multisearch) or a keyboard shortcut
    const id = data.id;
    let multiTabArray = [];
    if (logToConsole) console.log("Search engine id: " + id);
    if (logToConsole) console.log(options.tabMode === "openSidebar");
    const tabs = await queryAllTabs();
    //const activeTab = await getActiveTab();
    const lastTab = tabs[tabs.length - 1];
    let tabPosition = activeTab.index + 1;
    if (options.multiMode === "multiAfterLastTab" || options.lastTab) {
        tabPosition = lastTab.index + 1;
    }
    // If the search engine is a folder
    if (searchEngines[id] && searchEngines[id].isFolder) {
        multiTabArray.push(...(await processFolder(id, selection)));
    }

    if (id === "multisearch" || searchEngines[id].isFolder) {
        // If multisearch or the search engine is a folder
        await processMultisearch(multiTabArray, tabPosition);
    } else {
        // If single search and search engine is a link, HTTP GET or POST request or AI prompt
        const multisearch = false;
        const windowInfo = await browser.windows.getCurrent();
        await displaySearchResults(id, tabPosition, multisearch, windowInfo.id);
    }
}

/// Reset extension
// Resets the options to the default settings if options.resetPreferences is set
// Resets the list of search engines to the default list if options.forceSearchEnginesReload is set
// Force favicons to be reloaded if options.forceFaviconsReload is set
async function handleReset() {
    if (logToConsole) {
        console.log(
            "Resetting extension's preferences and search engines as per user reset preferences.",
        );
    }
    await initialiseSearchEngines();
    return { action: "resetCompleted" };
}

async function handleSaveSearchEngines(data) {
    searchEngines = data;
    await initSearchEngines();
}

async function handleSaveAIEngine(data) {
    const id = data.id;
    const aiProvider = data.aiProvider;
    const { imageFormat, base64 } = getFaviconForPrompt(id, aiProvider);

    searchEngines[id]["aiProvider"] = aiProvider;
    searchEngines[id]["imageFormat"] = imageFormat;
    searchEngines[id]["base64"] = base64;
    await initSearchEngines();
}

async function handleAddNewSearchEngine(data) {
    const id = data.id;
    let domain = null;
    searchEngines[id] = data.searchEngine;
    if (
        !(
            id.startsWith("separator-") ||
            id.startsWith("chatgpt-") ||
            searchEngines[id].isFolder
        )
    ) {
        domain = getDomain(data.searchEngine.url);
        if (logToConsole) console.log(id, domain);
    }
    await addNewSearchEngine(id, domain);
}

async function handleAddNewPrompt(data) {
    const id = data.id;
    const domain = "";
    searchEngines[id] = data.searchEngine;
    await addNewSearchEngine(id, domain);
}

/**
 * Unified handler for updating options
 * @param {string} updateType - The type of update to perform
 * @param {Object} data - The data containing the new values
 * @returns {Promise<string|void>} Returns a custom string for certain update types
 */
async function handleOptionUpdate(updateType, data) {
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
        config.fields.forEach(field => {
            options[field] = data.resetOptions[field];
        });
    }
    // Handle all other cases
    else {
        config.fields.forEach(field => {
            options[field] = data[field];
        });
    }

    await saveOptions(config.requiresMenuRebuild);
    return config.customReturn;
}

function handleUpdateOpenSearchSupport(data) {
    const supportsOpenSearch = data.supportsOpenSearch;

    // Update menu visibility based on OpenSearch support
    contextMenus.update("add-search-engine", {
        visible: supportsOpenSearch
    });
}

async function handleSaveSearchEnginesToDisk(data) {
    await browser.downloads.download({
        url: data,
        saveAs: true,
        filename: "searchEngines.json",
    });
}

async function handleContentScriptLoaded(data) {
    if (logToConsole) console.log("Content script loaded. Sending response.");
    // Send a response to the content script
    const { domain, tabUrl } = data;
    if (logToConsole) console.log(`Tab url: ${tabUrl}`);

    let trimmedUrl;
    if (tabUrl.endsWith("/")) {
        trimmedUrl = tabUrl.slice(0, -1);
    } else {
        trimmedUrl = tabUrl;
    }

    if (aiUrls.includes(trimmedUrl)) {
        if (logToConsole) console.log(`Prompt: ${promptText}`);
        return {
            action: "askPrompt",
            data: { url: domain, prompt: promptText },
        };
    }

    // Check if tabUrl is in the list of search engine URLs
    for (let id in searchEngines) {
        if (
            id.startsWith("separator-") ||
            id.startsWith("link-") ||
            id.startsWith("chatgpt-") ||
            searchEngines[id].isFolder
        )
            continue;
        const searchEngine = searchEngines[id];
        if (
            searchEngine.url.startsWith("https://" + domain) &&
            searchEngine.formData
        ) {
            let finalFormData;
            let formDataString = searchEngine.formData;
            if (formDataString.includes("{searchTerms}")) {
                formDataString = formDataString.replace("{searchTerms}", selection);
            } else if (formDataString.includes("%s")) {
                formDataString = formDataString.replace("%s", selection);
            }
            const jsonFormData = JSON.parse(formDataString);
            finalFormData = jsonToFormData(jsonFormData);

            if (logToConsole) {
                console.log(`id: ${id}`);
                console.log("Form data string:");
                console.log(formDataString);
                console.log(`Selection: ${selection}`);
            }
            return submitForm(finalFormData);
        }
    }
    return false;
}

async function sendImageUrl() {
    if (targetUrl) {
        if (logToConsole) console.log(`Sending image URL: ${targetUrl}`);
        return {
            action: "fillFormWithImageUrl",
            data: { imageUrl: imageUrl },
        };
    }
}

// Test if a search engine performing a search for the keyword 'test' returns valid results
async function testSearchEngine(engineData) {
    if (engineData.url != "") {
        let tempTargetUrl = await getSearchEngineUrl(engineData.url, "test");
        browser.tabs.create({
            url: tempTargetUrl,
        });
    } else if (notificationsEnabled) {
        notify(notifySearchEngineUrlRequired);
    }
}

// test if an AI search engine perfoming an AI request with the prompt 'How old is the Universe' returns valid results
async function testPrompt() {
    const id = "chatgpt-";
    const multisearch = false;
    //const activeTab = await getActiveTab();
    const tabPosition = activeTab.index + 1;
    const windowInfo = await browser.windows.getCurrent();
    await displaySearchResults(id, tabPosition, multisearch, windowInfo.id);
}

async function handleSetTargetUrl(data) {
    const nativeMessagingEnabled = await browser.permissions.contains({
        permissions: ["nativeMessaging"],
    });
    let showVideoDownloadMenu;
    if (data) targetUrl = data;
    if (logToConsole) console.log(`TargetUrl: ${targetUrl}`);
    if (
        targetUrl.includes("youtube.com") ||
        targetUrl.includes("youtu.be") ||
        targetUrl.includes("youtube-nocookie.com") ||
        targetUrl.includes("vimeo.com")
    ) {
        showVideoDownloadMenu = true;
    } else {
        showVideoDownloadMenu = false;
    }
    await contextMenus.update("cs-download-video", {
        visible: nativeMessagingEnabled && showVideoDownloadMenu,
    });
    await contextMenus.update("cs-reverse-image-search", {
        visible: !showVideoDownloadMenu,
    });
    await contextMenus.update("cs-google-lens", {
        visible: !showVideoDownloadMenu,
    });
    await contextMenus.update("cs-bing-image-search", {
        visible: !showVideoDownloadMenu,
    });
    await contextMenus.update("cs-yandex-image-search", {
        visible: !showVideoDownloadMenu,
    });
    await contextMenus.update("cs-tineye", {
        visible: !showVideoDownloadMenu,
    });
}

async function handleExecuteAISearch(data) {
    const { aiEngine, prompt } = data;
    const id = "chatgpt-direct";
    const windowInfo = await browser.windows.getCurrent();
    const tabs = await queryAllTabs();
    let tabPosition;
    if (logToConsole) console.log(tabs);
    if (options.tabMode === "openNewTab" && options.lastTab) {
        // After the last tab
        tabPosition = tabs.length;
    } else {
        // Right after the active tab
        tabPosition = activeTab.index + 1;
    }
    displaySearchResults(id, tabPosition, false, windowInfo.id, aiEngine, prompt);
}

// Initialize extension
// Initialize search engines, only setting to default if not previously set
// Check if options are set in sync storage and set to default if not
async function init() {
    if (logToConsole) console.log('Initializing search engines...');
    // Debug: verify that storage space occupied is within limits
    if (logToConsole) {
        // Inform on storage space being used by storage sync
        const bytesUsed = await browser.storage.sync
            .getBytesInUse()
            .catch((err) => {
                console.error(err);
                console.log("Failed to retrieve storage space used by storage sync.");
            });
        console.log(`Bytes used by storage sync: ${bytesUsed} bytes.`);

        // Inform on storage space being used by local storage
        const items = await browser.storage.local.get();
        console.log(
            `Bytes used by local storage: ${JSON.stringify(items).length} bytes.`,
        );
    }

    await checkNotificationsPermission();

    // Initialize when service worker starts
    await initializeStoredData();

    // Initialize search engines
    await initialiseSearchEngines();

    // Update action context menu when the extension loads initially
    updateAddonStateForActiveTab();

    // Initialize header rules
    await initializeHeaderRules();

    // Create backup alarm
    browser.alarms.create(BACKUP_ALARM_NAME, {
        periodInMinutes: 5 // Backup every 5 minutes
    });
}

// Check if notifications are enabled
async function checkNotificationsPermission() {
    notificationsEnabled = await browser.permissions.contains({
        permissions: ["notifications"],
    });
    if (logToConsole)
        console.log(
            `${notificationsEnabled ? "Notifications enabled." : "Notifications disabled."}`,
        );
}

// Fetches a favicon for the new search engine
async function addNewSearchEngine(id, domain) {
    // Add a favicon to the search engine except if it's a separator or a folder
    if (!id.startsWith("separator-")) {
        if (searchEngines[id].isFolder) {
            searchEngines[id]["imageFormat"] = "image/png";
            searchEngines[id]["base64"] = base64FolderIcon;
        } else {
            const favicon = await getNewFavicon(id, domain);
            searchEngines[id]["imageFormat"] = favicon.imageFormat;
            searchEngines[id]["base64"] = favicon.base64;
        }
    }
    searchEngines["root"]["children"].push(id);
    // Save the search engine to local storage
    await setStoredData(STORAGE_KEYS.SEARCH_ENGINES, searchEngines);
    await buildContextMenu();
    if (notificationsEnabled) notify(notifySearchEngineAdded);
}

async function handlePageAction(tab) {
    let message = { action: "getSearchEngine", data: "" };
    await sendMessageToTab(tab, message);
}

async function initialiseSearchEngines() {
    try {
        // Check for search engines in local storage
        if (
            searchEngines === undefined ||
            isEmpty(searchEngines) ||
            options.forceSearchEnginesReload
        ) {
            // Load default search engines if force reload is set or if no search engines are stored in local storage
            await loadDefaultSearchEngines(DEFAULT_SEARCH_ENGINES);
        }

        await initSearchEngines();
    } catch (error) {
        console.error('Error in initialiseSearchEngines:', error);
        throw error; // Re-throw to be caught by init()
    }
}

async function initSearchEngines() {
    // Add root folder if it doesn't exist
    if (!searchEngines.root) addRootFolderToSearchEngines();

    // Set default keyboard shortcuts to '' if they're undefined
    setKeyboardShortcuts();

    // Get favicons as base64 strings
    await getFaviconsAsBase64Strings();

    // Save search engines to local storage
    await saveSearchEnginesToLocalStorage();

    // Rebuild context menu
    await buildContextMenu();
}

function addRootFolderToSearchEngines() {
    searchEngines["root"] = {
        index: 0,
        name: "Root",
        isFolder: true,
        children: [],
    };
    const n = Object.keys(searchEngines).length;
    for (let i = 0; i < n; i++) {
        for (let id in searchEngines) {
            if (id === "root") continue;
            if (searchEngines[id]["index"] === i) {
                searchEngines["root"]["children"].push(id);
                if (searchEngines[id]["isFolder"] === undefined)
                    searchEngines[id]["isFolder"] = false;
            }
        }
    }
}

function setKeyboardShortcuts() {
    for (let id in searchEngines) {
        if (id === "root") continue;
        if (
            !searchEngines[id].isFolder &&
            searchEngines[id].keyboardShortcut === undefined
        ) {
            searchEngines[id]["keyboardShortcut"] = "";
            if (logToConsole) {
                console.log(`Search engine id: ${id}`);
                console.log(`Keyboard shortcut: ${searchEngines[id].keyboardShortcut}`);
            }
        }
    }
}

async function saveOptions(blnBuildContextMenu) {
    try {
        await setStoredData(STORAGE_KEYS.OPTIONS, options);
        if (logToConsole) console.log(options);
        if (blnBuildContextMenu) await buildContextMenu();
        if (logToConsole)
            console.log("Successfully saved the options to storage sync.");
    } catch (err) {
        if (logToConsole) {
            console.error(err);
            console.log("Failed to save options to storage sync.");
        }
    }
}

/// Load default list of search engines
async function loadDefaultSearchEngines(jsonFile) {
    let reqHeader = new Headers();
    reqHeader.append("Content-Type", "application/json");
    const initObject = {
        method: "GET",
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
    } catch (error) {
        if (logToConsole) console.error(error.message);
    }
}

async function saveSearchEnginesToLocalStorage() {
    if (logToConsole) {
        console.log("Saving search engines to local storage:\n");
        console.log(searchEngines);
    }

    try {
        // Save search engines to local storage
        await setStoredData(STORAGE_KEYS.SEARCH_ENGINES, searchEngines);
        if (notificationsEnabled) notify(notifySearchEnginesLoaded);
        if (logToConsole) {
            console.log(
                "Search engines have been successfully saved to local storage.",
            );
        }
    } catch (error) {
        if (logToConsole) {
            console.error(error.message);
            console.log("Failed to save the search engines to local storage.");
        }
    }
}

/// Fetch and store favicon image format and base64 representation to searchEngines
async function getFaviconsAsBase64Strings() {
    if (logToConsole) console.log("Fetching favicons..");
    let arrayOfPromises = [];

    for (let id in searchEngines) {
        // If search engine is a separator or the root folder, skip it
        if (id.startsWith("separator-") || id === "root") continue;

        // Fetch a new favicon only if there is no existing favicon or if an favicon reload is being forced
        if (
            searchEngines[id].base64 === null ||
            searchEngines[id].base64 === undefined ||
            searchEngines[id].base64.length < 10 ||
            options.forceFaviconsReload
        ) {
            if (logToConsole) console.log("Fetching favicon for " + id);
            let domain;
            if (!(id.startsWith("chatgpt-") || searchEngines[id].isFolder)) {
                const seUrl = searchEngines[id].url;
                domain = getDomain(seUrl);
                if (logToConsole) {
                    console.log("id: " + id);
                    console.log("url: " + seUrl);
                    console.log("Getting favicon for " + domain);
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
                console.log("Not ALL the favcions could be fetched.");
            }
            return;
        });
        if (logToConsole) console.log("ALL promises have completed.");
        if (values === undefined) return;
        for (let value of values) {
            if (logToConsole) {
                console.log("================================================");
                console.log("id is " + value.id);
                console.log("------------------------------------------------");
                console.log("image format is " + value.imageFormat);
                console.log("------------------------------------------------");
                console.log("base64 string is " + value.base64);
                console.log("================================================");
            }
            searchEngines[value.id]["imageFormat"] = value.imageFormat;
            searchEngines[value.id]["base64"] = value.base64;
        }
        if (logToConsole) console.log("The favicons have ALL been fetched.");
    }
}

async function getNewFavicon(id, domain) {
    if (id.startsWith("chatgpt-")) {
        const aiProvider = searchEngines[id].aiProvider;
        return getFaviconForPrompt(id, aiProvider);
    }
    if (searchEngines[id].isFolder) {
        const imageFormat = "image/png";
        const b64 = base64FolderIcon;
        if (logToConsole) console.log(id, imageFormat, b64);
        return { id: id, imageFormat: imageFormat, base64: b64 };
    }
    // Fetch CORS API URL and key from config file
    const config = await fetchConfig();
    const CORS_API_URL = config.API_URL;
    const CORS_API_KEY = config.API_KEY;
    let reqHeader = new Headers();
    reqHeader.append("Content-Type", "text/plain; charset=UTF-8");
    reqHeader.append("x-api-key", CORS_API_KEY);
    const initObject = {
        method: "GET",
        headers: reqHeader,
    };
    const userRequest = new Request(CORS_API_URL + domain, initObject);
    try {
        const response = await fetch(userRequest);
        if (!response.ok) {
            const message = `Failed to get domain of search engine. An error has occured: ${response.status}`;
            throw new Error(message);
        }
        if (logToConsole) console.log(response);
        const data = await response.json();
        let imageFormat = data.imageFormat;
        let b64 = data.b64;
        if (b64 === "") {
            b64 = base64ContextSearchIcon;
            imageFormat = "image/png";
        }
        if (logToConsole) console.log(imageFormat, b64);
        return { id: id, imageFormat: imageFormat, base64: b64 };
    } catch (error) {
        if (logToConsole) console.error(error.message);
        if (logToConsole) console.log("Failed to retrieve new favicon.");
        // Failed to retrieve a favicon, proceeding with default CS icon
        return {
            id: id,
            imageFormat: "image/png",
            base64: base64ContextSearchIcon,
        };
    }
}

function getFaviconForPrompt(id, aiProvider) {
    let imageFormat, b64;
    switch (aiProvider) {
        case "chatgpt":
            imageFormat = "image/png";
            b64 = base64chatGPT;
            break;
        case "google-ai-studio":
            imageFormat = "image/svg+xml";
            b64 = base64GoogleAIStudio;
            break;
        case "perplexity":
            imageFormat = "image/png";
            b64 = base64perplexity;
            break;
        case "poe":
            imageFormat = "image/png";
            b64 = base64poe;
            break;
        case "claude":
            imageFormat = "image/png";
            b64 = base64claude;
            break;
        case "you":
            imageFormat = "image/png";
            b64 = base64you;
            break;
        case "andi":
            imageFormat = "image/png";
            b64 = base64andi;
            break;
        case "exa":
            imageFormat = "image/x-icon";
            b64 = base64exa;
            break;
        default:
            imageFormat = "image/svg+xml";
            b64 = base64ContextSearchIcon;
    }
    return { id: id, imageFormat: imageFormat, base64: b64 };
}

function addClickListener() {
    menuClickHandler = async (info, tab) => {
        if (options.tabMode === "openSidebar") {
            if (logToConsole) console.log("Opening the sidebar.");
            await openBrowserPanel();
        } else {
            if (logToConsole) console.log("Closing the sidebar.");
            await closeBrowserPanel();
        }
        await handleMenuClick(info, tab);
    };
    contextMenus.onClicked.addListener(menuClickHandler);
}

function removeClickListener() {
    if (menuClickHandler) {
        contextMenus.onClicked.removeListener(menuClickHandler);
        menuClickHandler = null;
    }
}

async function handleMenuClick(info, tab) {
    const id = info.menuItemId.startsWith("cs-")
        ? info.menuItemId.replace("cs-", "")
        : info.menuItemId;
    const ignoreIds = [
        "download-video",
        "reverse-image-search",
        "google-lens",
        "options",
        "multitab",
        "match",
        "ai-search",
    ];

    if (logToConsole) console.log("Clicked on " + id);

    if (options.tabMode === "openSidebar" && !ignoreIds.includes(id)) {
        await openBrowserPanel();
    }

    await processSearch(info, tab);
}

// Build the context menu using the search engines from local storage
async function buildContextMenu() {
    if (logToConsole) console.log("Building context menu..");
    // const info = await browser.runtime.getBrowserInfo();
    // const v = info.version;
    // const browserVersion = parseInt(v.slice(0, v.search('.') - 1));
    const rootChildren = searchEngines["root"].children;

    /// Functions used to build the context menu
    // Build the options context menu
    const buildContextOptionsMenu = () => {
        if (options.optionsMenuLocation === "bottom") {
            contextMenus.create({
                id: "cs-separator",
                type: "separator",
                contexts: ["selection"],
            });
        }
        contextMenus.create({
            id: "cs-match",
            type: "checkbox",
            title: titleExactMatch,
            contexts: ["selection"],
            checked: options.exactMatch,
        });
        contextMenus.create({
            id: "cs-multitab",
            title: titleMultipleSearchEngines,
            contexts: ["selection"],
        });
        contextMenus.create({
            id: "cs-ai-search",
            title: titleAISearch + "...",
            contexts: ["editable", "frame", "page", "selection"],
        });
        contextMenus.create({
            id: "cs-site-search",
            title: `${titleSiteSearch} ${options.siteSearch}`,
            contexts: ["selection"],
        });
        contextMenus.create({
            id: "cs-options",
            title: titleOptions + "...",
            contexts: ["selection"],
        });
        if (options.optionsMenuLocation === "top") {
            contextMenus.create({
                id: "cs-separator",
                type: "separator",
                contexts: ["selection"],
            });
        }
    };

    // Build a single context menu item
    const buildContextMenuItem = (id, parentId) => {
        const createMenuItem = (id, title, contexts, parentId, faviconUrl) => {
            if (options.displayFavicons === true) {
                if (parentId === "root") {
                    contextMenus.create(
                        {
                            id: id,
                            title: title,
                            contexts: contexts,
                            icons: { 20: faviconUrl },
                        },
                        () => onCreated(id),
                    );
                } else {
                    contextMenus.create(
                        {
                            id: id,
                            title: title,
                            contexts: contexts,
                            parentId: parentId,
                            icons: { 20: faviconUrl },
                        },
                        () => onCreated(id),
                    );
                }
            } else {
                if (parentId === "root") {
                    contextMenus.create(
                        {
                            id: id,
                            title: title,
                            contexts: contexts,
                        },
                        () => onCreated(id),
                    );
                } else {
                    contextMenus.create(
                        {
                            id: id,
                            title: title,
                            contexts: contexts,
                            parentId: parentId,
                        },
                        () => onCreated(id),
                    );
                }
            }
        };

        if (id.startsWith("separator-") && parentId !== "root") {
            contextMenus.create({
                id: "cs-" + id,
                parentId: parentId,
                type: "separator",
                contexts: ["selection"],
            });
            return;
        } else if (id.startsWith("separator-") && parentId === "root") {
            contextMenus.create({
                id: "cs-" + id,
                type: "separator",
                contexts: ["selection"],
            });
            return;
        }
        const searchEngine = searchEngines[id];

        if (
            searchEngine === undefined ||
            !(searchEngine.show || searchEngine.isFolder)
        )
            return;

        //const index = 'cs-' + id;
        const title = searchEngine.name;
        const imageFormat = searchEngine.imageFormat;
        const base64String = searchEngine.base64;
        const faviconUrl = `data:${imageFormat};base64,${base64String}`;
        let contexts;
        if (id.startsWith("link-")) {
            contexts = ["all"];
        } else {
            contexts = ["selection"];
        }

        if (searchEngine.isFolder) {
            createMenuItem(id, title, contexts, parentId, faviconUrl);
            for (let child of searchEngine.children) {
                buildContextMenuItem(child, id);
            }
        } else {
            createMenuItem(id, title, contexts, parentId, faviconUrl);
        }
    };

    // Build the context menu for image searches
    const buildContextMenuForImages = () => {
        contextMenus.create({
            id: "cs-bing-image-search",
            title: "Bing Image Search",
            contexts: ["image"],
        });
        contextMenus.create({
            id: "cs-reverse-image-search",
            title: "Google Reverse Image Search",
            contexts: ["image"],
        });
        contextMenus.create({
            id: "cs-google-lens",
            title: "Google Lens",
            contexts: ["image"],
        });
        /* contextMenus.create({
                id: 'cs-yandex-image-search',
                title: 'Yandex Image Search',
                contexts: ['image'],
            }); */
        contextMenus.create({
            id: "cs-tineye",
            title: "TinEye",
            contexts: ["image"],
        });
    };

    // Build the context menu for YouTube video downloads
    const buildContextMenuForVideoDownload = () => {
        contextMenus.create({
            id: "cs-download-video",
            title: "Download Video",
            documentUrlPatterns: [
                "*://*.youtube.com/*",
                "*://*.youtu.be/*",
                "*://*.youtube-nocookie.com/*",
                "*://*.vimeo.com/*",
            ],
            contexts: ["all"],
        });
    };
    /// End of functions for building the context menu

    if (logToConsole) console.log(`Search engines:`);
    if (logToConsole) console.log(searchEngines);
    if (logToConsole) console.log(`Root children: ${rootChildren}`);

    // Remove listener for context menu clicks
    removeClickListener();

    // Remove all existing context menu items
    contextMenus.removeAll();

    if (options.optionsMenuLocation === "top") {
        buildContextOptionsMenu();
    }

    for (let id of rootChildren) {
        buildContextMenuItem(id, "root");
    }

    buildContextMenuForImages();
    buildContextMenuForVideoDownload();

    if (options.optionsMenuLocation === "bottom") {
        buildContextOptionsMenu();
    }

    // Build a context menu for the action button
    contextMenus.create({
        id: "bookmark-page",
        title: "Bookmark This Page",
        contexts: ["action"],
        icons: { "16": "/icons/bookmark-grey-icon.svg" }
    });

    contextMenus.create({
        id: "add-search-engine",
        title: "Add Search Engine",
        contexts: ["action"],
        icons: { "16": "/icons/search-icon.png" },
        visible: false // Initially hidden
    });

    // Add listener for context menu clicks
    addClickListener();
}

function onCreated(id) {
    if (browser.runtime.lastError) {
        if (logToConsole) console.log(`Error: ${browser.runtime.lastError}`);
    } else {
        if (logToConsole) console.log(`Menu Item ${id} created successfully`);
    }
}

// Perform search based on selected search engine, i.e. selected context menu item
async function processSearch(info, tab) {
    if (logToConsole) console.log(info);
    const windowInfo = await browser.windows.getCurrent();
    const multisearch = false;
    const id = info.menuItemId.startsWith("cs-")
        ? info.menuItemId.replace("cs-", "")
        : info.menuItemId;

    // By default, open the search results right after the active tab
    let tabIndex = tab.index + 1;

    // Cancel search if the selected search engine is a folder
    // This is a precautionary measure as folders can't be clicked in the context menu
    if (searchEngines[id] !== undefined && searchEngines[id].isFolder) return;

    // If search engines are set to be opened after the last tab, then adjust the tabIndex
    const tabs = await queryAllTabs();
    //const activeTab = await getActiveTab();
    if (logToConsole) console.log(tabs);
    if (options.multiMode === "multiAfterLastTab") {
        // After the last tab
        tabIndex = tabs.length;
    } else {
        // Right after the active tab
        tabIndex = activeTab.index + 1;
    }
    if (logToConsole) console.log(tabIndex);
    if (id === "bookmark-page") {
        toggleBookmark();
        return;
    }
    if (id === "add-search-engine") {
        await handlePageAction(tab);
        return;
    }
    if (id === "download-video") {
        let url = info.linkUrl;
        if (url.includes("vimeo.com")) url = url.replace("https://", "http://");
        if (logToConsole) console.log(url);
        sendMessageToHostScript(url);
        return;
    }
    if (id === "options") {
        await browser.runtime.openOptionsPage();
        return;
    }
    if (id === "multitab") {
        await processMultisearch([], tabIndex);
        return;
    }
    if (id === "match") {
        if (logToConsole)
            console.log(
                `Preferences retrieved from sync storage: ${JSON.stringify(options)}`,
            );
        options.exactMatch = !options.exactMatch;
        await saveOptions(true);
        return;
    }
    if (id === "ai-search") {
        openAISearchPopup();
        return;
    }

    // If search engine is none of the above and not a folder, then perform search
    // The search engine corresponds to an HTTP GET or POST request or an AI prompt
    if (!id.startsWith("separator-")) {
        await displaySearchResults(id, tabIndex, multisearch, windowInfo.id);
    }
}

async function processMultisearch(arraySearchEngineUrls, tabPosition) {
    let windowInfo = await browser.windows.getCurrent();
    let multisearchArray = [];
    let nonUrlArray = [];
    let postArray = [];
    let aiArray = [];
    let urlArray = [];

    // Helper function to log array contents
    const logArrayContents = (label, array) => {
        if (logToConsole) console.log(`${label}:`, array);
    };

    const getSearchEnginesFromFolder = async (folderId) => {
        for (let id of searchEngines[folderId].children) {
            if (logToConsole) console.log(folderId, id);
            // If id is for a separator, then skip it
            if (id.startsWith("separator-")) continue;
            if (searchEngines[id].isFolder) {
                await getSearchEnginesFromFolder(id);
            }
            if (searchEngines[id].multitab) {
                if (searchEngines[id].aiProvider) {
                    // This array will contain id items
                    aiArray.push(id);
                } else if (searchEngines[id].formData) {
                    // This array will contain {id, url} items
                    const data = await processSearchEngine(id, selection);
                    postArray.push(data);
                } else {
                    // This array will contain url items
                    const url = await processSearchEngine(id, selection);
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
            if (
                typeof multisearchArray[i] === "string" &&
                multisearchArray[i].startsWith("http")
            ) {
                urlArray.push(multisearchArray[i]);
            } else if (
                typeof multisearchArray[i] === "string" &&
                multisearchArray[i].startsWith("chatgpt-")
            ) {
                aiArray.push(multisearchArray[i]);
            } else if (
                typeof multisearchArray[i] === "object" &&
                multisearchArray[i].id &&
                multisearchArray[i].url
            ) {
                postArray.push(multisearchArray[i]);
            }
        }
    } else {
        // Create an array of search engine URLs for all multisearch engines (using HTTP GET requests or AI prompts)
        // If the search engine uses an HTTP POST request, then the array will contain {id, url} for that search engine instead of just a url
        // Sort search results in the order that search engines appear in the options page
        await getSearchEnginesFromFolder("root");
    }

    if (logToConsole) console.log("Before concatenation:");
    logArrayContents("urlArray", urlArray);
    logArrayContents("postArray", postArray);
    logArrayContents("aiArray", aiArray);

    // Directly concatenate arrays
    if (logToConsole) console.log("After concatenation:");
    nonUrlArray = joinArrays(postArray, aiArray);
    logArrayContents("nonUrlArray", nonUrlArray);
    multisearchArray = joinArrays(urlArray, nonUrlArray);
    logArrayContents("multisearchArray", multisearchArray);

    if (notificationsEnabled && isEmpty(multisearchArray)) {
        notify("No search engines have been selected for a multisearch.");
        return;
    }
    if (isEmpty(multisearchArray)) return;

    // Open search results in a new window
    if (options.multiMode === "multiNewWindow") {
        windowInfo = await browser.windows.create({
            allowScriptsToClose: true,
            titlePreface: windowTitle + "'" + selection + "'",
            focused: options.tabActive,
            incognito: options.privateMode,
            url: urlArray,
        });
        // Set the tab position in the new window to the last tab
        tabPosition = windowInfo.tabs.length;
    } else if (options.multiMode !== "multiNewWindow") {
        // Open search results in the current window
        const tabs = await queryAllTabs();
        //const activeTab = await getActiveTab();
        if (logToConsole) console.log(tabs);
        if (options.multiMode === "multiAfterLastTab") {
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

    // Process the remaaining non-URL array of search engines (using HTTP POST requests or AI prompts)
    if (nonUrlArray.length > 0) {
        if (logToConsole)
            console.log(
                `Opening HTTP POST requests & AI search results in window ${windowInfo.id} at tab position ${tabPosition}`,
            );
        await processNonUrlArray(nonUrlArray, tabPosition, windowInfo.id);
    }
}

function joinArrays(...arrays) {
    return [...new Set(arrays.flat())];
}

async function openTabsForUrls(urls, tabPosition) {
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const newTabIndex = tabPosition + i;

        try {
            await browser.tabs.create({
                url: url,
                active: false,
                index: newTabIndex,
            });
        } catch (error) {
            console.error(`Error opening tab for URL ${url}:`, error);
        }
    }
}

async function processNonUrlArray(nonUrlArray, tabPosition, windowId) {
    const multisearch = true;
    const n = nonUrlArray.length;
    if (logToConsole)
        console.log(
            `Number of items (AI prompts & HTTP POST requests) left to process: ${n}`,
        );
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
            targetUrl = url.replace("{searchTerms}", encodeUrl(selection));
            await displaySearchResults(id, tabIndex, multisearch, windowId);
        }
    }
}

// Handle search terms if there are any
async function getSearchEngineUrl(searchEngineUrl, sel) {
    let quote = "";
    if (options.exactMatch) quote = "%22";
    if (searchEngineUrl.includes("{searchTerms}")) {
        return searchEngineUrl.replace(/{searchTerms}/g, encodeUrl(sel));
    } else if (searchEngineUrl.includes("%s")) {
        return searchEngineUrl.replace(/%s/g, encodeUrl(sel));
    } else {
        return searchEngineUrl + quote + encodeUrl(sel) + quote;
    }
}

async function setTargetUrl(id, aiEngine = "") {
    if (logToConsole) console.log("Active tab is:");
    if (logToConsole) console.log(activeTab);
    if (id === "reverse-image-search") {
        return googleReverseImageSearchUrl + targetUrl;
    }
    if (id === "google-lens") {
        return googleLensUrl + targetUrl;
    }
    if (id === "tineye") {
        return tineyeUrl;
    }
    if (id === "bing-image-search") {
        return bingUrl;
    }
    if (id === "yandex-image-search") {
        return yandexUrl;
    }
    if (id === "site-search" ||
        (id.startsWith("link-") && !searchEngines[id].url.startsWith("javascript:"))
    ) {
        let quote = "";
        if (options.exactMatch) quote = "%22";
        const domain = getDomain(activeTab.url).replace(/https?:\/\//, "");
        return (
            options.siteSearchUrl +
            encodeUrl(`site:https://${domain} ${quote}${selection}${quote}`)
        );
    }
    if (!id.startsWith("chatgpt-")) {
        let searchEngineUrl = searchEngines[id].url;
        if (!id.startsWith("link-") && !searchEngines[id].formData) {
            // If the search engine uses HTTP GET
            searchEngineUrl = await getSearchEngineUrl(searchEngineUrl, selection);
            return searchEngineUrl;
        } else {
            // If the search engine uses HTTP POST or is a link
            return searchEngineUrl;
        }
    } else if (id === "chatgpt-direct") {
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
        case "chatgpt":
            providerUrl = chatGPTUrl;
            break;
        case "google":
        case "google-ai-studio":
            providerUrl = googleAIStudioUrl;
            break;
        case "perplexity":
            providerUrl = perplexityAIUrl;
            break;
        case "llama31":
        case "poe":
            providerUrl = poeUrl;
            break;
        case "claude":
            providerUrl = claudeUrl;
            break;
        case "you":
            providerUrl = youUrl;
            break;
        case "andi":
            providerUrl = andiUrl;
            break;
        default:
            providerUrl = chatGPTUrl;
    }
    return providerUrl;
}

// Display the search results for a single search (link, HTTP POST or GET request, or AI prompt)
async function displaySearchResults(
    id,
    tabPosition,
    multisearch,
    windowId,
    aiEngine = "",
    prompt = "",
) {
    imageUrl = targetUrl;
    targetUrl = await setTargetUrl(id, aiEngine);
    const postDomain = getDomain(targetUrl);
    let searchEngine, url;
    if (id.startsWith("chatgpt-")) {
        promptText = getPromptText(id, prompt);
        if (searchEngines[id].aiProvider === "chatgpt") {
            writeClipboardText(promptText);
        }
    }
    if (id !== "chatgpt-direct") {
        searchEngine = searchEngines[id];
    }
    if (searchEngine && searchEngine.formData) {
        url = postDomain;
    } else {
        url = targetUrl;
    }
    if (logToConsole) console.log(`id: ${id}`);
    if (logToConsole) console.log(`prompt: ${promptText}`);
    if (logToConsole) console.log(`selection: ${selection}`);

    // Ignore bookmarklets in multi-search
    if (multisearch && id.startsWith("link-") && url.startsWith("javascript:"))
        return;

    if (id.startsWith("link-") && url.startsWith("javascript:")) {
        url = url.replace("javascript:", "");
        if (url.includes("%s")) {
            url = url.replace("%s", selection);
        }
        if (url.includes("{searchTerms}")) {
            url = url.replace("{searchTerms}", selection);
        }
        if (logToConsole) console.log(`Code: ${url}`);
        await browser.tabs.executeScript(activeTab.id, { code: url });
        return;
    }

    if (logToConsole && searchEngine)
        console.log(
            `Opening tab at index ${tabPosition} for ${searchEngine.name} at ${url} in window ${windowId}`,
        );

    if (!multisearch && options.tabMode === "openSidebar") {
        const suffix =
            id === "reverse-image-search" ||
                id === "google-lens" ||
                id === "tineye" ||
                id === "bing-image-search" ||
                id.startsWith("chatgpt-")
                ? ""
                : "#_sidebar";
        if (suffix && url === getDomain(url)) {
            url += "/";
        }
        const tabUrl = url + suffix;

        if (logToConsole) console.log(tabUrl);

        // If single search and open in sidebar
        await openBrowserPanel(tabUrl);
    } else if (!multisearch && options.tabMode === "openNewWindow") {
        // If single search and open in new window
        // If search engine is link, uses HTTP GET or POST request or is AI prompt
        if (logToConsole)
            console.log(`Make new tab or window active: ${options.tabActive}`);
        await browser.windows.create({
            titlePreface: windowTitle + "'" + selection + "'",
            focused: options.tabActive,
            url: url,
            incognito: options.privateMode,
        });

        // If the new window shouldn't be active, then make the old window active
        if (!options.tabActive) {
            browser.windows.update(windowId, { focused: true });
        }
    } else if (!multisearch && options.tabMode === "openNewTab") {
        // If single search and open in current window
        // If search engine is a link, uses HTTP GET or POST request or is AI prompt
        if (logToConsole) {
            console.log(`Opening search results in a new tab, url is ${url}`);
        }
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
        if (logToConsole) {
            console.log(`Opening search results in same tab, url is ${url}`);
        }
        await browser.tabs.update(activeTab.id, {
            url: url,
        });
    }
}

function getPromptText(id, prompt) {
    const searchEngine = searchEngines[id];

    if (id === "chatgpt-") {
        promptText = "How old is the Universe";
    } else if (id === "chatgpt-direct") {
        promptText = prompt;
    } else {
        promptText = searchEngine.prompt;
    }

    if (promptText.includes("{searchTerms}")) {
        promptText = promptText.replace(/{searchTerms}/g, selection);
    } else if (promptText.includes("%s")) {
        promptText = promptText.replace(/%s/g, selection);
    }

    if (logToConsole) console.log(promptText);
    return promptText;
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
    let data = "";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout set to 10 seconds

    try {
        const response = await fetch(targetUrl, {
            method: "POST",
            body: finalFormData,
            signal: controller.signal, // Signal for aborting the fetch on timeout
        });

        clearTimeout(timeoutId); // Clear timeout once response is received

        // Check if the response is successful (status code in the 200–299 range)
        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        data = await response.text();
        if (logToConsole) console.log("Data:", data);
        if (data) {
            return {
                action: "displaySearchResults",
                data: data,
            };
        } else {
            return false;
        }
    } catch (error) {
        if (error.name === "AbortError") {
            console.error("Request timed out");
        } else {
            console.error("Fetch error:", error);
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
    if (input.indexOf(" ") > 0) {
        const suggestion = await buildSuggestion(input);
        if (suggestion.length === 1) {
            suggest(suggestion);
        }
    }
});

// Open the page based on how the user clicks on a suggestion
browser.omnibox.onInputEntered.addListener(async (input) => {
    if (logToConsole) console.log(`Input entered: ${input}`);
    const aiEngines = [
        "chatgpt",
        "google",
        "perplexity",
        "poe",
        "claude",
        "you",
        "andi",
        "exa",
    ];
    const multisearch = false;
    const keyword = input.split(" ")[0];
    const suggestion = await buildSuggestion(input);
    const windowInfo = await browser.windows.getCurrent();
    let searchTerms = input.replace(keyword, "").trim();

    // Check if the search terms contain '%s' or '{searchTerms}'
    if (searchTerms.includes("{searchTerms}")) {
        searchTerms = searchTerms.replace(/{searchTerms}/g, selection);
    } else if (searchTerms.includes("%s")) {
        searchTerms = searchTerms.replace(/%s/g, selection);
    }

    selection = searchTerms.trim();

    // tabPosition is used to determine where to open the search results for a multisearch
    let tabIndex,
        tabPosition,
        tabId,
        id,
        aiEngine = "";

    if (logToConsole) console.log(`Keyword is: ${keyword}`);
    if (logToConsole) console.log(`Search terms are: ${searchTerms}`);
    if (logToConsole) console.log("Suggestion is: ");
    if (logToConsole) console.log(suggestion);

    // Get the id of the search engine based on the keyword
    for (const se in searchEngines) {
        if (searchEngines[se].keyword === keyword) {
            id = se;
            break;
        }
    }

    // If id isn't found, then check if the search engine corresponds to an AI engine
    if (id === undefined) {
        if (aiEngines.includes(keyword)) {
            id = "chatgpt-direct";
            aiEngine = keyword;
        }
    }

    // Get active tab's index and id
    const tabs = await queryAllTabs();
    //const activeTab = await getActiveTab();
    tabIndex = activeTab.index;
    tabId = activeTab.id;

    tabPosition = tabIndex + 1;

    if (options.lastTab || options.multiMode === "multiAfterLastTab") {
        tabPosition = tabs.length;
    }

    if (logToConsole) console.log(tabPosition);
    if (logToConsole) console.log(input.indexOf("://"));

    // Only display search results when there is a valid link inside of the url variable
    if (input.indexOf("://") > -1) {
        if (logToConsole) console.log("Processing search...");
        await displaySearchResults(id, tabPosition, multisearch, windowInfo.id);
    } else {
        try {
            switch (keyword) {
                case ".":
                    browser.runtime.openOptionsPage();
                    break;
                case "!":
                    await processMultisearch([], tabPosition);
                    break;
                case "bookmarks":
                case "!b":
                    if (searchTerms === "recent") {
                        bookmarkItems = await browser.bookmarks.getRecent(10);
                    } else {
                        bookmarkItems = await browser.bookmarks.search({
                            query: searchTerms,
                        });
                    }
                    if (logToConsole) console.log(bookmarkItems);
                    await browser.storage.local.set({
                        bookmarkItems: bookmarkItems,
                        searchTerms: searchTerms,
                    });
                    await browser.tabs.create({
                        active: options.tabActive,
                        index: tabPosition,
                        url: "/html/bookmarks.html",
                    });
                    break;
                case "history":
                case "!h":
                    historyItems = await browser.history.search({ text: searchTerms });
                    await browser.storage.local.set({
                        historyItems: historyItems,
                        searchTerms: searchTerms,
                    });
                    await browser.tabs.create({
                        active: options.tabActive,
                        index: tabPosition,
                        url: "/html/history.html",
                    });
                    break;
                default:
                    if (suggestion.length > 1) {
                        let arraySearchEngineUrls = [];
                        for (const s of suggestion) {
                            arraySearchEngineUrls.push(s.content);
                        }
                        await processMultisearch(arraySearchEngineUrls, tabPosition);
                    } else if (
                        suggestion.length === 1 &&
                        ((searchEngines[id] && !searchEngines[id].isFolder) ||
                            aiEngines.includes(suggestion[0].content))
                    ) {
                        if (typeof suggestion[0].content === "string") {
                            // If AI prompt or search engine uses HTTP GET or POST request
                            await displaySearchResults(
                                id,
                                tabPosition,
                                multisearch,
                                windowInfo.id,
                                aiEngine,
                                searchTerms,
                            );
                        }
                    } else if (suggestion.length === 1 && searchEngines[id].isFolder) {
                        // If search engine is a folder
                        const multiTabArray = await processFolder(id, searchTerms);
                        await processMultisearch(multiTabArray, tabPosition);
                    } else {
                        browser.search.search({ query: searchTerms, tabId: tabId });
                        if (notificationsEnabled) notify(notifyUsage);
                    }
                    break;
            }
        } catch (error) {
            if (logToConsole) console.error(error);
            if (logToConsole) console.log("Failed to process " + input);
        }
    }
});

async function processFolder(id, searchTerms) {
    let multiTabArray = [];
    for (const childId of searchEngines[id].children) {
        if (searchEngines[childId].isFolder) {
            // If search engine is a folder
            multiTabArray.push(...(await processFolder(childId, searchTerms)));
        } else {
            multiTabArray.push(await processSearchEngine(childId, searchTerms));
        }
    }
    return multiTabArray;
}

async function processSearchEngine(id, searchTerms) {
    let result;
    let quote = "";
    if (id.startsWith("chatgpt-")) {
        // If the search engine is an AI search engine
        result = id;
    } else {
        const searchEngineUrl = searchEngines[id].url;
        // If search engine is a link
        if (id.startsWith("link-") && !searchEngineUrl.startsWith("javascript:")) {
            if (options.exactMatch) quote = "%22";
            const domain = getDomain(searchEngineUrl).replace(/https?:\/\//, "");
            result =
                options.siteSearchUrl +
                encodeUrl(`site:https://${domain} ${quote}${selection}${quote}`);
        } else if (!searchEngines[id].formData) {
            // If search engine uses GET request
            if (searchEngineUrl.includes("{searchTerms}")) {
                targetUrl = searchEngineUrl.replace(
                    /{searchTerms}/g,
                    encodeUrl(searchTerms),
                );
            } else if (searchEngineUrl.includes("%s")) {
                targetUrl = searchEngineUrl.replace(/%s/g, encodeUrl(searchTerms));
            } else {
                targetUrl =
                    searchEngineUrl + quote + encodeUrl(searchTerms) + quote;
            }
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
    const aiEngines = [
        "chatgpt",
        "google",
        "perplexity",
        "poe",
        "claude",
        "you",
        "andi",
        "exa",
    ];
    const keyword = text.split(" ")[0];
    const searchTerms = text.replace(keyword, "").trim();
    let result = [];
    let quote = "";
    let showNotification = true;

    if (options.exactMatch) quote = "%22";

    // Only make suggestions available and check for existence of a search engine when there is a space
    if (text.indexOf(" ") === -1) {
        if (logToConsole) console.log("No space found");
        lastAddressBarKeyword = "";
        return result;
    }

    // Don't notify for the same keyword
    if (lastAddressBarKeyword === keyword) showNotification = false;
    lastAddressBarKeyword = keyword;

    if (keyword === "!") {
        const suggestion = [
            {
                content: "",
                description: "Perform multisearch for " + searchTerms,
            },
        ];
        return suggestion;
    } else if (keyword === ".") {
        const suggestion = [
            {
                content: "",
                description: "Open options page",
            },
        ];
        return suggestion;
    } else if (keyword === "!b" || keyword === "bookmarks") {
        const suggestion = [
            {
                content: "",
                description: "Search bookmarks",
            },
        ];
        return suggestion;
    } else if (keyword === "!h" || keyword === "history") {
        const suggestion = [
            {
                content: "",
                description: "Search history",
            },
        ];
        return suggestion;
    }

    // Check if keyword is that of a search engine
    // A same keyword may be used for different search engines
    for (let id in searchEngines) {
        if (searchEngines[id].keyword === keyword) {
            let suggestion = {};
            if (id.startsWith("chatgpt-")) {
                // If AI prompt
                const provider = searchEngines[id].aiProvider;
                targetUrl = getAIProviderBaseUrl(provider);
                suggestion["description"] =
                    "Search " + searchEngines[id].name + " " + searchTerms;
                suggestion["content"] = targetUrl; // AI provider URL
            } else if (searchEngines[id].isFolder) {
                // If search engine is a folder
                suggestion["description"] =
                    "Perform multisearch using search engines in " +
                    searchEngines[id].name +
                    " for " +
                    searchTerms;
                suggestion["content"] = "";
            } else {
                const searchEngineUrl = searchEngines[id].url;
                suggestion["description"] =
                    "Search " + searchEngines[id].name + " for " + searchTerms;
                if (!searchEngines[id].formData) {
                    // If search engine uses GET request
                    if (searchEngineUrl.includes("{searchTerms}")) {
                        targetUrl = searchEngineUrl.replace(
                            /{searchTerms}/g,
                            encodeUrl(searchTerms),
                        );
                    } else if (searchEngineUrl.includes("%s")) {
                        targetUrl = searchEngineUrl.replace(/%s/g, encodeUrl(searchTerms));
                    } else {
                        targetUrl =
                            searchEngineUrl + quote + encodeUrl(searchTerms) + quote;
                    }
                    suggestion["content"] = targetUrl;
                } else {
                    // If search engine uses POST request
                    targetUrl = searchEngineUrl;
                    suggestion["content"] = { id: id, url: targetUrl };
                }
            }

            result.push(suggestion);
        }
    }

    // If no known search engine was found, then check if AI engine
    if (result.length === 0 && aiEngines.includes(keyword)) {
        const suggestion = {
            description: "Search for " + searchTerms + " using " + keyword,
            content: keyword,
        };
        result.push(suggestion);
    }

    // If no known keyword was found
    if (notificationsEnabled && showNotification && result.length === 0) {
        notify(notifySearchEngineWithKeyword + " " + keyword + " " + notifyUnknown);
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
    let test = "";
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
    try {
        await browser.tabs.sendMessage(tabId, message);
        if (logToConsole)
            console.log(`Message sent successfully to tab ${tab.id}: ${tab.title}`);
    } catch (err) {
        if (logToConsole) console.error(err);
        if (logToConsole)
            console.log(
                `Failed to send message ${JSON.stringify(message)} to tab ${tab.id}: ${tab.title}`,
            );
    }
}

/// Notifications
function notify(message) {
    browser.notifications.create(message.substring(0, 20), {
        type: "basic",
        iconUrl: "icons/icon_64.png",
        title: browser.i18n.getMessage("extensionName"),
        message: message,
    });
}

/// Get the domain of a given url
function getDomain(url) {
    let protocol = "";
    if (url.indexOf("://") !== -1) {
        protocol = url.split("://")[0] + "://";
    } else {
        // By default, set the protocol to 'https://' if it hasn't been set
        protocol = "https://";
    }

    let urlParts = url
        .replace("http://", "")
        .replace("https://", "")
        .split(/[/?#]/);
    let domain = protocol + urlParts[0];
    return domain;
}

// Test if an object is empty
function isEmpty(value) {
    if (typeof value === "number") return false;
    else if (typeof value === "string") return value.trim().length === 0;
    else if (Array.isArray(value)) return value.length === 0;
    else if (typeof value === "object") {
        return value === null || Object.keys(value).length === 0;
    } else if (typeof value === "boolean") return false;
    else return !value;
}

//
async function fetchConfig() {
    const response = await fetch(browser.runtime.getURL("config.json"));
    const config = await response.json();
    return config;
}

function sendMessageToHostScript(url) {
    let port = browser.runtime.connectNative("yt_dlp_host");
    if (logToConsole) console.log(`Sending: ${url}`);
    port.postMessage({ url: url });

    port.onMessage.addListener((response) => {
        if (logToConsole) console.log("Received response:", response);
    });

    port.onDisconnect.addListener(() => {
        let error = browser.runtime.lastError;
        if (error) {
            if (logToConsole)
                console.error("Port disconnected due to error:", error.message);
        } else {
            if (logToConsole) console.log("Port disconnected without error.");
        }
    });
}

function openAISearchPopup() {
    const width = 700;
    const height = 50;

    // Calculate the position to center the window with a vertical offset of 200px
    const left = Math.round((screen.width - width) / 2);
    const top = Math.round((screen.height - height) / 2) - 200;

    browser.windows.create({
        url: "/html/popup.html",
        type: "popup",
        width: width,
        height: height,
        left: left,
        top: top,
    });
}

async function openBookmarkPopup() {
    const width = 700;
    const height = 500; // Adjust the height as needed

    // Calculate the position to center the window with a small offset
    const left = Math.round((screen.width - width) / 2) + 50;
    const top = Math.round((screen.height - height) / 2) - 150;

    const currentWindow = await browser.windows.getCurrent();
    const currentWindowId = currentWindow.id;

    // Open a new window with the specified dimensions and position
    browser.windows.create({
        url: `/html/bookmark.html?parentWindowId=${currentWindowId}`,
        type: "popup",
        width: width,
        height: height,
        left: left,
        top: top,
    });
}

function openBookmarkRemovalConfirmDialog() {
    const width = 500;
    const height = 180;

    // Calculate the position to center the window with a vertical offset of 200px
    const left = Math.round((screen.width - width) / 2);
    const top = Math.round((screen.height - height) / 2) - 200;

    browser.windows.create({
        url: `/html/bookmarkRemoval.html?url=${activeTab.url}`,
        type: "popup",
        width: width,
        height: height,
        left: left,
        top: top,
    });
}

/*
 * Switches currentTab and currentBookmark to reflect the currently active tab
 */
async function updateAddonStateForActiveTab() {
    function isSupportedProtocol(urlString) {
        const supportedProtocols = [
            "https:",
            "http:",
            "ftp:",
            "file:",
            "javascript:",
        ];
        const url = document.createElement("a");
        url.href = urlString;
        return supportedProtocols.indexOf(url.protocol) !== -1;
    }

    function updateActionMenu() {
        let links = [];
        if (activeTab) {
            if (isSupportedProtocol(activeTab.url)) {
                // Store all the bookmarks in the links array
                for (const id in searchEngines) {
                    if (id.startsWith("link-")) {
                        links.push(searchEngines[id].url);
                    }
                }
                if (links.includes(activeTab.url)) {
                    bookmarked = true;
                } else {
                    bookmarked = false;
                }
                // Update menu item for bookmarking
                contextMenus.update("bookmark-page", {
                    title: bookmarked ? "Unbookmark This Page" : "Bookmark This Page",
                    icons: bookmarked
                        ? {
                            16: "/icons/bookmark-red-icon.svg",
                        }
                        : {
                            16: "/icons/bookmark-grey-icon.svg",
                        },
                });

                // Update menu item for adding a search engine
                contextMenus.update("add-search-engine", {
                    visible: false,
                });
            } else {
                if (logToConsole && activeTab.url !== "about:blank")
                    console.log(`The '${activeTab.url}' URL cannot be bookmarked.`);
            }
        }
    }

    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    activeTab = tabs[0];
    updateActionMenu();
}

/*
 * Add or remove the bookmark on the current page.
 */
function toggleBookmark() {
    if (bookmarked) {
        openBookmarkRemovalConfirmDialog();
    } else {
        openBookmarkPopup();
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
async function openBrowserPanel(url = 'about:blank', title = 'Search results') {
    const browser_type = getBrowserType();
    try {
        if (browser_type === 'firefox') {
            // Firefox uses sidebar API
            const isOpen = await browser.sidebarAction.isOpen({});
            await browser.sidebarAction.setPanel({
                panel: url
            });
            await browser.sidebarAction.setTitle({
                title: title
            });
            if (!isOpen) {
                await browser.sidebarAction.open();
            }
        } else if (browser_type === 'chrome') {
            // Chrome and other Chromium-based browsers use side panel API
            if (chrome.sidePanel) {
                await chrome.sidePanel.setOptions({
                    path: url,
                    enabled: true,
                    tabId: -1, // -1 means apply to all tabs
                    title: title
                });
                // Chrome requires tab ID to open side panel
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab) {
                    await chrome.sidePanel.open({ tabId: tab.id });
                }
            } else {
                console.warn('Side panel API not available in this browser');
            }
        }
    } catch (error) {
        console.error('Error opening browser panel:', error);
    }
}

// Function to close sidebar/side panel across different browsers
async function closeBrowserPanel() {
    const browser_type = getBrowserType();
    try {
        if (browser_type === 'firefox') {
            // Firefox uses sidebar API
            await browser.sidebarAction.close();
        } else if (browser_type === 'chrome') {
            // Chrome and other Chromium-based browsers use side panel API
            if (chrome.sidePanel) {
                // Chrome requires tab ID to manipulate side panel
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab) {
                    await chrome.sidePanel.setOptions({
                        enabled: false,
                        tabId: tab.id
                    });
                }
            } else {
                console.warn('Side panel API not available in this browser');
            }
        }
    } catch (error) {
        console.error('Error closing browser panel:', error);
    }
}
