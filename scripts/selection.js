'use strict';

/// Global variables
/* global EXIF, isEmpty, getDomain, getNewSearchEngine, logToConsole */

const notifySearchEngineNotFound = browser.i18n.getMessage('notifySearchEngineNotFound');
const googleReverseImageSearchUrl = 'https://images.google.com/searchbyimage?image_url=';
const mycroftUrl = 'https://mycroftproject.com/installos.php/';
const base64ContextSearchIcon =
	'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';
const base64MultiSearchIcon =
	'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBtZWV0IiB2aWV3Qm94PSIwIDAgNjQwIDY0MCIgd2lkdGg9IjY0MCIgaGVpZ2h0PSI2NDAiPjxkZWZzPjxwYXRoIGQ9Ik0xMDQuODQgNTMzLjU3QzI3LjYzIDQ1OC4wNiAyNy42MyAxODEuOTQgMTA0Ljg0IDEwNi40M0MxODIuMDUgMzAuOTIgNDcyLjk3IDIzLjM3IDU0MS42IDEwNi40M0M2MTAuMjIgMTg5LjQ5IDYxMC4yMiA0NTAuNTEgNTQxLjYgNTMzLjU3QzQ3Mi45NyA2MTYuNjMgMTgyLjA1IDYwOS4wOCAxMDQuODQgNTMzLjU3WiIgaWQ9ImE5WUNBTG1FOSI+PC9wYXRoPjxwYXRoIGQ9Ik00NjguNzMgMzg4LjUyQzQ2OC43MyAzOTcuNiA0NjEuMzggNDA0Ljk1IDQ1Mi4zIDQwNC45NUM0MjUuODQgNDA0Ljk1IDIxNC4xNiA0MDQuOTUgMTg3LjcgNDA0Ljk1QzE3OC42MiA0MDQuOTUgMTcxLjI3IDM5Ny42IDE3MS4yNyAzODguNTJDMTcxLjI3IDM2Ni40OSAxNzEuMjcgMTkwLjI1IDE3MS4yNyAxNjguMjJDMTcxLjI3IDE2My42NiAxNzQuOTIgMTYwIDE3OS40OCAxNjBDMTg1LjY0IDE2MCAyMzQuOTEgMTYwIDI0MS4wNyAxNjBDMjQzLjM3IDE2MCAzMTMuMTggMTU4LjI3IDMxNC43NCAxNjBDMzE2Ljg1IDE2Mi4zMyAzMzcuMjEgMTgzLjcyIDMzOS4zMiAxODYuMDVDMzQwLjg4IDE4Ny43OCAzNDAuMTcgMTg4Ljc2IDM0Mi41MSAxODguNzZDMzYxLjEyIDE4OC43NiA0NDEuOSAxODguNzYgNDYwLjUyIDE4OC43NkM0NjUuMDQgMTg4Ljc2IDQ2OC43MyAxOTIuNDIgNDY4LjczIDE5Ni45OEM0NjguNzMgMjM1LjI5IDQ2OC43MyAzNjkuMzYgNDY4LjczIDM4OC41MloiIGlkPSJiMjNGdHkzcUxsIj48L3BhdGg+PHBhdGggZD0iTTQ2OC43MyAzODguNTJDNDY4LjczIDM5Ny42IDQ2MS4zOCA0MDQuOTUgNDUyLjMgNDA0Ljk1QzQyNS44NCA0MDQuOTUgMjE0LjE2IDQwNC45NSAxODcuNyA0MDQuOTVDMTc4LjYyIDQwNC45NSAxNzEuMjcgMzk3LjYgMTcxLjI3IDM4OC41MkMxNzEuMjcgMzY2LjQ5IDE3MS4yNyAxOTAuMjUgMTcxLjI3IDE2OC4yMkMxNzEuMjcgMTYzLjY2IDE3NC45MiAxNjAgMTc5LjQ4IDE2MEMxODUuNjQgMTYwIDIzNC45MSAxNjAgMjQxLjA3IDE2MEMyNDMuMzcgMTYwIDI0NS41OSAxNjAuOTkgMjQ3LjE1IDE2Mi43MUMyNDkuMjYgMTY1LjA1IDI2Ni4xMiAxODMuNzIgMjY4LjIzIDE4Ni4wNUMyNjkuNzkgMTg3Ljc4IDI3Mi4wMSAxODguNzYgMjc0LjM1IDE4OC43NkMyOTIuOTcgMTg4Ljc2IDQ0MS45IDE4OC43NiA0NjAuNTIgMTg4Ljc2QzQ2NS4wNCAxODguNzYgNDY4LjczIDE5Mi40MiA0NjguNzMgMTk2Ljk4QzQ2OC43MyAyMzUuMjkgNDY4LjczIDM2OS4zNiA0NjguNzMgMzg4LjUyWiIgaWQ9ImIxeWlRN0RaZlgiPjwvcGF0aD48cGF0aCBkPSJNMTcxLjI3IDM4OC41MkMxNzEuMjcgMzk3LjYgMTc4LjYyIDQwNC45NSAxODcuNyA0MDQuOTVDMjE0LjE2IDQwNC45NSA0MjUuODQgNDA0Ljk1IDQ1Mi4zIDQwNC45NUM0NjEuMzggNDA0Ljk1IDQ2OC43MyAzOTcuNiA0NjguNzMgMzg4LjUyQzQ2OC43MyAzODcuODMgNDY4LjczIDM4NC4zOSA0NjguNzMgMzc4LjJMMTcxLjI3IDM3OC4yQzE3MS4yNyAzODQuMzkgMTcxLjI3IDM4Ny44MyAxNzEuMjcgMzg4LjUyWiIgaWQ9ImJUazNsUzdZdSI+PC9wYXRoPjxwYXRoIGQ9Ik00NjguNzMgMjM1LjJDNDY4LjczIDIzNS4yIDQ2OC43MyAyMzUuMiA0NjguNzMgMjM1LjJDNDY4LjczIDI0NS4zMyA0NjguNzMgMjUwLjk2IDQ2OC43MyAyNTIuMDlDNDY4LjczIDI1Mi4wOSA0NjguNzMgMjUyLjA5IDQ2OC43MyAyNTIuMDlDMjkwLjI1IDI1Mi4wOSAxOTEuMSAyNTIuMDkgMTcxLjI3IDI1Mi4wOUMxNzEuMjcgMjUyLjA5IDE3MS4yNyAyNTIuMDkgMTcxLjI3IDI1Mi4wOUMxNzEuMjcgMjQxLjk1IDE3MS4yNyAyMzYuMzIgMTcxLjI3IDIzNS4yQzE3MS4yNyAyMzUuMiAxNzEuMjcgMjM1LjIgMTcxLjI3IDIzNS4yQzM0OS43NSAyMzUuMiA0NDguOSAyMzUuMiA0NjguNzMgMjM1LjJaIiBpZD0ibHJvTTdzSGZLIj48L3BhdGg+PHBhdGggZD0iTTQ2MS4yMyA0NTEuNzRDNDY3Ljc2IDQ1OC4wNiA0NjcuOTMgNDY4LjQ2IDQ2MS42MiA0NzQuOTlDNDU1LjMxIDQ4MS41MSA0NDQuOTEgNDgxLjY5IDQzOC4zOCA0NzUuMzhDNDMzLjgzIDQ3MC45OCA0MTEuMDcgNDQ4Ljk4IDM3MC4xIDQwOS4zN0wzOTIuOTUgMzg1Ljc0QzQzMy45MiA0MjUuMzQgNDU2LjY3IDQ0Ny4zNCA0NjEuMjMgNDUxLjc0WiIgaWQ9ImExSmVLeHNoYiI+PC9wYXRoPjxwYXRoIGQ9Ik0zODguOTIgMjk0Ljg5QzQyMC4zOCAzMjUuMDcgNDIxLjQyIDM3NS4wNSAzOTEuMjMgNDA2LjUxQzM2MS4wNSA0MzcuOTggMzExLjA3IDQzOS4wMSAyNzkuNjEgNDA4LjgzQzI0OC4xNCAzNzguNjUgMjQ3LjExIDMyOC42NyAyNzcuMjkgMjk3LjIxQzMwNy40OCAyNjUuNzQgMzU3LjQ1IDI2NC43IDM4OC45MiAyOTQuODlaIiBpZD0iZUhsaUJzZTh6Ij48L3BhdGg+PHBhdGggZD0iTTM3OS43OCAzMDQuNDFDNDA1Ljk4IDMyOS41NSA0MDYuODQgMzcxLjE3IDM4MS43MSAzOTcuMzhDMzU2LjU3IDQyMy41OCAzMTQuOTUgNDI0LjQ0IDI4OC43NCAzOTkuM0MyNjIuNTQgMzc0LjE3IDI2MS42OCAzMzIuNTUgMjg2LjgyIDMwNi4zNEMzMTEuOTUgMjgwLjE0IDM1My41NyAyNzkuMjggMzc5Ljc4IDMwNC40MVoiIGlkPSJhMTdycHZGTEgyIj48L3BhdGg+PHBhdGggZD0iTTM3NC4xNyAzMjMuNjhDMzczLjggMzI2LjY0IDM2MS4yNSAzMTQuMjEgMzQwLjc4IDMxMS42N0MzMjAuMzEgMzA5LjEzIDI5OS42NyAzMTcuNDQgMzAwLjA0IDMxNC40OEMzMDAuNDEgMzExLjUzIDMxOC4zOCAyOTkuMTkgMzM4Ljg1IDMwMS43M0MzNTkuMzIgMzA0LjI3IDM3NC41MyAzMjAuNzIgMzc0LjE3IDMyMy42OFoiIGlkPSJhUk9DeWh3dkQiPjwvcGF0aD48cGF0aCBkPSJNNDQ4LjQ2IDQzOS40MUM0NDguNDYgNDM5LjQxIDQ0OC40NiA0MzkuNDEgNDQ4LjQ2IDQzOS40MUM0NTIuMDEgNDQyLjgzIDQ1My45OCA0NDQuNzQgNDU0LjM3IDQ0NS4xMkM0NTQuMzcgNDQ1LjEyIDQ1NC4zNyA0NDUuMTIgNDU0LjM3IDQ0NS4xMkM0NDAuNjYgNDU5LjMgNDMzLjA1IDQ2Ny4xOCA0MzEuNTIgNDY4Ljc1QzQzMS41MiA0NjguNzUgNDMxLjUyIDQ2OC43NSA0MzEuNTIgNDY4Ljc1QzQyNy45OCA0NjUuMzMgNDI2LjAxIDQ2My40MiA0MjUuNjEgNDYzLjA0QzQyNS42MSA0NjMuMDQgNDI1LjYxIDQ2My4wNCA0MjUuNjEgNDYzLjA0QzQzOS4zMiA0NDguODYgNDQ2Ljk0IDQ0MC45OCA0NDguNDYgNDM5LjQxWiIgaWQ9ImFNUGNnNWJZbCI+PC9wYXRoPjxwYXRoIGQ9Ik00MzMuNjkgNDI1LjEyQzQzMy42OSA0MjUuMTIgNDMzLjY5IDQyNS4xMiA0MzMuNjkgNDI1LjEyQzQzNy4yNCA0MjguNTUgNDM5LjIxIDQzMC40NiA0MzkuNiA0MzAuODRDNDM5LjYgNDMwLjg0IDQzOS42IDQzMC44NCA0MzkuNiA0MzAuODRDNDI1Ljg5IDQ0NS4wMiA0MTguMjcgNDUyLjkgNDE2Ljc1IDQ1NC40N0M0MTYuNzUgNDU0LjQ3IDQxNi43NSA0NTQuNDcgNDE2Ljc1IDQ1NC40N0M0MTMuMjEgNDUxLjA1IDQxMS4yNCA0NDkuMTQgNDEwLjg0IDQ0OC43NkM0MTAuODQgNDQ4Ljc2IDQxMC44NCA0NDguNzYgNDEwLjg0IDQ0OC43NkM0MjQuNTUgNDM0LjU4IDQzMi4xNyA0MjYuNyA0MzMuNjkgNDI1LjEyWiIgaWQ9Imk0aEZYWXhoOWkiPjwvcGF0aD48L2RlZnM+PGc+PGc+PGc+PHVzZSB4bGluazpocmVmPSIjYTlZQ0FMbUU5IiBvcGFjaXR5PSIxIiBmaWxsPSIjMzM0ZDVjIiBmaWxsLW9wYWNpdHk9IjEiPjwvdXNlPjxnPjx1c2UgeGxpbms6aHJlZj0iI2E5WUNBTG1FOSIgb3BhY2l0eT0iMSIgZmlsbC1vcGFjaXR5PSIwIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLW9wYWNpdHk9IjAiPjwvdXNlPjwvZz48L2c+PGc+PHVzZSB4bGluazpocmVmPSIjYjIzRnR5M3FMbCIgb3BhY2l0eT0iMSIgZmlsbD0iI2Y2YzM1OCIgZmlsbC1vcGFjaXR5PSIxIj48L3VzZT48Zz48dXNlIHhsaW5rOmhyZWY9IiNiMjNGdHkzcUxsIiBvcGFjaXR5PSIxIiBmaWxsLW9wYWNpdHk9IjAiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2Utb3BhY2l0eT0iMCI+PC91c2U+PC9nPjwvZz48Zz48dXNlIHhsaW5rOmhyZWY9IiNiMXlpUTdEWmZYIiBvcGFjaXR5PSIxIiBmaWxsPSIjZmNkNDYyIiBmaWxsLW9wYWNpdHk9IjEiPjwvdXNlPjxnPjx1c2UgeGxpbms6aHJlZj0iI2IxeWlRN0RaZlgiIG9wYWNpdHk9IjEiIGZpbGwtb3BhY2l0eT0iMCIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1vcGFjaXR5PSIwIj48L3VzZT48L2c+PC9nPjxnPjx1c2UgeGxpbms6aHJlZj0iI2JUazNsUzdZdSIgb3BhY2l0eT0iMSIgZmlsbD0iI2Y2YzM1OCIgZmlsbC1vcGFjaXR5PSIxIj48L3VzZT48Zz48dXNlIHhsaW5rOmhyZWY9IiNiVGszbFM3WXUiIG9wYWNpdHk9IjEiIGZpbGwtb3BhY2l0eT0iMCIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1vcGFjaXR5PSIwIj48L3VzZT48L2c+PC9nPjxnPjx1c2UgeGxpbms6aHJlZj0iI2xyb003c0hmSyIgb3BhY2l0eT0iMSIgZmlsbD0iI2Y2YzM1OCIgZmlsbC1vcGFjaXR5PSIxIj48L3VzZT48Zz48dXNlIHhsaW5rOmhyZWY9IiNscm9NN3NIZksiIG9wYWNpdHk9IjEiIGZpbGwtb3BhY2l0eT0iMCIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1vcGFjaXR5PSIwIj48L3VzZT48L2c+PC9nPjxnPjx1c2UgeGxpbms6aHJlZj0iI2ExSmVLeHNoYiIgb3BhY2l0eT0iMSIgZmlsbD0iI2RjODc0NCIgZmlsbC1vcGFjaXR5PSIxIj48L3VzZT48Zz48dXNlIHhsaW5rOmhyZWY9IiNhMUplS3hzaGIiIG9wYWNpdHk9IjEiIGZpbGwtb3BhY2l0eT0iMCIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1vcGFjaXR5PSIwIj48L3VzZT48L2c+PC9nPjxnPjx1c2UgeGxpbms6aHJlZj0iI2VIbGlCc2U4eiIgb3BhY2l0eT0iMSIgZmlsbD0iI2U1NjM1MyIgZmlsbC1vcGFjaXR5PSIxIj48L3VzZT48Zz48dXNlIHhsaW5rOmhyZWY9IiNlSGxpQnNlOHoiIG9wYWNpdHk9IjEiIGZpbGwtb3BhY2l0eT0iMCIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1vcGFjaXR5PSIwIj48L3VzZT48L2c+PC9nPjxnPjx1c2UgeGxpbms6aHJlZj0iI2ExN3JwdkZMSDIiIG9wYWNpdHk9IjEiIGZpbGw9IiNlMWU2ZTkiIGZpbGwtb3BhY2l0eT0iMSI+PC91c2U+PGc+PHVzZSB4bGluazpocmVmPSIjYTE3cnB2RkxIMiIgb3BhY2l0eT0iMSIgZmlsbC1vcGFjaXR5PSIwIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLW9wYWNpdHk9IjAiPjwvdXNlPjwvZz48L2c+PGc+PHVzZSB4bGluazpocmVmPSIjYVJPQ3lod3ZEIiBvcGFjaXR5PSIxIiBmaWxsPSIjZWJmMGYzIiBmaWxsLW9wYWNpdHk9IjEiPjwvdXNlPjxnPjx1c2UgeGxpbms6aHJlZj0iI2FST0N5aHd2RCIgb3BhY2l0eT0iMSIgZmlsbC1vcGFjaXR5PSIwIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLW9wYWNpdHk9IjAiPjwvdXNlPjwvZz48L2c+PGc+PHVzZSB4bGluazpocmVmPSIjYU1QY2c1YllsIiBvcGFjaXR5PSIxIiBmaWxsPSIjZTFlNmU5IiBmaWxsLW9wYWNpdHk9IjEiPjwvdXNlPjxnPjx1c2UgeGxpbms6aHJlZj0iI2FNUGNnNWJZbCIgb3BhY2l0eT0iMSIgZmlsbC1vcGFjaXR5PSIwIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLW9wYWNpdHk9IjAiPjwvdXNlPjwvZz48L2c+PGc+PHVzZSB4bGluazpocmVmPSIjaTRoRlhZeGg5aSIgb3BhY2l0eT0iMSIgZmlsbD0iI2UxZTZlOSIgZmlsbC1vcGFjaXR5PSIxIj48L3VzZT48Zz48dXNlIHhsaW5rOmhyZWY9IiNpNGhGWFl4aDlpIiBvcGFjaXR5PSIxIiBmaWxsLW9wYWNpdHk9IjAiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2Utb3BhY2l0eT0iMCI+PC91c2U+PC9nPjwvZz48L2c+PC9nPjwvc3ZnPg==';
const ICON32 = '38px'; // icon width is 32px plus 3px margin/padding

let searchEngines = {};
let tabUrl = '';
let domain = '';
let pn = '';
let sel = null;
let range = null;
let sameTab = false;

/// Debugging
// Current state
if (logToConsole) {
	console.log(document.readyState);
	document.addEventListener('readystatechange', () => console.log(document.readyState));
}

/// Event handlers
// Right-click event listener
document.addEventListener('contextmenu', handleRightClickWithoutGrid);

// Mouse up event listener
document.addEventListener('mouseup', handleAltClickWithGrid);

// Storage change event listener
browser.storage.onChanged.addListener(handleStorageChange);

/// Handle Incoming Messages
// Listen for messages from the background script
browser.runtime.onMessage.addListener((message) => {
	let action = message.action;
	let data = message.data;
	let url = '';
	switch (action) {
		case 'getSearchEngine':
			try {
				url = document.querySelector('link[type="application/opensearchdescription+xml"]').href;
				if (logToConsole) console.log(url);
				// Fetch search engine data
				getNewSearchEngine(url, searchEngines).then((result) => {
					// Send msg to background script to get the new search engine added
					sendMessage('addNewSearchEngine', result);
				});
			} catch (err) {
				if (logToConsole) console.log(err);
				sendMessage('notify', notifySearchEngineNotFound);
			}
			break;
		case 'displayExifTags':
			displayExifTags(data);
			break;
		default:
			break;
	}
});

function handleStorageChange(changes, area) {
	let oldSearchEngines = JSON.parse(JSON.stringify(searchEngines));
	let ids = Object.keys(changes);
	switch (area) {
		case 'local':
			searchEngines = {};
			if (logToConsole) {
				console.log(changes);
				console.log('Search engines list has been updated with:\n');
			}
			for (let id of ids) {
				if (changes[id].newValue === undefined) {
					continue;
				}
				searchEngines[id] = changes[id].newValue;
				if (logToConsole) {
					console.log(`Search engine ${id}:\n`);
					console.log(searchEngines[id]);
				}
			}
			if (!Object.keys(searchEngines).length > 0) searchEngines = oldSearchEngines;
			if (logToConsole) console.log(searchEngines);
			break;
		case 'sync':
			for (let id of ids) {
				if (id === 'options') {
					if (changes[id].tabMode === 'sameTab') {
						sameTab = true;
					} else {
						sameTab = false;
					}
				}
			}
			break;
		default:
			break;
	}
}

function displayExifTags(tags) {
	if (!isEmpty(tags)) {
		alert(`Image metadata: \n\n${JSON.stringify(tags, null, '\t')}`);
	} else {
		alert('No EXIF metadata could be found for this image!');
	}
}

async function init() {
	tabUrl = window.location.href;
	pn = window.location.pathname;
	domain = window.location.hostname;
	if (logToConsole) {
		console.log(`Tab url: ${tabUrl}`);
		console.log(`Path name: ${pn}`);
		console.log(`Domain: ${domain}`);
	}
	let data = await browser.storage.sync.get('options');
	if (data.options.tabMode === 'sameTab') {
		sameTab = true;
	} else {
		sameTab = false;
	}
	searchEngines = await browser.storage.local.get(null);
}

async function handleAltClickWithGrid(e) {
	if (logToConsole) console.log('Click event triggered:\n' + e.type, e.button, e.altKey);

	// If mouse up is not done with left mouse button then do nothing
	if (e.button > 0) return;

	// If Option (alt) key isn't pressed on mouse up then do nothing
	if (!e.altKey) return;

	let selectedText = getSelectedText();
	if (logToConsole) console.log(`Selected text: ${selectedText}`);

	let x = e.clientX;
	let y = e.clientY;

	if (selectedText) {
		if (e.target.tagName === 'A') {
			// Do additional safety checks.
			if (
				e.target.textContent.indexOf(selectedText) === -1 &&
				selectedText.indexOf(e.target.textContent) === -1
			) {
				// This is not safe. There is a selection on the page, but the element that right clicked does not contain a part of the selection
				return;
			}
		}

		// If option is diabled then do nothing. Note: this intentionally comes after selected text is accessed as text can become unselected on click
		let data = await browser.storage.sync.get(null);
		if (data.options.disableAltClick) return;

		// Test URL: https://bugzilla.mozilla.org/show_bug.cgi?id=1215376
		// Test URL: https://github.com/odebroqueville/contextSearch/

		sendSelectionToBackgroundScript(selectedText);
		buildIconGrid(x, y);
	}
}

async function handleRightClickWithoutGrid(e) {
	if (logToConsole) console.log(e);
	let elementClicked = e.target;
	let tag = elementClicked.tagName;
	if (tag === 'IMG') {
		let img = e.target;
		let imgurl = absoluteUrl(img.getAttribute('src'));
		let targetUrl = googleReverseImageSearchUrl + imgurl;
		sendMessage('setTargetUrl', targetUrl);
		if (logToConsole) console.log(`Image url: ${imgurl}`);
		EXIF.getData(img, function() {
			//alert(EXIF.pretty(this));
			let tags = EXIF.getAllTags(this);
			if (logToConsole) console.log(tags);
			let data = { imageUrl: imgurl, imageTags: tags };
			sendMessage('setImageData', data);
		});
	} else if (tag === 'A') {
		// Check that domain of current web page is mycroftproject.com
		let url = window.location.href;
		let domain = getDomain(url).replace(/https?:\/\//, '');
		if (domain === 'mycroftproject.com') {
			// Prevent context menu from showing
			e.preventDefault();

			// get pid and name to retrieve open search data
			let attr = elementClicked.getAttribute('onclick');
			let pid = getPidAndName(attr).pid;
			let name = getPidAndName(attr).name;
			let url = mycroftUrl + pid + '/' + name + '.xml';
			if (logToConsole) console.log(url);

			getNewSearchEngine(url, searchEngines).then((result) => {
				// Send msg to background script to get the new search engine added
				sendMessage('addNewSearchEngine', result);
			});
			return false;
		}
	} else {
		let selectedText = getSelectedText();
		sendSelectionToBackgroundScript(selectedText);
	}
}

function getPidAndName(string) {
	let str = string.match(/\(.+\)/).toString().match(/'.+'/g).toString();
	let array = str.replace(/'/g, '').toString().split(',');
	return { pid: array[3], name: array[0] };
}

function getSelectedText() {
	let selectedText = ''; // Get the current value, not a cached value

	if (window.getSelection) {
		// All modern browsers and IE9+
		sel = window.getSelection();
		range = sel.getRangeAt(0);
		selectedText = sel.toString().trim();
	}
	if (
		document.activeElement != null &&
		(document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT')
	) {
		let selectedTextInput = document.activeElement.value.substring(
			document.activeElement.selectionStart,
			document.activeElement.selectionEnd
		);
		if (selectedTextInput != '') selectedText = selectedTextInput;
	}

	if (logToConsole) console.log(`Selected text: ${selectedText}`);
	return selectedText;
}

function sendSelectionToBackgroundScript(selectedText) {
	// Send the selected text to background.js
	sendMessage('setSelection', selectedText);

	// Send url of Google search within current site to background.js
	let targetUrl = 'https://www.google.com/search?q=site' + encodeUrl(':https://' + domain + ' ' + selectedText);
	sendMessage('setTargetUrl', targetUrl);
}

function buildIconGrid(x, y) {
	let arrIDs = Object.keys(searchEngines);

	// Grid dimensions
	let n = arrIDs.length; // Number of search engines
	n += 1; // Add one icon for multi-search
	let m = Math.ceil(Math.sqrt(n)); // Grid dimension: m x m matrix
	let r = m - Math.floor(Math.abs(m * m - n) / m); // Number of rows

	// Cleanup
	let navExisting = document.getElementById('cs-grid');
	if (navExisting != null) {
		navExisting.parentElement.removeChild(navExisting);
	}

	let nav = document.createElement('nav');
	nav.setAttribute('id', 'cs-grid');
	nav.style.display = 'block';
	nav.style.backgroundColor = 'white';
	nav.style.border = '2px solid #999';
	nav.style.zIndex = 999;
	nav.style.position = 'fixed';
	nav.style.setProperty('top', y.toString() + 'px');
	nav.style.setProperty('left', x.toString() + 'px');
	let ol = document.createElement('ol');
	ol.style.margin = '0px';
	ol.style.padding = '0px';
	for (let i = 0; i < r; i++) {
		let liRow = document.createElement('li');
		liRow.style.listStyleType = 'none';
		liRow.style.margin = '0px';
		liRow.style.padding = '0px';
		liRow.style.height = ICON32;
		let olRow = document.createElement('ol');
		olRow.style.margin = '0px';
		olRow.style.padding = '0px';
		olRow.style.height = ICON32;
		for (let j = 0; j < m; j++) {
			if (i * m + j + 1 > n) break;
			let id = '';
			let src = '';
			let title = '';
			let liItem = document.createElement('li');
			liItem.style.display = 'inline-block';
			liItem.style.listStyleType = 'none';
			liItem.style.width = ICON32;
			liItem.style.height = ICON32;
			let img = document.createElement('img');
			img.style.display = 'inline-block';
			if (i === 0 && j === 0) {
				// Insert multisearch icon in first position
				id = 'multisearch';
				src = 'data:image/svg+xml;base64,' + base64MultiSearchIcon;
				title = 'multi-search';
			} else {
				id = arrIDs[i * m + j - 1];
				src = 'data:image/png;base64,';
				if (isEmpty(searchEngines[id]) || isEmpty(searchEngines[id].base64)) {
					// Default icon when no favicon could be found
					src += base64ContextSearchIcon;
				} else {
					src += searchEngines[id].base64;
				}
				title = searchEngines[id].name;
			}
			liItem.setAttribute('id', id);
			liItem.style.margin = '0px';
			liItem.style.padding = '0px';
			img.setAttribute('src', src);
			img.setAttribute('title', title);
			img.style.margin = '0px';
			img.style.padding = '0px';
			img.style.border = '3px solid #fff';
			img.style.width = '32px';
			img.style.height = '32px';
			img.addEventListener('mouseover', addBorder);
			img.addEventListener('mouseleave', removeBorder);
			liItem.appendChild(img);
			olRow.appendChild(liItem);
			if (i * m + j === n) break;
		}
		liRow.appendChild(olRow);
		ol.appendChild(liRow);
	}
	nav.appendChild(ol);
	nav.addEventListener('click', onGridClick);
	nav.addEventListener('mouseleave', onLeave);

	let body = document.getElementsByTagName('body')[0];
	body.appendChild(nav);

	// Position icon grid contained in nav element
	nav.style.left = 0;
	nav.style.top = 0;
	let viewportWidth = window.innerWidth;
	let viewportHeight = window.innerHeight;
	let navWidth = nav.offsetWidth;
	let navHeight = nav.offsetHeight;
	if (x > viewportWidth - navWidth) {
		nav.style.left = viewportWidth - navWidth + 'px';
	} else {
		nav.style.left = x + 'px';
	}
	if (y > viewportHeight - navHeight) {
		nav.style.top = viewportHeight - navHeight + 'px';
	} else {
		nav.style.top = y + 'px';
	}
}

function onGridClick(e) {
	if (logToConsole) console.log('Grid icon got clicked:' + e.type);
	let id = e.target.parentNode.id;
	if (logToConsole) console.log('Search engine clicked:' + id);
	if (sameTab) {
		let nav = document.getElementById('cs-grid');
		nav.style.display = 'none';
		nav.removeEventListener('click', onGridClick);
		nav.removeEventListener('mouseleave', onLeave);
		nav = null;
	} else {
		sel.addRange(range);
	}
	sendMessage('doSearch', { id: id });
}

function onLeave(e) {
	let nav = e.target;
	nav.style.display = 'none';
	nav.removeEventListener('click', onGridClick);
	nav.removeEventListener('mouseleave', onLeave);
	nav = null;
}

function addBorder(e) {
	if (logToConsole) console.log(e);
	if (logToConsole) console.log(e.target.tagName);
	if (e.target.tagName === 'IMG') {
		e.target.style.border = '3px solid #999';
	}
}

function removeBorder(e) {
	if (logToConsole) console.log(e);
	if (logToConsole) console.log(e.target.tagName);
	if (e.target.tagName === 'IMG') {
		e.target.style.border = '3px solid #fff';
	}
}

/// Encode a url
function encodeUrl(url) {
	if (isEncoded(url)) {
		return url;
	}
	return encodeURIComponent(url);
}

/// Verify is uri is encoded
function isEncoded(uri) {
	uri = uri || '';
	return uri !== decodeURIComponent(uri);
}

function sendMessage(action, data) {
	browser.runtime.sendMessage({ action: action, data: data });
}

function absoluteUrl(url) {
	// If the url is absolute, i.e. begins withh either'http' or 'https', there's nothing to do!
	if (/^(https?:\/\/)/.test(url)) return url;

	// If url begins with '//'
	if (/^(\/\/)/.test(url)) {
		return 'https:' + url;
	}

	// If url begins with '/' (and not '//' handled above)
	if (/^\//.test(url)) {
		let parts = url.split('/');
		parts.unshift(domain);
		return 'https://' + parts.join('/');
	}

	// If url begins with an alphanumerical character
	if (/^([a-zA-Z0-9])/.test(url) && /^(?!file|gopher|ftp:\/\/).+/.test(url)) {
		let parts = pn.split('/');
		parts.pop();
		return 'https://' + domain + parts.join('/') + '/' + url;
	}

	// If url begins with './' or '../'
	if (/^(\.\/|\.\.\/)/.test(url)) {
		let stack = tabUrl.split('/');
		let parts = url.split('/');
		stack.pop(); // remove current file name (or empty string)
		// (omit if "base" is the current folder without trailing slash)
		for (let i = 0; i < parts.length; i++) {
			if (parts[i] == '.') continue;
			if (parts[i] == '..') {
				stack.pop();
			} else {
				stack.push(parts[i]);
			}
		}
		return stack.join('/');
	}
}

init();
