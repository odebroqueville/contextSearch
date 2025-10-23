/// Import browser polyfill for compatibility with Chrome and other browsers
import '/libs/browser-polyfill.min.js';

/// Import constants
import { STORAGE_KEYS, notifyAIMinimalRequirements, notifySearchEngineUrlRequired } from './constants.js';
import { isKeyAllowed, isInFocus, isIdUnique, getOS, getMetaKey } from './utilities.js';

/* global DEBUG_VALUE */
const logToConsole = typeof DEBUG_VALUE !== 'undefined' ? DEBUG_VALUE : false; // Flag to control console logging

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
let keysPressed = {}; // Object to track pressed keys
let searchEngines = {};

// Prompt library (PromptCat) elements
const pcTagsContainer = document.getElementById('promptcat-tags');
const pcPromptsContainer = document.getElementById('promptcat-prompts');
const pcSearchInput = document.getElementById('promptcat-search');
const pcSection = document.getElementById('promptcat-section');

// Minimal catalog state
const promptCatalog = {
    loaded: false,
    prompts: [],
    tags: [],
    activeTag: null,
    query: '',
};

// Minimal IndexedDB access to read PromptCat data
const PromptCatDB = (() => {
    let db = null;
    function open() {
        return new Promise((resolve) => {
            const req = indexedDB.open('PromptCatDB');
            req.onerror = () => resolve(null);
            req.onsuccess = (e) => {
                db = e.target.result;
                resolve(db);
            };
        });
    }
    function getAll(storeName) {
        return new Promise((resolve) => {
            if (!db || !db.objectStoreNames.contains(storeName)) return resolve([]);
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.getAll();
            req.onsuccess = (e) => resolve(e.target.result || []);
            req.onerror = () => resolve([]);
        });
    }
    return { open, getAll };
})();

// Minimal decrypt support for locked prompts
const CryptoServiceMini = {
    encoder: new TextEncoder(),
    decoder: new TextDecoder(),
    _b64ToBuf(b64) {
        try {
            const bin = atob(b64);
            const len = bin.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
            return bytes.buffer;
        } catch (_) {
            return null;
        }
    },
    async _derive(password, salt) {
        const keyMaterial = await crypto.subtle.importKey('raw', this.encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
        return crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );
    },
    async decrypt(enc, password) {
        if (typeof enc !== 'object' || !enc?.ct || !password) return null;
        try {
            const salt = this._b64ToBuf(enc.salt);
            const iv = this._b64ToBuf(enc.iv);
            if (!salt || !iv) return null;
            const key = await this._derive(password, salt);
            const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, this._b64ToBuf(enc.ct));
            return this.decoder.decode(pt);
        } catch (_) {
            return null;
        }
    },
};

/// Event listeners

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('DOM content loaded.');
        os = await getOS();
        await init();
        // Configure prompt catalog visibility/behavior based on AI provider selection
        setupPromptCatalogBehavior();
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

// Removed local getOS (now imported from utilities.js)

// Removed duplicate helper functions (isKeyAllowed, isInFocus, isIdUnique) now imported from utilities.js

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

    i18nElements.forEach((i) => {
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

// Removed local initMetaKey (using getMetaKey from utilities.js)

async function init() {
    try {
        meta = getMetaKey(os, 'display').replace('+', '').slice(0, -0); // Display form (e.g., Cmd) without trailing plus

        // Initialize the UI with stored data
        searchEngines = await getStoredData(STORAGE_KEYS.SEARCH_ENGINES);

        // Now you can use these variables (uniqueId, parentId, newIndex) in your script
        if (logToConsole) console.log('Received parentId:', parentId);
        if (logToConsole) console.log('Received newIndex:', newIndex);

        i18n();
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

function setupPromptCatalogBehavior() {
    // Always start hidden
    if (pcSection) pcSection.classList.remove('visible');

    const ensureLoadedAndRender = async () => {
        // Restore last state from sessionStorage if present
        try {
            const savedTag = sessionStorage.getItem('pc.activeTag');
            const savedQuery = sessionStorage.getItem('pc.query');
            promptCatalog.activeTag = savedTag ? savedTag : null;
            promptCatalog.query = savedQuery ? savedQuery : '';
            if (pcSearchInput) pcSearchInput.value = promptCatalog.query;
        } catch (_) {
            // sessionStorage might be unavailable; fail silently
        }
        if (!promptCatalog.loaded) await loadPromptCatalog();
        renderPromptCatalog();
    };

    const handleProviderChange = async () => {
        if (!aiProvider) return;
        const hasProvider = !!aiProvider.value;
        if (hasProvider) {
            await ensureLoadedAndRender();
            if (pcSection) pcSection.classList.add('visible');
            // Attach search listener once
            if (pcSearchInput && !pcSearchInput.dataset.bound) {
                pcSearchInput.addEventListener('input', () => {
                    promptCatalog.query = pcSearchInput.value.trim().toLowerCase();
                    // Save to session
                    try {
                        sessionStorage.setItem('pc.query', promptCatalog.query);
                    } catch (e) {
                        // sessionStorage may be blocked; ignore
                    }
                    renderPromptCatList();
                });
                pcSearchInput.dataset.bound = '1';
            }
        } else {
            if (pcSection) pcSection.classList.remove('visible');
        }
    };

    // React to provider changes
    if (aiProvider) aiProvider.addEventListener('change', handleProviderChange);
    // Initialize once based on current value
    handleProviderChange();
}

async function loadPromptCatalog() {
    const db = await PromptCatDB.open();
    if (!db) {
        promptCatalog.loaded = true;
        return;
    }
    const [prompts, tags] = await Promise.all([PromptCatDB.getAll('prompts'), PromptCatDB.getAll('globalTags')]);
    promptCatalog.prompts = Array.isArray(prompts) ? prompts : [];
    promptCatalog.tags = Array.isArray(tags) ? tags.map((t) => t.id ?? t).filter(Boolean) : [];
    promptCatalog.loaded = true;
}

function clearContainer(el) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
}

function renderPromptCatalog() {
    renderPromptCatTags();
    renderPromptCatList();
}

function renderPromptCatTags() {
    if (!pcTagsContainer) return;
    clearContainer(pcTagsContainer);
    // Build a unique tag set
    const all = new Set(promptCatalog.tags);
    promptCatalog.prompts.forEach((p) => (p.tags || []).forEach((t) => all.add(t)));
    const sorted = Array.from(all).sort((a, b) => String(a).localeCompare(String(b)));
    sorted.forEach((tag) => {
        const pill = document.createElement('button');
        pill.type = 'button';
        pill.className = 'tag-pill';
        pill.textContent = tag;
        pill.dataset.tag = tag;
        if (promptCatalog.activeTag === tag) pill.classList.add('active');
        pill.addEventListener('click', () => {
            // Toggle selection like in popup
            promptCatalog.activeTag = promptCatalog.activeTag === tag ? null : tag;
            // Save to session
            try {
                sessionStorage.setItem('pc.activeTag', promptCatalog.activeTag ?? '');
            } catch (e) {
                // sessionStorage may be blocked; ignore
            }
            renderPromptCatTags();
            renderPromptCatList();
        });
        pcTagsContainer.appendChild(pill);
    });
    const catcher = document.createElement('div');
    catcher.className = 'tags-click-catcher';
    catcher.addEventListener('click', () => {
        if (promptCatalog.activeTag !== null) {
            promptCatalog.activeTag = null;
            try {
                sessionStorage.setItem('pc.activeTag', '');
            } catch (e) {
                // sessionStorage may be blocked; ignore
            }
            renderPromptCatTags();
            renderPromptCatList();
        }
    });
    pcTagsContainer.appendChild(catcher);
}

function isEncryptedBody(body) {
    return body && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'ct');
}

function renderPromptCatList() {
    if (!pcPromptsContainer) return;
    clearContainer(pcPromptsContainer);
    const list = document.createElement('div');
    list.className = 'prompt-button-list';
    let filtered = promptCatalog.activeTag
        ? promptCatalog.prompts.filter((p) => (p.tags || []).includes(promptCatalog.activeTag))
        : promptCatalog.prompts.slice();
    if (promptCatalog.query) {
        const q = promptCatalog.query;
        filtered = filtered.filter((p) =>
            String(p.title || '')
                .toLowerCase()
                .includes(q)
        );
    }
    filtered
        .slice()
        .sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')))
        .forEach((p) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'prompt-title-btn';
            btn.textContent = p.title || 'Untitled Prompt';
            btn.addEventListener('click', async () => {
                let bodyText = '';
                if (isEncryptedBody(p.body)) {
                    const pwd = window.prompt(
                        browser.i18n ? browser.i18n.getMessage('promptLockedEnterPassword') : 'This prompt is locked. Enter password to insert it:'
                    );
                    if (!pwd) return;
                    const decrypted = await CryptoServiceMini.decrypt(p.body, pwd);
                    if (!decrypted) {
                        window.alert('Incorrect password.');
                        return;
                    }
                    bodyText = decrypted;
                } else {
                    bodyText = typeof p.body === 'string' ? p.body : '';
                }
                // Insert into the prompt textarea
                promptText.value = bodyText;
                promptText.focus();
                promptText.selectionStart = promptText.selectionEnd = promptText.value.length;
                // If name is empty, suggest using the prompt title
                if (!promptName.value && p.title) {
                    promptName.value = p.title;
                }
            });
            list.appendChild(btn);
        });
    pcPromptsContainer.appendChild(list);
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
    const modifierOrder = { Meta: 1, Control: 2, Alt: 3, Shift: 4 };
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
    currentModifiers.forEach((mod) => {
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
    while (!isIdUnique(searchEngines, sepId)) {
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
    while (!isIdUnique(searchEngines, id)) {
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
    let id = 'chatgpt-' + Date.now();

    // Ensure new ID is unique
    while (!isIdUnique(searchEngines, id)) {
        id = 'chatgpt-' + Date.now();
    }

    // Minimal requirements to add a prompt
    if (!(aiProvider.value && promptName.value && promptText.value)) {
        await notify(notifyAIMinimalRequirements);
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
        isFolder: false,
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
    while (!isIdUnique(searchEngines, id)) {
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
        isFolder: false,
    };

    // Send data back to the main window using the unique ID
    window.opener.postMessage({ parentId, id, searchEngine }, window.location.origin);
    window.close();
}

async function testSearchEngine() {
    await sendMessage('testSearchEngine', {
        url: document.getElementById('url').value,
    });
}

async function testChatGPTPrompt() {
    const provider = document.getElementById('ai-provider').value;
    await sendMessage('testPrompt', {
        provider: provider,
    });
}
