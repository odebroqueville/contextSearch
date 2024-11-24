/// Constants
// User agent for sidebar search results
const USER_AGENT_FOR_SIDEBAR =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/12.0 Mobile/15A372 Safari/604.1';
const USER_AGENT_FOR_GOOGLE = 'Mozilla/5.0 (Linux; Android 13; G8VOU Build/TP1A.220905.004;wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chromium/104.0.5112.97; Mobile Safari/537.36';

export const BACKUP_ALARM_NAME = 'persistDataAlarm';

// File containing default list of search engines
export const DEFAULT_SEARCH_ENGINES = 'defaultSearchEngines.json';

// Persistent data keys
export const STORAGE_KEYS = {
    OPTIONS: 'options',
    SEARCH_ENGINES: 'searchEngines',
    NOTIFICATIONS_ENABLED: 'notificationsEnabled',
    LOG_TO_CONSOLE: 'logToConsole',
};

// Rules for modifying User-Agent headers based on URL patterns
export const HEADER_RULES = [
    {
        // Rule for Google image search
        id: 1,
        priority: 2,
        action: {
            type: 'modifyHeaders',
            requestHeaders: [
                {
                    header: 'User-Agent',
                    operation: 'set',
                    value: USER_AGENT_FOR_GOOGLE
                }
            ]
        },
        condition: {
            regexFilter: '.*google\\.com/.*(searchbyimage|tbs=sbi:|webhp.*tbs=sbi:).*',
            resourceTypes: ['main_frame', 'sub_frame']
        }
    },
    {
        // Rule for YouTube
        id: 2,
        priority: 2,
        action: {
            type: 'modifyHeaders',
            requestHeaders: [
                {
                    header: 'User-Agent',
                    operation: 'set',
                    value: USER_AGENT_FOR_GOOGLE
                }
            ]
        },
        condition: {
            urlFilter: '*youtube.com/*',
            resourceTypes: ['main_frame', 'sub_frame']
        }
    },
    {
        // Default rule for sidebar mode (lowest priority)
        id: 3,
        priority: 1,
        action: {
            type: 'modifyHeaders',
            requestHeaders: [
                {
                    header: 'User-Agent',
                    operation: 'set',
                    value: USER_AGENT_FOR_SIDEBAR
                }
            ]
        },
        condition: {
            urlFilter: '*',
            excludedInitiatorDomains: ['lens.google.com'],
            resourceTypes: ['main_frame', 'sub_frame']
        }
    }
];

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

// Configuration for option updates
export const UPDATE_CONFIG = {
    searchOptions: {
        fields: ['exactMatch'],
        requiresMenuRebuild: true
    },
    displayFavicons: {
        fields: ['displayFavicons'],
        requiresMenuRebuild: true
    },
    quickIconGrid: {
        fields: ['quickIconGrid'],
        requiresMenuRebuild: false
    },
    closeGridOnMouseOut: {
        fields: ['closeGridOnMouseOut'],
        requiresMenuRebuild: false
    },
    offset: {
        fields: ['offsetX', 'offsetY'],
        requiresMenuRebuild: false
    },
    disableAltClick: {
        fields: ['disableAltClick'],
        requiresMenuRebuild: false
    },
    tabMode: {
        fields: ['tabMode', 'tabActive', 'lastTab', 'privateMode'],
        requiresMenuRebuild: false
    },
    overwriteSearchEngines: {
        fields: ['overwriteSearchEngines'],
        requiresMenuRebuild: false
    },
    multiMode: {
        fields: ['multiMode'],
        requiresMenuRebuild: false
    },
    optionsMenuLocation: {
        fields: ['optionsMenuLocation'],
        requiresMenuRebuild: true
    },
    siteSearch: {
        fields: ['siteSearch', 'siteSearchUrl'],
        requiresMenuRebuild: true
    },
    resetOptions: {
        fields: ['forceSearchEnginesReload', 'resetPreferences', 'forceFaviconsReload'],
        requiresMenuRebuild: false,
        customReturn: 'updatedResetOptions'
    }
};