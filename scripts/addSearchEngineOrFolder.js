/// Import browser polyfill for compatibility with Chrome and other browsers
import '/libs/browser-polyfill.min.js';

/// Import constants
import { STORAGE_KEYS } from './constants.js';

const notifySearchEngineUrlRequired = browser.i18n.getMessage('notifySearchEngineUrlRequired');

// Get the query string part of the URL (e.g., "?uniqueId=abc&parentId=xyz&newIndex=2")
const queryString = window.location.search;

// Create a URLSearchParams object from the query string
const urlParams = new URLSearchParams(queryString);

// Retrieve the specific parameters using the get() method
const parentId = urlParams.get('parentId');
const strNewIndex = urlParams.get('newIndex'); // Note: this will be a string, convert if needed
const newIndex = parseInt(strNewIndex, 10);

// Add a new search engine
const show = document.getElementById('show'); // Boolean
const sename = document.getElementById('name'); // String
const keyword = document.getElementById('keyword'); // String
const multitab = document.getElementById('multitab'); // Boolean
const url = document.getElementById('url'); // String
const searchEngineKbsc = document.getElementById('kb-shortcut'); // String

// Add a new AI Prompt
const promptShow = document.getElementById('promptShow'); // Boolean
const promptName = document.getElementById('promptName'); // String
const promptKeyword = document.getElementById('promptKeyword'); // String
const promptMultitab = document.getElementById('promptMultitab'); // Boolean
const promptText = document.getElementById('prompt'); // String
const promptKbsc = document.getElementById('prompt-kb-shortcut'); // String
const aiProvider = document.getElementById('ai-provider');

// Add a new folder
const folderName = document.getElementById('folderName');
const folderKeyword = document.getElementById('folderKeyword');
const folderKbsc = document.getElementById('folder-kb-shortcut');

// Add new search engine buttons
const btnTest = document.getElementById('test');
const btnAddSearchEngine = document.getElementById('addSearchEngine');
const btnClearAddSearchEngine = document.getElementById('clearAddSearchEngine');

// Add new AI Prompt buttons
const btnTestChatGPTPrompt = document.getElementById('testChatGPTPrompt');
const btnAddChatGPTPrompt = document.getElementById('addChatGPTPrompt');
const btnClearAddChatGPTPrompt = document.getElementById('clearAddChatGPTPrompt');

// Add new folder buttons
const btnAddFolder = document.getElementById('addFolder');
const btnClearAddFolder = document.getElementById('clearAddFolder');

// Add new separator buttons
const btnAddSeparator = document.getElementById('addSeparator');

let os = ''; // Variable to store the OS type
let meta = ''; // Variable to store the meta key
let logToConsole = false; // Flag to control console logging
let keysPressed = {}; // Object to track pressed keys
let searchEngines = {};

/// Event listeners

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('DOM content loaded.');
        os = await getOS();
        await init();
    } catch (err) {
        console.error('Error during initialization:', err);
    }
});

// Test new search engine or AI Prompt button click handlers
btnTest.addEventListener('click', testSearchEngine);
btnTestChatGPTPrompt.addEventListener('click', testChatGPTPrompt);

// Add new search engine or AI Prompt or folder or separator button click handlers
btnAddSearchEngine.addEventListener('click', addSearchEngine);
btnAddChatGPTPrompt.addEventListener('click', addChatGPTPrompt);
btnAddFolder.addEventListener('click', addFolder);
btnAddSeparator.addEventListener('click', addSeparator);

// Clear form inputs for adding a new search engine or AI Prompt or folder
btnClearAddSearchEngine.addEventListener('click', clearAddSearchEngine);
btnClearAddChatGPTPrompt.addEventListener('click', clearAddChatGPTPrompt);
btnClearAddFolder.addEventListener('click', clearAddFolder);

/// Keyboard Shortcut handlers

// Add new search engine event handlers for adding a keyboard shortcut
searchEngineKbsc.addEventListener('keyup', handleKeyboardShortcutKeyUp);
searchEngineKbsc.addEventListener('keydown', handleKeyboardShortcutKeyDown);

// Add new AI prompt event handlers for adding a keyboard shortcut
promptKbsc.addEventListener('keyup', handleKeyboardShortcutKeyUp);
promptKbsc.addEventListener('keydown', handleKeyboardShortcutKeyDown);

// Add new folder event handlers for adding a keyboard shortcut
folderKbsc.addEventListener('keyup', handleKeyboardShortcutKeyUp);
folderKbsc.addEventListener('keydown', handleKeyboardShortcutKeyDown);

/// Helper functions

// Detect the underlying OS
async function getOS() {
    const platform = await browser.runtime.getPlatformInfo();
    const os = platform.os;
    if (os === 'mac') {
        return 'macOS';
    } else if (os === 'ios') {
        return 'iOS';
    } else if (os === 'win') {
        return 'Windows';
    } else if (os === 'android') {
        return 'Android';
    } else if (os === 'linux') {
        return 'Linux';
    } else return null;
}

// Function to check if a key is allowed
function isKeyAllowed(key) {
    const disallowedKeys = [
        'Tab', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Escape', ' ', 'Delete', 'Backspace', 'Home', 'End',
        'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'F13', 'F14', 'F15', 'F16', 'F17', 'F18', 'F19'
    ];

    return !disallowedKeys.includes(key);
}

// Function to check if an elementis in focus
function isInFocus(element) {
    return (document.activeElement === element);
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

function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        // Malformed URL
        return false;
    }
}

// Storage utility functions
async function getStoredData(key) {
    try {
        const result = await browser.storage.local.get(key);
        if (logToConsole) console.log(`Getting ${key} from storage:`, result[key]);
        return result[key];
    } catch (error) {
        console.error(`Error getting ${key} from storage:`, error);
        return null;
    }
}

// Send a message to the background script
async function sendMessage(action, data = {}) {
    try {
        if (logToConsole) console.log('Sending message:', action, data);
        const response = await browser.runtime.sendMessage({ action, data });
        if (logToConsole) console.log('Message response:', response);
        return response;
    } catch (error) {
        console.error('Error sending message:', error);
        throw new Error(`Failed to send message ${action}: ${error.message}`);
    }
}

// Notification
async function notify(message) {
    await sendMessage('notify', message);
}

function i18n() {
    translateContent('data-i18n', 'textContent');
    translateContent('data-i18n-placeholder', 'placeholder');
    translateContent('data-i18n-title', 'title');
}

function translateContent(attribute, type) {
    let i18nElements = document.querySelectorAll('[' + attribute + ']');

    i18nElements.forEach(i => {
        try {
            const i18n_attrib = i.getAttribute(attribute);
            const message = browser.i18n.getMessage(i18n_attrib);
            switch (type) {
                case 'textContent':
                    i.textContent = message;
                    break;
                case 'placeholder':
                    i.placeholder = message;
                    break;
                case 'title':
                    i.title = message;
                    break;
                default:
                    break;
            }
        } catch (ex) {
            if (logToConsole) console.error(`Translation for ${i18nElements[i]} could not be found`);
        }
    });
}

/// Main functions

// Initialize meta key based on OS
function initMetaKey() {
    if (os === 'macOS') {
        meta = 'Cmd';
    } else if (os === 'Windows') {
        meta = 'Win';
    } else if (os === 'Linux') {
        meta = 'Super';
    } else {
        meta = 'Meta';
    }
}


async function init() {
    try {
        initMetaKey();

        // Initialize the UI with stored data
        logToConsole = await getStoredData(STORAGE_KEYS.LOG_TO_CONSOLE);
        searchEngines = await getStoredData(STORAGE_KEYS.SEARCH_ENGINES);

        // Now you can use these variables (uniqueId, parentId, newIndex) in your script
        if (logToConsole) console.log("Received parentId:", parentId);
        if (logToConsole) console.log("Received newIndex:", newIndex);

        i18n();
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

// Clears the form inputs for adding a new search engine
function clearAddSearchEngine() {
    show.checked = true;
    sename.value = '';
    keyword.value = '';
    multitab.checked = false;
    url.value = '';
    searchEngineKbsc.value = '';
    console.log('Cleared Add Search Engine form');
}

// Clears the form inputs for adding a new AI prompt
function clearAddChatGPTPrompt() {
    promptShow.checked = true;
    promptName.value = '';
    promptKeyword.value = '';
    promptMultitab.checked = false;
    promptText.value = '';
    promptKbsc.value = '';
    aiProvider.value = '';
    console.log('Cleared Add AI Prompt form');
}

// Clears the form inputs for adding a new folder
function clearAddFolder() {
    folderName.value = '';
    folderKeyword.value = '';
    folderKbsc.value = '';
    console.log('Cleared Add Folder form');
}

// Handles the keyup event for keyboard shortcuts
function handleKeyboardShortcutKeyUp(e) {
    if (logToConsole) console.log('Keyboard Shortcut Key Up Event');
    if (logToConsole) console.log(e);

    const releasedKey = e.key;
    if (logToConsole) console.log('keyup:', releasedKey, 'keysPressed:', keysPressed);

    // List of modifier keys
    const modifierKeys = ['Meta', 'Control', 'Alt', 'Shift'];

    // Ignore the keyup event if the released key is a modifier itself
    // or if no keys were actually recorded (e.g., if Escape/Backspace was just pressed)
    if (modifierKeys.includes(releasedKey) || Object.keys(keysPressed).length === 0) {
        if (logToConsole) console.log('keyup ignored (modifier released or keysPressed empty)');
        return;
    }

    // Ensure the target is an input
    if (e.target.nodeName !== 'INPUT') {
        keysPressed = {}; // Clear keysPressed just in case
        return;
    }

    // We now know a non-modifier key was released, and keysPressed contains the combination.
    e.preventDefault(); // Prevent any default action associated with the non-modifier key release
    e.stopPropagation();

    let input;

    // Determine the target input field
    if (e.target.id === 'kb-shortcut') {
        input = searchEngineKbsc;
    } else if (e.target.id === 'prompt-kb-shortcut') {
        input = promptKbsc;
    } else if (e.target.id === 'folder-kb-shortcut') {
        input = folderKbsc;
    } else {
        keysPressed = {};
        return;
    }

    // Define the desired order for modifier keys
    const modifierOrder = { 'Meta': 1, 'Control': 2, 'Alt': 3, 'Shift': 4 };
    let currentModifiers = [];
    let mainKey = null;

    // Separate modifiers and the main key from keysPressed
    for (const key in keysPressed) {
        if (modifierKeys.includes(key)) {
            currentModifiers.push(key);
        } else {
            // Assuming only one non-modifier key is used in a shortcut
            // If multiple are allowed, this needs adjustment
            mainKey = key;
        }
    }

    // Sort modifiers based on the defined order
    currentModifiers.sort((a, b) => (modifierOrder[a] || 99) - (modifierOrder[b] || 99));

    // Build the shortcut string
    let shortcutParts = [];
    currentModifiers.forEach(mod => {
        if (mod === 'Meta') {
            // Use 'Cmd' on Mac
            shortcutParts.push(meta);
        } else {
            shortcutParts.push(mod); // Use the key name directly (e.g., Control, Alt, Shift)
        }
    });

    if (mainKey) {
        shortcutParts.push(mainKey.length === 1 ? mainKey.toUpperCase() : mainKey); // Uppercase single chars
    }

    const keyboardShortcut = shortcutParts.join('+');

    // Update the input field value
    if (logToConsole) console.log('Final shortcut string:', keyboardShortcut);
    input.value = keyboardShortcut;

    // Clear keysPressed for the next shortcut
    keysPressed = {};
}

// Handles the keydown event for keyboard shortcuts
function handleKeyboardShortcutKeyDown(e) {
    console.log(`Keyboard Shortcut Key Down: ${e.key}`);
    if (logToConsole) console.log('keydown:', e.key, e.code, e.metaKey, e.ctrlKey, 'target:', e.target.id);
    // Ensure event target is an input and is focused
    if (e.target.nodeName !== 'INPUT' || !isInFocus(e.target)) return;

    // If Escape, Backspace, or Delete is pressed, clear keysPressed and the input
    if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'Delete') {
        if (logToConsole) console.log(`${e.key} pressed, clearing keysPressed and input`);
        keysPressed = {};
        e.target.value = ''; // Clear the visual input
        // Prevent default actions (like navigating back on Backspace)
        e.preventDefault();
        e.stopPropagation();
        // Trigger change event manually ONLY if clearing the value should be saved immediately
        // Normally, we wait for blur, but if an existing shortcut was cleared,
        // we might want to save the empty string.
        // const changeEvent = new Event('change', { bubbles: true });
        // e.target.dispatchEvent(changeEvent);
        return; // Don't record these keys
    }

    // Prevent default browser shortcuts (like Ctrl+S) but allow standalone modifiers
    const isModifierOnly = e.key === 'Control' || e.key === 'Alt' || e.key === 'Shift' || e.key === 'Meta';
    if (!isModifierOnly && (e.metaKey || e.ctrlKey || e.altKey)) {
        e.preventDefault();
    }

    const key = e.key; // Use e.key for consistency

    // Record the key if allowed (using true for presence)
    if (isKeyAllowed(key)) {
        keysPressed[key] = true;
        if (logToConsole) console.log('Stored keydown:', key, 'keysPressed:', keysPressed);
    } else {
        if (logToConsole) console.log('Key not allowed or ignored:', key);
        // Optionally prevent default for disallowed keys if they cause issues
        // e.preventDefault();
    }
}

// Handles adding a new separator
async function addSeparator(e) {
    e.preventDefault();
    let sepId = `separator-${Date.now()}`;

    // Ensure new id is unique
    while (!isIdUnique(sepId)) {
        sepId = `separator-${Date.now()}`;
    }

    const separatorData = {
        index: newIndex,
    };

    // Send data back to the main window using the unique ID
    window.opener.postMessage({ parentId, id: sepId, searchEngine: separatorData }, window.location.origin);
    window.close();
}

// Handles adding a new folder
async function addFolder(e) {
    e.preventDefault();
    const name = folderName.value;
    const keyword = folderKeyword.value || '';
    const keyboardShortcut = folderKbsc.value || '';
    let id = name.trim().replaceAll(' ', '-').toLowerCase();

    // Ensure new ID is unique
    while (!isIdUnique(id)) {
        id = name.trim().replaceAll(' ', '-').toLowerCase() + '-' + Date.now();
    }

    // The new folder will be saved as a search engine entry
    // Folders don't possess all the properties that search engines do
    // A folder doesn't have a query string url property
    // A folder may have children (search engines don't have children)
    const folderData = {
        index: newIndex,
        name: name,
        keyword: keyword,
        keyboardShortcut: keyboardShortcut,
        isFolder: true,
        children: [], // Array of search engine and/or subfolder ids
    };

    // Send data back to the main window using the unique ID
    window.opener.postMessage({ parentId, id, searchEngine: folderData }, window.location.origin);
    window.close();
}

// Handles adding a new AI prompt
async function addChatGPTPrompt(e) {
    e.preventDefault();
    let id = "chatgpt-" + Date.now();

    // Ensure new ID is unique
    while (!isIdUnique(id)) {
        id = "chatgpt-" + Date.now();
    }

    // Minimal requirements to add a prompt
    if (!(aiProvider.value && promptName.value && promptText.value)) {
        await notify('Please at least select an AI Provider and provide a prompt name and a prompt.');
        return;
    }

    const promptData = {
        index: newIndex,
        aiProvider: aiProvider.value,
        name: promptName.value,
        keyword: promptKeyword.value,
        keyboardShortcut: promptKbsc.value,
        multitab: promptMultitab.checked,
        prompt: promptText.value,
        show: promptShow.checked,
        isFolder: false
    };

    // Send data back to the main window using the unique ID
    window.opener.postMessage({ parentId, id, searchEngine: promptData }, window.location.origin);
    window.close();
}

// Handles adding a new search engine
async function addSearchEngine(e) {
    e.preventDefault();
    let strUrl = url.value;
    let testUrl = '';
    let id = sename.value.trim().replaceAll(' ', '-').toLowerCase();
    id = id.substring(0, 25);
    const baseId = id;

    // Ensure new ID is unique
    while (!isIdUnique(id)) {
        id = baseId + '-' + Date.now();
    }

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
        await notify(notifySearchEngineUrlRequired);
        return;
    }

    const searchEngine = {
        index: newIndex,
        name: sename.value,
        keyword: keyword.value,
        keyboardShortcut: searchEngineKbsc.value,
        multitab: multitab.checked,
        url: strUrl,
        show: show.checked,
        isFolder: false
    };

    // Send data back to the main window using the unique ID
    window.opener.postMessage({ parentId, id, searchEngine }, window.location.origin);
    window.close();
}

async function testSearchEngine() {
    await sendMessage('testSearchEngine', {
        url: document.getElementById('url').value
    });
}

async function testChatGPTPrompt() {
    const provider = document.getElementById('ai-provider').value;
    await sendMessage('testPrompt', {
        provider: provider
    });
}