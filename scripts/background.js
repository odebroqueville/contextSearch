"use strict";

/// Debug
let logToConsole = true;

/// Global variables
let searchEngines = {};
let searchEnginesArray = [];
let selection = "";
let targetUrl = "";
let lastAddressBarKeyword = "";
let imageUrl = "";
let imageTags = {};

/// Constants
const DEFAULT_JSON = "defaultSearchEngines.json";
const besticonAPIUrl = "https://get-besticons.herokuapp.com/icon?url=";
const besticonAPIUrlSuffix = "&size=16..32..128";
const base64ContextSearchIcon = "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";

// Constants for translations
const notifyEnableStorageSync = browser.i18n.getMessage("notifyEnableStorageSync");
const notifySearchEnginesLoaded = browser.i18n.getMessage("notifySearchEnginesLoaded");
const titleMultipleSearchEngines = browser.i18n.getMessage("titleMultipleSearchEngines");
const titleGoogleSearch = browser.i18n.getMessage("titleGoogleSearch");
const titleOptions = browser.i18n.getMessage("titleOptions");
const windowTitle = browser.i18n.getMessage("windowTitle");
const omniboxDescription = browser.i18n.getMessage("omniboxDescription");
const notifyUsage = browser.i18n.getMessage("notifyUsage");
const notifySearchEngineWithKeyword = browser.i18n.getMessage("notifySearchEngineWithKeyword");
const notifyUnknown = browser.i18n.getMessage("notifyUnknown");
const notifySearchEngineUrlRequired = browser.i18n.getMessage("notifySearchEngineUrlRequired");

/// Preferences - Default settings
let contextsearch_optionsMenuLocation = "bottom";
let contextsearch_openSearchResultsInNewTab = true;
let contextsearch_makeNewTabOrWindowActive = false;
let contextsearch_openSearchResultsInNewWindow = false;
let contextsearch_getFavicons = true;
let contextsearch_cacheFavicons = true;
let contextsearch_forceIconReload = false;

/// Handle Incoming Messages
// Listen for messages from the content or options script
browser.runtime.onMessage.addListener(function(message) {
    let id = "";
    let domain = "";
    switch (message.action) {
        case "doSearch":
            id = message.data.id;
            if (logToConsole) console.log("Search engine id: " + id);
            browser.tabs.query({active: true, currentWindow: true}).then(function(tabs) {
                if (logToConsole) console.log(tabs);
                let tabIndex = 0;
                for (let tab of tabs) {
                    if (tab.active) {
                        if (logToConsole) console.log("Active tab url: " + tab.url);
                        tabIndex = tab.index;
                        if (logToConsole) console.log("tabIndex: " + tabIndex);
                        break;
                    }
                }
                searchUsing(id, tabIndex);
            }, onError);
            break;
        case "notify":
            notify(message.data);
            break;
        case "setImageData":
            imageUrl = message.data.imageUrl;
            imageTags = message.data.tags;
            break;        
        case "setSelection":
            if (logToConsole) console.log(`Selected text: ${message.data}`);
            selection = message.data;
            break;
        case "reset":
            reset();
            break;
        case "sendCurrentTabUrl":
            if (message.data) targetUrl = message.data;
            break;
        case "testSearchEngine":
            testSearchEngine(message.data);
            break;
        case "saveEngines":
            searchEngines = message.data;
            if (logToConsole) console.log(searchEngines);
            getFaviconsAsBase64Strings().then(function(){
                saveSearchEnginesToStorageSync(true);
                rebuildContextMenu();
            }, onError);
			break;
        case "addNewSearchEngine":
            id = message.data.id;
            domain = getDomain(message.data.searchEngine.url);
            if (logToConsole) console.log(id, domain);
            searchEngines[id] = message.data.searchEngine;
            searchEngines = sortByIndex(searchEngines);
            addNewFavicon(domain, id).then(function(value){
                searchEngines[id]["base64"] = value.base64;
                saveSearchEnginesToStorageSync(false);
                rebuildContextMenu();
            }, onError);
            break;
        case "updateCacheFavicons":
			setCacheFavicons(message.data);
			break;
        case "updateGetFavicons":
            setDisplayFavicons(message.data);
            break;
		case "updateTabMode":
			setTabMode(message.data);
			break;
        case "updateOptionsMenuLocation":
            setOptionsMenuLocation(message.data);
            rebuildContextMenu();
			break;
		case "save":
			browser.downloads.download({url: message.data, saveAs: true, filename: "searchEngines.json"});
			break;
		default:
			break;
	}
});

/// Initialisation
function init() {

    let defaultOptions = {
        "options": {
            "tabMode": "openNewTab",
            "tabActive": false,
            "optionsMenuLocation": "bottom",
            "cacheFavicons": true,
            "favicons": true
        }
    }

    if (logToConsole) console.log("Loading the extension's preferences and search engines from storage sync..");
    browser.storage.sync.get(null).then(function(data){
        
        var options = data.options;
        if (logToConsole) {
            console.log("The following data was retrieved from storage sync..");
            if (options != undefined) console.log("Options: \n" + JSON.stringify(options));
            console.log("Search engines: \n" + JSON.stringify(data));
        }
        if (options === undefined) options = defaultOptions.options;
        delete data.options;
        if (isEmpty(data)) {
            if (logToConsole) console.log("Storage sync is empty -> loading default list of search engines.");
            loadDefaultSearchEngines(DEFAULT_JSON).then(function() {
                setOptions(options);
            }, onError);
        } else {
            if (logToConsole) console.log("Sorting search engines by index..");
            searchEngines = sortByIndex(data);
            setOptions(options);
        }

    }, onError);
}

// Resets the list of search engines to the default list
// Does not reset the options
function reset(){
    browser.storage.sync.get(null).then(function(data){
        let options = data.options;
        browser.storage.sync.clear().then(function(){
            loadDefaultSearchEngines(DEFAULT_JSON).then(function() {
                setOptions(options);
            }, onError);
        }, onError);
    }, onError);
}

// Sets the default options if they haven't already been set in storage sync and saves them
// The context menu is also rebuilt when required
function setOptions(options) {

    if (!(options.tabMode === "openNewTab" || options.tabMode === "sameTab" || options.tabMode === "openNewWindow")) {
        // By default, search results will be presented in a new tab
        options.tabMode = "openNewTab";
    }
    if (!(options.tabActive === true || options.tabActive === false)){
        // By default the search is performed in the background, i.e. the new tab isn't made active
        options.tabActive = false;
    }
    setTabMode(options);

    if (!(options.optionsMenuLocation === "top" || options.optionsMenuLocation === "bottom" || options.optionsMenuLocation === "none")) {
        // By default, the options menu is located at the bottom of the context menu
        options.optionsMenuLocation = "bottom";
    }
    setOptionsMenuLocation(options); // context menu will be rebuilt

    if (!(options.cacheFavicons === false || options.cacheFavicons === true)) {
        // By default, favicons should be cached
        options.cacheFavicons = true;
    }
    setCacheFavicons(options);

    if (!(options.favicons === false || options.favicons === true)) {
        // By default, favicons should be displayed
        options.favicons = true;
    }
    setDisplayFavicons(options); // context menu will be rebuilt

    let strOptions = JSON.stringify(options);
    if (logToConsole) console.log("Options settings:\n" + strOptions);

}

function saveOptions(data, blnRebuildContextMenu) {
    return new Promise(
        (resolve, reject) => {
            browser.storage.sync.set({"options": data}).then(function(){
                if (blnRebuildContextMenu) rebuildContextMenu();
                resolve();
            }, reject);
        }
    );
}

// Store the default values for tab mode in storage local
function setTabMode(data) {
    if (logToConsole) console.log("Setting tab mode..");
    contextsearch_makeNewTabOrWindowActive = data.tabActive;
    switch (data.tabMode) {
        case "openNewTab":
            contextsearch_openSearchResultsInNewTab = true;
            contextsearch_openSearchResultsInNewWindow = false;
            break;
        case "sameTab":
            contextsearch_openSearchResultsInNewTab = false;
            contextsearch_openSearchResultsInNewWindow = false;
            break;
        case "openNewWindow":
            contextsearch_openSearchResultsInNewWindow = true;
            contextsearch_openSearchResultsInNewTab = false;
            break;
        default:
            break;
    }
    saveOptions(data, false);
}

function setOptionsMenuLocation(data) {
    if (logToConsole) console.log("Setting the position of options in the context menu..");
    contextsearch_optionsMenuLocation = data.optionsMenuLocation;
    saveOptions(data, true);
}

function setCacheFavicons(data){
    if (logToConsole) console.log("Setting the preference for caching favicons..");
    contextsearch_cacheFavicons = data.cacheFavicons;
    saveOptions(data, false).then(() => {
        saveSearchEnginesToStorageSync(false)
    }, onError);
}

function setDisplayFavicons(data) {
    if (logToConsole) console.log("Setting favicons preference..");
    contextsearch_getFavicons = data.favicons;
    saveOptions(data, true);
}

/// Load default list of search engines
function loadDefaultSearchEngines(jsonFile) {
    return new Promise(
        (resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open("GET", jsonFile, true);
            xhr.setRequestHeader("Content-type", "application/json");
            xhr.overrideMimeType("application/json");
            xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    searchEngines = JSON.parse(this.responseText);
                    if (logToConsole) console.log("Search engines: \n" + JSON.stringify(searchEngines));
                    getFaviconsAsBase64Strings().then(function(){
                        saveSearchEnginesToStorageSync(true);
                        rebuildContextMenu();
                        resolve();
                    }, reject);
                }
            };
            xhr.send();
            xhr.onerror = function(e) {
                reject(e);
            }
        }
    );
}

function saveSearchEnginesToStorageSync(blnNotify){
    let searchEnginesLocal = searchEngines;
	if (!contextsearch_cacheFavicons) {
		if (logToConsole) console.log("cacheFavicons is disabled, clearing favicons before saving to sync storage..");
		for (let id in searchEnginesLocal) {
			searchEnginesLocal[id].base64 = null;
		}
	}
	
    browser.storage.sync.set(searchEnginesLocal).then(function() {
        if (blnNotify) notify(notifySearchEnginesLoaded);
        if (logToConsole) {
            for (let id in searchEnginesLocal){
                console.log(`Search engine: ${id} has been saved as follows:\n\n${JSON.stringify(searchEnginesLocal[id])}\n\n`);
            }
        }
        browser.tabs.query({
            currentWindow: true,
            url: "*://*/*"
        }).then((tabs) => {
            if (tabs.length > 0) {
                sendMessageToTabs(tabs, {"action": "updateSearchEnginesList", "data": searchEngines});
                if (logToConsole) console.log("Message to update search engines has been sent to all tabs!");
            }
        }, onError);
    }, onError);
}

/// Get and store favicon urls and base64 images
function getFaviconsAsBase64Strings() {
    return new Promise(
        (resolve, reject) => {
            if (logToConsole) console.log("Fetching favicons..");
            let arrayOfPromises = new Array();
            
            for (let id in searchEngines) {
                let seUrl = searchEngines[id].url;
                if (logToConsole) console.log("id: " + id);
                if (logToConsole) console.log("url: " + seUrl);
                let domain = getDomain(seUrl);

                // Fetch a new favicon only if there is no existing favicon or if an icon reload is being forced
                if (contextsearch_forceIconReload || searchEngines[id].base64 === null || searchEngines[id].base64 === undefined || searchEngines[id].base64.length === 0) {
                    if (logToConsole) console.log("Getting favicon for " + domain);
                    arrayOfPromises.push(addNewFavicon(id, domain));
                }
            }
            
            Promise.all(arrayOfPromises).then((values) => { // values is an array of {id:, base64:}
                if (logToConsole) console.log("ALL Promises have completed.");
                if (values === undefined) return;
                    for (let value of values) {
                        if (logToConsole) console.log("================================================");
                        if (logToConsole) console.log("id is " + value.id);
                        if (logToConsole) console.log("------------------------------------------------");
                        if (logToConsole) console.log("base64 string is " + value.base64);
                        if (logToConsole) console.log("================================================");
                        searchEngines[value.id]["base64"] = value.base64;
                    }
                    if (logToConsole) console.log("Favicons are no longer being fetched.");
                    if (logToConsole) console.log(searchEngines);
                    resolve();
            }, reject);
        }
    );
}

/// Add favicon to newly added search engine
function addNewFavicon(id, domain) {
    return new Promise((resolve, reject) => {
        let linksWithIcons = [];
        let xhr = new XMLHttpRequest();
        xhr.open("GET", domain, true);
        xhr.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                let webPage = this.responseText;
                let parser = new DOMParser();
                let doc = parser.parseFromString(webPage, "text/html");
                let links = doc.getElementsByTagName("link");
                let rel = null;
                let size = null;
                let bestIconUrl = null;
                let base64str = '';
                let optimalSize = "32x32";
                let tests = [optimalSize, "[.]png", "[.]ico"];

                // 1st Pass: store all links with a possible favicon of size 32x32 in an array
                for (let link of links){
                    rel = link.getAttribute('rel');
                    size = link.getAttribute('size');
                    if (/icon/.test(rel)){
                        let absUrl = convertUrl2AbsUrl(link.href, domain);
                        if (size === optimalSize){
                            if (!linksWithIcons.includes(absUrl)) linksWithIcons.push(absUrl);
                        }
                    }
                }

                // 2nd Pass: store all remaining links with a possible favicon of any size different to 32x32 in the same array
                for (let link of links){
                    rel = link.getAttribute('rel');
                    size = link.getAttribute('size');
                    if (/icon/.test(rel)){
                        let absUrl = convertUrl2AbsUrl(link.href, domain);
                        if (size !== optimalSize){
                            if (!linksWithIcons.includes(absUrl)) linksWithIcons.push(absUrl);
                        }
                    }
                }

                if (logToConsole) console.log(`Domain: ${domain}`);
                if (logToConsole) console.log(`Links with favicons: ${linksWithIcons}`);

                // Check if the links containing icons contain 32x32 in their name, then
                // check if they are of type png, then
                // finally check if they are of type ico
                for (let test of tests){
                    if (logToConsole) console.log(`Checking if url contains: ${test}`);
                    bestIconUrl = getBestIconUrl(linksWithIcons, test);
                    if (bestIconUrl !== null) {
                        if (logToConsole) console.log(`Best icon url: ${bestIconUrl}`);
                        base64str = getBase64Image(bestIconUrl);
                        base64str.then(b64 => {
                            return resolve({"id": id, "base64": b64});
                        }, );
                    }
                }
                // Failed to retrieve a favicon, proceeding with besticon API
                if (bestIconUrl === null) {
                    if (logToConsole) console.log("Fetching favicon using Besticon API");
                    bestIconUrl = besticonAPIUrl + domain + besticonAPIUrlSuffix;
                    base64str = getBase64Image(bestIconUrl);
                    base64str.then(b64 => {
                        resolve({"id": id, "base64": b64});
                    }, );
                }
            }
        }
        xhr.send();
        xhr.onerror = (err) => {
            console.error(`Failed to fetch favicon. Error: ${err}`)
            resolve({"id": id, "base64": base64ContextSearchIcon});
        }
    });
}

function getDomain(url) {
    let protocol = '';
    if (url.indexOf('://') !== -1) {
        protocol =  url.split('://')[0] + "://";
    } else { // By default, set the protocol to 'https://' if it hasn't been set
        protocol = 'https://';
    }
    
	let urlParts = url.replace('http://','').replace('https://','').split(/\//);
    let domain = protocol + urlParts[0];
	return domain;
}

function convertUrl2AbsUrl(href, domain){
    let url = href;
    let absUrl = domain;
    let urlParts = [];

    // If the url is absolute, i.e. begins withh either'http' or 'https', there's nothing to do!
    if (/^(https?\:\/\/)/.test(url)) return url;

    if (url.includes('moz-extension://')) {
        let i = url.lastIndexOf('moz-extension://') + 16;
        url = url.substr(i);
        urlParts = url.split(/\//);
        urlParts.shift();
        for (let urlPart of urlParts){
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
    if (/^([.]\/|\/)[^\/]/.test(url)) {
        urlParts = url.split(/\//);
        urlParts.shift();
    } else if (/^[^\/]/.test(url)){ // url does not begin with '/'
        urlParts = url.split(/\//);
    }
    for (let urlPart of urlParts){
        absUrl += '/' + urlPart;
    }
    return absUrl;
}

function getBestIconUrl(urls, regex){
    let regexp = new RegExp(regex);
    for (let url of urls){
        if (regexp.test(url)) {
            return url;
        }
    }
    return null;
}

/// Generate base64 image string for the favicon with the given url
function getBase64Image(faviconUrl) {
    return new Promise(
        (resolve, reject) => {
            let xhr = new XMLHttpRequest();
            xhr.open("GET", faviconUrl, true);
            xhr.responseType = "arraybuffer";
            xhr.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    let ab = this.response;
                    let b64 = convertArrayBuffer2Base64(ab, faviconUrl);
                    return resolve(b64);
                }
            }
            xhr.send();
            xhr.onerror = (err) => {
                if (logToConsole) console.log('Array Buffer fetch Error :-S', err);
                resolve(base64ContextSearchIcon);
            }
        }
    );
}

function convertArrayBuffer2Base64(ab, faviconUrl){
    let byteArray = new Uint8Array(ab);
    let str = String.fromCharCode.apply(null, byteArray);
    let base64String = btoa(str);
    if (logToConsole) console.log(`Base64 string for ${faviconUrl} is:\n ${base64String}`);
    return base64String;
}

/// Rebuild the context menu using the search engines from storage sync
function rebuildContextMenu() {
	if (logToConsole) console.log("Rebuilding context menu..");
    browser.runtime.getBrowserInfo().then((info) => {
		let v = info.version;
        let browserVersion = parseInt(v.slice(0, v.search(".") - 1));
        
        browser.contextMenus.removeAll();
		browser.contextMenus.onClicked.removeListener(processSearch);

        if (contextsearch_optionsMenuLocation === "top") {
            rebuildContextOptionsMenu();
        }
        
        buildContextMenuForImageExifTags();

        searchEnginesArray = [];
        var index = 0;
        for (let id in searchEngines) {
            let base64String = searchEngines[id].base64;
            let strIndex = "cs-" + index.toString();
            let strTitle = searchEngines[id].name;
            
            searchEnginesArray.push(id);
            buildContextMenuItem(searchEngines[id], strIndex, strTitle, base64String, browserVersion);
            index += 1;
        }
        
        if (contextsearch_optionsMenuLocation === "bottom") {
            rebuildContextOptionsMenu();
        }

		browser.contextMenus.onClicked.addListener(processSearch);
	});
}

function rebuildContextOptionsMenu(){
    if (contextsearch_optionsMenuLocation === "bottom") {
        browser.contextMenus.create({
            id: "cs-separator",
            type: "separator",
            contexts: ["selection"]
        });
    }
    browser.contextMenus.create({
		id: "cs-multitab",
		title: titleMultipleSearchEngines,
		contexts: ["selection"]
	});
	browser.contextMenus.create({
		id: "cs-google-site",
		title: titleGoogleSearch,
		contexts: ["selection"]
	});
	browser.contextMenus.create({
		id: "cs-options",
		title: titleOptions + "...",
		contexts: ["selection"]
    });
    if (contextsearch_optionsMenuLocation === "top") {
        browser.contextMenus.create({
            id: "cs-separator",
            type: "separator",
            contexts: ["selection"]
        });
    }
}

/// Build the context menu for image searches
function buildContextMenuForImageExifTags(){
    browser.contextMenus.create({
		id: "cs-exif-tags",
		title: "View EXIF tags...",
		contexts: ["image"]
    });
}

/// Build a single context menu item
function buildContextMenuItem(searchEngine, index, title, base64String, browserVersion){
	const contexts = ["selection"];
	let faviconUrl = "data:image/png;base64," + base64String;
	if (!searchEngine.show) return;
	if (browserVersion >= 56 && contextsearch_getFavicons === true){
		browser.contextMenus.create({
			id: index,
			title: title,
			contexts: contexts,
			icons: { "20": faviconUrl }
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
function processSearch(info, tab){
    let id = info.menuItemId.replace("cs-", "");

    if (id === "exif-tags") {
        browser.tabs.query({
            active: true,
        }).then((tabs) => {
            if (tabs.length > 0) {
                sendMessageToTabs(tabs, {"action": "displayExifTags", "data": imageTags});
                if (logToConsole) console.log(`Image URL: ${imageUrl}`);
                if (logToConsole) console.log(`Image EXIF tags: \n\n${JSON.stringify(imageTags, null, "\t")}`);
            }
        }, onError);
        return;
    }

    // Prefer info.selectionText over selection received by content script for these lengths (more reliable)
    if (info.selectionText.length < 150 || info.selectionText.length > 150) {
        selection = info.selectionText.trim();
    }

    if (id === "google-site" && targetUrl != "") {
        displaySearchResults(targetUrl, tab.index);
        return;
    } else if (id === "options") {
        browser.runtime.openOptionsPage().then(null, onError);
        return;
    } else if (id === "multitab") {
        processMultiTabSearch();
        return;
    }

    id = parseInt(id);
    
    // At this point, it should be a number
    if(!isNaN(id)){
		targetUrl = getSearchEngineUrl(searchEngines[searchEnginesArray[id]].url, selection);
        displaySearchResults(targetUrl, tab.index);
    }
}

function processMultiTabSearch() {
    browser.storage.sync.get(null).then(function(data){
        searchEngines = sortByIndex(data);
        let multiTabSearchEngineUrls = [];
        for (let id in searchEngines) {
            if (searchEngines[id].multitab) {
                multiTabSearchEngineUrls.push(getSearchEngineUrl(searchEngines[id].url, selection));
            }
        }
        if (isEmpty(multiTabSearchEngineUrls)) {
            notify("Search engines have not been selected for a multi-search.");
            return;
        }
        if (logToConsole) console.log(multiTabSearchEngineUrls);
        browser.windows.create({
            titlePreface: windowTitle + '"' + selection + '"',
            url: multiTabSearchEngineUrls
        }).then(null, onError);
    }, onError);
}

// Handle search terms if there are any
function getSearchEngineUrl(searchEngineUrl, sel){
	if (searchEngineUrl.includes("{searchTerms}")) {
		return searchEngineUrl.replace(/{searchTerms}/g, encodeUrl(sel));
	} else if (searchEngineUrl.includes("%s")) {
		return searchEngineUrl.replace(/%s/g, encodeUrl(sel));
	} else {
		return searchEngineUrl + encodeUrl(sel);
	}
}

function searchUsing(id, tabIndex) {
    let searchEngineUrl = searchEngines[id].url;
    targetUrl = getSearchEngineUrl(searchEngineUrl, selection);
    if (logToConsole) console.log("TargetURL = " + targetUrl);
    displaySearchResults(targetUrl, tabIndex);
}

// Display the search results
function displaySearchResults(targetUrl, tabPosition) {
    if (logToConsole) console.log("Tab position: " + tabPosition);
    browser.windows.getCurrent({populate: false}).then(function(windowInfo) {
        var currentWindowID = windowInfo.id;
        if (contextsearch_openSearchResultsInNewWindow) {
            browser.windows.create({
                url: targetUrl
            }).then(function() {
                if (!contextsearch_makeNewTabOrWindowActive) {
                    browser.windows.update(currentWindowID, {
                        focused: true
                    }).then(null, onError);    
                }
            }, onError);
        } else if (contextsearch_openSearchResultsInNewTab) {
            browser.tabs.create({
                active: contextsearch_makeNewTabOrWindowActive,
                index: tabPosition + 1,
                url: targetUrl
            });
        } else {
            // Open search results in the same tab
            if (logToConsole) console.log("Opening search results in same tab, url is " + targetUrl);
            browser.tabs.update({url: targetUrl});
        }
    }, onError);
}

/// OMNIBOX
// Provide help text to the user
browser.omnibox.setDefaultSuggestion({
    description: omniboxDescription
});

// Update the suggestions whenever the input is changed
browser.omnibox.onInputChanged.addListener((input, suggest) => {
    if (input.indexOf(" ") > 0) {
        let suggestion = buildSuggestion(input);
        if (logToConsole) console.log(JSON.stringify(suggestion));
        if (suggestion.length === 1) {
            suggest(suggestion);
        }
    }
});

// Open the page based on how the user clicks on a suggestion
browser.omnibox.onInputEntered.addListener((input, disposition) => {
    if (logToConsole) console.log(input);
    let tabPosition = 0;
    browser.tabs.query({
        currentWindow: true, 
        active: true,
    }).then(function(tabs){
        for (let tab of tabs) {
            tabPosition = tab.index;
        }

        if (logToConsole) console.log(tabPosition);
        if (logToConsole) console.log(input.indexOf("://"));

        // Only display search results when there is a valid link inside of the url variable
        if (input.indexOf("://") > -1) {
            if (logToConsole) console.log("Processing search...");
			displaySearchResults(input, tabPosition);
		} else {
			try {
				let suggestion = buildSuggestion(input);
				if (suggestion.length === 1) {
					displaySearchResults(suggestion[0].content, tabPosition);
				} else if (input.indexOf(" ") === -1) {
					notify(notifyUsage);
				}
			} catch(ex) {
				if (logToConsole) console.log("Failed to process " + input);
			}
		}

    }, onError);
});

function buildSuggestion(text) {
    let result = [];

    // Only make suggestions available and check for existence of a search engine when there is a space.
    if (text.indexOf(" ") === -1) {
        lastAddressBarKeyword = "";
        return result;
    }

    let keyword = text.split(" ")[0];
    let searchTerms = text.replace(keyword, "").trim();
    if (logToConsole) console.log(searchTerms);

	// Don't notify for the same keyword
	let showNotification = true;
	if (lastAddressBarKeyword == keyword) showNotification = false;
	lastAddressBarKeyword = keyword;

    for (let id in searchEngines) {
        if (searchEngines[id].keyword === keyword) {
            let suggestion = {};
            let searchEngineUrl = searchEngines[id].url;
            if (searchEngineUrl.includes("{searchTerms}")) {
                targetUrl = searchEngineUrl.replace(/{searchTerms}/g, encodeUrl(searchTerms));
            } else if (searchEngineUrl.includes("%s")) {
                targetUrl = searchEngineUrl.replace(/%s/g, encodeUrl(searchTerms));
            } else {
                targetUrl = searchEngineUrl + encodeUrl(searchTerms);
            }
            suggestion["content"] = targetUrl;
            suggestion["description"] = "Search " + searchEngines[id].name + " for " + searchTerms;
            if (logToConsole) console.log(JSON.stringify(suggestion));
            result.push(suggestion);
            return result;
        }
    }

    // If no known keyword was found
	if (showNotification) {
		notify(notifySearchEngineWithKeyword + " " + keyword + " " + notifyUnknown);
	}

    return result;
}

/// Helper functions
// Test if an object is empty
function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

// Test if a search engine performing a search for the keyword 'test' returns valid results
function testSearchEngine(engineData) {
	if (engineData.url != "") {
		let tempTargetUrl = getSearchEngineUrl(engineData.url, "test");
		browser.tabs.create({url: tempTargetUrl});
	} else {
		notify(notifySearchEngineUrlRequired);
	}
}

/// Generic Error Handler
function onError(error) {
    if (error.toString().indexOf("Please set webextensions.storage.sync.enabled to true in about:config") > -1) {
        notify(notifyEnableStorageSync);
    } else {
        console.error(`${error}`);
    }
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
    uri = uri || "";  
    return uri !== decodeURIComponent(uri);
}

/// Send a message to the option script
function sendMessageToOptionsScript(action, data) {
    browser.runtime.sendMessage({"action": action, "data": data});
}

/// Send messages to content scripts (selection.js)
function sendMessageToTabs(tabs, message) {
    if (logToConsole) console.log(`Tabs array is: \n${tabs}`);
    for (let tab of tabs) {
        if (logToConsole) console.log("Sending message to tab: \n" + JSON.stringify(tab));
        browser.tabs.sendMessage(tab.id, message);
    }
}

/// Notifications
function notify(message){
    browser.notifications.create(message.substring(0, 20),
    {
        type: "basic",
        iconUrl: browser.extension.getURL("icons/icon_64.png"),
        title: browser.i18n.getMessage("extensionName"),
        message: message
    });
}

init();
