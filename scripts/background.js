'use strict';

/// Global variables
/* global  */
let searchEngines = {};
let searchEnginesArray = [];
let selection = '';
let targetUrl = '';
let lastAddressBarKeyword = '';
let historyItems, bookmarkItems;

/// Constants
// Debug
const logToConsole = false;

//const FIREFOX_VERSION = /rv:([0-9.]+)/.exec(navigator.userAgent)[1];
//const contextsearch_userAgent = `Mozilla/5.0 (Android 4.4; Mobile; rv:${FIREFOX_VERSION}) Gecko/${FIREFOX_VERSION} Firefox/${FIREFOX_VERSION}`;
const contextsearch_userAgent =
	'Mozilla/5.0 (iPhone9,3; U; CPU iPhone OS 10_0_1 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) Version/10.0 Mobile/14A403 Safari/602.1';
const DEFAULT_SEARCH_ENGINES = 'defaultSearchEngines.json';
const base64ContextSearchIcon =
	'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';
// Advanced feature
const defaultRegex = /[\s\S]*/i;

// This is a RequestFilter: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/webRequest/RequestFilter
// It matches tabs that aren't attached to a normal location (like a sidebar)
// It only matches embedded iframes
const requestFilter = {
	tabId: -1,
	types: ['main_frame'],
	urls: ['http://*/*', 'https://*/*']
};

// Constants for translations
const titleMultipleSearchEngines = browser.i18n.getMessage('titleMultipleSearchEngines');
const titleSiteSearch = browser.i18n.getMessage('titleSiteSearch');
const titleExactMatch = browser.i18n.getMessage('exactMatch');
const titleOptions = browser.i18n.getMessage('titleOptions');
const windowTitle = browser.i18n.getMessage('windowTitle');
const omniboxDescription = browser.i18n.getMessage('omniboxDescription');
const notifySearchEnginesLoaded = browser.i18n.getMessage('notifySearchEnginesLoaded');
const notifySearchEngineAdded = browser.i18n.getMessage('notifySearchEngineAdded');
const notifyUsage = browser.i18n.getMessage('notifyUsage');
const notifySearchEngineWithKeyword = browser.i18n.getMessage('notifySearchEngineWithKeyword');
const notifyUnknown = browser.i18n.getMessage('notifyUnknown');
const notifySearchEngineUrlRequired = browser.i18n.getMessage('notifySearchEngineUrlRequired');

/// Preferences - Default settings
let contextsearch_exactMatch = false;
let contextsearch_tabMode = 'openNewTab';
let contextsearch_optionsMenuLocation = 'bottom';
let contextsearch_openSearchResultsInNewTab = true;
let contextsearch_openSearchResultsInLastTab = false;
let contextsearch_makeNewTabOrWindowActive = false;
let contextsearch_openSearchResultsInNewWindow = false;
let contextsearch_openSearchResultsInSidebar = false;
let contextsearch_displayFavicons = true;
let contextsearch_displayExifSummary = true;
let contextsearch_disableAltClick = false;
let contextsearch_forceFaviconsReload = false;
let contextsearch_resetPreferences = false;
let contextsearch_forceSearchEnginesReload = false;
let contextsearch_siteSearch = "Google";
let contextsearch_siteSearchUrl = "https://www.google.com/search?q=";
let contextsearch_useRegex = false;
let contextsearch_multiMode = 'multiNewWindow';
let contextsearch_privateMode = false;
let notificationsEnabled = false;

const defaultOptions = {
	exactMatch: contextsearch_exactMatch,
	tabMode: contextsearch_tabMode,
	tabActive: contextsearch_makeNewTabOrWindowActive,
	lastTab: contextsearch_openSearchResultsInLastTab,
	optionsMenuLocation: contextsearch_optionsMenuLocation,
	displayFavicons: contextsearch_displayFavicons,
	displayExifSummary: contextsearch_displayExifSummary,
	disableAltClick: contextsearch_disableAltClick,
	forceSearchEnginesReload: contextsearch_forceSearchEnginesReload,
	resetPreferences: contextsearch_resetPreferences,
	forceFaviconsReload: contextsearch_forceFaviconsReload,
	siteSearch: contextsearch_siteSearch,
	siteSearchUrl: contextsearch_siteSearchUrl,
	useRegex: contextsearch_useRegex,
	multiMode: contextsearch_multiMode,
	privateMode: contextsearch_privateMode
}

/// Handle Page Action click
browser.pageAction.onClicked.addListener(handlePageAction);

/// Add a mobile header to outgoing requests
browser.webRequest.onBeforeSendHeaders.addListener(
	(info) => {
		if (!contextsearch_openSearchResultsInSidebar) {
			return {};
		}
		let headers = info.requestHeaders;
		for (let i = 0; i < headers.length; i++) {
			let name = headers[i].name.toLowerCase();
			if (name === 'user-agent') {
				headers[i].value = contextsearch_userAgent;
				return { requestHeaders: headers };
			}
		}
		return {};
	},
	requestFilter,
	['blocking', 'requestHeaders']
);

/// Handle Incoming Messages
// Listen for messages from the content or options script
browser.runtime.onMessage.addListener(async (message, sender) => {
	let id = '';
	let domain = '';
	let activeTab, lastTab, activeTabIndex, tabPosition, tabs, options;
	switch (message.action) {
		case 'doSearch':
			id = message.data.id;
			if (logToConsole) console.log('Search engine id: ' + id);
			if (logToConsole) console.log(contextsearch_openSearchResultsInSidebar);
			activeTab = (await browser.tabs.query({ active: true, currentWindow: true }))[0];
			if (logToConsole) console.log('Active tab url: ' + activeTab.url);
			tabs = await browser.tabs.query({ currentWindow: true });
			if (logToConsole) console.log(tabs);
			lastTab = tabs[tabs.length - 1];
			activeTabIndex = activeTab.index;
			if (logToConsole) console.log('Active tab index: ' + activeTabIndex);
			if (contextsearch_multiMode === 'multiAfterLastTab') {
				tabPosition = lastTab.index + 1;
			} else {
				tabPosition = activeTabIndex + 1;
			}
			if (id === 'multisearch') {
				processMultiTabSearch(tabPosition);
				return;
			}
			if (contextsearch_openSearchResultsInSidebar) {
				searchUsing(id, null);
				return;
			}
			if (contextsearch_openSearchResultsInLastTab) activeTabIndex = lastTab.index;
			searchUsing(id, activeTabIndex + 1);
			break;
		case 'notify':
			if (notificationsEnabled) notify(message.data);
			break;
		case 'setSelection':
			if (logToConsole) console.log(`Selected text: ${message.data}`);
			selection = message.data;
			break;
		case 'reset':
			reset();
			break;
		case 'setTargetUrl':
			if (message.data) {
				targetUrl = message.data;
			}
			break;
		case 'testSearchEngine':
			testSearchEngine(message.data);
			break;
		case 'saveSearchEngines':
			searchEngines = sortByIndex(message.data);
			if (logToConsole) console.log(searchEngines);
			await browser.storage.local.clear()
				.catch((err) => {
					if (logToConsole) {
						console.error(err);
						console.log('Failed to clear local storage.');
					}
				});
			await saveSearchEnginesToLocalStorage(false);
			rebuildContextMenu();
			break;
		case 'addNewSearchEngine':
			id = message.data.id;
			domain = getDomain(message.data.searchEngine.url);
			if (logToConsole) console.log(id, domain);
			searchEngines[id] = message.data.searchEngine;
			searchEngines = sortByIndex(searchEngines);
			await addNewSearchEngine(id, domain);
			break;
		case 'updateSearchOptions':
			options = await getOptions();
			if (logToConsole) {
				console.log(`Preferences retrieved from sync storage: ${JSON.stringify(options)}`);
			}
			options.exactMatch = message.data.exactMatch;
			setExactMatch(options);
			await saveOptions(options, true);
			break;
		case 'updateDisplayFavicons':
			options = await getOptions();
			if (logToConsole) {
				console.log(`Preferences retrieved from sync storage: ${JSON.stringify(options)}`);
			}
			options.displayFavicons = message.data.displayFavicons;
			setDisplayFavicons(options);
			await saveOptions(options, true);
			break;
		case 'updateDisplayExifSummary':
			options = await getOptions();
			if (logToConsole) {
				console.log(`Preferences retrieved from sync storage: ${JSON.stringify(options)}`);
			}
			options.displayExifSummary = message.data.displayExifSummary;
			setDisplayExifSummary(options);
			await saveOptions(options, false);
			break;
		case 'updateDisableAltClick':
			options = await getOptions();
			if (logToConsole) {
				console.log(`Preferences retrieved from sync storage: ${JSON.stringify(options)}`);
			}
			options.disableAltClick = message.data.disableAltClick;
			setDisableAltClick(options);
			await saveOptions(options, false);
			break;
		case 'updateTabMode':
			options = await getOptions();
			if (logToConsole) {
				console.log(`Preferences retrieved from sync storage: ${JSON.stringify(options)}`);
			}
			options.tabMode = message.data.tabMode;
			options.tabActive = message.data.tabActive;
			options.lastTab = message.data.lastTab;
			options.privateMode = message.data.privateMode;
			setTabMode(options);
			await saveOptions(options, false);
			break;
		case 'updateMultiMode':
			options = await getOptions();
			if (logToConsole) {
				console.log(`Preferences retrieved from sync storage: ${JSON.stringify(options)}`);
			}
			options.multiMode = message.data.multiMode;
			setMultiMode(options);
			await saveOptions(options, false);
			break;
		case 'updateOptionsMenuLocation':
			options = await getOptions();
			if (logToConsole) {
				console.log(`Preferences retrieved from sync storage: ${JSON.stringify(options)}`);
			}
			options.optionsMenuLocation = message.data.optionsMenuLocation;
			setOptionsMenuLocation(options);
			await saveOptions(options, true);
			break;
		case 'updateSiteSearchSetting':
			options = await getOptions();
			if (logToConsole) {
				console.log(`Preferences retrieved from sync storage: ${JSON.stringify(options)}`);
			}
			options.siteSearch = message.data.siteSearch;
			options.siteSearchUrl = message.data.siteSearchUrl;
			setSiteSearchSetting(options);
			await saveOptions(options, true);
			break;
		case 'updateResetOptions':
			options = await getOptions();
			if (logToConsole) {
				console.log('Preferences retrieved from sync storage:');
				console.log(options);
			}
			options.forceSearchEnginesReload = message.data.resetOptions.forceSearchEnginesReload;
			options.resetPreferences = message.data.resetOptions.resetPreferences;
			options.forceFaviconsReload = message.data.resetOptions.forceFaviconsReload;
			setResetOptions(options);
			await saveOptions(options, false);
			break;
		case 'updateUseRegex':
			options = await getOptions();
			if (logToConsole) {
				console.log(`Preferences retrieved from sync storage: ${JSON.stringify(options)}`);
			}
			options.useRegex = message.data.useRegex;
			setUseRegex(options);
			await saveOptions(options, true);
			break;
		case 'saveSearchEnginesToDisk':
			browser.downloads.download({
				url: message.data,
				saveAs: true,
				filename: 'searchEngines.json'
			});
			break;
		case 'hidePageAction':
			browser.pageAction.hide(sender.tab.id);
			break;
		case 'showPageAction':
			browser.pageAction.show(sender.tab.id);
			break;
		default:
			break;
	}
});

/// Initialize extension
// Initialize search engines, only setting to default if not previously set
// Check if options are set in sync storage and set to default if not
async function init() {
	// Debug: verify that storage space occupied is within limits
	if (logToConsole) {
		// Inform on storage space being used by storage sync
		const bytesUsed = await browser.storage.sync.getBytesInUse(null)
			.catch((err) => {
				console.error(err);
				console.log('Failed to retrieve storage space used by storage sync.');
			});
		console.log(`Bytes used by storage sync: ${bytesUsed} bytes.`);

		// Inform on storage space being used by local storage
		const items = await browser.storage.local.get(null);
		console.log(`Bytes used by local storage: ${JSON.stringify(items).length} bytes.`);
	}

	notificationsEnabled = (await navigator.permissions.query({ name: 'notifications' })).state === 'granted';

	// Initialize options and search engines
	await initialiseOptionsAndSearchEngines(false);
	rebuildContextMenu();
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
	const data = await browser.storage.sync.get(null)
		.catch((err) => {
			if (logToConsole) {
				console.error(err);
				console.log('Failed to retrieve options from storage sync.');
			}
			return;
		});
	const options = data.options;
	const forceReload = options.forceSearchEnginesReload;
	if (logToConsole) console.log(`Options:`);
	if (logToConsole) console.log(options);
	await initialiseOptionsAndSearchEngines(forceReload);
	rebuildContextMenu();
}

async function addNewSearchEngine(id, domain) {
	await browser.storage.local.clear()
		.catch(err => {
			if (logToConsole) {
				console.error(err);
				console.log('Failed to clear local storage.');
			}
			return;
		});
	const value = await getNewFavicon(id, domain);
	searchEngines[id]['base64'] = value.base64;
	await saveSearchEnginesToLocalStorage(false);
	rebuildContextMenu();
	if (notificationsEnabled) notify(notifySearchEngineAdded);
}

function handlePageAction(tab) {
	let message = { action: 'getSearchEngine', data: '' };
	sendMessageToTab(tab, message);
}

async function initialiseOptionsAndSearchEngines(forceReload) {
	/// Initialise options
	let options = {};
	let data = await browser.storage.sync.get(null)
		.catch(err => {
			if (logToConsole) {
				console.error(err);
				console.log('Failed to retrieve data from storage sync.');
			}
		});

	if (data.options) {
		options = data.options;
		if (logToConsole) console.log(options);
		delete data['options'];
	}

	// If there are no options stored in storage sync or reset preferences is set, then use default options
	// Otherwise clear storage sync and only save options in storage sync
	if (isEmpty(options) || options.resetPreferences) {
		options = defaultOptions;
	} else {
		await browser.storage.sync.clear();
	}
	if (logToConsole) console.log(options);
	await setOptions(options, true);

	/// Initialise search engines
	// If there were search engines stored in storage sync (legacy), move them to storage local
	if (!isEmpty(data) && Object.keys(data).length > 1) {
		searchEngines = sortByIndex(data);
		setRegex();
		setKeyboardShortcuts();
		if (logToConsole) {
			console.log('Search engines: \n');
			console.log(searchEngines);
		}
		await browser.storage.local.clear();
		await getFaviconsAsBase64Strings();
		await saveSearchEnginesToLocalStorage(false);
	} else {
		// Check for search engines in local storage
		const se = await browser.storage.local.get(null);
		if (se === undefined || isEmpty(se) || forceReload) {
			// Load default search engines if force reload is set or if no search engines are stored in local storage
			await browser.storage.local.clear();
			await loadDefaultSearchEngines(DEFAULT_SEARCH_ENGINES)
				.catch((err) => {
					console.error(err);
					console.log('Failed to retrieve search enginees from local storage.');
				});
		} else {
			searchEngines = sortByIndex(se);
			setRegex();
			setKeyboardShortcuts();
			if (logToConsole) {
				console.log('Search engines: \n');
				console.log(searchEngines);
			}
		}
	}
}

function setRegex() {
	for (let id in searchEngines) {
		if (searchEngines[id].regex !== undefined) continue;
		if (logToConsole) console.log(`id: ${id}`);
		searchEngines[id]['regex'] = {};
		searchEngines[id]['regex']['body'] = defaultRegex.source;
		searchEngines[id]['regex']['flags'] = defaultRegex.flags;
		if (logToConsole) console.log(searchEngines[id].regex);
	}
}

function setKeyboardShortcuts() {
	for (let id in searchEngines) {
		if (searchEngines[id].keyboardShortcut !== undefined) continue;
		if (logToConsole) console.log(`id: ${id}`);
		searchEngines[id]['keyboardShortcut'] = "";
		if (logToConsole) console.log(`keyboard shortcut: ${searchEngines[id].keyboardShortcut}`);
	}
}

async function getOptions() {
	const data = await browser.storage.sync.get(null)
		.catch(err => {
			if (logToConsole) {
				console.error(err);
				console.log('Failed to retrieve options from sync storage.');
			}
			return err;
		});
	const options = data.options;
	if (logToConsole) console.log(options);
	return options;
}

// Sets the default options if they haven't already been set in local storage and saves them
// The context menu is also rebuilt when required
async function setOptions(options, save) {
	setExactMatch(options);
	setTabMode(options);
	setOptionsMenuLocation(options); // context menu will have to be rebuilt
	setDisplayFavicons(options); // context menu will have to be rebuilt
	setDisplayExifSummary(options);
	setDisableAltClick(options);
	setResetOptions(options);
	setSiteSearchSetting(options);
	setUseRegex(options);
	setMultiMode(options);
	if (save) {
		await browser.storage.sync.clear();
		await saveOptions(options, true);
	}
}

async function saveOptions(options, blnRebuildContextMenu) {
	if (logToConsole) {
		const strOptions = JSON.stringify(options);
		console.log(`Options settings:\n${strOptions}`);
	}
	await browser.storage.sync.set({ options: options })
		.catch(err => {
			if (logToConsole) {
				console.error(err);
				console.log('Failed to save options to storage sync.');
			}
		});
	if (blnRebuildContextMenu) rebuildContextMenu();
	if (logToConsole) {
		console.log('Successfully saved the options to storage sync.');
	}
}

function setExactMatch(options) {
	if (logToConsole) console.log(`Setting exact match to ${options.exactMatch}`);
	contextsearch_exactMatch = options.exactMatch;
}

// Store the default values for tab mode in storage local
function setTabMode(options) {
	if (logToConsole) console.log('Setting tab mode..');
	contextsearch_makeNewTabOrWindowActive = options.tabActive;
	contextsearch_openSearchResultsInLastTab = options.lastTab;
	contextsearch_privateMode = options.privateMode;
	switch (options.tabMode) {
		case 'openNewTab':
			contextsearch_openSearchResultsInNewTab = true;
			contextsearch_openSearchResultsInNewWindow = false;
			contextsearch_openSearchResultsInSidebar = false;
			break;
		case 'sameTab':
			contextsearch_openSearchResultsInNewTab = false;
			contextsearch_openSearchResultsInNewWindow = false;
			contextsearch_openSearchResultsInSidebar = false;
			break;
		case 'openNewWindow':
			contextsearch_openSearchResultsInNewWindow = true;
			contextsearch_openSearchResultsInNewTab = false;
			contextsearch_openSearchResultsInSidebar = false;
			break;
		case 'openSidebar':
			contextsearch_openSearchResultsInSidebar = true;
			contextsearch_openSearchResultsInNewTab = false;
			contextsearch_openSearchResultsInNewWindow = false;
			break;
		default:
			break;
	}
}

function setMultiMode(options) {
	contextsearch_multiMode = options.multiMode;
}

function setOptionsMenuLocation(options) {
	if (logToConsole) {
		console.log(`Setting the position of options in the context menu to ${options.optionsMenuLocation}`);
	}
	contextsearch_optionsMenuLocation = options.optionsMenuLocation;
}

function setDisplayFavicons(options) {
	if (logToConsole) console.log('Setting favicons preference..');
	contextsearch_displayFavicons = options.displayFavicons;
}

function setDisplayExifSummary(options) {
	if (logToConsole) console.log('Setting display EXIF summary preference..');
	contextsearch_displayExifSummary = options.displayExifSummary;
}

function setDisableAltClick(options) {
	if (logToConsole) console.log('Setting option to disable Alt-Click..');
	contextsearch_disableAltClick = options.disableAltClick;
}

function setSiteSearchSetting(options) {
	if (logToConsole) console.log('Setting site search option..');
	contextsearch_siteSearch = options.siteSearch;
	contextsearch_siteSearchUrl = options.siteSearchUrl;
}

function setResetOptions(options) {
	if (logToConsole) console.log(`Setting reset options..`);
	contextsearch_forceSearchEnginesReload = options.forceSearchEnginesReload;
	contextsearch_resetPreferences = options.resetPreferences;
	contextsearch_forceFaviconsReload = options.forceFaviconsReload;
}

function setUseRegex(options) {
	if (logToConsole) console.log(`Setting whether to use regular expressions...`);
	contextsearch_useRegex = options.useRegex;
}

/// Load default list of search engines
async function loadDefaultSearchEngines(jsonFile) {
	let reqHeader = new Headers();
	reqHeader.append('Content-Type', 'application/json');
	const initObject = {
		method: 'GET',
		headers: reqHeader
	};
	let userRequest = new Request(jsonFile, initObject);
	try {
		const response = await fetch(userRequest);
		if (!response.ok) {
			const message = `The search engines could not be loaded. An error has occured: ${response.status}`;
			throw new Error(message);
		}
		const json = await response.json();
		searchEngines = sortByIndex(json);
		setRegex();
		setKeyboardShortcuts();
		if (logToConsole) {
			console.log('Search engines:\n');
			console.log(searchEngines);
		}
		await browser.storage.local.clear();
		await getFaviconsAsBase64Strings();
		await saveSearchEnginesToLocalStorage(true);
		rebuildContextMenu();
	} catch (error) {
		if (logToConsole) console.error(error.message);
	}
}

async function saveSearchEnginesToLocalStorage(blnNotify) {
	searchEngines = sortByIndex(searchEngines);
	if (logToConsole) {
		console.log('Search engines:\n');
		console.log(searchEngines);
	}

	try {
		// save list of search engines to local storage
		await browser.storage.local.set(searchEngines);
		if (notificationsEnabled && blnNotify) notify(notifySearchEnginesLoaded);
		if (logToConsole) {
			console.log('Search engines have been successfully saved to local storage.');
		}
	} catch (error) {
		if (logToConsole) {
			console.error(error.message);
			console.log('Failed to save the search engines to local storage.');
		}
	}
}

/// Get and store favicon urls and base64 images
async function getFaviconsAsBase64Strings() {
	if (logToConsole) console.log('Fetching favicons..');
	let arrayOfPromises = [];

	for (let id in searchEngines) {
		// Fetch a new favicon only if there is no existing favicon or if an icon reload is being forced
		if (
			searchEngines[id].base64 === null ||
			searchEngines[id].base64 === undefined ||
			contextsearch_forceFaviconsReload
		) {
			let seUrl = searchEngines[id].url;
			if (logToConsole) console.log('id: ' + id);
			if (logToConsole) console.log('url: ' + seUrl);
			let domain = getDomain(seUrl);
			if (logToConsole) console.log('Getting favicon for ' + domain);
			arrayOfPromises.push(await getNewFavicon(id, domain));
		}
	}

	if (arrayOfPromises.length > 0) {
		// values is an array of {id:, base64:}
		const values = await Promise.all(arrayOfPromises)
			.catch((err) => {
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
				console.log('base64 string is ' + value.base64);
				console.log('================================================');
			}
			searchEngines[value.id]['base64'] = value.base64;
		}
		if (logToConsole) console.log('The favicons have ALL been fetched.');
	}
}

async function getNewFavicon(id, domain) {
	const optimalSize = '32x32';
	const tests = [optimalSize, '[.]png', '[.]ico'];
	let linksWithIcons = [];
	let parser = new DOMParser();
	let bestIconUrl = null;
	let reqHeader = new Headers();
	reqHeader.append('Content-Type', 'text/html; charset=UTF-8');
	const initObject = {
		method: 'GET',
		headers: reqHeader
	};
	const userRequest = new Request(domain, initObject);
	try {
		const response = await fetch(userRequest);
		if (!response.ok) {
			const message = `Failed to domain of search engine. An error has occured: ${response.status}`;
			throw new Error(message);
		}
		const webPage = await response.text();
		const doc = parser.parseFromString(webPage, 'text/html');
		const links = doc.getElementsByTagName('link');

		// Store all links with a possible favicon in an array
		for (let link of links) {
			const rel = link.getAttribute('rel');
			if (/icon/i.test(rel)) {
				const absUrl = convertUrl2AbsUrl(link.href, domain);
				linksWithIcons.push(absUrl);
			}
		}

		if (logToConsole) console.log(`Domain: ${domain}`);
		if (logToConsole) console.log(`Links with favicons: ${linksWithIcons}`);

		// Check if the links containing icons contain 32x32 in their name, then
		// check if they are of type png. Finally, check if they are of type ico.
		for (let test of tests) {
			if (logToConsole) console.log(`Checking if url contains: ${test}`);
			bestIconUrl = getBestIconUrl(linksWithIcons, test);
			// If an icon is found convert it to a base64 image
			if (bestIconUrl !== null) {
				if (logToConsole) console.log(`Best icon url: ${bestIconUrl}`);
				const base64str = await getBase64Image(bestIconUrl);
				return { id: id, base64: base64str };
			}
		}

		// Failed to retrieve a favicon, proceeding with default CS icon
		return { id: id, base64: base64ContextSearchIcon };
	} catch (error) {
		if (logToConsole) console.error(error.message);
		if (logToConsole) console.log('Failed to retrieve new favicon.');
		return { id: id, base64: base64ContextSearchIcon };
	}
}

function convertUrl2AbsUrl(href, domain) {
	let url = href;
	let absUrl = domain;
	let urlParts = [];

	// If the url is absolute, i.e. begins withh either'http' or 'https', there's nothing to do!
	if (/^(https?:\/\/)/.test(url)) return url;

	if (url.includes('moz-extension://')) {
		let i = url.lastIndexOf('moz-extension://') + 16;
		url = url.substr(i);
		urlParts = url.split(/\//);
		urlParts.shift();
		for (let urlPart of urlParts) {
			absUrl += '/' + urlPart;
		}
		return absUrl;
	}

	// If url begins with '//'
	if (/^(\/\/)/.test(url)) {
		return 'https:' + url;
	}

	// If url is relative...
	// If url begings with either './' or '/' (excluding './/' or '//')
	if (/^([.]\/|\/)[^/]/.test(url)) {
		urlParts = url.split(/\//);
		urlParts.shift();
	} else if (/^[^/]/.test(url)) {
		// url does not begin with '/'
		urlParts = url.split(/\//);
	}
	for (let urlPart of urlParts) {
		absUrl += '/' + urlPart;
	}
	return absUrl;
}

function getBestIconUrl(urls, regex) {
	let regexp = new RegExp(regex, 'i');
	for (let url of urls) {
		if (regexp.test(url)) {
			return url;
		}
	}
	return null;
}

/// Generate base64 image string for the favicon with the given url
async function getBase64Image(url) {
	const initObject = {
		method: 'GET',
		responseType: "arraybuffer"
	};
	const userRequest = new Request(url, initObject);
	try {
		const response = await fetch(userRequest)
		if (!response.ok) {
			const message = `Failed to fetch the favicon image. An error has occured: ${response.status}`;
			throw new Error(message);
		}
		const ab = await response.arrayBuffer();
		const b64 = convertArrayBuffer2Base64(ab, url);
		return b64;
	} catch (error) {
		if (logToConsole) console.log(error.message);
		return base64ContextSearchIcon;
	}
}

function convertArrayBuffer2Base64(ab, faviconUrl) {
	let byteArray = new Uint8Array(ab);
	let str = String.fromCharCode.apply(null, byteArray);
	let base64String = btoa(str);
	if (logToConsole) {
		console.log(`Base64 string for ${faviconUrl} is:\n ${base64String}`);
	}
	return base64String;
}

/// Rebuild the context menu using the search engines from local storage
function rebuildContextMenu() {
	if (logToConsole) console.log('Rebuilding context menu..');
	browser.runtime.getBrowserInfo().then((info) => {
		let v = info.version;
		let browserVersion = parseInt(v.slice(0, v.search('.') - 1));

		browser.contextMenus.removeAll();
		browser.contextMenus.onClicked.removeListener(processSearch);

		if (contextsearch_optionsMenuLocation === 'top') {
			rebuildContextOptionsMenu();
		}

		buildContextMenuForImages();

		searchEnginesArray = [];
		let n = Object.keys(searchEngines).length;
		for (let i = 1; i < n + 1; i++) {
			for (let id in searchEngines) {
				if (searchEngines[id].index === i) {
					let base64String = searchEngines[id].base64;
					let strIndex = 'cs-' + i.toString();
					let strTitle = searchEngines[id].name;

					searchEnginesArray.push(id);
					buildContextMenuItem(searchEngines[id], strIndex, strTitle, base64String, browserVersion);
				}
			}
		}

		if (contextsearch_optionsMenuLocation === 'bottom') {
			rebuildContextOptionsMenu();
		}

		browser.contextMenus.onClicked.addListener(processSearch);
	});
}

function rebuildContextOptionsMenu() {
	if (contextsearch_optionsMenuLocation === 'bottom') {
		browser.contextMenus.create({
			id: 'cs-separator',
			type: 'separator',
			contexts: ['selection']
		});
	}
	browser.contextMenus.create({
		id: 'cs-match',
		type: 'checkbox',
		title: titleExactMatch,
		contexts: ['selection'],
		checked: contextsearch_exactMatch
	});
	browser.contextMenus.create({
		id: 'cs-multitab',
		title: titleMultipleSearchEngines,
		contexts: ['selection']
	});
	browser.contextMenus.create({
		id: 'cs-site-search',
		title: `${titleSiteSearch} ${contextsearch_siteSearch}`,
		contexts: ['selection']
	});
	browser.contextMenus.create({
		id: 'cs-options',
		title: titleOptions + '...',
		contexts: ['selection']
	});
	if (contextsearch_optionsMenuLocation === 'top') {
		browser.contextMenus.create({
			id: 'cs-separator',
			type: 'separator',
			contexts: ['selection']
		});
	}
}

/// Build the context menu for image searches
function buildContextMenuForImages() {
	browser.contextMenus.create({
		id: 'cs-reverse-image-search',
		title: 'Google Reverse Image Search',
		contexts: ['image']
	});
	/* 	browser.contextMenus.create({
			id: 'cs-exif-tags',
			title: 'Image analysis...',
			contexts: ['image']
		}); */
}

/// Build a single context menu item
function buildContextMenuItem(searchEngine, index, title, base64String, browserVersion) {
	const contexts = ['selection'];
	const faviconUrl = 'data:image/png;base64,' + base64String;
	const regexString = searchEngine.regex.body;
	const regexModifier = searchEngine.regex.flags;
	const regex = new RegExp(regexString, regexModifier);
	if (!searchEngine.show) return;
	// if (logToConsole){
	// 	console.log(regexString);
	// 	console.log(regexModifier);
	// 	console.log(selection.match(regex));
	// }
	if (contextsearch_useRegex && (selection.match(regex) === null)) return;
	if (browserVersion >= 56 && contextsearch_displayFavicons === true) {
		browser.contextMenus.create({
			id: index,
			title: title,
			contexts: contexts,
			icons: { '20': faviconUrl }
		});
	} else {
		browser.contextMenus.create({
			id: index,
			title: title,
			contexts: contexts
		});
	}
}

// Perform search based on selected search engine, i.e. selected context menu item
async function processSearch(info, tab) {
	let id = info.menuItemId.replace('cs-', '');
	let tabIndex, tabPosition;

	if (info.selectionText !== undefined) {
		// Prefer info.selectionText over selection received by content script for these lengths (more reliable)
		if (info.selectionText.length < 150 || info.selectionText.length > 150) {
			selection = info.selectionText.trim();
		}
	}

	if ((contextsearch_openSearchResultsInSidebar && id !== 'reverse-image-search') || id === 'exif-tags') {
		await browser.sidebarAction.open();
		browser.sidebarAction.setPanel({ panel: "about:blank" });
	} else {
		await browser.sidebarAction.close();
		tabIndex = tab.index + 1;
	}
	const tabs = await browser.tabs.query({ currentWindow: true });
	tabPosition = tabs[tabs.length - 1].index + 1;
	if (contextsearch_openSearchResultsInLastTab) tabIndex = tabPosition;
	if (contextsearch_multiMode !== 'multiAfterLastTab') {
		tabPosition = tabIndex + 1;
	}
	if (id === 'exif-tags') {
		let url = browser.runtime.getURL('/sidebar/exif_tags.html');
		browser.sidebarAction.setPanel({ panel: url });
		browser.sidebarAction.setTitle({ title: 'Image analysis' });
		return;
	} else if (id === 'reverse-image-search') {
		if (logToConsole) console.log(targetUrl);
		displaySearchResults(targetUrl, tabIndex);
		return;
	}
	if ((id === 'site-search') && !isEmpty(targetUrl)) {
		if (logToConsole) console.log(targetUrl);
		if (contextsearch_openSearchResultsInSidebar) {
			const domain = getDomain(tab.url).replace(/https?:\/\//, '');
			const options = await getOptions();
			targetUrl = options.siteSearchUrl + encodeUrl(`site:https://${domain} ${selection}`);
			openUrl(targetUrl);
			browser.sidebarAction.setTitle({ title: 'Search results' });
			return;
		} else {
			displaySearchResults(targetUrl, tabIndex);
			return;
		}
	} else if (id === 'options') {
		browser.runtime.openOptionsPage().then(null, onError);
		return;
	} else if (id === 'multitab') {
		processMultiTabSearch(tabPosition);
		return;
	} else if (id === 'match') {
		getOptions().then((settings) => {
			let options = settings.options;
			if (logToConsole) {
				console.log(`Preferences retrieved from sync storage: ${JSON.stringify(options)}`);
			}
			options.exactMatch = !contextsearch_exactMatch;
			setExactMatch(options);
			saveOptions(options, true);
		});
		return;
	}

	let intId = parseInt(id);

	// At this point, it should be a number
	if (!isNaN(intId)) {
		searchUsing(searchEnginesArray[intId - 1], tabIndex);
	}
}

async function processMultiTabSearch(tabPosition) {
	const data = await browser.storage.local.get(null);
	searchEngines = sortByIndex(data);
	let multiTabSearchEngineUrls = [];
	for (let id in searchEngines) {
		if (searchEngines[id].multitab) {
			multiTabSearchEngineUrls.push(getSearchEngineUrl(searchEngines[id].url, selection));
		}
	}
	if (notificationsEnabled && isEmpty(multiTabSearchEngineUrls)) {
		notify('Search engines have not been selected for a multi-search.');
		return;
	}
	const n = multiTabSearchEngineUrls.length;
	if (logToConsole) console.log(multiTabSearchEngineUrls);
	if (contextsearch_multiMode === 'multiNewWindow') {
		await browser.windows.create({
			titlePreface: windowTitle + '"' + selection + '"',
			url: multiTabSearchEngineUrls,
			incognito: contextsearch_privateMode
		});
	} else {
		for (let i = 0; i < n; i++) {
			await browser.tabs.create({
				index: tabPosition + i,
				url: multiTabSearchEngineUrls[i]
			});
		}
	}
}

// Handle search terms if there are any
function getSearchEngineUrl(searchEngineUrl, sel) {
	let quote = '';
	if (contextsearch_exactMatch) quote = '%22';
	if (searchEngineUrl.includes('{searchTerms}')) {
		return searchEngineUrl.replace(/{searchTerms}/g, encodeUrl(sel));
	} else if (searchEngineUrl.includes('%s')) {
		return searchEngineUrl.replace(/%s/g, encodeUrl(sel));
	} else {
		return searchEngineUrl + quote + encodeUrl(sel) + quote;
	}
}

function searchUsing(id, tabIndex) {
	let searchEngineUrl = searchEngines[id].url;
	targetUrl = getSearchEngineUrl(searchEngineUrl, selection);
	if (logToConsole) console.log(`Target url: ${targetUrl}`);
	if (contextsearch_openSearchResultsInSidebar) {
		browser.sidebarAction.setPanel({ panel: "about:blank" });
		openUrl(targetUrl);
		browser.sidebarAction.setTitle({ title: 'Search results' });
		return;
	}
	displaySearchResults(targetUrl, tabIndex);
}

// Display the search results
async function displaySearchResults(targetUrl, tabPosition) {
	if (logToConsole) console.log('Tab position: ' + tabPosition);
	const windowInfo = await browser.windows.getCurrent({ populate: false });
	const currentWindowID = windowInfo.id;
	if (contextsearch_openSearchResultsInNewWindow) {
		await browser.windows.create({
			url: targetUrl,
			incognito: contextsearch_privateMode
		});
		if (!contextsearch_makeNewTabOrWindowActive) {
			await browser.windows.update(currentWindowID, { focused: true });
		}
	} else if (contextsearch_openSearchResultsInNewTab) {
		browser.tabs.create({
			active: contextsearch_makeNewTabOrWindowActive,
			index: tabPosition,
			url: targetUrl
		});
	} else {
		// Open search results in the same tab
		if (logToConsole) {
			console.log('Opening search results in same tab, url is ' + targetUrl);
		}
		browser.tabs.update({ url: targetUrl });
	}
}

/// OMNIBOX
// Provide help text to the user
browser.omnibox.setDefaultSuggestion({
	description: omniboxDescription
});

// Update the suggestions whenever the input is changed
browser.omnibox.onInputChanged.addListener((input, suggest) => {
	if (input.indexOf(' ') > 0) {
		let suggestion = buildSuggestion(input);
		if (logToConsole) console.log(JSON.stringify(suggestion));
		if (suggestion.length === 1) {
			suggest(suggestion);
		}
	}
});

// Open the page based on how the user clicks on a suggestion
browser.omnibox.onInputEntered.addListener(async (input) => {
	if (logToConsole) console.log(input);
	let tabIndex, tabPosition, tabId;

	const activeTab = await browser.tabs.query({
		currentWindow: true,
		active: true
	});
	tabIndex = activeTab[0].index;
	tabId = activeTab[0].id;

	const tabs = await browser.tabs.query({ currentWindow: true });
	if (contextsearch_openSearchResultsInLastTab) {
		tabIndex = tabs.length + 1;
	}

	if (logToConsole) console.log(contextsearch_multiMode);
	if (contextsearch_multiMode === 'multiAfterLastTab') {
		tabPosition = tabs.length + 1;
	} else {
		tabPosition = tabIndex + 1;
	}

	if (logToConsole) console.log(tabPosition);
	if (logToConsole) console.log(input.indexOf('://'));

	// Only display search results when there is a valid link inside of the url variable
	if (input.indexOf('://') > -1) {
		if (logToConsole) console.log('Processing search...');
		displaySearchResults(input, tabIndex);
	} else {
		try {
			const keyword = input.split(' ')[0];
			const searchTerms = input.replace(keyword, '').trim();
			const suggestion = buildSuggestion(input);
			switch (keyword) {
				case '.':
					browser.runtime.openOptionsPage();
					break;
				case '!':
					processMultiTabSearch(tabPosition);
					break;
				case 'bookmarks':
				case '!b':
					if (searchTerms === "recent") {
						bookmarkItems = await browser.bookmarks.getRecent(10);
					} else {
						bookmarkItems = await browser.bookmarks.search({ query: searchTerms });
					}
					if (logToConsole) console.log(bookmarkItems);
					await browser.storage.local.set({ bookmarkItems: bookmarkItems, searchTerms: searchTerms });
					await browser.tabs.create({
						active: contextsearch_makeNewTabOrWindowActive,
						index: tabPosition,
						url: '/bookmarks.html'
					});
					break;
				case 'history':
				case '!h':
					historyItems = await browser.history.search({ text: searchTerms });
					await browser.storage.local.set({ historyItems: historyItems, searchTerms: searchTerms });
					await browser.tabs.create({
						active: contextsearch_makeNewTabOrWindowActive,
						index: tabPosition,
						url: '/history.html'
					});
					break;
				default:
					if (suggestion.length === 1) {
						displaySearchResults(suggestion[0].content, tabIndex);
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

function buildSuggestion(text) {
	let result = [];
	let quote = '';

	if (contextsearch_exactMatch) quote = '%22';

	// Only make suggestions available and check for existence of a search engine when there is a space.
	if (text.indexOf(' ') === -1) {
		lastAddressBarKeyword = '';
		return result;
	}

	let keyword = text.split(' ')[0];
	let searchTerms = text.replace(keyword, '').trim();
	if (logToConsole) console.log(searchTerms);

	// Don't notify for the same keyword
	let showNotification = true;
	if (lastAddressBarKeyword == keyword) showNotification = false;
	lastAddressBarKeyword = keyword;

	if (keyword === '!') {
		selection = searchTerms;
		let suggestion = [
			{
				content: '',
				description: 'Perform multisearch for ' + searchTerms
			}
		];
		return suggestion;
	} else if (keyword === '.') {
		let suggestion = [
			{
				content: '',
				description: 'Open options page'
			}
		];
		return suggestion;
	} else if (keyword === '!b' || keyword === 'bookmarks') {
		let suggestion = [
			{
				content: '',
				description: 'Search bookmarks'
			}
		];
		return suggestion;
	} else if (keyword === '!h' || keyword === 'history') {
		let suggestion = [
			{
				content: '',
				description: 'Search history'
			}
		];
		return suggestion;
	}

	for (let id in searchEngines) {
		if (searchEngines[id].keyword === keyword) {
			let suggestion = {};
			let searchEngineUrl = searchEngines[id].url;
			if (searchEngineUrl.includes('{searchTerms}')) {
				targetUrl = searchEngineUrl.replace(/{searchTerms}/g, encodeUrl(searchTerms));
			} else if (searchEngineUrl.includes('%s')) {
				targetUrl = searchEngineUrl.replace(/%s/g, encodeUrl(searchTerms));
			} else {
				targetUrl = searchEngineUrl + quote + encodeUrl(searchTerms) + quote;
			}
			suggestion['content'] = targetUrl;
			suggestion['description'] = 'Search ' + searchEngines[id].name + ' for ' + searchTerms;
			if (logToConsole) console.log(JSON.stringify(suggestion));
			result.push(suggestion);
			return result;
		}
	}

	// If no known keyword was found
	if (notificationsEnabled && showNotification) {
		notify(notifySearchEngineWithKeyword + ' ' + keyword + ' ' + notifyUnknown);
	}

	return result;
}

/// Helper functions

// Test if a search engine performing a search for the keyword 'test' returns valid results
function testSearchEngine(engineData) {
	if (engineData.url != '') {
		let tempTargetUrl = getSearchEngineUrl(engineData.url, 'test');
		browser.tabs.create({
			url: tempTargetUrl
		});
	} else if (notificationsEnabled) {
		notify(notifySearchEngineUrlRequired);
	}
}

/// Generic Error Handler
function onError(error) {
	if (logToConsole) console.error(`${error}`);
}

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

/// Send message
async function sendMessageToTab(tab, message) {
	const tabId = tab.id;
	await browser.tabs.sendMessage(tabId, message)
		.catch((err) => {
			if (logToConsole) {
				console.error(err);
				console.log(`Failed to send message ${JSON.stringify(message)} to:\n`);
				console.log(`Tab ${tab.id}: ${tab.title}\n`);
			}
			return;
		});
	if (logToConsole) {
		console.log(`Successfully sent message to:\n`);
		console.log(`Tab ${tab.id}: ${tab.title}\n`);
	}
}

/// Notifications
function notify(message) {
	browser.notifications.create(message.substring(0, 20), {
		type: 'basic',
		iconUrl: 'icons/icon_64.png',
		title: browser.i18n.getMessage('extensionName'),
		message: message
	});
}

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

/// Sort search engines by index
function sortByIndex(list) {
	let sortedList = JSON.parse(JSON.stringify(list));
	let n = Object.keys(list).length;
	let arrayOfIndexes = [];
	let arrayOfIds = [];
	let min = 0;
	if (logToConsole) console.log(list);
	// Create the array of indexes and its corresponding array of ids
	for (let id in list) {
		if (logToConsole) console.log(`id = ${id}`);
		// If there is no index, then move the search engine to the end of the list
		if (isEmpty(list[id].index)) {
			list[id].index = n + 1;
			n++;
		}
		arrayOfIndexes.push(list[id].index);
		arrayOfIds.push(id);
	}
	// Sort the list by index
	for (let i = 1; i < n + 1; i++) {
		min = Math.min(...arrayOfIndexes);
		let ind = arrayOfIndexes.indexOf(min);
		arrayOfIndexes.splice(ind, 1);
		let id = arrayOfIds.splice(ind, 1);
		sortedList[id].index = i;
	}

	return sortedList;
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

function openUrl(url) {
	browser.sidebarAction.setPanel({ panel: url });
}

init();
