/// Import browser polyfill for compatibility with Chrome and other browsers
import '/libs/browser-polyfill.min.js';

// Import constants to use STORAGE_KEYS
import { STORAGE_KEYS } from './constants.js';
import { isKeyAllowed, isInFocus, isIdUnique, getOS, getMetaKey } from './utilities.js';

/* global logToConsole */
// logToConsole provided by shared logging.js injected via manifest.
/// Global variables
let meta = 'win+';
let os = 'Windows';

document.addEventListener('DOMContentLoaded', async () => {
    // Retrieve the parent window ID from the URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const parentWindowId = parseInt(urlParams.get('parentWindowId'));
    const cancelButton = document.getElementById('cancelButton');
    const addBookmarkButton = document.getElementById('addBookmarkButton');
    const folderSelect = document.getElementById('folder');
    const title = document.getElementById('title');
    const url = document.getElementById('url');
    const inputKeyboardShortcut = document.getElementById('keyboardShortcut');
    let keysPressed = {};
    const searchEngines = await getStoredData(STORAGE_KEYS.SEARCH_ENGINES);
    const tabs = await browser.tabs.query({ active: true, windowId: parentWindowId });
    const activeTab = tabs[0];

    // Determine the operating system and define the meta key
    os = await getOS();
    meta = getMetaKey(os, 'display');

    if (logToConsole) console.log(searchEngines);
    if (logToConsole) console.log(activeTab);
    if (logToConsole) console.log(os);

    // Fill in default values for the title & url
    title.value = activeTab.title;
    url.value = activeTab.url;

    // Event handlers for adding a keyboard shortcut
    inputKeyboardShortcut.addEventListener('keyup', (e) => {
        if (Object.keys(keysPressed).length > 0) {
            inputKeyboardShortcut.value = getKeyboardShortcut(e, keysPressed, os);
        }
        keysPressed = {};
    });
    inputKeyboardShortcut.addEventListener('keydown', (e) => {
        if (logToConsole) console.log(e);
        if (e.target.nodeName !== 'INPUT') return;
        if ((os === 'macOS' && e.metaKey) || ((os === 'Windows' || os === 'Linux') && e.ctrlKey) || !isInFocus(e.target) || e.key === 'Escape') {
            if (logToConsole) console.log('Keys pressed: ' + keysPressed);
            keysPressed = {};
            return;
        }
        const key = e.key;
        if (isKeyAllowed(e)) keysPressed[key] = e.code;
        if (logToConsole) console.log(keysPressed);
    });

    // Cancel button closes the popup
    cancelButton.addEventListener('click', () => {
        window.close();
    });

    // Add Bookmark button functionality
    addBookmarkButton.addEventListener('click', async () => {
        if (isSupportedProtocol(url.value)) {
            await addBookmark(folderSelect, searchEngines);
            window.close();
        } else {
            // Display an error message for 4 seconds if the URL is not supported
            const warning = document.getElementById('warning');
            setTimeout(() => {
                warning.style.color = 'red';
                warning.style.weight = 'bold';
                warning.textContent = 'Invalid URL. Please enter a valid bookmark URL.';
            }, 4000);
            warning.textContent = '';
        }
    });

    // Populate the folder select with bookmark folders
    populateFolderSelect(folderSelect, searchEngines);
});

// Removed local getOS (now provided by utilities.js)

function populateFolderSelect(selectElement, searchEngines) {
    for (const id in searchEngines) {
        if (searchEngines[id].isFolder) {
            const option = document.createElement('option');
            option.value = id;
            option.text = searchEngines[id].name;
            selectElement.appendChild(option);
        }
    }
}

// Add the bookmark to the selected folder
async function addBookmark(folderSelect, searchEngines) {
    const title = document.getElementById('title').value;
    const url = document.getElementById('url').value;
    const keyword = document.getElementById('keyword').value;
    const keyboardShortcut = document.getElementById('keyboardShortcut').value;
    const folderId = folderSelect.value;
    const children = searchEngines[folderId].children;
    const i = children.length;

    // Generate a unique id for the bookmark
    let id = 'link-' + title.trim().replaceAll(' ', '-').toLowerCase();
    id = id.substring(0, 25); // Limit id length to 25 characters
    while (!isIdUnique(searchEngines, id)) {
        id = 'link-' + title.trim().replaceAll(' ', '-').toLowerCase() + '-' + Date.now();
    }

    // Add the bookmark id to the children array of the selected folder
    children.push(id);

    // Define bookmark to be added to search engines list
    searchEngines[id] = {};
    searchEngines[id]['index'] = i;
    searchEngines[id]['name'] = title;
    searchEngines[id]['keyword'] = keyword;
    searchEngines[id]['keyboardShortcut'] = keyboardShortcut;
    searchEngines[id]['multitab'] = false;
    searchEngines[id]['url'] = url;
    searchEngines[id]['show'] = true;
    //searchEngines[id]['imageFormat'] = imageFormat;
    //searchEngines[id]['base64'] = base64String;

    await sendMessage('saveSearchEngines', searchEngines);
}

// Removed duplicate helper functions (isKeyAllowed, isInFocus, isIdUnique) now imported from utilities.js

function isSupportedProtocol(urlString) {
    const supportedProtocols = ['https:', 'http:', 'ftp:', 'file:', 'javascript:'];
    const url = document.createElement('a');
    url.href = urlString;
    return supportedProtocols.indexOf(url.protocol) !== -1;
}

// Handle the input of a keyboard shortcut for a search engine in the Options page
function getKeyboardShortcut(e, keysPressed, os) {
    if (logToConsole) console.log(e);
    if (e.target.nodeName !== 'INPUT' || !isKeyAllowed(e)) return;
    // If the ESC key is pressed or the CMD key is pressed on macOS or CTRL key is pressed on Windows or Linux, then do nothing
    if ((os === 'macOS' && e.metaKey) || ((os === 'Windows' || os === 'Linux') && e.ctrlKey) || !isInFocus(e.target) || e.key === 'Escape') {
        if (logToConsole) console.log('Keys pressed: ' + Object.keys(keysPressed));
        keysPressed = {};
        return;
    }
    e.preventDefault();

    if (logToConsole) console.log(os);
    if (logToConsole) console.log(keysPressed);

    let keyboardShortcut = '';

    // Identify modifier keys pressed
    for (let key in keysPressed) {
        switch (key) {
            case 'Control':
                keyboardShortcut = keyboardShortcut + 'ctrl+';
                delete keysPressed[key];
                break;
            case 'Alt':
                keyboardShortcut = keyboardShortcut + 'alt+';
                delete keysPressed[key];
                break;
            case 'Shift':
                keyboardShortcut = keyboardShortcut + 'shift+';
                delete keysPressed[key];
                break;
            case 'Meta':
                keyboardShortcut = keyboardShortcut + meta;
                delete keysPressed[key];
                break;
            default:
        }
    }
    if (logToConsole) console.log(`Modifier keys pressed: ${keyboardShortcut}`);
    if (logToConsole) console.log(`Remaining non-modifier keys pressed: `);
    if (logToConsole) console.log(keysPressed);

    // Identify the remaining non-modifier keys pressed
    for (let key in keysPressed) {
        if (os === 'macOS') {
            keyboardShortcut += keysPressed[key].substring(3).toLowerCase();
        } else {
            keyboardShortcut += key.toLowerCase();
        }
    }

    // Save the identified keyboard shortcut
    if (logToConsole) console.log(keyboardShortcut);
    return keyboardShortcut;
}

// Function to get stored data
async function getStoredData(key) {
    try {
        if (key) {
            const result = await browser.storage.local.get(key);
            if (logToConsole) console.log(`Getting ${key} from storage:`, result[key]);
            return result[key];
        } else {
            const result = await browser.storage.local.get();
            if (logToConsole) console.log('Getting all data from storage:', result);
            return result;
        }
    } catch (error) {
        console.error(`Error getting ${key} from storage:`, error);
        return null;
    }
}

// Send a message to the background script
async function sendMessage(action, data) {
    await browser.runtime.sendMessage({ action: action, data: JSON.parse(JSON.stringify(data)) }).catch((e) => {
        if (logToConsole) console.error(e);
    });
}

// Removed local initMetaKey (using getMetaKey from utilities.js)
