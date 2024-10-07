/// Constants
// User agent for sidebar search results
export const USER_AGENT_FOR_SIDEBAR =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/12.0 Mobile/15A372 Safari/604.1';
export const DEFAULT_SEARCH_ENGINES = 'defaultSearchEngines.json';

// This is a RequestFilter: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/RequestFilter
// It matches tabs that aren't attached to a normal location (like a sidebar)
// It only matches embedded iframes
export const REQUEST_FILTER = {
    tabId: -1,
    types: ['main_frame'],
    urls: ['http://*/*', 'https://*/*'],
};

// Constants for translations
export const titleMultipleSearchEngines = browser.i18n.getMessage(
    'titleMultipleSearchEngines'
);
export const titleAISearch = browser.i18n.getMessage('titleAISearch');
export const titleSiteSearch = browser.i18n.getMessage('titleSiteSearch');
export const titleExactMatch = browser.i18n.getMessage('exactMatch');
export const titleOptions = browser.i18n.getMessage('titleOptions');
export const windowTitle = browser.i18n.getMessage('windowTitle');
export const omniboxDescription = browser.i18n.getMessage('omniboxDescription');
export const notifySearchEnginesLoaded = browser.i18n.getMessage(
    'notifySearchEnginesLoaded'
);
export const notifySearchEngineAdded = browser.i18n.getMessage(
    'notifySearchEngineAdded'
);
export const notifyUsage = browser.i18n.getMessage('notifyUsage');
export const notifySearchEngineWithKeyword = browser.i18n.getMessage(
    'notifySearchEngineWithKeyword'
);
export const notifyUnknown = browser.i18n.getMessage('notifyUnknown');
export const notifySearchEngineUrlRequired = browser.i18n.getMessage(
    'notifySearchEngineUrlRequired'
);

// Default settings
export const DEFAULT_OPTIONS = {
    exactMatch: false,
    tabMode: 'openNewTab',
    optionsMenuLocation: 'bottom',
    tabActive: false,
    lastTab: false,
    displayFavicons: true,
    quickIconGrid: false,
    closeGridOnMouseOut: true,
    offsetX: 12,
    offsetY: 12,
    disableAltClick: false,
    forceSearchEnginesReload: false,
    resetPreferences: false,
    forceFaviconsReload: false,
    siteSearch: 'Google',
    siteSearchUrl: 'https://www.google.com/search?q=',
    multiMode: 'multiNewWindow',
    privateMode: false,
    overwriteSearchEngines: false
};
