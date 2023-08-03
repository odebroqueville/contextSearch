/* eslint-disable no-case-declarations */
'use strict';

/// Global variables
const logToConsole = true; // Debug
const os = getOS();
const notifySearchEngineNotFound = browser.i18n.getMessage('notifySearchEngineNotFound');
const mycroftUrl = 'https://mycroftproject.com/installos.php/';
const base64ContextSearchIcon =
    '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';
const base64MultiSearchIcon =
    'PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+CjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBtZWV0IiB2aWV3Qm94PSIwIDAgNjQwIDY0MCIgd2lkdGg9IjY0MCIgaGVpZ2h0PSI2NDAiPjxkZWZzPjxwYXRoIGQ9Ik0xMDQuODQgNTMzLjU3QzI3LjYzIDQ1OC4wNiAyNy42MyAxODEuOTQgMTA0Ljg0IDEwNi40M0MxODIuMDUgMzAuOTIgNDcyLjk3IDIzLjM3IDU0MS42IDEwNi40M0M2MTAuMjIgMTg5LjQ5IDYxMC4yMiA0NTAuNTEgNTQxLjYgNTMzLjU3QzQ3Mi45NyA2MTYuNjMgMTgyLjA1IDYwOS4wOCAxMDQuODQgNTMzLjU3WiIgaWQ9ImE5WUNBTG1FOSI+PC9wYXRoPjxwYXRoIGQ9Ik00NjguNzMgMzg4LjUyQzQ2OC43MyAzOTcuNiA0NjEuMzggNDA0Ljk1IDQ1Mi4zIDQwNC45NUM0MjUuODQgNDA0Ljk1IDIxNC4xNiA0MDQuOTUgMTg3LjcgNDA0Ljk1QzE3OC42MiA0MDQuOTUgMTcxLjI3IDM5Ny42IDE3MS4yNyAzODguNTJDMTcxLjI3IDM2Ni40OSAxNzEuMjcgMTkwLjI1IDE3MS4yNyAxNjguMjJDMTcxLjI3IDE2My42NiAxNzQuOTIgMTYwIDE3OS40OCAxNjBDMTg1LjY0IDE2MCAyMzQuOTEgMTYwIDI0MS4wNyAxNjBDMjQzLjM3IDE2MCAzMTMuMTggMTU4LjI3IDMxNC43NCAxNjBDMzE2Ljg1IDE2Mi4zMyAzMzcuMjEgMTgzLjcyIDMzOS4zMiAxODYuMDVDMzQwLjg4IDE4Ny43OCAzNDAuMTcgMTg4Ljc2IDM0Mi41MSAxODguNzZDMzYxLjEyIDE4OC43NiA0NDEuOSAxODguNzYgNDYwLjUyIDE4OC43NkM0NjUuMDQgMTg4Ljc2IDQ2OC43MyAxOTIuNDIgNDY4LjczIDE5Ni45OEM0NjguNzMgMjM1LjI5IDQ2OC43MyAzNjkuMzYgNDY4LjczIDM4OC41MloiIGlkPSJiMjNGdHkzcUxsIj48L3BhdGg+PHBhdGggZD0iTTQ2OC43MyAzODguNTJDNDY4LjczIDM5Ny42IDQ2MS4zOCA0MDQuOTUgNDUyLjMgNDA0Ljk1QzQyNS44NCA0MDQuOTUgMjE0LjE2IDQwNC45NSAxODcuNyA0MDQuOTVDMTc4LjYyIDQwNC45NSAxNzEuMjcgMzk3LjYgMTcxLjI3IDM4OC41MkMxNzEuMjcgMzY2LjQ5IDE3MS4yNyAxOTAuMjUgMTcxLjI3IDE2OC4yMkMxNzEuMjcgMTYzLjY2IDE3NC45MiAxNjAgMTc5LjQ4IDE2MEMxODUuNjQgMTYwIDIzNC45MSAxNjAgMjQxLjA3IDE2MEMyNDMuMzcgMTYwIDI0NS41OSAxNjAuOTkgMjQ3LjE1IDE2Mi43MUMyNDkuMjYgMTY1LjA1IDI2Ni4xMiAxODMuNzIgMjY4LjIzIDE4Ni4wNUMyNjkuNzkgMTg3Ljc4IDI3Mi4wMSAxODguNzYgMjc0LjM1IDE4OC43NkMyOTIuOTcgMTg4Ljc2IDQ0MS45IDE4OC43NiA0NjAuNTIgMTg4Ljc2QzQ2NS4wNCAxODguNzYgNDY4LjczIDE5Mi40MiA0NjguNzMgMTk2Ljk4QzQ2OC43MyAyMzUuMjkgNDY4LjczIDM2OS4zNiA0NjguNzMgMzg4LjUyWiIgaWQ9ImIxeWlRN0RaZlgiPjwvcGF0aD48cGF0aCBkPSJNMTcxLjI3IDM4OC41MkMxNzEuMjcgMzk3LjYgMTc4LjYyIDQwNC45NSAxODcuNyA0MDQuOTVDMjE0LjE2IDQwNC45NSA0MjUuODQgNDA0Ljk1IDQ1Mi4zIDQwNC45NUM0NjEuMzggNDA0Ljk1IDQ2OC43MyAzOTcuNiA0NjguNzMgMzg4LjUyQzQ2OC43MyAzODcuODMgNDY4LjczIDM4NC4zOSA0NjguNzMgMzc4LjJMMTcxLjI3IDM3OC4yQzE3MS4yNyAzODQuMzkgMTcxLjI3IDM4Ny44MyAxNzEuMjcgMzg4LjUyWiIgaWQ9ImJUazNsUzdZdSI+PC9wYXRoPjxwYXRoIGQ9Ik00NjguNzMgMjM1LjJDNDY4LjczIDIzNS4yIDQ2OC43MyAyMzUuMiA0NjguNzMgMjM1LjJDNDY4LjczIDI0NS4zMyA0NjguNzMgMjUwLjk2IDQ2OC43MyAyNTIuMDlDNDY4LjczIDI1Mi4wOSA0NjguNzMgMjUyLjA5IDQ2OC43MyAyNTIuMDlDMjkwLjI1IDI1Mi4wOSAxOTEuMSAyNTIuMDkgMTcxLjI3IDI1Mi4wOUMxNzEuMjcgMjUyLjA5IDE3MS4yNyAyNTIuMDkgMTcxLjI3IDI1Mi4wOUMxNzEuMjcgMjQxLjk1IDE3MS4yNyAyMzYuMzIgMTcxLjI3IDIzNS4yQzE3MS4yNyAyMzUuMiAxNzEuMjcgMjM1LjIgMTcxLjI3IDIzNS4yQzM0OS43NSAyMzUuMiA0NDguOSAyMzUuMiA0NjguNzMgMjM1LjJaIiBpZD0ibHJvTTdzSGZLIj48L3BhdGg+PHBhdGggZD0iTTQ2MS4yMyA0NTEuNzRDNDY3Ljc2IDQ1OC4wNiA0NjcuOTMgNDY4LjQ2IDQ2MS42MiA0NzQuOTlDNDU1LjMxIDQ4MS41MSA0NDQuOTEgNDgxLjY5IDQzOC4zOCA0NzUuMzhDNDMzLjgzIDQ3MC45OCA0MTEuMDcgNDQ4Ljk4IDM3MC4xIDQwOS4zN0wzOTIuOTUgMzg1Ljc0QzQzMy45MiA0MjUuMzQgNDU2LjY3IDQ0Ny4zNCA0NjEuMjMgNDUxLjc0WiIgaWQ9ImExSmVLeHNoYiI+PC9wYXRoPjxwYXRoIGQ9Ik0zODguOTIgMjk0Ljg5QzQyMC4zOCAzMjUuMDcgNDIxLjQyIDM3NS4wNSAzOTEuMjMgNDA2LjUxQzM2MS4wNSA0MzcuOTggMzExLjA3IDQzOS4wMSAyNzkuNjEgNDA4LjgzQzI0OC4xNCAzNzguNjUgMjQ3LjExIDMyOC42NyAyNzcuMjkgMjk3LjIxQzMwNy40OCAyNjUuNzQgMzU3LjQ1IDI2NC43IDM4OC45MiAyOTQuODlaIiBpZD0iZUhsaUJzZTh6Ij48L3BhdGg+PHBhdGggZD0iTTM3OS43OCAzMDQuNDFDNDA1Ljk4IDMyOS41NSA0MDYuODQgMzcxLjE3IDM4MS43MSAzOTcuMzhDMzU2LjU3IDQyMy41OCAzMTQuOTUgNDI0LjQ0IDI4OC43NCAzOTkuM0MyNjIuNTQgMzc0LjE3IDI2MS42OCAzMzIuNTUgMjg2LjgyIDMwNi4zNEMzMTEuOTUgMjgwLjE0IDM1My41NyAyNzkuMjggMzc5Ljc4IDMwNC40MVoiIGlkPSJhMTdycHZGTEgyIj48L3BhdGg+PHBhdGggZD0iTTM3NC4xNyAzMjMuNjhDMzczLjggMzI2LjY0IDM2MS4yNSAzMTQuMjEgMzQwLjc4IDMxMS42N0MzMjAuMzEgMzA5LjEzIDI5OS42NyAzMTcuNDQgMzAwLjA0IDMxNC40OEMzMDAuNDEgMzExLjUzIDMxOC4zOCAyOTkuMTkgMzM4Ljg1IDMwMS43M0MzNTkuMzIgMzA0LjI3IDM3NC41MyAzMjAuNzIgMzc0LjE3IDMyMy42OFoiIGlkPSJhUk9DeWh3dkQiPjwvcGF0aD48cGF0aCBkPSJNNDQ4LjQ2IDQzOS40MUM0NDguNDYgNDM5LjQxIDQ0OC40NiA0MzkuNDEgNDQ4LjQ2IDQzOS40MUM0NTIuMDEgNDQyLjgzIDQ1My45OCA0NDQuNzQgNDU0LjM3IDQ0NS4xMkM0NTQuMzcgNDQ1LjEyIDQ1NC4zNyA0NDUuMTIgNDU0LjM3IDQ0NS4xMkM0NDAuNjYgNDU5LjMgNDMzLjA1IDQ2Ny4xOCA0MzEuNTIgNDY4Ljc1QzQzMS41MiA0NjguNzUgNDMxLjUyIDQ2OC43NSA0MzEuNTIgNDY4Ljc1QzQyNy45OCA0NjUuMzMgNDI2LjAxIDQ2My40MiA0MjUuNjEgNDYzLjA0QzQyNS42MSA0NjMuMDQgNDI1LjYxIDQ2My4wNCA0MjUuNjEgNDYzLjA0QzQzOS4zMiA0NDguODYgNDQ2Ljk0IDQ0MC45OCA0NDguNDYgNDM5LjQxWiIgaWQ9ImFNUGNnNWJZbCI+PC9wYXRoPjxwYXRoIGQ9Ik00MzMuNjkgNDI1LjEyQzQzMy42OSA0MjUuMTIgNDMzLjY5IDQyNS4xMiA0MzMuNjkgNDI1LjEyQzQzNy4yNCA0MjguNTUgNDM5LjIxIDQzMC40NiA0MzkuNiA0MzAuODRDNDM5LjYgNDMwLjg0IDQzOS42IDQzMC44NCA0MzkuNiA0MzAuODRDNDI1Ljg5IDQ0NS4wMiA0MTguMjcgNDUyLjkgNDE2Ljc1IDQ1NC40N0M0MTYuNzUgNDU0LjQ3IDQxNi43NSA0NTQuNDcgNDE2Ljc1IDQ1NC40N0M0MTMuMjEgNDUxLjA1IDQxMS4yNCA0NDkuMTQgNDEwLjg0IDQ0OC43NkM0MTAuODQgNDQ4Ljc2IDQxMC44NCA0NDguNzYgNDEwLjg0IDQ0OC43NkM0MjQuNTUgNDM0LjU4IDQzMi4xNyA0MjYuNyA0MzMuNjkgNDI1LjEyWiIgaWQ9Imk0aEZYWXhoOWkiPjwvcGF0aD48L2RlZnM+PGc+PGc+PGc+PHVzZSB4bGluazpocmVmPSIjYTlZQ0FMbUU5IiBvcGFjaXR5PSIxIiBmaWxsPSIjMzM0ZDVjIiBmaWxsLW9wYWNpdHk9IjEiPjwvdXNlPjxnPjx1c2UgeGxpbms6aHJlZj0iI2E5WUNBTG1FOSIgb3BhY2l0eT0iMSIgZmlsbC1vcGFjaXR5PSIwIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLW9wYWNpdHk9IjAiPjwvdXNlPjwvZz48L2c+PGc+PHVzZSB4bGluazpocmVmPSIjYjIzRnR5M3FMbCIgb3BhY2l0eT0iMSIgZmlsbD0iI2Y2YzM1OCIgZmlsbC1vcGFjaXR5PSIxIj48L3VzZT48Zz48dXNlIHhsaW5rOmhyZWY9IiNiMjNGdHkzcUxsIiBvcGFjaXR5PSIxIiBmaWxsLW9wYWNpdHk9IjAiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2Utb3BhY2l0eT0iMCI+PC91c2U+PC9nPjwvZz48Zz48dXNlIHhsaW5rOmhyZWY9IiNiMXlpUTdEWmZYIiBvcGFjaXR5PSIxIiBmaWxsPSIjZmNkNDYyIiBmaWxsLW9wYWNpdHk9IjEiPjwvdXNlPjxnPjx1c2UgeGxpbms6aHJlZj0iI2IxeWlRN0RaZlgiIG9wYWNpdHk9IjEiIGZpbGwtb3BhY2l0eT0iMCIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1vcGFjaXR5PSIwIj48L3VzZT48L2c+PC9nPjxnPjx1c2UgeGxpbms6aHJlZj0iI2JUazNsUzdZdSIgb3BhY2l0eT0iMSIgZmlsbD0iI2Y2YzM1OCIgZmlsbC1vcGFjaXR5PSIxIj48L3VzZT48Zz48dXNlIHhsaW5rOmhyZWY9IiNiVGszbFM3WXUiIG9wYWNpdHk9IjEiIGZpbGwtb3BhY2l0eT0iMCIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1vcGFjaXR5PSIwIj48L3VzZT48L2c+PC9nPjxnPjx1c2UgeGxpbms6aHJlZj0iI2xyb003c0hmSyIgb3BhY2l0eT0iMSIgZmlsbD0iI2Y2YzM1OCIgZmlsbC1vcGFjaXR5PSIxIj48L3VzZT48Zz48dXNlIHhsaW5rOmhyZWY9IiNscm9NN3NIZksiIG9wYWNpdHk9IjEiIGZpbGwtb3BhY2l0eT0iMCIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1vcGFjaXR5PSIwIj48L3VzZT48L2c+PC9nPjxnPjx1c2UgeGxpbms6aHJlZj0iI2ExSmVLeHNoYiIgb3BhY2l0eT0iMSIgZmlsbD0iI2RjODc0NCIgZmlsbC1vcGFjaXR5PSIxIj48L3VzZT48Zz48dXNlIHhsaW5rOmhyZWY9IiNhMUplS3hzaGIiIG9wYWNpdHk9IjEiIGZpbGwtb3BhY2l0eT0iMCIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1vcGFjaXR5PSIwIj48L3VzZT48L2c+PC9nPjxnPjx1c2UgeGxpbms6aHJlZj0iI2VIbGlCc2U4eiIgb3BhY2l0eT0iMSIgZmlsbD0iI2U1NjM1MyIgZmlsbC1vcGFjaXR5PSIxIj48L3VzZT48Zz48dXNlIHhsaW5rOmhyZWY9IiNlSGxpQnNlOHoiIG9wYWNpdHk9IjEiIGZpbGwtb3BhY2l0eT0iMCIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1vcGFjaXR5PSIwIj48L3VzZT48L2c+PC9nPjxnPjx1c2UgeGxpbms6aHJlZj0iI2ExN3JwdkZMSDIiIG9wYWNpdHk9IjEiIGZpbGw9IiNlMWU2ZTkiIGZpbGwtb3BhY2l0eT0iMSI+PC91c2U+PGc+PHVzZSB4bGluazpocmVmPSIjYTE3cnB2RkxIMiIgb3BhY2l0eT0iMSIgZmlsbC1vcGFjaXR5PSIwIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLW9wYWNpdHk9IjAiPjwvdXNlPjwvZz48L2c+PGc+PHVzZSB4bGluazpocmVmPSIjYVJPQ3lod3ZEIiBvcGFjaXR5PSIxIiBmaWxsPSIjZWJmMGYzIiBmaWxsLW9wYWNpdHk9IjEiPjwvdXNlPjxnPjx1c2UgeGxpbms6aHJlZj0iI2FST0N5aHd2RCIgb3BhY2l0eT0iMSIgZmlsbC1vcGFjaXR5PSIwIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLW9wYWNpdHk9IjAiPjwvdXNlPjwvZz48L2c+PGc+PHVzZSB4bGluazpocmVmPSIjYU1QY2c1YllsIiBvcGFjaXR5PSIxIiBmaWxsPSIjZTFlNmU5IiBmaWxsLW9wYWNpdHk9IjEiPjwvdXNlPjxnPjx1c2UgeGxpbms6aHJlZj0iI2FNUGNnNWJZbCIgb3BhY2l0eT0iMSIgZmlsbC1vcGFjaXR5PSIwIiBzdHJva2U9IiMwMDAwMDAiIHN0cm9rZS13aWR0aD0iMSIgc3Ryb2tlLW9wYWNpdHk9IjAiPjwvdXNlPjwvZz48L2c+PGc+PHVzZSB4bGluazpocmVmPSIjaTRoRlhZeGg5aSIgb3BhY2l0eT0iMSIgZmlsbD0iI2UxZTZlOSIgZmlsbC1vcGFjaXR5PSIxIj48L3VzZT48Zz48dXNlIHhsaW5rOmhyZWY9IiNpNGhGWFl4aDlpIiBvcGFjaXR5PSIxIiBmaWxsLW9wYWNpdHk9IjAiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2Utb3BhY2l0eT0iMCI+PC91c2U+PC9nPjwvZz48L2c+PC9nPjwvc3ZnPg==';
const ICON32 = '32px'; // icon width is 32px
const defaultRegex = /[\s\S]*/i; // Advanced feature

let meta = '';
if (os === 'macOS') {
    meta = 'cmd+';
} else if (os === 'Windows') {
    meta = 'win+';
} else if (os === 'Linux') {
    meta = 'super+';
} else meta = 'meta+';
let tabUrl = '';
let domain = '';
let pn = '';
let sel = null;
let range = null;
let keysPressed = {};
let flagSearchEngineClicked = false;

/// Debugging
// Current state
if (logToConsole) {
    console.log(document.readyState);
}

if (document.readyState === 'complete') init();

/// Event handlers
// Text selection change event listener
document.addEventListener('selectionchange', handleTextSelection);

// Right-click event listener
document.addEventListener('contextmenu', handleRightClickWithoutGrid);

// Mouse up event listener
document.addEventListener('mouseup', handleAltClickWithGrid);

// Key down event listener
document.addEventListener('keydown', (event) => {
    const key = event.key;
    if (event.target.nodeName === 'INPUT' || !isKeyAllowed(event)) return;
    keysPressed[key] = event.code;
    if (logToConsole) console.log(keysPressed);
});

// Key up event listener
document.addEventListener('keyup', handleKeyUp);

// Storage change event listener
browser.storage.onChanged.addListener(handleStorageChange);

/// Handle Incoming Messages
// Listen for messages from the background script
browser.runtime.onMessage.addListener((message) => {
    switch (message.action) {
        case 'getSearchEngine':
            try {
                getOpenSearchEngine();
            } catch (err) {
                if (logToConsole) console.log(err);
                sendMessage('notify', notifySearchEngineNotFound);
            }
            break;
        case 'askPrompt':
            try {
                const prompt = message.data.prompt;
                const url = message.data.url;
                ask(url, prompt);
            } catch (err) {
                if (logToConsole) console.log(err);
                sendMessage('notify', notifySearchEngineNotFound);
            }
            break;
        default:
            break;
    }
});

async function getOpenSearchEngine() {
    const url = document.querySelector('link[type="application/opensearchdescription+xml"]').href;
    if (logToConsole) console.log(url);
    // Fetch search engine data
    const result = await getNewSearchEngine(url);
    // Send msg to background script to get the new search engine added
    if (result !== null) sendMessage('addNewSearchEngine', result);
}

async function ask(url, promptText) {
    if (logToConsole) console.log(`Prompt is: ${promptText}`);
    if (logToConsole) console.log(`URL is: ${url}`);
    if (logToConsole) console.log(`Ready state is: ${document.readyState}`);
    await navigator.clipboard.writeText(promptText);
    let someDiv, textarea, submit;
    let observer = new MutationObserver((mutations, mutationInstance) => {
        if (logToConsole) console.log(mutations);
        if (url.includes('openai')) {
            someDiv = document.getElementsByTagName("h1")[0];
        } else {
            someDiv = document.getElementsByTagName("span")[0];
            if (logToConsole) console.log(someDiv);
        }
        if (someDiv) {
            if (url.includes('bard')) {
                // mutationInstance.disconnect();
                // return;
                textarea = document.getElementById('mat-input-0');
                const buttons = document.getElementsByTagName("button");
                submit = buttons[buttons.length - 1];
            } else if (url.includes('www.perplexity.ai/')) {
                const textareas = document.getElementsByTagName("textarea");
                textarea = textareas[0];
                const buttons = document.getElementsByTagName("button");
                submit = buttons[5];
            } else if (url.includes('huggingface')) {
                const textareas = document.getElementsByTagName("textarea");
                textarea = textareas[textareas.length - 1];
                submit = textarea.parentElement.nextSibling;
            } else if (url.includes('openai')) {
                textarea = document.getElementById('prompt-textarea');
                submit = textarea.nextSibling;
            } else {
                const textareas = document.getElementsByTagName("textarea");
                textarea = textareas[textareas.length - 1];
                const buttons = document.getElementsByTagName("button");
                submit = buttons[buttons.length - 1];
            }

            if (logToConsole) console.log(textarea);
            if (logToConsole) console.log(submit);
            if (textarea) {
                textarea.focus();
                textarea.value = promptText;
                submit.disabled = false;
                submit.click();
                mutationInstance.disconnect();
            }
        }
    });

    observer.observe(document, {
        childList: true,
        subtree: true
    });
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

    if (tabUrl.endsWith('#_sidebar')) {
        const stylesheetUrl = browser.runtime.getURL('/styles/search_results.css');
        const link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', stylesheetUrl);
        document.head.appendChild(link);
    }

    // If the website doesn't contain an opensearch plugin, then hide the Page action
    if (document.querySelector('link[type="application/opensearchdescription+xml"]') == null) {
        sendMessage('hidePageAction', null);
    } else {
        sendMessage('showPageAction', null);
    }

    // Retrieve search engines from local storage
    const searchEngines = await browser.storage.local.get(null);
    if (logToConsole) console.log(searchEngines);

    // If there exists a search engine with a query string that includes the domain of the visited web page, then hide the Page action
    for (let id in searchEngines) {
        if (id.startsWith("separator-") || id.startsWith("chatgpt-")) continue;
        if (searchEngines[id].url.includes(domain)) {
            if (logToConsole) console.log('This web page has already been added to your list of search engines.');
            sendMessage('hidePageAction', null);
            break;
        }
    }

    // Display clickable icons (buttons) for mycroftproject.com
    showButtons();
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

// Handle keyboard shortcuts
async function handleKeyUp(e) {
    const modifiers = ["Control", "Shift", "Alt", "Meta"];
    if (logToConsole) console.log(e);
    if (logToConsole) console.log(keysPressed);
    // If no key has been pressed or if text is being typed in an INPUT field then discontinue
    if (!Object.keys(keysPressed).length > 0 || e.target.nodeName === 'INPUT' || !isKeyAllowed(e)) return;
    // if (e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) return;

    // If no text has been selected then discontinue
    const selectedText = getSelectedText();
    if (selectedText) {
        e.preventDefault();
        sendSelectionToBackgroundScript(selectedText);
    } else {
        return;
    }

    // Retrieve search engines from local storage
    const searchEngines = await browser.storage.local.get(null);

    // Store all modifier keys pressesd in var input
    let input = "";
    for (let i = 0; i < modifiers.length; i++) {
        const modifier = modifiers[i];
        if (logToConsole) console.log(modifier);
        if (!(modifier in keysPressed)) continue;
        switch (modifier) {
            case 'Control':
                input = input + 'ctrl+';
                break;
            case 'Shift':
                input = input + 'shift+';
                break;
            case 'Alt':
                input = input + 'alt+';
                break;
            case 'Meta':
                input = input + meta;
                break;
            default:
        }
        delete keysPressed[modifier];
    }
    if (logToConsole) console.log(`keys pressed: ${input}`);
    if (logToConsole) console.log(`remaining keys down: `);
    if (logToConsole) console.log(keysPressed);

    // For all non-modifier keys pressed...
    for (let key in keysPressed) {
        if (logToConsole) console.log(key);
        if (os === 'macOS') {
            input += keysPressed[key].substring(3).toLowerCase();
        } else {
            input += key.toLowerCase();
        }
    }
    if (logToConsole) console.log(`keys pressed: ${input}`);
    keysPressed = {};
    // If only the alt key was pressed then discontinue
    if (input === "alt+") return;
    for (let id in searchEngines) {
        if (logToConsole) console.log(id);
        const keyboardShortcut = searchEngines[id].keyboardShortcut;
        if (logToConsole) console.log(keyboardShortcut);
        if (keyboardShortcut && keyboardShortcut === input) {
            sendMessage('doSearch', { id: id });
            break;
        }
    }
}

async function handleStorageChange(changes, area) {
    if (logToConsole) {
        console.log('The following changes have occured:\n');
        console.log(changes);
    }
    switch (area) {
        case 'local':
            const searchEngines = await browser.storage.local.get(null);
            // If the website doesn't contain an opensearch plugin, then hide the Page action
            if (document.querySelector('link[type="application/opensearchdescription+xml"]') == null) {
                sendMessage('hidePageAction', null);
            } else {
                sendMessage('showPageAction', null);
            }
            // The following test has to be carried out when a new search engine is added...
            // If there exists a search engine with a query string that includes the domain of the visited web page, then hide the Page action
            for (let id in searchEngines) {
                if (id.startsWith("separator-") || id.startsWith("chatgpt-")) continue;
                if (searchEngines[id].url.includes(domain)) {
                    if (logToConsole) console.log('This web page has already been added to your list of search engines.');
                    sendMessage('hidePageAction', null);
                    break;
                }
            }
            break;
        default:
            break;
    }
}

// Triggered by mouse up event
async function handleAltClickWithGrid(e) {
    if (e !== undefined && logToConsole) console.log('Click event triggered:\n' + e.type, e.button, e.altKey, e.clientX, e.clientY);

    if (e.type === 'mouseup' && e.altKey && e.button === 0) e.preventDefault();

    const data = await browser.storage.sync.get(null);
    const options = data.options;
    if (logToConsole) console.log(options);

    // If option is disabled then do nothing. Note: this intentionally comes after selected text is accessed as text can become unselected on click
    if (options.disableAltClick) return;

    // If mouse up is not done with left mouse button then do nothing
    if (e !== undefined && e.button > 0) return;

    const selectedText = getSelectedText();
    if (logToConsole) console.log(`Selected text: ${selectedText}`);

    // IF either the Quick Icons Grid is activated on mouse up 
    // OR the option (alt) key is pressed on mouse up
    // THEN display the Icons Grid
    if ((options.quickIconGrid && e.type === 'mouseup' && selectedText.length > 0) || (e.type === 'mouseup' && e.altKey && selectedText.length > 0)) {
        // If a search engine has just been clicked
        if (flagSearchEngineClicked) {
            flagSearchEngineClicked = false;
            return;
        }

        // If the grid of icons is alreadey displayed
        const nav = document.getElementById('context-search-icon-grid');
        if (nav !== undefined && nav !== null) return;

        // Otherwise
        if (logToConsole) console.log('Displaying Icons Grid...');
        const x = e.clientX;
        const y = e.clientY;
        createIconGrid(x, y);
    }
}

function handleRightClickWithoutGrid(e) {
    if (logToConsole) console.log(e);
    const selectedText = getSelectedText();
    if (logToConsole) console.log(selectedText);
    // Send the selected text to background.js
    sendMessage('setSelection', { selection: selectedText });
    // If right click is on image
    const elementClicked = e.target;
    const tag = elementClicked.tagName;
    if (tag === 'IMG') {
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
        const imgUrl = absoluteUrl(elementClicked.getAttribute('src'));
        sendMessage('setTargetUrl', imgUrl);
        if (logToConsole) console.log(`Image url: ${imgUrl}`);
    }
}

// Display clickable buttons/icons on mycroftproject.com
async function showButtons() {
    if (domain != 'mycroftproject.com') return;
    const installLinks = document.querySelectorAll('a[href^="/install.html"]');
    const links = Array.from(installLinks);
    if (logToConsole) console.log(links);

    links.forEach(link => {
        let img = new Image();
        img.src = browser.runtime.getURL('/icons/context-search.svg');
        img.className = 'icon';
        img.height = '16px';
        img.style.marginRight = '5px';
        img.style.cursor = 'pointer';
        img.title = browser.i18n.getMessage("AddSearchEngine");

        img.onclick = async function () {
            const href = link.getAttribute('href');
            const pid = getPidAndName(href).pid;
            const name = getPidAndName(href).name;
            const url = mycroftUrl + pid + '/' + name + '.xml';
            const result = await getNewSearchEngine(url);
            // Send msg to background script to get the new search engine added
            if (result !== null) {
                sendMessage('addNewSearchEngine', result);
            }
        }

        link.parentNode.insertBefore(img, link);
    });
}

function handleTextSelection() {
    const selectedText = getSelectedText();
    if (selectedText !== null && selectedText !== undefined && selectedText !== "") {
        if (logToConsole) console.log(`Selected text: ${selectedText}`);
        sendSelectionToBackgroundScript(selectedText);
    }
}

function getPidAndName(string) {
    const queryString = string.substring(string.indexOf('?'));
    if (logToConsole) console.log(`query string: ${queryString}`);
    const urlParams = new URLSearchParams(queryString);
    const pid = urlParams.get('id');
    const name = urlParams.get('name');
    return { pid: pid, name: name };
}

function getSelectedText() {
    // If selection is made in Textarea or Input field
    if (
        document.activeElement != null &&
        (document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'INPUT')
    ) {
        const selectedTextInput = document.activeElement.value.substring(
            document.activeElement.selectionStart,
            document.activeElement.selectionEnd
        );
        if (selectedTextInput !== '') return selectedTextInput;
    }

    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.rangeCount > 0) {
            range = sel.getRangeAt(0);
            return range.toString().trim();
        }
    }

    return '';
}

async function sendSelectionToBackgroundScript(selectedText) {
    const data = await browser.storage.sync.get(null);
    const options = data.options;
    if (logToConsole) console.log(options);
    const targetUrl = options.siteSearchUrl + encodeUrl(`site:https://${domain} ${selectedText}`);
    sendMessage('setTargetUrl', targetUrl);

    // Send the selected text to background.js
    sendMessage('setSelection', { selection: selectedText });
}

/* function handleError(error) {
    console.log(`Error: ${error}`);
} */

async function createIconGrid(x, y) {
    // Retrieve search engines from local storage
    const se = await browser.storage.local.get(null);
    const searchEngines = sortByIndex(se);
    if (logToConsole) console.log(searchEngines);
    let icons = [];
    // Only include the multi-search icon in the Icons Grid if required
    for (const id in searchEngines) {
        if (searchEngines[id].multitab) {
            icons = [{
                id: 'multisearch',
                src: 'data:image/svg+xml;base64,' + base64MultiSearchIcon,
                title: 'multi-search',
            }];
            break;
        }
    }

    // Number of search engines
    let n = 0;
    for (const id in searchEngines) {
        if (!id.startsWith("separator-")) {
            let src = `data:${searchEngines[id].imageFormat || 'image/png'};base64,`;
            const title = searchEngines[id].name;
            if (isEmpty(searchEngines[id]) || isEmpty(searchEngines[id].base64)) {
                // Default icon when no favicon could be found
                src += base64ContextSearchIcon;
            } else {
                src += searchEngines[id].base64;
            }
            icons.push({ id: id, src: src, title: title });
            n++;
        }
    }

    // Grid dimensions
    n += 1; // Add one icon for multi-search
    const m = Math.ceil(Math.sqrt(n)); // Grid dimension: m x m matrix

    // Cleanup
    closeGrid();

    const nav = document.createElement('div');
    nav.setAttribute('id', 'context-search-icon-grid');
    nav.style.backgroundColor = '#ccc';
    nav.style.border = '3px solid #999';
    nav.style.padding = '5px';
    nav.style.borderRadius = '20px';
    nav.style.zIndex = 9999;
    nav.style.position = 'fixed';
    nav.style.setProperty('top', y.toString() + 'px');
    nav.style.setProperty('left', x.toString() + 'px');
    nav.style.gridTemplateColumns = `repeat(${m}, 1fr)`;
    nav.style.display = 'grid';
    nav.style.gap = '4px';


    for (const icon of icons) {
        const iconElement = document.createElement("img");
        iconElement.style.width = ICON32;
        iconElement.style.height = ICON32;
        iconElement.style.display = 'inline-block';
        iconElement.style.border = '3px solid #ccc';
        iconElement.style.borderRadius = '10px';
        iconElement.setAttribute('id', icon.id);
        iconElement.setAttribute('src', icon.src);
        iconElement.setAttribute('title', icon.title);
        iconElement.addEventListener('mouseover', addBorder);
        iconElement.addEventListener('mouseleave', removeBorder);
        nav.appendChild(iconElement);
    }

    const body = document.getElementsByTagName('body')[0];
    body.appendChild(nav);

    // Define event listeners for the icon grid
    nav.addEventListener('click', onGridClick);
    nav.addEventListener('mouseleave', onLeave);

    // Position icon grid contained in nav element
    nav.style.left = 0;
    nav.style.top = 0;
    let viewportWidth = document.body.clientWidth;
    let viewportHeight = window.innerHeight;
    let navWidth = nav.offsetWidth + 16;
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
    e.preventDefault();
    e.stopPropagation();
    flagSearchEngineClicked = true;
    if (logToConsole) console.log('Icons Grid got clicked:' + e.type);
    const id = e.target.id;
    if (logToConsole) console.log('Search engine clicked:' + id);
    closeGrid();
    const selection = window.getSelection();
    selection.addRange(range);
    sendMessage('doSearch', { id: id });
}

async function onLeave() {
    const data = await browser.storage.sync.get(null);
    const options = data.options;
    if (logToConsole) console.log(options);
    if (!options.closeGridOnMouseOut) return;
    if (logToConsole) console.log('Closing Icons Grid...');
    closeGrid();
}

function closeGrid() {
    let nav = document.getElementById('context-search-icon-grid');
    if (nav) {
        nav.parentElement.removeChild(nav);
        nav.removeEventListener('click', onGridClick);
        nav.removeEventListener('mouseleave', onLeave);
        nav = null;
    }
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
        e.target.style.border = '3px solid #ccc';
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
    /* Only accept commonly trusted protocols:
     * Only data-image URLs are accepted, Exotic flavours (escaped slash,
     * html-entitied characters) are not supported to keep the function fast */
    if (/^(https?|file|ftps?|mailto|javascript|data:image\/[^;]{2,9};):/i.test(url))
        return url; //Url is already absolute

    var base_url = location.href.match(/^(.+)\/?(?:#.+)?$/)[0] + "/";
    if (url.substring(0, 2) == "//")
        return location.protocol + url;
    else if (url.charAt(0) == "/")
        return location.protocol + "//" + location.host + url;
    else if (url.substring(0, 2) == "./")
        url = "." + url;
    else if (/^\s*$/.test(url))
        return ""; //Empty = Return nothing
    else url = "../" + url;

    url = base_url + url;

    while (/\/\.\.\//.test(url = url.replace(/[^/]+\/+\.\.\//g, "")));

    /* Escape certain characters to prevent XSS */
    url = url.replace(/\.$/, "").replace(/\/\./g, "").replace(/"/g, "%22")
        .replace(/'/g, "%27").replace(/</g, "%3C").replace(/>/g, "%3E");
    return url;
}

async function getNewSearchEngine(url) {
    const xml = await fetchXML(url);
    const shortName = getNameAndQueryString(xml).shortName;
    const queryString = getNameAndQueryString(xml).queryString;

    // Retrieve search engines from local storage
    const searchEngines = await browser.storage.local.get(null);

    // Prevent duplicates
    for (let id in searchEngines) {
        if (queryString === searchEngines[id].url) return null;
    }

    let id = shortName.replace(/\s/g, '-').toLowerCase();
    while (!isIdUnique(id)) {
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
async function isIdUnique(testId) {
    // Retrieve search engines from local storage
    const searchEngines = await browser.storage.local.get(null);
    for (let id in searchEngines) {
        if (id === testId) {
            return false;
        }
    }
    return true;
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

/// Sort search engines by index
function sortByIndex(list) {
    let sortedList = JSON.parse(JSON.stringify(list));
    const n = Object.keys(list).length;
    let m = n;
    let arrayOfIndexes = [];
    let arrayOfIds = [];
    let min = 999;
    if (logToConsole) console.log(list);
    // Create the array of indexes and its corresponding array of ids
    for (let id in list) {
        if (logToConsole) console.log(`id = ${id}`);
        // If there is no index, then move the search engine to the end of the list
        if (isEmpty(list[id].index)) {
            list[id].index = m + 1;
            m++;
        }
        arrayOfIndexes.push(list[id].index);
        arrayOfIds.push(id);
    }
    // Sort the list by index
    for (let i = 1; i < n + 1; i++) {
        min = Math.min(...arrayOfIndexes);
        const indice = arrayOfIndexes.indexOf(min);
        const id = arrayOfIds[indice];
        arrayOfIndexes.splice(indice, 1);
        arrayOfIds.splice(indice, 1);
        sortedList[id].index = i;
    }

    return sortedList;
}

function isKeyAllowed(event) {
    const disallowedKeys = [
        'Tab', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Escape', ' ', 'Delete', 'Backspace', 'Home', 'End',
        'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
    ];

    return !disallowedKeys.includes(event.key);
}