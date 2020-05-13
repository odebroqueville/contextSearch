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
	console.log(x);
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
function isIdUnique(testId) {
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
	while (!isIdUnique(id)) {
		id = defineNewId(shortName);
	}
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
		multitab: false,
		url: queryString,
		show: true,
		base64: ''
	};
	if (logToConsole) console.log(searchEngines[id]);
	return { id: id, searchEngine: searchEngines[id] };
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
