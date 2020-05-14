/// Global variables and functions used by the background script

/* exported sortByIndex, getDomain, isEmpty */

/// Debug
const logToConsole = false;

/// Sort search engines by index
function sortByIndex(list) {
	let sortedList = {};
	let n = Object.keys(list).length;
	let arrayOfIndexes = [];
	let max = 0;
	if (logToConsole) console.log(list);
	// Determine a max index
	for (let id in list) {
		if (logToConsole) console.log(`id = ${id}`);
		if (list[id].index != null && list[id].index > max) {
			max = list[id].index + 1;
		}
	}
	// If there are no indexes, then add an index starting from max
	for (let id in list) {
		if (list[id].index == null) {
			list[id].index = max;
			max += 1;
		}
		arrayOfIndexes.push(list[id].index);
	}
	// Sort arrayOfIndexes in ascending order
	arrayOfIndexes.sort((a, b) => {
		return a - b;
	});
	// Create sorted list by ascending index and re-number the indexes starting from 0
	for (let i = 0; i < n; i++) {
		for (let id in list) {
			if (arrayOfIndexes[i] === list[id].index) {
				sortedList[id] = list[id];
				sortedList[id].index = i;
				continue;
			}
		}
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
	else if (typeof value === 'object') return value == null || Object.keys(value).length === 0;
	else if (typeof value === 'boolean') return false;
	else return !value;
}
