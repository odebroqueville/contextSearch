/// Global variables functions used by content scripts

/* exported defaultRegex, getDomain, getNewSearchEngine, getOS, isEmpty, logToConsole, meta, modifiers, openUrl, os, sortByIndex */

/// Debug
const logToConsole = true;

// Advanced feature
const defaultRegex = /[\s\S]*/i;

// Other 
const modifiers = ["Control", "Shift", "Alt", "Meta"];
const os = getOS();
let meta = '';
if (os === 'macOS') {
	meta = 'cmd+';
} else if (os === 'Windows') {
	meta = 'win+';
} else if (os === 'Linux') {
	meta = 'super+';
} else meta = 'meta+';

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

function fetchXML(url) {
	return new Promise((resolve, reject) => {
		let reqHeader = new Headers();
		reqHeader.append('Content-Type', 'text/xml');

		let initObject = {
			method: 'GET',
			headers: reqHeader
		};

		let userRequest = new Request(url, initObject);

		fetch(userRequest)
			.then((response) => response.text())
			.then((str) => new window.DOMParser().parseFromString(str, 'text/xml'))
			.then((xml) => {
				if (logToConsole) console.log(xml);
				resolve(xml);
			})
			.catch((err) => {
				if (logToConsole) console.log('Something went wrong!', err);
				reject(err);
			});
	});
}

// Retrieve the short name and query string from an xml document with the open search specifications
function getNameAndQueryString(xml) {
	let x, shortName, url, txt;
	txt = '';
	x = xml.documentElement.childNodes;
	if (logToConsole) console.log(x);
	for (let node of x) {
		let key = node.nodeName;
		txt += key + '\n';
		if (key === 'ShortName') shortName = node.textContent;
		if (key === 'Url') {
			let type = node.getAttribute('type');
			if (type === 'text/html') url = node.getAttribute('template');
		}
	}
	if (logToConsole) console.log(txt);
	return { shortName: shortName, queryString: url };
}

// Define a random ID for the new search engine
function defineNewId(shortName) {
	let newId = shortName.replace(/\s/g, '-').toLowerCase();
	let randomNumber = Math.floor(Math.random() * 1000000);
	newId = newId + '-' + randomNumber.toString();
	if (logToConsole) console.log(newId);
	return newId;
}

// Ensure the ID generated is unique
function isIdUnique(testId, searchEngines) {
	for (let id in searchEngines) {
		if (id === testId) {
			return false;
		}
	}
	return true;
}

async function getNewSearchEngine(url, searchEngines) {
	let xml = await fetchXML(url);
	let shortName = getNameAndQueryString(xml).shortName;
	let queryString = getNameAndQueryString(xml).queryString;
	let id = shortName.replace(/\s/g, '-').toLowerCase();
	while (!isIdUnique(id, searchEngines)) {
		id = defineNewId(shortName);
	}
	id = id.trim();
	if (logToConsole) {
		console.log(id);
		console.log(shortName);
		console.log(queryString);
	}
	let numberOfSearchEngines = Object.keys(searchEngines).length;

	// Define new search engine to be added along with its default values
	searchEngines[id] = {
		index: numberOfSearchEngines,
		name: shortName,
		keyword: '',
		keyboardShortcut: '',
		multitab: false,
		url: queryString,
		show: true,
		base64: '',
	};
	searchEngines[id]['regex'] = {};
	searchEngines[id]['regex']['body'] = defaultRegex.source;
	searchEngines[id]['regex']['flags'] = defaultRegex.flags;
	if (logToConsole) console.log(searchEngines[id]);
	return { id: id, searchEngine: searchEngines[id] };
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

// Detect the underlying OS
function getOS() {
	const userAgent = window.navigator.userAgent;
	const platform = window.navigator.platform;
	// if (navigator.userAgentData.platform !== undefined) {
	// 	platform = navigator.userAgentData.platform;
	// } else {
	// 	platform = window.navigator.platform;
	// }
  
	if (platform.toLowerCase().startsWith("mac")) {
		return 'macOS';
	} else if (platform.toLowerCase().startsWith("ip")) {
		return 'iOS';
	} else if (platform.toLowerCase().startsWith("win")) {
		return 'Windows';
	} else if (/Android/.test(userAgent)) {
		return 'Android';
	} else if (/Linux/.test(platform)) {
		return 'Linux';
	} else return null;
  
  }