/// Global variables
/* global sortByIndex, Sortable */
// Debugging
const logToConsole = false;

// Settings container and div for addSearchEngine
const divContainer = document.getElementById('container');

// Engine
const show = document.getElementById('show'); // Boolean
const sename = document.getElementById('name'); // String
const keyword = document.getElementById('keyword'); // String
const multitab = document.getElementById('multitab'); // Boolean
const url = document.getElementById('url'); // String

// Settings
const exactMatch = document.getElementById('exactMatch');
const openNewTab = document.getElementById('openNewTab');
const sameTab = document.getElementById('sameTab');
const openNewWindow = document.getElementById('openNewWindow');
const openSidebar = document.getElementById('openSidebar');
const tabMode = document.getElementById('tabMode');
const tabActive = document.getElementById('tabActive');
const active = document.getElementById('active');
const position = document.getElementById('position');
const lastTab = document.getElementById('lastTab');
const optionsMenuLocation = document.getElementById('optionsMenuLocation');
const displayFavicons = document.getElementById('displayFavicons');
const disableAltClick = document.getElementById('disableAltClick');
const resetPreferences = document.getElementById('resetPreferences');
const forceSearchEnginesReload = document.getElementById('forceSearchEnginesReload');
const forceFaviconsReload = document.getElementById('forceFaviconsReload');

// All engine buttons
const btnClearAll = document.getElementById('clearAll');
const btnSelectAll = document.getElementById('selectAll');
const btnSortAlpha = document.getElementById('sortAlphabetically');
const btnReset = document.getElementById('reset');

// Add new search engine buttons
const btnTest = document.getElementById('test');
const btnAdd = document.getElementById('add');
const btnClear = document.getElementById('clear');

// Import/export
const btnDownload = document.getElementById('download');
const btnUpload = document.getElementById('upload');

let numberOfSearchEngines = 0;
let searchEngines = {};

// Translation variables
const remove = browser.i18n.getMessage('remove');
const multipleSearchEnginesSearch = browser.i18n.getMessage('multipleSearchEnginesSearch');
const titleShowEngine = browser.i18n.getMessage('titleShowEngine');
const placeHolderName = browser.i18n.getMessage('searchEngineName');
const placeHolderKeyword = browser.i18n.getMessage('placeHolderKeyword');
const notifySearchEngineAdded = browser.i18n.getMessage('notifySearchEngineAdded');
const notifySearchEngineUrlRequired = browser.i18n.getMessage('notifySearchEngineUrlRequired');

// Typing timer
let typingTimerSearchEngineName;
let typingTimerKeyword;
let typingTimerQueryString;
let typingEventSearchEngineName;
let typingEventKeyword;
let typingEventQueryString;
let typingInterval = 1500;

/// Event handlers
document.addEventListener('DOMContentLoaded', restoreOptionsPage);
browser.storage.onChanged.addListener(handleStorageChange);
// browser.runtime.onMessage.addListener(handleIncomingMessages);

// Settings
exactMatch.addEventListener('click', updateSearchOptions);
displayFavicons.addEventListener('click', updateDisplayFavicons);
disableAltClick.addEventListener('click', updateDisableAltClick);
tabMode.addEventListener('click', updateTabMode);
tabActive.addEventListener('click', updateTabMode);
lastTab.addEventListener('click', updateTabMode);
optionsMenuLocation.addEventListener('click', updateOptionsMenuLocation);
resetPreferences.addEventListener('click', updateResetOptions);
forceSearchEnginesReload.addEventListener('click', updateResetOptions);
forceFaviconsReload.addEventListener('click', updateResetOptions);

// All engine buttons
btnClearAll.addEventListener('click', clearAll);
btnSelectAll.addEventListener('click', selectAll);
btnSortAlpha.addEventListener('click', sortSearchEnginesAlphabetically);
btnReset.addEventListener('click', reset);

// Add new engine
btnTest.addEventListener('click', testSearchEngine);
btnAdd.addEventListener('click', addSearchEngine);
btnClear.addEventListener('click', clear);

// Import/export
btnDownload.addEventListener('click', saveToLocalDisk);
btnUpload.addEventListener('change', handleFileUpload);

// Send a message to the background script
function sendMessage(action, data) {
	return new Promise((resolve, reject) => {
		browser.runtime.sendMessage({ action: action, data: data }).then(resolve, reject);
	});
}

function handleStorageChange(changes, area) {
	let oldSearchEngines = JSON.parse(JSON.stringify(searchEngines));
	searchEngines = {};
	if (area === 'local') {
		let ids = Object.keys(changes);
		if (logToConsole) {
			console.log(changes);
			console.log(ids);
		}
		for (let id of ids) {
			if (changes[id].newValue === undefined) {
				continue;
			}
			if (logToConsole) console.log(id);
			searchEngines[id] = changes[id].newValue;
			if (logToConsole) {
				console.log(`Search engine ${id}:\n`);
				console.log(searchEngines[id]);
			}
		}
		if (!Object.keys(searchEngines) > 0) searchEngines = oldSearchEngines;
		if (logToConsole) console.log(searchEngines);
		displaySearchEngines();
	}
}

// Notification
function notify(message) {
	sendMessage('notify', message);
}

// Generic Error Handler
function onError(error) {
	if (logToConsole) console.log(`${error}`);
}

function removeEventHandler(e) {
	e.stopPropagation();
	removeSearchEngine(e);
}

// Display the list of search engines
function displaySearchEngines() {
	let div = document.getElementById('searchEngines');
	if (div != null) divContainer.removeChild(div);

	searchEngines = sortByIndex(searchEngines);
	let divSearchEngines = document.createElement('ol');
	divSearchEngines.setAttribute('id', 'searchEngines');
	for (let id in searchEngines) {
		let searchEngine = searchEngines[id];
		let lineItem = createLineItem(id, searchEngine);
		divSearchEngines.appendChild(lineItem);
	}
	divContainer.appendChild(divSearchEngines);
	numberOfSearchEngines = divSearchEngines.childNodes.length;

	// Initialize Sortable list
	new Sortable(divSearchEngines, {
		handle: '.sort',
		animation: 200,
		// On element drag ended, save search engines
		onEnd: saveSearchEngines
	});
}

// Create a navigation button using icons from ionicon (up arrow, down arrow and bin)
function createButton(ioniconClass, btnClass, btnTitle) {
	let button = document.createElement('button');
	let btnIcon = document.createElement('i');
	button.setAttribute('type', 'button');
	button.setAttribute('class', btnClass);
	button.setAttribute('title', btnTitle);
	btnIcon.setAttribute('class', 'icon ' + ioniconClass);
	button.appendChild(btnIcon);
	return button;
}

// Display a single search engine in a row or line item
function createLineItem(id, searchEngine) {
	let searchEngineName = searchEngine.name;
	let lineItem = document.createElement('li');

	// Input elements for each search engine composing each line item
	let chkShowSearchEngine = document.createElement('input');
	let inputSearchEngineName = document.createElement('input');
	let inputKeyword = document.createElement('input');
	let chkMultiSearch = document.createElement('input');
	let inputQueryString = document.createElement('input');

	// Create menu target for line item sorting
	let sortTarget = document.createElement('i');

	// Navigation and deletion buttons for each search engine or line item
	let removeButton = createButton('ion-ios-trash', 'remove', remove + ' ' + searchEngineName);

	// Event handler for 'show search engine' checkbox click event
	chkShowSearchEngine.addEventListener('click', visibleChanged); // when users check or uncheck the checkbox

	// Event handlers for search engine name changes
	inputSearchEngineName.addEventListener('cut', searchEngineNameChanged); // when users paste text
	inputSearchEngineName.addEventListener('paste', searchEngineNameChanged); // when users paste text
	inputSearchEngineName.addEventListener('input', (e) => {
		typingEventSearchEngineName = e;
		clearTimeout(typingTimerSearchEngineName);
		typingTimerSearchEngineName = setTimeout(searchEngineNameChanged, typingInterval);
	});
	inputSearchEngineName.addEventListener('change', (e) => {
		typingEventSearchEngineName = e;
		clearTimeout(typingTimerSearchEngineName);
		searchEngineNameChanged();
	});

	// Event handlers for keyword text changes
	inputKeyword.addEventListener('paste', keywordChanged); // when users paste text
	inputKeyword.addEventListener('change', keywordChanged); // when users leave the input field and content has changed
	inputKeyword.addEventListener('keyup', () => {
		clearTimeout(typingTimerKeyword);
		typingTimerKeyword = setTimeout(keywordChanged, typingInterval);
	});
	inputKeyword.addEventListener('keydown', (e) => {
		typingEventKeyword = e;
		clearTimeout(typingTimerKeyword);
	});

	// Event handler for 'include search engine in multi-search' checkbox click event
	chkMultiSearch.addEventListener('click', multiTabChanged); // when users check or uncheck the checkbox

	// Event handlers for query string changes
	inputQueryString.addEventListener('paste', queryStringChanged); // when users paste text
	inputQueryString.addEventListener('change', queryStringChanged); // when users leave the input field and content has changed
	inputQueryString.addEventListener('keyup', () => {
		clearTimeout(typingTimerQueryString);
		typingTimerQueryString = setTimeout(queryStringChanged, typingInterval);
	});
	inputQueryString.addEventListener('keydown', (e) => {
		typingEventQueryString = e;
		clearTimeout(typingTimerQueryString);
	});

	// Navigation and deletion buttons event handlers
	removeButton.addEventListener('click', removeEventHandler);

	// Set attributes for all the elements composing a search engine or line item
	lineItem.setAttribute('id', id);

	chkShowSearchEngine.setAttribute('type', 'checkbox');
	chkShowSearchEngine.setAttribute('title', titleShowEngine);
	chkShowSearchEngine.setAttribute('id', id + '-chk');
	chkShowSearchEngine.checked = searchEngine.show;

	inputSearchEngineName.setAttribute('type', 'text');
	inputSearchEngineName.setAttribute('id', id + '-name');
	inputSearchEngineName.setAttribute('placeholder', placeHolderName);
	inputSearchEngineName.setAttribute('value', searchEngineName);

	inputKeyword.setAttribute('type', 'text');
	inputKeyword.setAttribute('id', id + '-kw');
	inputKeyword.setAttribute('class', 'keyword');
	inputKeyword.setAttribute('placeholder', placeHolderKeyword);
	inputKeyword.setAttribute('value', searchEngine.keyword);

	chkMultiSearch.setAttribute('type', 'checkbox');
	chkMultiSearch.setAttribute('id', id + '-mt');
	chkMultiSearch.setAttribute('title', multipleSearchEnginesSearch);
	chkMultiSearch.checked = searchEngine.multitab;

	inputQueryString.setAttribute('type', 'url');
	inputQueryString.setAttribute('value', searchEngine.url);

	sortTarget.classList.add('sort', 'icon', 'ion-arrow-move');

	// Attach all the elements composing a search engine to the line item
	lineItem.appendChild(chkShowSearchEngine);
	lineItem.appendChild(inputSearchEngineName);
	lineItem.appendChild(inputKeyword);
	lineItem.appendChild(chkMultiSearch);
	lineItem.appendChild(inputQueryString);

	lineItem.appendChild(sortTarget);
	lineItem.appendChild(removeButton);

	return lineItem;
}

function clearAll() {
	let divSearchEngines = document.getElementById('searchEngines');
	let lineItems = divSearchEngines.childNodes;
	for (let i = 0; i < lineItems.length; i++) {
		let input = lineItems[i].firstChild;
		if (input != null && input.nodeName == 'INPUT' && input.getAttribute('type') == 'checkbox') {
			input.checked = false;
		}
	}
	saveSearchEngines();
}

function selectAll() {
	let divSearchEngines = document.getElementById('searchEngines');
	let lineItems = divSearchEngines.childNodes;
	for (let i = 0; i < lineItems.length; i++) {
		let input = lineItems[i].firstChild;
		if (input != null && input.nodeName == 'INPUT' && input.getAttribute('type') == 'checkbox') {
			input.checked = true;
		}
	}
	saveSearchEngines();
}

function sortSearchEnginesAlphabetically() {
	let se = [];
	let counter = 0;
	for (let id in searchEngines) {
		se.push(searchEngines[id].name);
	}
	se = sortAlphabetically(se);
	if (logToConsole) console.log(se);
	for (let name of se) {
		for (let id in searchEngines) {
			if (searchEngines[id].name == name) {
				searchEngines[id].index = counter;
				counter++;
			}
		}
	}
	displaySearchEngines();
	saveSearchEngines();
}

function reset() {
	let sending = sendMessage('reset');
	sending.then(handleResponse, handleError);
}

function handleResponse(message) {
	if (logToConsole) console.log(`Response from background script: ${message.response}`);
	if (message.response === 'resetCompleted') {
		restoreOptionsPage();
	}
}

function handleError(error) {
	if (logToConsole) console.error(error);
}

// Begin of user event handlers
function removeSearchEngine(e) {
	// Find closest <li> parent
	let lineItem = e.target.closest('li');
	if (!lineItem) return;
	let id = lineItem.getAttribute('id');
	let pn = lineItem.parentNode;
	if (logToConsole) console.log(id);

	pn.removeChild(lineItem);
	delete searchEngines[id];
	if (logToConsole) console.log(searchEngines);

	sendMessage('saveSearchEngines', searchEngines);
}

function visibleChanged(e) {
	let lineItem = e.target.parentNode;
	let id = lineItem.getAttribute('id');
	let visible = e.target.checked;

	searchEngines[id]['show'] = visible;

	sendMessage('saveSearchEngines', searchEngines);
}

function searchEngineNameChanged(e) {
	if (e) {
		if (e.target.value == typingEventSearchEngineName.target.value) return;
	}
	let event = e || typingEventSearchEngineName;
	if (!event) return;
	let lineItem = event.target.parentNode;
	let id = lineItem.getAttribute('id');
	let searchEngineName = event.target.value;

	searchEngines[id]['name'] = searchEngineName;

	sendMessage('saveSearchEngines', searchEngines);
}

function keywordChanged(e) {
	if (e) {
		if (e.target.value == typingEventKeyword.target.value) return;
	}
	let event = e || typingEventKeyword;
	if (!event) return;
	let lineItem = event.target.parentNode;
	let id = lineItem.getAttribute('id');
	let keyword = event.target.value;

	searchEngines[id]['keyword'] = keyword;

	sendMessage('saveSearchEngines', searchEngines);
}

function multiTabChanged(e) {
	let lineItem = e.target.parentNode;
	let id = lineItem.getAttribute('id');
	let multiTab = e.target.checked;

	searchEngines[id]['multitab'] = multiTab;

	sendMessage('saveSearchEngines', searchEngines);
}

function queryStringChanged(e) {
	if (e) {
		if (e.target.value == typingEventQueryString.target.value) return;
	}
	let event = e || typingEventQueryString;
	if (!event) return;
	let lineItem = event.target.parentNode;
	let id = lineItem.getAttribute('id');
	let queryString = event.target.value;

	searchEngines[id]['url'] = queryString;

	sendMessage('saveSearchEngines', searchEngines);
}
// End of user event handlers

function readData() {
	let oldSearchEngines = {};
	oldSearchEngines = searchEngines;
	searchEngines = {};

	let divSearchEngines = document.getElementById('searchEngines');
	let lineItems = divSearchEngines.childNodes;
	numberOfSearchEngines = lineItems.length;
	for (let i = 0; i < numberOfSearchEngines; i++) {
		let input = lineItems[i].firstChild;
		if (input != null && input.nodeName === 'INPUT' && input.getAttribute('type') === 'checkbox') {
			let label = input.nextSibling;
			let keyword = label.nextSibling;
			let multiTab = keyword.nextSibling;
			let url = multiTab.nextSibling;
			searchEngines[lineItems[i].id] = {};
			searchEngines[lineItems[i].id]['index'] = i;
			searchEngines[lineItems[i].id]['name'] = label.value;
			searchEngines[lineItems[i].id]['keyword'] = keyword.value;
			searchEngines[lineItems[i].id]['multitab'] = multiTab.checked;
			searchEngines[lineItems[i].id]['url'] = url.value;
			searchEngines[lineItems[i].id]['show'] = input.checked;
			searchEngines[lineItems[i].id]['base64'] = oldSearchEngines[lineItems[i].id].base64;
		}
	}
	return searchEngines;
}

// Save the list of search engines to be displayed in the context menu
function saveSearchEngines() {
	if (logToConsole) console.log('Search Engines BEFORE SAVE:\n', searchEngines);
	searchEngines = readData();
	if (logToConsole) console.log('Search Engines AFTER SAVE:\n', searchEngines);
	sendMessage('saveSearchEngines', searchEngines);
}

function testSearchEngine() {
	sendMessage('testSearchEngine', {
		url: document.getElementById('url').value
	});
}

function addSearchEngine() {
	let id = sename.value.replace(' ', '-').toLowerCase();
	let divSearchEngines = document.getElementById('searchEngines');
	let strUrl = url.value;
	let testUrl = '';

	// Make certain that query string url starts with "https" to enforce SSL
	if (!strUrl.startsWith('https://')) {
		if (strUrl.startsWith('http://')) {
			strUrl.replace('http://', 'https://');
		} else {
			strUrl += 'https://' + strUrl;
		}
	}

	// Create test url
	if (strUrl.includes('{searchTerms}')) {
		testUrl = strUrl.replace('{searchTerms}', 'test');
	} else if (strUrl.includes('%s')) {
		testUrl = strUrl.replace('%s', 'test');
	} else {
		testUrl = strUrl + 'test';
	}

	// Validate query string url
	if (url.validity.typeMismatch || !isValidUrl(testUrl)) {
		notify(notifySearchEngineUrlRequired);
		return;
	}

	searchEngines[id] = {
		index: numberOfSearchEngines,
		name: sename.value,
		keyword: keyword.value,
		multitab: multitab.checked,
		url: url.value,
		show: show.checked
	};

	if (logToConsole) console.log('New search engine: ' + id + '\n' + JSON.stringify(searchEngines[id]));

	let lineItem = createLineItem(id, searchEngines[id]);
	divSearchEngines.appendChild(lineItem);

	sendMessage('addNewSearchEngine', {
		id: id,
		searchEngine: searchEngines[id]
	});
	notify(notifySearchEngineAdded);

	// Clear HTML input fields to add a search engine
	clear();
}

function clear() {
	// Clear check boxes and text box entries of the line used to add a search engine
	show.checked = true;
	sename.value = null;
	keyword.value = null;
	multitab.checked = false;
	url.value = null;
}

function setOptions(options) {
	if (logToConsole) {
		console.log('Preferences retrieved from sync storage:\n');
		console.log(options);
	}

	if (options.exactMatch === true) {
		exactMatch.checked = true;
	} else {
		exactMatch.checked = false;
	}

	switch (options.tabMode) {
		case 'openNewTab':
			openNewTab.checked = true;
			active.style.visibility = 'visible';
			break;
		case 'sameTab':
			sameTab.checked = true;
			active.style.visibility = 'hidden';
			break;
		case 'openNewWindow':
			openNewWindow.checked = true;
			active.style.visibility = 'visible';
			break;
		case 'openSidebar':
			openSidebar.checked = true;
			active.style.visibility = 'hidden';
			break;
		default:
			openNewTab.checked = true;
			active.style.visibility = 'visible';
			break;
	}

	if (options.tabActive === true) {
		tabActive.checked = true;
	} else {
		// Default value for tabActive is false
		tabActive.checked = false;
	}

	if (options.lastTab === true) {
		lastTab.checked = true;
	} else {
		// Default value for lastTab is false
		lastTab.checked = false;
	}

	if (
		options.optionsMenuLocation === 'top' ||
		options.optionsMenuLocation === 'bottom' ||
		options.optionsMenuLocation === 'none'
	) {
		optionsMenuLocation.value = options.optionsMenuLocation;
	} else {
		// Default value for optionsMenuLocation is bottom
		optionsMenuLocation.value = 'bottom';
	}

	if (options.favicons === false) {
		displayFavicons.checked = false;
	} else {
		// Default setting is to fetch favicons for context menu list
		displayFavicons.checked = true;
	}

	disableAltClick.checked = options.disableAltClick || false;

	if (options.resetPreferences === false) {
		resetPreferences.checked = false;
	} else {
		// Default setting is to cache favicons in storage sync
		resetPreferences.checked = true;
	}

	if (options.forceSearchEnginesReload === false) {
		forceSearchEnginesReload.checked = false;
	} else {
		// Default setting is to cache favicons in storage sync
		forceSearchEnginesReload.checked = true;
	}

	if (options.forceFaviconsReload === false) {
		forceFaviconsReload.checked = false;
	} else {
		// Default setting is to cache favicons in storage sync
		forceFaviconsReload.checked = true;
	}
}

// Restore the list of search engines and the options to be displayed in the options page
async function restoreOptionsPage() {
	try {
		let data = await browser.storage.sync.get('options');
		searchEngines = await browser.storage.local.get(null);
		if (logToConsole) {
			console.log('Search engines retrieved from local storage:\n');
			console.log(searchEngines);
		}
		displaySearchEngines();
		setOptions(data.options);
		if (logToConsole) console.log('Options have been reset.');
	} catch (err) {
		if (logToConsole) console.error(err);
	}
}

function saveToLocalDisk() {
	saveSearchEngines();
	let fileToDownload = new Blob([ JSON.stringify(searchEngines, null, 2) ], {
		type: 'text/json',
		name: 'searchEngines.json'
	});

	sendMessage('saveSearchEnginesToDisk', window.URL.createObjectURL(fileToDownload));
}

function handleFileUpload() {
	browser.storage.local.clear().then(() => {
		let upload = document.getElementById('upload');
		let jsonFile = upload.files[0];
		let reader = new FileReader();
		reader.onload = function(event) {
			searchEngines = JSON.parse(event.target.result);
			displaySearchEngines();
			saveSearchEngines();
		};
		reader.readAsText(jsonFile);
	}, onError);
}

function updateSearchOptions() {
	let em = exactMatch.checked;
	sendMessage('updateSearchOptions', { exactMatch: em });
}

function updateTabMode() {
	if (sameTab.checked || openSidebar.checked) {
		active.style.visibility = 'hidden';
		position.style.visibility = 'hidden';
	} else {
		active.style.visibility = 'visible';
		if (openNewWindow.checked) {
			position.style.visibility = 'hidden';
		} else {
			position.style.visibility = 'visible';
		}
	}

	let data = {};
	data['tabMode'] = document.querySelector('input[name="results"]:checked').value;
	data['tabActive'] = tabActive.checked;
	data['lastTab'] = lastTab.checked;
	sendMessage('updateTabMode', data);
}

function updateDisplayFavicons() {
	let fav = displayFavicons.checked;
	sendMessage('updateDisplayFavicons', { displayFavicons: fav });
}

function updateDisableAltClick() {
	sendMessage('updateDisableAltClick', { disableAltClick: disableAltClick.checked });
}

function updateOptionsMenuLocation() {
	let omat = optionsMenuLocation.value;
	sendMessage('updateOptionsMenuLocation', { optionsMenuLocation: omat });
}

function updateResetOptions() {
	let resetOptions = {
		forceSearchEnginesReload: forceSearchEnginesReload.checked,
		resetPreferences: resetPreferences.checked,
		forceFaviconsReload: forceFaviconsReload.checked
	};
	sendMessage('updateResetOptions', { resetOptions: resetOptions });
}

function isValidUrl(url) {
	try {
		new URL(url);
		return true;
	} catch (e) {
		// Malformed URL
		return false;
	}
}

function compareNumbers(a, b) {
	return a - b;
}

function compareStrings(a, b) {
	return a.toLowerCase().localeCompare(b.toLowerCase());
}

function sortAlphabetically(array) {
	let numbers = [];
	let alpha = [];
	for (let item of array) {
		if (!isNaN(Number(item))) {
			numbers.push(Number(item));
		} else {
			alpha.push(item);
		}
	}
	numbers = numbers.sort(compareNumbers);
	alpha = alpha.sort(compareStrings);
	return numbers.concat(alpha);
}

function i18n() {
	translateContent('data-i18n', 'textContent');
	translateContent('data-i18n-placeholder', 'placeholder');
	translateContent('data-i18n-title', 'title');
}

function translateContent(attribute, type) {
	let i18nElements = document.querySelectorAll('[' + attribute + ']');

	for (let i in i18nElements) {
		try {
			if (i18nElements[i].getAttribute == null) continue;
			let i18n_attrib = i18nElements[i].getAttribute(attribute);
			let message = browser.i18n.getMessage(i18n_attrib);
			switch (type) {
				case 'textContent':
					i18nElements[i].textContent = message;
					break;
				case 'placeholder':
					i18nElements[i].placeholder = message;
					break;
				case 'title':
					i18nElements[i].title = message;
					break;
				default:
					break;
			}
		} catch (ex) {
			if (logToConsole) console.error('i18n id ' + IDS[id] + ' not found');
		}
	}
}

i18n();
