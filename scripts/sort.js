/// Global variables and functions used by the background script

/* exported sortByIndex, getDomain, isEmpty, openUrl */

/// Debug
const logToConsole = false;

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

// Test if an object is empty
function isEmpty(value) {
	if (typeof value === 'number') return false;
	else if (typeof value === 'string') return value.trim().length === 0;
	else if (Array.isArray(value)) return value.length === 0;
	else if (typeof value === 'object') {
		return value == null || Object.keys(value).length === 0;
	} else if (typeof value === 'boolean') return false;
	else return !value;
}

function openUrl(url) {
	browser.sidebarAction.setPanel({ panel: url });
}
