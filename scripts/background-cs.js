/* eslint-disable prefer-arrow-callback */
/* eslint-disable no-case-declarations */

globalThis.browser ??= chrome;

/// Import constants
import { googleReverseImageSearchUrl, googleLensUrl, chatGPTUrl, googleAIStudioUrl, perplexityAIUrl, poeUrl, claudeUrl, youUrl, andiUrl, aiUrls } from './hosts.js';
import { base64chatGPT, base64GoogleAIStudio, base64perplexity, base64poe, base64claude, base64you, base64andi, base64exa, base64ContextSearchIcon, base64FolderIcon } from './favicons.js';
import { USER_AGENT_FOR_SIDEBAR, USER_AGENT_FOR_GOOGLE, DEFAULT_SEARCH_ENGINES, REQUEST_FILTER, titleMultipleSearchEngines, titleAISearch, titleSiteSearch, titleExactMatch, titleOptions, windowTitle, omniboxDescription, notifySearchEnginesLoaded, notifySearchEngineAdded, notifyUsage, notifySearchEngineWithKeyword, notifyUnknown, notifySearchEngineUrlRequired, DEFAULT_OPTIONS } from './constants.js';

/// Global variables
/* global  */
let searchEngines = {};
let newSearchEngineUrl;
let formData;
let selection = '';
let targetUrl = '';
let lastAddressBarKeyword = '';
let historyItems, bookmarkItems;
let bookmarked = false;
let activeTab;
let promptText;
let CORS_API_URL;
let CORS_API_KEY;

// Debug
let logToConsole = false;

// Notifications
let notificationsEnabled = false;

// Store the listener function for context menu clicks in a variable
let menuClickHandler = null;

/// Listeners
// Handle Debugging
browser.runtime.onInstalled.addListener(async (details) => {
    if (details.temporary) {
        logToConsole = true;
    } else {
        logToConsole = false;
    }
    if (logToConsole) {
        console.log('Debugging enabled.');
        console.log(details);
    }
    if (details.reason === "install" || details.reason === "update") {
        await init();
    }
})

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

// Handle browser action click
browser.browserAction.onClicked.addListener(toggleBookmark);

// Handle Page Action click
browser.pageAction.onClicked.addListener(handlePageAction);

// Handle addon shortcut to launch icons grid or open the AI search window
browser.commands.onCommand.addListener(async (command) => {
    if (command === "launch-icons-grid") {
        if (logToConsole) console.log('Launching Icons Grid...');
        //const activeTab = await getActiveTab();
        await sendMessageToTab(activeTab, { action: "launchIconsGrid" });
    } else if (command === "open-popup") {
        openAISearchPopup();
    }
});

// Add a mobile header to outgoing requests
browser.webRequest.onBeforeSendHeaders.addListener(
    rewriteUserAgentHeader,
    REQUEST_FILTER,
    ['blocking', 'requestHeaders']
);

// Listen for messages from the content or options script
browser.runtime.onMessage.addListener((message, sender) => {
    const action = message.action;
    const data = message.data;
    if (logToConsole) console.log(`Message received: action=${action}, data=${JSON.stringify(data)}`);
    switch (action) {
        case 'openModal':
            handleOpenModal(data);
            break;
        case 'addNewPostSearchEngine':
            handleAddNewPostSearchEngine(data);
            break;
        case 'doSearch':
            handleDoSearch(data);
            break;
        case 'executeAISearch':
            handleExecuteAISearch(data);
            break;
        case 'notify':
            if (notificationsEnabled) notify(data);
            break;
        case 'setSelection':
            // Escape single and double quotes from the selection
            if (data) selection = data.selection.replace(/["']/g, '\\$&');
            if (logToConsole) console.log(`Selected text: ${selection}`);
            //if (data) selections[sender.tab.id] = data.selection;
            //if (logToConsole) console.log(`Selected text from tab ${sender.tab.id}: ${selections[sender.tab.id]}`);
            break;
        case 'reset':
            handleReset();
            break;
        case 'setTargetUrl':
            return handleSetTargetUrl(data);
        case 'testSearchEngine':
            testSearchEngine(data);
            break;
        case 'testPrompt':
            testPrompt();
            break;
        case 'saveSearchEngines':
            handleSaveSearchEngines(data);
            break;
        case 'saveAIEngine':
            handleSaveAIEngine(data);
            break;
        case 'addNewSearchEngine':
            handleAddNewSearchEngine(data);
            break;
        case 'addNewPrompt':
            handleAddNewPrompt(data);
            break;
        case 'updateSearchOptions':
            handleUpdateSearchOptions(data);
            break;
        case 'updateDisplayFavicons':
            handleUpdateDisplayFavicons(data);
            break;
        case 'updateQuickIconGrid':
            handleUpdateQuickIconGrid(data);
            break;
        case 'updateCloseGridOnMouseOut':
            handleUpdateCloseGridOnMouseOut(data);
            break;
        case 'updateXOffset':
            handleOffsetUpdate(data);
            break;
        case 'updateYOffset':
            handleOffsetUpdate(data);
            break;
        case 'updateDisableAltClick':
            handleUpdateDisableAltClick(data);
            break;
        case 'updateTabMode':
            handleUpdateTabMode(data);
            break;
        case 'updateOverwriteSearchEngines':
            handleUpdateOverwriteSearchEngines(data);
            break;
        case 'updateMultiMode':
            handleUpdateMultiMode(data);
            break;
        case 'updateOptionsMenuLocation':
            handleUpdateOptionsMenuLocation(data);
            break;
        case 'updateSiteSearchSetting':
            handleUpdateSiteSearchSetting(data);
            break;
        case 'updateResetOptions':
            handleUpdateResetOptions(data);
            break;
        case 'saveSearchEnginesToDisk':
            handleSaveSearchEnginesToDisk(data);
            break;
        case 'hidePageAction':
            return browser.pageAction.hide(sender.tab.id);
        case 'showPageAction':
            return browser.pageAction.show(sender.tab.id);
        case 'contentScriptLoaded':
            return handleContentScriptLoaded(data);
        default:
            console.error('Unexpected action:', action);
            return false;
    }
});

/// Main functions
/*
Rewrite the User-Agent header to USER_AGENT_FOR_SIDEBAR
*/
async function rewriteUserAgentHeader(e) {
    if (logToConsole) console.log(e);
    const options = await getOptions();

    // Check if this is a Google image search URL (including redirects)
    const isGoogleImageSearch = e.url.includes('google.com/') &&
        (e.url.includes('searchbyimage') ||
            e.url.includes('tbs=sbi:') ||
            (e.url.includes('webhp') && e.url.includes('tbs=sbi:')));

    // Check if this is a Google Lens search
    const isGoogleLensSearch = e.url.includes('lens.google.com/');

    const isYouTube = e.url.includes('youtube.com/');

    // Only proceed if we're in sidebar mode
    if (options.tabMode !== 'openSidebar' || isGoogleLensSearch) {
        return { requestHeaders: e.requestHeaders };
    }

    if (logToConsole) {
        console.log('Intercepted header:');
        console.log(e.requestHeaders);
    }

    for (const header of e.requestHeaders) {
        if (header.name.toLowerCase() === 'user-agent') {
            if (isGoogleImageSearch || isYouTube) {
                header.value = USER_AGENT_FOR_GOOGLE;
            } else {
                header.value = USER_AGENT_FOR_SIDEBAR;
            }
        }
    }

    if (logToConsole) {
        console.log('Modified header:');
        console.log(e.requestHeaders);
    }

    return { requestHeaders: e.requestHeaders };
}

// Functions used to handle incoming messages
function isActive(tab) {
    return tab.active;
}

async function queryAllTabs() {
    return await browser.tabs.query({ currentWindow: true });
}

async function getActiveTab() {
    const tabs = await queryAllTabs();
    return tabs.filter(isActive)[0];
}

async function isIdUnique(testId) {
    // Retrieve search engines from local storage
    const searchEngines = await browser.storage.local.get(null);
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
    const modalURL = browser.runtime.getURL('/html/addSearchEngineForPostRequest.html');
    const popupWidth = 400; // Width of the popup window
    const popupHeight = 420; // Height of the popup window
    const left = Math.floor((window.screen.width - popupWidth) / 2);
    const top = Math.floor((window.screen.height - popupHeight) / 2);
    browser.windows.create({
        allowScriptsToClose: true,
        type: 'popup',
        top: top,
        left: left,
        width: popupWidth,
        height: popupHeight,
        url: modalURL
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
    let id = searchEngineName.replace(/\s/g, '-').toLowerCase();
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
        base64: '',
        formData: formDataString
    }

    if (logToConsole) console.log(searchEngine);

    handleAddNewSearchEngine({ id: id, searchEngine: searchEngine });
}

async function handleDoSearch(data) {
    // The id of the search engine, folder, AI prompt or 'multisearch'
    // The source is either the grid of icons (for multisearch) or a keyboard shortcut
    const id = data.id;
    const options = await getOptions();
    let multiTabArray = [];
    if (logToConsole) console.log('Search engine id: ' + id);
    if (logToConsole) console.log(options.tabMode === 'openSidebar');
    const tabs = await queryAllTabs();
    //const activeTab = await getActiveTab();
    const lastTab = tabs[tabs.length - 1];
    let tabPosition = activeTab.index + 1;
    if (options.multiMode === 'multiAfterLastTab' || options.lastTab) {
        tabPosition = lastTab.index + 1;
    }
    // If the search engine is a folder
    if (searchEngines[id] && searchEngines[id].isFolder) {
        multiTabArray.push(...await processFolder(id, selection));
    }

    if (id === 'multisearch' || searchEngines[id].isFolder) {
        // If multisearch or the search engine is a folder
        await processMultisearch(multiTabArray, tabPosition);
    } else {
        // If single search and search engine is a link, HTTP GET or HTTP POST request or AI prompt
        const multisearch = false;
        const windowInfo = await browser.windows.getCurrent();
        await displaySearchResults(id, tabPosition, multisearch, windowInfo.id);
    }
}

async function handleReset() {
    const response = await reset();
    if (logToConsole) console.log(response);
    sendMessageToOptionsPage(response, null);
}

async function handleSaveSearchEngines(data) {
    searchEngines = data;
    await initSearchEngines();
}

async function handleSaveAIEngine(data) {
    const id = data.id;
    const aiProvider = data.aiProvider;
    const { imageFormat, base64 } = getFaviconForPrompt(id, aiProvider);

    searchEngines[id]['aiProvider'] = aiProvider;
    searchEngines[id]['imageFormat'] = imageFormat;
    searchEngines[id]['base64'] = base64;
    await initSearchEngines();
}

async function handleAddNewSearchEngine(data) {
    const id = data.id;
    let domain = null;
    searchEngines[id] = data.searchEngine;
    if (!(id.startsWith("separator-") || id.startsWith('chatgpt-') || searchEngines[id].isFolder)) {
        domain = getDomain(data.searchEngine.url);
        if (logToConsole) console.log(id, domain);
    }
    await addNewSearchEngine(id, domain);
}

async function handleAddNewPrompt(data) {
    const id = data.id;
    const domain = '';
    searchEngines[id] = data.searchEngine;
    await addNewSearchEngine(id, domain);
}

async function handleUpdateSearchOptions(data) {
    let options = await getOptions();
    options.exactMatch = data.exactMatch;
    await saveOptions(options, true);
}

async function handleUpdateDisplayFavicons(data) {
    let options = await getOptions();
    options.displayFavicons = data.displayFavicons;
    await saveOptions(options, true);
}

async function handleUpdateQuickIconGrid(data) {
    let options = await getOptions();
    options.quickIconGrid = data.quickIconGrid;
    await saveOptions(options, false);
}

async function handleUpdateCloseGridOnMouseOut(data) {
    let options = await getOptions();
    options.closeGridOnMouseOut = data.closeGridOnMouseOut;
    await saveOptions(options, false);
}

async function handleOffsetUpdate(data) {
    let options = await getOptions();
    if (data.offsetX) options.offsetX = data.offsetX;
    if (data.offsetY) options.offsetY = data.offsetY;
    await saveOptions(options, false);
}

async function handleUpdateDisableAltClick(data) {
    let options = await getOptions();
    options.disableAltClick = data.disableAltClick;
    await saveOptions(options, false);
}

async function handleUpdateTabMode(data) {
    let options = await getOptions();
    options.tabMode = data.tabMode;
    options.tabActive = data.tabActive;
    options.lastTab = data.lastTab;
    options.privateMode = data.privateMode;
    await saveOptions(options, false);
}

async function handleUpdateOverwriteSearchEngines(data) {
    let options = await getOptions();
    options.overwriteSearchEngines = data.overwriteSearchEngines;
    await saveOptions(options, false);
}

async function handleUpdateMultiMode(data) {
    let options = await getOptions();
    options.multiMode = data.multiMode;
    await saveOptions(options, false);
}

async function handleUpdateOptionsMenuLocation(data) {
    let options = await getOptions();
    options.optionsMenuLocation = data.optionsMenuLocation;
    await saveOptions(options, true);
}

async function handleUpdateSiteSearchSetting(data) {
    let options = await getOptions();
    options.siteSearch = data.siteSearch;
    options.siteSearchUrl = data.siteSearchUrl;
    await saveOptions(options, true);
}

async function handleUpdateResetOptions(data) {
    let options = await getOptions();
    options.forceSearchEnginesReload = data.resetOptions.forceSearchEnginesReload;
    options.resetPreferences = data.resetOptions.resetPreferences;
    options.forceFaviconsReload = data.resetOptions.forceFaviconsReload;
    await saveOptions(options, false);
}

async function handleSaveSearchEnginesToDisk(data) {
    await browser.downloads.download({
        url: data,
        saveAs: true,
        filename: 'searchEngines.json',
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
            action: "askPrompt",
            data: { url: tabUrl, prompt: promptText }
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
            const jsonFormData = JSON.parse(formDataString);
            finalFormData = jsonToFormData(jsonFormData);

            if (logToConsole) {
                console.log(`id: ${id}`);
                console.log('Form data string:');
                console.log(formDataString);
                console.log(`Selection: ${selection}`);
            }
            return submitForm(finalFormData);
        }
    }
    return false;
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
    //const activeTab = await getActiveTab();
    const tabPosition = activeTab.index + 1;
    const windowInfo = await browser.windows.getCurrent();
    await displaySearchResults(id, tabPosition, multisearch, windowInfo.id);
}

async function handleSetTargetUrl(data) {
    const nativeMessagingEnabled = await browser.permissions.contains({ permissions: ['nativeMessaging'] });
    let showVideoDownloadMenu;
    if (data) targetUrl = data;
    if (logToConsole) console.log(`TargetUrl: ${targetUrl}`);
    if (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be') || targetUrl.includes('youtube-nocookie.com') || targetUrl.includes('vimeo.com')) {
        showVideoDownloadMenu = true;
    } else {
        showVideoDownloadMenu = false;
    }
    await browser.menus.update('cs-download-video', {
        visible: nativeMessagingEnabled && showVideoDownloadMenu
    });
    await browser.menus.update('cs-reverse-image-search', {
        visible: !showVideoDownloadMenu
    });
    await browser.menus.update('cs-google-lens', {
        visible: !showVideoDownloadMenu
    });
}

async function handleExecuteAISearch(data) {
    const { aiEngine, prompt } = data;
    const id = 'chatgpt-direct';
    const options = await getOptions();
    const windowInfo = await browser.windows.getCurrent();
    const tabs = await queryAllTabs();
    let tabPosition;
    if (logToConsole) console.log(tabs);
    if (options.tabMode === 'openNewTab' && options.lastTab) {
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
    // Debug: verify that storage space occupied is within limits
    if (logToConsole) {
        // Inform on storage space being used by storage sync
        const bytesUsed = await browser.storage.sync
            .getBytesInUse(null)
            .catch((err) => {
                console.error(err);
                console.log('Failed to retrieve storage space used by storage sync.');
            });
        console.log(`Bytes used by storage sync: ${bytesUsed} bytes.`);

        // Inform on storage space being used by local storage
        const items = await browser.storage.local.get(null);
        console.log(
            `Bytes used by local storage: ${JSON.stringify(items).length} bytes.`
        );
    }

    await checkNotificationsPermission();

    // Fetch CORS API URL and key from config file
    const config = await fetchConfig();
    CORS_API_URL = config.API_URL;
    CORS_API_KEY = config.API_KEY;

    // Update when the extension loads initially
    updateAddonStateForActiveTab();

    // Initialize options and search engines
    await initialiseOptionsAndSearchEngines();
}

// Check if notifications are enabled
async function checkNotificationsPermission() {
    notificationsEnabled = await browser.permissions.contains({ permissions: ["notifications"] });
    if (logToConsole) console.log(`${notificationsEnabled ? 'Notifications enabled.' : 'Notifications disabled.'}`);
}

/// Reset extension
// Resets the options to the default list if options.resetPreferences is set
// Resets the list of search engines to the default list if options.forceSearchEnginesReload is set
// Force favicons to be reloaded if options.forceFaviconsReload is set
async function reset() {
    if (logToConsole) {
        console.log(
            "Resetting extension's preferences and search engines as per user reset preferences."
        );
    }
    await initialiseOptionsAndSearchEngines();
    return "resetCompleted";
}

// Fetches a favicon for the new search engine
async function addNewSearchEngine(id, domain) {
    // Add a favicon to the search engine except if it's a separator or a folder
    if (!id.startsWith("separator-")) {
        if (searchEngines[id].isFolder) {
            searchEngines[id]['imageFormat'] = 'image/png';
            searchEngines[id]['base64'] = base64FolderIcon;
        } else {
            const favicon = await getNewFavicon(id, domain);
            searchEngines[id]['imageFormat'] = favicon.imageFormat;
            searchEngines[id]['base64'] = favicon.base64;
        }
    }
    searchEngines['root']['children'].push(id);
    // Save the search engine to local storage
    await browser.storage.local.set(searchEngines);
    await buildContextMenu();
    if (notificationsEnabled) notify(notifySearchEngineAdded);
}

async function handlePageAction(tab) {
    let message = { action: 'getSearchEngine', data: '' };
    await sendMessageToTab(tab, message);
}

async function initialiseOptionsAndSearchEngines() {
    /// Initialise options
    let options = {};
    let data = await browser.storage.sync.get().catch((err) => {
        if (logToConsole) {
            console.error(err);
            console.log('Failed to retrieve data from storage sync.');
        }
    });

    if (data.options) {
        options = data.options;
        delete data['options'];
    }

    // If there are no options stored in storage sync or reset preferences is set, then use default options
    // Otherwise clear storage sync and only save options in storage sync
    if (isEmpty(options) || options.resetPreferences) {
        options = DEFAULT_OPTIONS;
    } else {
        await browser.storage.sync.clear();
    }
    options['logToConsole'] = logToConsole;
    if (logToConsole) console.log(options);
    await saveOptions(options, false);

    /// Initialise search engines
    // If there were search engines stored in storage sync (legacy), move them to storage local
    if (!isEmpty(data) && Object.keys(data).length > 1) {
        searchEngines = data;
    } else {
        // Check for search engines in local storage
        searchEngines = await browser.storage.local.get();
        if (searchEngines === undefined || isEmpty(searchEngines) || options.forceSearchEnginesReload) {
            // Load default search engines if force reload is set or if no search engines are stored in local storage
            await loadDefaultSearchEngines(DEFAULT_SEARCH_ENGINES);
        }
    }

    initSearchEngines();
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
    searchEngines['root'] = {
        index: 0,
        name: 'Root',
        isFolder: true,
        children: []
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
        if (id === 'root') continue;
        if (!searchEngines[id].isFolder && searchEngines[id].keyboardShortcut === undefined) {
            searchEngines[id]['keyboardShortcut'] = '';
            if (logToConsole) {
                console.log(`Search engine id: ${id}`);
                console.log(`Keyboard shortcut: ${searchEngines[id].keyboardShortcut}`);
            }
        }
    }
}

async function getOptions() {
    const data = await browser.storage.sync.get();
    const options = data.options;
    return options;
}

async function saveOptions(options, blnBuildContextMenu) {
    try {
        await browser.storage.sync.set({ options });
        if (logToConsole) console.log(options);
        if (blnBuildContextMenu) await buildContextMenu();
        if (logToConsole) console.log('Successfully saved the options to storage sync.');
    } catch (err) {
        if (logToConsole) {
            console.error(err);
            console.log('Failed to save options to storage sync.');
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
    } catch (error) {
        if (logToConsole) console.error(error.message);
    }
}

async function saveSearchEnginesToLocalStorage() {
    if (logToConsole) {
        console.log('Saving search engines to local storage:\n');
        console.log(searchEngines);
    }

    try {
        // Clear local storage
        await browser.storage.local.clear();
        if (logToConsole) console.log('Local storage cleared.');
        // Save search engines to local storage
        await browser.storage.local.set(searchEngines);
        if (notificationsEnabled) notify(notifySearchEnginesLoaded);
        if (logToConsole) {
            console.log(
                'Search engines have been successfully saved to local storage.'
            );
        }
    } catch (error) {
        if (logToConsole) {
            console.error(error.message);
            console.log('Failed to save the search engines to local storage.');
        }
    }
}

/// Fetch and store favicon image format and base64 representation to searchEngines
async function getFaviconsAsBase64Strings() {
    if (logToConsole) console.log('Fetching favicons..');
    const options = await getOptions();
    let arrayOfPromises = [];

    for (let id in searchEngines) {
        // If search engine is a separator or the root folder, skip it
        if (id.startsWith('separator-') || id === 'root') continue;

        // Fetch a new favicon only if there is no existing favicon or if an favicon reload is being forced
        if (
            searchEngines[id].base64 === null ||
            searchEngines[id].base64 === undefined ||
            searchEngines[id].base64.length < 10 ||
            options.forceFaviconsReload
        ) {
            if (logToConsole) console.log('Fetching favicon for ' + id);
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
    let reqHeader = new Headers();
    reqHeader.append('Content-Type', 'text/plain; charset=UTF-8');
    reqHeader.append('x-api-key', CORS_API_KEY);
    const initObject = {
        method: 'GET',
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
        if (b64 === '') {
            b64 = base64ContextSearchIcon;
            imageFormat = 'image/png';
        }
        if (logToConsole) console.log(imageFormat, b64);
        return { id: id, imageFormat: imageFormat, base64: b64 };
    } catch (error) {
        if (logToConsole) console.error(error.message);
        if (logToConsole) console.log('Failed to retrieve new favicon.');
        // Failed to retrieve a favicon, proceeding with default CS icon
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
        case 'google-ai-studio':
            imageFormat = 'image/svg+xml';
            b64 = base64GoogleAIStudio;
            break;
        case 'perplexity':
            imageFormat = 'image/png';
            b64 = base64perplexity;
            break;
        case 'poe':
            imageFormat = 'image/png';
            b64 = base64poe;
            break;
        case 'claude':
            imageFormat = 'image/png';
            b64 = base64claude;
            break;
        case 'you':
            imageFormat = 'image/png';
            b64 = base64you;
            break;
        case 'andi':
            imageFormat = 'image/png';
            b64 = base64andi;
            break;
        case 'exa':
            imageFormat = 'image/x-icon';
            b64 = base64exa;
            break;
        default:
            imageFormat = 'image/svg+xml';
            b64 = base64ContextSearchIcon;
    }
    return { id: id, imageFormat: imageFormat, base64: b64 };
}

function addClickListener() {
    menuClickHandler = async (info, tab) => {
        if (logToConsole) console.log('Opening the sidebar.');
        browser.sidebarAction.open();
        await handleMenuClick(info, tab);
    }
    browser.menus.onClicked.addListener(menuClickHandler);
}

function removeClickListener() {
    if (menuClickHandler) {
        browser.menus.onClicked.removeListener(menuClickHandler);
        menuClickHandler = null;
    }
}

async function handleMenuClick(info, tab) {
    const id = (info.menuItemId.startsWith('cs-')) ? info.menuItemId.replace('cs-', '') : info.menuItemId;
    const ignoreIds = ['download-video', 'reverse-image-search', 'google-lens', 'options', 'multitab', 'match', 'ai-search'];
    const options = await getOptions();

    if (logToConsole) console.log('Clicked on ' + id);

    if (options.tabMode === 'openSidebar' && !ignoreIds.includes(id)) {
        await browser.sidebarAction.setPanel({ panel: '' });
    }

    await processSearch(info, tab);
}

// Build the context menu using the search engines from local storage
async function buildContextMenu() {
    if (logToConsole) console.log('Building context menu..');
    // const info = await browser.runtime.getBrowserInfo();
    // const v = info.version;
    // const browserVersion = parseInt(v.slice(0, v.search('.') - 1));
    const rootChildren = searchEngines['root'].children;
    const options = await getOptions();

    // Start of functions for building the context menu

    const buildContextOptionsMenu = () => {
        if (options.optionsMenuLocation === 'bottom') {
            browser.menus.create({
                id: 'cs-separator',
                type: 'separator',
                contexts: ['selection'],
            });
        }
        browser.menus.create({
            id: 'cs-match',
            type: 'checkbox',
            title: titleExactMatch,
            contexts: ['selection'],
            checked: options.exactMatch,
        });
        browser.menus.create({
            id: 'cs-multitab',
            title: titleMultipleSearchEngines,
            contexts: ['selection'],
        });
        browser.menus.create({
            id: 'cs-ai-search',
            title: titleAISearch + '...',
            contexts: ['all'],
        });
        browser.menus.create({
            id: 'cs-site-search',
            title: `${titleSiteSearch} ${options.siteSearch}`,
            contexts: ['selection'],
        });
        browser.menus.create({
            id: 'cs-options',
            title: titleOptions + '...',
            contexts: ['selection'],
        });
        if (options.optionsMenuLocation === 'top') {
            browser.menus.create({
                id: 'cs-separator',
                type: 'separator',
                contexts: ['selection'],
            });
        }
    }

    // Build a single context menu item
    const buildContextMenuItem = (id, parentId) => {
        const createMenuItem = (id, title, contexts, parentId, faviconUrl) => {
            if (options.displayFavicons === true) {
                if (parentId === 'root') {
                    browser.menus.create({
                        id: id,
                        title: title,
                        contexts: contexts,
                        icons: { 20: faviconUrl },
                    }, () => onCreated(id));
                } else {
                    browser.menus.create({
                        id: id,
                        title: title,
                        contexts: contexts,
                        parentId: parentId,
                        icons: { 20: faviconUrl },
                    }, () => onCreated(id));
                }
            } else {
                if (parentId === 'root') {
                    browser.menus.create({
                        id: id,
                        title: title,
                        contexts: contexts,
                    }, () => onCreated(id));
                } else {
                    browser.menus.create({
                        id: id,
                        title: title,
                        contexts: contexts,
                        parentId: parentId,
                    }, () => onCreated(id));
                }
            }
        }

        if (id.startsWith("separator-") && parentId !== 'root') {
            browser.menus.create({
                id: 'cs-' + id,
                parentId: parentId,
                type: 'separator',
                contexts: ['selection'],
            });
            return;
        } else if (id.startsWith("separator-") && parentId === 'root') {
            browser.menus.create({
                id: 'cs-' + id,
                type: 'separator',
                contexts: ['selection'],
            });
            return;
        }
        const searchEngine = searchEngines[id];

        if (searchEngine === undefined || !(searchEngine.show || searchEngine.isFolder)) return;

        //const index = 'cs-' + id;
        const title = searchEngine.name;
        const imageFormat = searchEngine.imageFormat;
        const base64String = searchEngine.base64;
        const faviconUrl = `data:${imageFormat};base64,${base64String}`;
        let contexts;
        if (id.startsWith('link-')) {
            contexts = ['all'];
        } else {
            contexts = ['selection'];
        }

        if (searchEngine.isFolder) {
            createMenuItem(id, title, contexts, parentId, faviconUrl);
            for (let child of searchEngine.children) {
                buildContextMenuItem(child, id);
            }
        } else {
            createMenuItem(id, title, contexts, parentId, faviconUrl);
        }
    }

    // Build the context menu for image searches
    const buildContextMenuForImages = () => {
        browser.menus.create({
            id: 'cs-reverse-image-search',
            title: 'Google Reverse Image Search',
            contexts: ['image'],
        });
        browser.menus.create({
            id: 'cs-google-lens',
            title: 'Google Lens',
            contexts: ['image'],
        });
    }

    // Build the context menu for YouTube video downloads
    const buildContextMenuForVideoDownload = () => {
        browser.menus.create({
            id: 'cs-download-video',
            title: 'Download Video',
            documentUrlPatterns: ['*://*.youtube.com/*', '*://*.youtu.be/*', '*://*.youtube-nocookie.com/*', '*://*.vimeo.com/*'],
            contexts: ['all']
        });
    }
    // End of functions for building the context menu

    if (logToConsole) console.log(`Search engines:`);
    if (logToConsole) console.log(searchEngines);
    if (logToConsole) console.log(`Root children: ${rootChildren}`);

    // Remove listener for context menu clicks
    removeClickListener();

    // Remove all existing context menu items
    browser.menus.removeAll();

    if (options.optionsMenuLocation === 'top') {
        buildContextOptionsMenu();
    }

    for (let id of rootChildren) {
        buildContextMenuItem(id, 'root');
    }

    buildContextMenuForImages();
    buildContextMenuForVideoDownload();

    if (options.optionsMenuLocation === 'bottom') {
        buildContextOptionsMenu();
    }

    // Add listener for context menu clicks
    addClickListener();
}

function onCreated(id) {
    if (browser.runtime.lastError) {
        console.log(`Error: ${browser.runtime.lastError}`);
    } else {
        console.log(`Menu Item ${id} created successfully`);
    }
}

// Perform search based on selected search engine, i.e. selected context menu item
async function processSearch(info, tab) {
    if (logToConsole) console.log(info);
    const windowInfo = await browser.windows.getCurrent();
    const multisearch = false;
    const id = (info.menuItemId.startsWith('cs-')) ? info.menuItemId.replace('cs-', '') : info.menuItemId;
    const options = await getOptions();

    // By default, open the search results right after the active tab
    let tabIndex = tab.index + 1;

    // Cancel search if the selected search engine is a folder
    // This is a precautionary measure as folders can't be clicked in the context menu
    if (searchEngines[id] !== undefined && searchEngines[id].isFolder) return;

    /*    if (info.selectionText !== undefined) {
            // Prefer info.selectionText over selection received by content script for these lengths (more reliable)
            if (info.selectionText.length < 150 || info.selectionText.length > 150) {
                selection = info.selectionText.trim();
            }
        }*/

    // If search engines are set to be opened after the last tab, then adjust the tabIndex
    const tabs = await queryAllTabs();
    // Get the index of the last tab and add 1 to define lastTab
    const lastTab = tabs.length;
    if ((options.tabMode === 'openNewTab' && options.lastTab) || (options.multiMode === 'multiAfterLastTab' && options.tabMode !== 'openNewTab')) {
        tabIndex = lastTab;
    }
    if (id === 'download-video') {
        let url = info.linkUrl
        if (url.includes('vimeo.com')) url = url.replace('https://', 'http://');
        if (logToConsole) console.log(url);
        sendMessageToHostScript(url);
        return;
    }
    if (id === 'reverse-image-search') {
        await displaySearchResults(id, tabIndex, multisearch, windowInfo.id);
        return;
    }
    if (id === 'google-lens') {
        await displaySearchResults(id, tabIndex, multisearch, windowInfo.id);
        return;
    }
    if (id === 'site-search') {
        await displaySearchResults(id, tabIndex, multisearch, windowInfo.id);
        return;
    }
    if (id === 'options') {
        await browser.runtime.openOptionsPage();
        return;
    }
    if (id === 'multitab') {
        await processMultisearch([], tabIndex);
        return;
    }
    if (id === 'match') {
        let options = await getOptions();
        if (logToConsole) {
            console.log(
                `Preferences retrieved from sync storage: ${JSON.stringify(options)}`
            );
        }
        options.exactMatch = !options.exactMatch;
        await saveOptions(options, true);
        return;
    }
    if (id === 'ai-search') {
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

    const searchEngines = await browser.storage.local.get();
    const options = await getOptions();

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
    }

    if (arraySearchEngineUrls.length > 0) {
        multisearchArray = arraySearchEngineUrls;
        // Split multisearchArray into 2 separate arrays: 
        // urlArray for links and search engines using HTTP GET requests; items in multisearchArray corresponding to urls
        // nonUrlArray for AI prompts and search engines using HTTP POST requests; items in multisearchArray starting with 'chatgpt-' and items in multisearchArray saved as {id, url}
        for (let i = 0; i < multisearchArray.length; i++) {
            if (typeof multisearchArray[i] === 'string' && multisearchArray[i].startsWith("http")) {
                urlArray.push(multisearchArray[i]);
            } else if (typeof multisearchArray[i] === 'string' && multisearchArray[i].startsWith("chatgpt-")) {
                aiArray.push(multisearchArray[i]);
            } else if (typeof multisearchArray[i] === 'object' && multisearchArray[i].id && multisearchArray[i].url) {
                postArray.push(multisearchArray[i]);
            }
        }
    } else {
        // Create an array of search engine URLs for all multisearch engines (using HTTP GET requests or AI prompts)
        // If the search engine uses an HTTP POST request, then the array will contain {id, url} for that search engine instead of just a url
        // Sort search results in the order that search engines appear in the options page
        await getSearchEnginesFromFolder('root');
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

    if (notificationsEnabled && isEmpty(multisearchArray)) {
        notify('No search engines have been selected for a multisearch.');
        return;
    }
    if (isEmpty(multisearchArray)) return;

    // Open search results in a new window
    if (options.multiMode === 'multiNewWindow') {
        windowInfo = await browser.windows.create({
            allowScriptsToClose: true,
            titlePreface: windowTitle + "'" + selection + "'",
            focused: options.tabActive,
            incognito: options.privateMode,
            url: urlArray
        });
        // Set the tab position in the new window to the last tab
        tabPosition = windowInfo.tabs.length;
    } else if (options.multiMode !== 'multiNewWindow') {
        // Open search results in the current window
        const tabs = await queryAllTabs();
        //const activeTab = await getActiveTab();
        if (logToConsole) console.log(tabs);
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

    // Process the remaaining non-URL array of search engines (using HTTP POST requests or AI prompts)
    if (nonUrlArray.length > 0) {
        if (logToConsole) console.log(`Opening HTTP POST requests & AI search results in window ${windowInfo.id} at tab position ${tabPosition}`);
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
                index: newTabIndex
            });
        } catch (error) {
            console.error(`Error opening tab for URL ${url}:`, error);
        }
    }
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
            await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
            // If the search engine uses HTTP POST request
            const id = nonUrlArray[i].id;
            const url = nonUrlArray[i].url;
            targetUrl = url.replace('{searchTerms}', encodeUrl(selection));
            await displaySearchResults(id, tabIndex, multisearch, windowId);
        }
    }
}

// Handle search terms if there are any
async function getSearchEngineUrl(searchEngineUrl, sel) {
    const options = await getOptions();
    let quote = '';
    if (options.exactMatch) quote = '%22';
    if (searchEngineUrl.includes('{searchTerms}')) {
        return searchEngineUrl.replace(/{searchTerms}/g, encodeUrl(sel));
    } else if (searchEngineUrl.includes('%s')) {
        return searchEngineUrl.replace(/%s/g, encodeUrl(sel));
    } else {
        return searchEngineUrl + quote + encodeUrl(sel) + quote;
    }
}

async function setTargetUrl(id, aiEngine = '') {
    const options = await getOptions();
    if (logToConsole) console.log('Active tab is:');
    if (logToConsole) console.log(activeTab);
    if (id === 'reverse-image-search') {
        return googleReverseImageSearchUrl + targetUrl;
    }
    if (id === 'google-lens') {
        return googleLensUrl + targetUrl;
    }
    if (id === 'site-search' || (id.startsWith('link-') && !searchEngines[id].url.startsWith('javascript:'))) {
        let quote = '';
        if (options.exactMatch) quote = '%22';
        const domain = getDomain(activeTab.url).replace(/https?:\/\//, '');
        return options.siteSearchUrl +
            encodeUrl(`site:https://${domain} ${quote}${selection}${quote}`);
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
        case 'google-ai-studio':
            providerUrl = googleAIStudioUrl;
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
        case 'you':
            providerUrl = youUrl;
            break;
        case 'andi':
            providerUrl = andiUrl;
            break;
        case 'exa':
            providerUrl = exaUrl;
            break;
        default:
            providerUrl = chatGPTUrl;
    }
    return providerUrl;
}

// Display the search results for a single search (link, HTTP POST or GET request, or AI prompt)
async function displaySearchResults(id, tabPosition, multisearch, windowId, aiEngine = '', prompt = '') {
    const options = await getOptions();
    targetUrl = await setTargetUrl(id, aiEngine);
    const postDomain = getDomain(targetUrl);
    let searchEngine, url;
    if (id.startsWith('chatgpt-')) {
        promptText = getPromptText(id, prompt);
    }
    if (id !== 'chatgpt-direct') {
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
    if (multisearch && id.startsWith('link-') && url.startsWith('javascript:')) return;

    if (id.startsWith('link-') && url.startsWith('javascript:')) {
        url = url.replace('javascript:', '');
        if (url.includes('%s')) {
            url = url.replace('%s', selection);
        }
        if (url.includes('{searchTerms}')) {
            url = url.replace('{searchTerms}', selection);
        }
        if (logToConsole) console.log(`Code: ${url}`);
        await browser.tabs.executeScript(activeTab.id, { code: url });
        return;
    }

    if (logToConsole && searchEngine) console.log(`Opening tab at index ${tabPosition} for ${searchEngine.name} at ${url} in window ${windowId}`);

    if (!multisearch && options.tabMode === 'openSidebar') {
        if (url === getDomain(url)) {
            url += '/';
        }
        let suffix = (id === 'reverse-image-search' || id === 'google-lens' || id.startsWith('chatgpt-')) ? '' : '#_sidebar';
        let tabUrl = url + suffix;

        if (logToConsole) console.log(tabUrl);

        // If single search and open in sidebar
        browser.sidebarAction.setPanel({ panel: tabUrl });
        browser.sidebarAction.setTitle({ title: 'Search results' });
    } else if (!multisearch && options.tabMode === 'openNewWindow') {
        // If single search and open in new window
        // If search engine is link, uses HTTP GET or POST request or is AI prompt
        if (logToConsole) console.log(`Make new tab or window active: ${options.tabActive}`);
        await browser.windows.create({
            titlePreface: windowTitle + "'" + selection + "'",
            focused: options.tabActive,
            url: url,
            incognito: options.privateMode
        });

        // If the new window shouldn't be active, then make the old window active
        if (!options.tabActive) {
            browser.windows.update(windowId, { focused: true });
        }
    } else if (!multisearch && options.tabMode === 'openNewTab') {
        // If single search and open in current window
        // If search engine is a link, uses HTTP GET or POST request or is AI prompt
        if (logToConsole) {
            console.log(`Opening search results in a new tab, url is ${url}`);
        }
        await browser.tabs.create({
            active: options.tabActive,
            index: tabPosition,
            url: url
        });
    } else if (multisearch) {
        await browser.tabs.create({
            active: options.tabActive,
            index: tabPosition,
            url: url,
            windowId: windowId
        });
    } else {
        // Open search results in the same tab
        if (logToConsole) {
            console.log(`Opening search results in same tab, url is ${url}`);
        }
        await browser.tabs.update(activeTab.id, {
            url: url
        });
    }
}

function getPromptText(id, prompt) {
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
    let data = '';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Timeout set to 10 seconds

    try {
        const response = await fetch(targetUrl, {
            method: 'POST',
            body: finalFormData,
            signal: controller.signal // Signal for aborting the fetch on timeout
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
                action: "displaySearchResults",
                data: data
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
    if (input.indexOf(' ') > 0) {
        const suggestion = await buildSuggestion(input);
        if (suggestion.length === 1) {
            suggest(suggestion);
        }
    }
});

// Open the page based on how the user clicks on a suggestion
browser.omnibox.onInputEntered.addListener(async (input) => {
    if (logToConsole) console.log(`Input entered: ${input}`);
    const aiEngines = ['chatgpt', 'google', 'perplexity', 'poe', 'claude', 'you', 'andi', 'exa'];
    const multisearch = false;
    const keyword = input.split(' ')[0];
    const suggestion = await buildSuggestion(input);
    const windowInfo = await browser.windows.getCurrent();
    const options = await getOptions();
    let searchTerms = input.replace(keyword, '').trim();

    // Check if the search terms contain '%s' or '{searchTerms}'
    if (searchTerms.includes('{searchTerms}')) {
        searchTerms = searchTerms.replace(/{searchTerms}/g, selection);
    } else if (searchTerms.includes('%s')) {
        searchTerms = searchTerms.replace(/%s/g, selection);
    }

    selection = searchTerms.trim();

    // tabPosition is used to determine where to open the search results for a multisearch
    let tabIndex, tabPosition, tabId, id, aiEngine = '';

    if (logToConsole) console.log(`Keyword is: ${keyword}`);
    if (logToConsole) console.log(`Search terms are: ${searchTerms}`);
    if (logToConsole) console.log('Suggestion is: ');
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
            id = 'chatgpt-direct';
            aiEngine = keyword;
        }
    }

    // Get active tab's index and id
    const tabs = await queryAllTabs();
    //const activeTab = await getActiveTab();
    tabIndex = activeTab.index;
    tabId = activeTab.id;

    tabPosition = tabIndex + 1;

    if (options.lastTab || options.multiMode === 'multiAfterLastTab') {
        tabPosition = tabs.length;
    }

    if (logToConsole) console.log(tabPosition);
    if (logToConsole) console.log(input.indexOf('://'));

    // Only display search results when there is a valid link inside of the url variable
    if (input.indexOf('://') > -1) {
        if (logToConsole) console.log('Processing search...');
        await displaySearchResults(id, tabPosition, multisearch, windowInfo.id);
    } else {
        try {
            switch (keyword) {
                case '.':
                    browser.runtime.openOptionsPage();
                    break;
                case '!':
                    await processMultisearch([], tabPosition);
                    break;
                case 'bookmarks':
                case '!b':
                    if (searchTerms === 'recent') {
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
                        url: '/html/bookmarks.html',
                    });
                    break;
                case 'history':
                case '!h':
                    historyItems = await browser.history.search({ text: searchTerms });
                    await browser.storage.local.set({
                        historyItems: historyItems,
                        searchTerms: searchTerms,
                    });
                    await browser.tabs.create({
                        active: options.tabActive,
                        index: tabPosition,
                        url: '/html/history.html',
                    });
                    break;
                default:
                    if (suggestion.length > 1) {
                        let arraySearchEngineUrls = [];
                        for (const s of suggestion) {
                            arraySearchEngineUrls.push(s.content);
                        }
                        await processMultisearch(arraySearchEngineUrls, tabPosition);
                    }
                    else if (suggestion.length === 1 && ((searchEngines[id] && !searchEngines[id].isFolder) || aiEngines.includes(suggestion[0].content))) {
                        if (typeof (suggestion[0].content) === 'string') {
                            // If AI prompt or search engine uses HTTP GET or POST request
                            await displaySearchResults(id, tabPosition, multisearch, windowInfo.id, aiEngine, searchTerms);
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
            if (logToConsole) console.log('Failed to process ' + input);
        }
    }
});

async function processFolder(id, searchTerms) {
    let multiTabArray = [];
    for (const childId of searchEngines[id].children) {
        if (searchEngines[childId].isFolder) {
            // If search engine is a folder
            multiTabArray.push(...await processFolder(childId, searchTerms));
        } else {
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
            const options = await getOptions();
            let quote = '';
            if (options.exactMatch) quote = '%22';
            const domain = getDomain(searchEngineUrl).replace(/https?:\/\//, '');
            result = options.siteSearchUrl +
                encodeUrl(`site:https://${domain} ${quote}${selection}${quote}`);
        } else if (!searchEngines[id].formData) {
            // If search engine uses HTTP GET request
            result = await getSearchEngineUrl(searchEngineUrl, searchTerms);
        } else {
            // If search engine uses HTTP POST request
            result = { id: id, url: searchEngineUrl };
        }
    }
    return result;
}

async function buildSuggestion(text) {
    const aiEngines = ['chatgpt', 'google', 'perplexity', 'poe', 'claude', 'you', 'andi', 'exa'];
    const keyword = text.split(' ')[0];
    const searchTerms = text.replace(keyword, '').trim();
    const options = await getOptions();
    let result = [];
    let quote = '';
    let showNotification = true;

    if (options.exactMatch) quote = '%22';

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
                content: '',
                description: 'Perform multisearch for ' + searchTerms,
            },
        ];
        return suggestion;
    } else if (keyword === '.') {
        const suggestion = [
            {
                content: '',
                description: 'Open options page',
            },
        ];
        return suggestion;
    } else if (keyword === '!b' || keyword === 'bookmarks') {
        const suggestion = [
            {
                content: '',
                description: 'Search bookmarks',
            },
        ];
        return suggestion;
    } else if (keyword === '!h' || keyword === 'history') {
        const suggestion = [
            {
                content: '',
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
                suggestion['description'] =
                    'Search ' + searchEngines[id].name + ' ' + searchTerms;
                suggestion['content'] = targetUrl; // AI provider URL
            } else if (searchEngines[id].isFolder) {
                // If search engine is a folder
                suggestion['description'] =
                    'Perform multisearch using search engines in ' + searchEngines[id].name + ' for ' + searchTerms;
                suggestion['content'] = '';
            } else {
                const searchEngineUrl = searchEngines[id].url;
                suggestion['description'] =
                    'Search ' + searchEngines[id].name + ' for ' + searchTerms;
                if (!searchEngines[id].formData) {
                    // If search engine uses GET request
                    if (searchEngineUrl.includes('{searchTerms}')) {
                        targetUrl = searchEngineUrl.replace(
                            /{searchTerms}/g,
                            encodeUrl(searchTerms)
                        );
                    } else if (searchEngineUrl.includes('%s')) {
                        targetUrl = searchEngineUrl.replace(/%s/g, encodeUrl(searchTerms));
                    } else {
                        targetUrl = searchEngineUrl + quote + encodeUrl(searchTerms) + quote;
                    }
                    suggestion['content'] = targetUrl;
                } else {
                    // If search engine uses POST request
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
    try {
        await browser.tabs.sendMessage(tabId, message);
        if (logToConsole) console.log(`Message sent successfully to tab ${tab.id}: ${tab.title}`);
    } catch (err) {
        if (logToConsole) console.error(err);
        if (logToConsole) console.log(`Failed to send message ${JSON.stringify(message)} to tab ${tab.id}: ${tab.title}`);
    }
}

/// Send message to options page
async function sendMessageToOptionsPage(action, data) {
    await browser.runtime.sendMessage({ action: action, data: JSON.parse(JSON.stringify(data)) })
        .catch(e => {
            if (logToConsole) console.error(e);
        });
}

/// Notifications
function notify(message) {
    browser.notifications.create(message.substring(0, 20), {
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

    let urlParts = url
        .replace('http://', '')
        .replace('https://', '')
        .split(/[/?#]/);
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

// 
async function fetchConfig() {
    const response = await fetch(browser.runtime.getURL('config.json'));
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
            if (logToConsole) console.error("Port disconnected due to error:", error.message);
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
        top: top
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
        top: top
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
        top: top
    });
}

/*
 * Updates the browserAction icon to reflect whether the current page
 * is already bookmarked.
 */
function updateIcon() {
    browser.browserAction.setIcon({
        path: bookmarked ? {
            48: "/icons/bookmark-red-icon.svg"
        } : {
            48: "/icons/bookmark-grey-icon.svg"
        },
        tabId: activeTab.id
    });
    browser.browserAction.setTitle({
        // Screen readers can see the title
        title: bookmarked ? "Unbookmark the active tab from Context Search" : "Bookmark the active tab to Context Search",
        tabId: activeTab.id
    });
}

/*
 * Switches currentTab and currentBookmark to reflect the currently active tab
 */
async function updateAddonStateForActiveTab() {

    function isSupportedProtocol(urlString) {
        const supportedProtocols = ["https:", "http:", "ftp:", "file:", "javascript:"];
        const url = document.createElement('a');
        url.href = urlString;
        return supportedProtocols.indexOf(url.protocol) !== -1;
    }

    function updateTab() {
        let links = [];
        if (activeTab) {
            if (isSupportedProtocol(activeTab.url)) {
                for (const id in searchEngines) {
                    if (id.startsWith('link-')) {
                        links.push(searchEngines[id].url);
                    }
                }
                if (links.includes(activeTab.url)) {
                    bookmarked = true;
                } else {
                    bookmarked = false;
                }
                updateIcon();
            } else {
                if (logToConsole && activeTab.url !== 'about:blank') console.log(`The '${activeTab.url}' URL cannot be bookmarked.`)
            }
        }
    }

    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    activeTab = tabs[0];
    updateTab();
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