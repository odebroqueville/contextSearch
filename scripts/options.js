/// Import constants
import { base64FolderIcon } from './favicons.js';

// Simple polyfill for Chrome/Firefox compatibility
if (typeof browser === 'undefined') {
    globalThis.browser = chrome;
}

/// Global variables
/* global Sortable */

// Storage keys (copied from constants.js)
const STORAGE_KEYS = {
    OPTIONS: 'options',
    SEARCH_ENGINES: 'searchEngines',
    NOTIFICATIONS_ENABLED: 'notificationsEnabled',
    LOG_TO_CONSOLE: 'logToConsole',
};

const os = await getOS();

// Settings container and div for addSearchEngine
const divContainer = document.getElementById('container');

// Add a New Search Engine
const show = document.getElementById('show'); // Boolean
const sename = document.getElementById('name'); // String
const keyword = document.getElementById('keyword'); // String
const multitab = document.getElementById('multitab'); // Boolean
const url = document.getElementById('url'); // String
const kbsc = document.getElementById('kb-shortcut'); // String

// Add a New AI Prompt
const promptShow = document.getElementById('promptShow'); // Boolean
const promptName = document.getElementById('promptName'); // String
const promptKeyword = document.getElementById('promptKeyword'); // String
const promptMultitab = document.getElementById('promptMultitab'); // Boolean
const promptText = document.getElementById('prompt'); // String
const promptKbsc = document.getElementById('prompt-kb-shortcut'); // String
const aiProvider = document.getElementById('ai-provider');

// Add folder
const folderName = document.getElementById('folderName');
const folderKeyword = document.getElementById('folderKeyword');
const folderKbsc = document.getElementById('folder-kb-shortcut');

// Options
const exactMatch = document.getElementById('exactMatch');
const openNewTab = document.getElementById('openNewTab');
const sameTab = document.getElementById('sameTab');
const openNewWindow = document.getElementById('openNewWindow');
const openSidebar = document.getElementById('openSidebar');
const tabMode = document.getElementById('tabMode');
const tabActive = document.getElementById('tabActive');
const privateMode = document.getElementById('privateMode');
const active = document.getElementById('active');
const position = document.getElementById('position');
const privacy = document.getElementById('privacy');
const lastTab = document.getElementById('lastTab');
const optionsMenuLocation = document.getElementById('optionsMenuLocation');
const displayFavicons = document.getElementById('displayFavicons');
const quickIconGrid = document.getElementById('quickIconGrid');
const closeGridOnMouseOut = document.getElementById('closeGridOnMouseOut');
const xOffset = document.getElementById('xOffset');
const yOffset = document.getElementById('yOffset');
const disableAltClick = document.getElementById('disableAltClick');
const resetPreferences = document.getElementById('resetPreferences');
const forceSearchEnginesReload = document.getElementById('forceSearchEnginesReload');
const forceFaviconsReload = document.getElementById('forceFaviconsReload');
const searchEngineSiteSearch = document.getElementById('siteSearch');
const multiNewWindow = document.getElementById('multiNewWindow');
const multiActiveTab = document.getElementById('multiActiveTab');
const multiAfterLastTab = document.getElementById('multiAfterLastTab');
const multiMode = document.getElementById('multiMode');
const overwriteSearchEngines = document.getElementById('overwriteSearchEngines');

// All search engine buttons
const btnClearAll = document.getElementById('clearAll');
const btnSelectAll = document.getElementById('selectAll');
const btnSortAlpha = document.getElementById('sortAlphabetically');
const btnClearKeyboardShortcuts = document.getElementById('clearKeyboardShortcuts');
const btnReset = document.getElementById('reset');

// Add new search engine buttons
const btnTest = document.getElementById('test');
const btnAdd = document.getElementById('addSearchEngine');
const btnClearAddSearchEngine = document.getElementById('clearAddSearchEngine');
const btnTestChatGPTPrompt = document.getElementById('testChatGPTPrompt');
const btnAddChatGPTPrompt = document.getElementById('addChatGPTPrompt');
const btnClearAddChatGPTPrompt = document.getElementById('clearAddChatGPTPrompt');
const btnAddFolder = document.getElementById('addFolder');
const btnClearAddFolder = document.getElementById('clearAddFolder');
const btnAddSeparator = document.getElementById('addSeparator');

// Import/export
const btnDownload = document.getElementById('download');
const btnUpload = document.getElementById('upload');

// Translation variables
const remove = browser.i18n.getMessage('remove');
const notifySearchEngineUrlRequired = browser.i18n.getMessage('notifySearchEngineUrlRequired');

// Other variables
let meta = '';
let searchEngines = {};
let keysPressed = {};

// Debug
let logToConsole = false;

/// Event handlers
document.addEventListener('DOMContentLoaded', init);
browser.runtime.onMessage.addListener(handleMessage);
browser.storage.onChanged.addListener(handleStorageChange);
browser.permissions.onAdded.addListener(handlePermissionsChanges);
browser.permissions.onRemoved.addListener(handlePermissionsChanges);

// Options changes event handlers
exactMatch.addEventListener('click', updateSearchOptions);
displayFavicons.addEventListener('click', updateDisplayFavicons);
quickIconGrid.addEventListener('click', updateQuickIconGrid);
closeGridOnMouseOut.addEventListener('click', updateCloseGridOnMouseOut);
xOffset.addEventListener('change', updateXOffset);
yOffset.addEventListener('change', updateYOffset);
disableAltClick.addEventListener('click', updateDisableAltClick);
tabMode.addEventListener('click', updateTabMode);
tabActive.addEventListener('click', updateTabMode);
lastTab.addEventListener('click', updateTabMode);
privateMode.addEventListener('click', updateTabMode);
optionsMenuLocation.addEventListener('click', updateOptionsMenuLocation);
searchEngineSiteSearch.addEventListener('change', updateSiteSearchSetting);
resetPreferences.addEventListener('click', updateResetOptions);
forceSearchEnginesReload.addEventListener('click', updateResetOptions);
forceFaviconsReload.addEventListener('click', updateResetOptions);
multiMode.addEventListener('click', updateMultiMode);
overwriteSearchEngines.addEventListener('click', updateOverwriteSearchEngines);

/// All button click handlers
btnClearAll.addEventListener('click', clearAll);
btnSelectAll.addEventListener('click', selectAll);
btnSortAlpha.addEventListener('click', sortSearchEnginesAlphabetically);
btnClearKeyboardShortcuts.addEventListener('click', clearKeyboardShortcuts);
btnReset.addEventListener('click', reset);

// Add new search engine button click handlers
btnTest.addEventListener('click', testSearchEngine);
btnAdd.addEventListener('click', addSearchEngine);
btnClearAddSearchEngine.addEventListener('click', clearAddSearchEngine);

// Add new search engine event handlers for adding a keyboard shortcut
kbsc.addEventListener('keyup', handleKeyboardShortcut);
kbsc.addEventListener('keydown', (event) => {
    if (event.target.nodeName !== 'INPUT') return;
    const key = event.key;
    if (isKeyAllowed(event)) keysPressed[key] = event.code;
    if (logToConsole) console.log(keysPressed);
});
// kbsc.addEventListener('change', handleKeyboardShortcutChange);

// Add new AI Prompt button handlers
btnTestChatGPTPrompt.addEventListener('click', testChatGPTPrompt);
btnAddChatGPTPrompt.addEventListener('click', addChatGPTPrompt);
btnClearAddChatGPTPrompt.addEventListener('click', clearAddChatGPTPrompt);

// Add new AI prompt event handlers for adding a keyboard shortcut
promptKbsc.addEventListener('keyup', handleKeyboardShortcut);
promptKbsc.addEventListener('keydown', (event) => {
    if (event.target.nodeName !== 'INPUT') return;
    const key = event.key;
    if (isKeyAllowed(event)) keysPressed[key] = event.code;
    if (logToConsole) console.log(keysPressed);
});
// promptKbsc.addEventListener('change', handleKeyboardShortcutChange);

// Add new folder or separator button click handlers
btnAddSeparator.addEventListener('click', addSeparator);
btnAddFolder.addEventListener('click', addFolder);
btnClearAddFolder.addEventListener('click', clearAddFolder);

// Add new folder event handlers for adding a keyboard shortcut
folderKbsc.addEventListener('keyup', handleKeyboardShortcut);
folderKbsc.addEventListener('keydown', (event) => {
    if (event.target.nodeName !== 'INPUT') return;
    const key = event.key;
    if (isKeyAllowed(event)) keysPressed[key] = event.code;
    if (logToConsole) console.log(keysPressed);
});
// folderKbsc.addEventListener('change', handleKeyboardShortcutChange);

// Import/export
btnDownload.addEventListener('click', saveToLocalDisk);
btnUpload.addEventListener('change', handleFileUpload);

// Initialize meta key based on OS
async function initMetaKey() {
    const detectedOS = await getOS();
    if (detectedOS === 'macOS') {
        meta = 'cmd+';
    } else if (detectedOS === 'Windows') {
        meta = 'win+';
    } else if (detectedOS === 'Linux') {
        meta = 'super+';
    } else {
        meta = 'meta+';
    }
}

// Handle incoming messages
async function handleMessage(message) {
    if (message.action === 'resetCompleted') {
        if (logToConsole) console.log(message);
        await restoreOptionsPage();
    }
    if (message.action === 'logToConsole') {
        logToConsole = message.data;
    }
}

// Handle Permissions changes for Downloads
function handlePermissionsChanges(Permissions) {
    console.log(`API permissions: ${Permissions.permissions}`);
    console.log(`Host permissions: ${Permissions.origins}`);
    checkForDownloadsPermission();
}

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

// Send a message to the background script
async function sendMessage(action, data) {
    try {
        console.log(`Sending message: action=${action}, data=${JSON.stringify(data)}`);
        const response = await browser.runtime.sendMessage({ action: action, data: data });
        console.log(`Received response: ${JSON.stringify(response)}`);
        return response;  // Return the response received from the background script
    } catch (error) {
        console.error(`Error sending message: ${error}`);
        return null;
    }
}

// Storage utility functions that use runtime messaging
async function getStoredData(key) {
    try {
        const response = await browser.runtime.sendMessage({
            action: 'getStoredData',
            key: key
        });
        return response.data;
    } catch (error) {
        console.error('Error getting stored data:', error);
        return null;
    }
}

// Handle local and sync storage changes
function handleStorageChange(changes, area) {
    if (area === 'local') {
        const ids = Object.keys(changes);
        for (const id of ids) {
            if (changes[id].newValue === undefined) {
                continue;
            }
            searchEngines[id] = changes[id].newValue;
            if (logToConsole) {
                console.log(`Search engine ${id}:\n`);
                console.log(searchEngines[id]);
            }
        }
        displaySearchEngines();
    } else if (area === 'sync') {
        let data = {};
        let optionKeys = Object.keys(changes);
        if (optionKeys.includes('logToConsole')) logToConsole = changes['logToConsole'].newValue;
        if (logToConsole) {
            console.log(changes);
            console.log(optionKeys);
        }
        for (let optionKey of optionKeys) {
            if (changes[optionKey].newValue !== undefined) {
                data[optionKey] = changes[optionKey].newValue;
                if (logToConsole) {
                    console.log(optionKey);
                    console.log(changes[optionKey].newValue);
                    console.log('---------------------------------------');
                }
            }
        }
        if (logToConsole) console.log(data);
        const options = data.options;
        if (!isEmpty(options)) setOptions(options);
    }
}

// Notification
function notify(message) {
    sendMessage('notify', message);
}

function removeEventHandler(e) {
    e.stopPropagation();
    removeSearchEngine(e);
}

// Display the list of search engines
function displaySearchEngines() {
    const sortableOptions = {
        group: {
            name: 'folder',
            pull: true,
            put: true
        },
        animation: 150,
        filter: 'input, textarea',// Prevent dragging on input and textarea elements
        preventOnFilter: false,// Allow events to propagate to input and textarea
        // On element drag ended, save search engines
        onEnd: saveSearchEnginesOnDragEnded
    };

    // Remove previous search engines
    const div = document.getElementById('searchEngines');
    if (!isEmpty(div)) divContainer.removeChild(div);
    // Create new search engines div container
    const divSearchEngines = document.createElement('div');
    divSearchEngines.setAttribute('id', 'searchEngines');
    divSearchEngines.classList.add('folder');
    divContainer.appendChild(divSearchEngines);

    if (logToConsole) console.log(searchEngines);

    expand('root', null);
    i18n();

    let folders = null;
    folders = document.querySelectorAll(".folder");
    for (let folder of folders) {
        new Sortable(folder, sortableOptions);
    }
}

async function saveSearchEnginesOnDragEnded(evt) {
    const draggedElement = evt.item;
    const oldParent = evt.from;
    const newParent = evt.to;

    // Identify the dragged item's id
    const movedElementId = draggedElement.getAttribute('data-id');

    // Identify the old and new parent folder's ids
    let oldParentFolderId = findClosestFolder(oldParent).id;
    if (oldParentFolderId === 'searchEngines') oldParentFolderId = 'root';
    let newParentFolderId = findClosestFolder(newParent).id;
    if (newParentFolderId === 'searchEngines') newParentFolderId = 'root';

    // Get the old and new indices
    const oldIndex = searchEngines[oldParentFolderId].children.indexOf(movedElementId);
    let newIndex;
    if (newParentFolderId === 'root') {
        newIndex = evt.newIndex;
    } else {
        newIndex = evt.newIndex - 5;
    }

    if (logToConsole) {
        console.log(`Moved item id: ${movedElementId}`);
        console.log(`Old index: ${oldIndex}`);
        console.log(`New index: ${newIndex}`);
        console.log(`Old parent folder id: ${oldParentFolderId}`);
        console.log(`New parent folder id: ${newParentFolderId}`);
    }

    // Update the children property of the old parent folder
    if (newParentFolderId && movedElementId) {
        let oldChildren = searchEngines[oldParentFolderId].children;
        let newChildren = searchEngines[newParentFolderId].children;

        if (oldParentFolderId === newParentFolderId) {
            // Remove the dragged element from the new children array
            newChildren.splice(oldIndex, 1);
            // Add the dragged element to the new children array
            newChildren.splice(newIndex, 0, movedElementId);
        } else {
            // Remove the dragged element from the old children array
            oldChildren.splice(oldIndex, 1);
            // Add the dragged element to the new children array
            newChildren.splice(newIndex, 0, movedElementId);

            //searchEngines[oldParentFolderId].children = oldChildren;
            //searchEngines[newParentFolderId].children = newChildren;
        }

        if (logToConsole) {
            console.log(`Old children: ${oldChildren}`);
            console.log(`New children: ${newChildren}`);
            console.log(`Search Engines children in new parent folder: ${searchEngines[newParentFolderId].children}`);
            console.log(searchEngines);
        }

        updateIndices('root');
    }
    if (logToConsole) console.log(searchEngines);
    await sendMessage('saveSearchEngines', searchEngines);
}

function expand(folderId, parentDiv) {
    const folder = searchEngines[folderId];
    let folderDiv;
    if (folderId === 'root') {
        folderDiv = document.getElementById('searchEngines');
    } else {
        folderDiv = createFolderItem(folderId);
        parentDiv.appendChild(folderDiv);
    }
    folder.children.forEach(f => {
        if (!searchEngines[f] || searchEngines[f].aiProvider === 'exa') return;
        if (searchEngines[f].isFolder) {
            expand(f, folderDiv);
        } else {
            const div = createLineItem(f);
            folderDiv.appendChild(div);
        }
    });
}

function findClosestFolder(element) {
    while (element && !element.classList.contains('folder')) {
        element = element.parentElement;
    }
    return element;
}

function updateIndices(folderId) {
    const children = searchEngines[folderId].children;
    for (let childId of children) {
        searchEngines[childId].index = children.indexOf(childId);
        if (logToConsole) console.log(childId, searchEngines[childId].index);
        if (searchEngines[childId].children && searchEngines[childId].children.length > 0) {
            updateIndices(childId);
        }
    }
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

// Display a single separator, search engine or prompt in a row or line item
function createLineItem(id) {
    const searchEngine = searchEngines[id];
    const searchEngineName = searchEngine.name;
    const lineItem = document.createElement('div');
    lineItem.setAttribute('id', id);
    lineItem.classList.add('se');
    lineItem.setAttribute('data-id', id);

    let inputQueryString;
    let textareaPrompt;
    let aiProvider;
    let selectedOption;
    let textareaFormData;

    // If line item is a separator
    if (id.startsWith("separator-")) {
        const hr = document.createElement('hr');
        // const sortTarget = document.createElement('i');
        // sortTarget.classList.add('sort', 'icon', 'ion-arrow-move');
        const removeButton = createButton('ion-ios-trash', 'remove', remove + ' separator');
        removeButton.addEventListener('click', removeEventHandler);
        lineItem.appendChild(hr);
        // lineItem.appendChild(sortTarget);
        lineItem.appendChild(removeButton);
        return lineItem;
    }

    // If line item is an AI prompt
    if (id.startsWith("chatgpt-")) {
        aiProvider = document.createElement("select");
        aiProvider.classList.add('row-1');

        const option1 = document.createElement("option");
        option1.value = "";
        option1.text = "Choose AI Provider";

        const option2 = document.createElement("option");
        option2.value = "chatgpt";
        option2.text = "ChatGPT";

        const option3 = document.createElement("option");
        option3.value = "google-ai-studio";
        option3.text = "Google AI Studio";

        const option4 = document.createElement("option");
        option4.value = "perplexity";
        option4.text = "Perplexity.ai";

        const option5 = document.createElement("option");
        option5.value = "poe";
        option5.text = "Poe";

        const option6 = document.createElement("option");
        option6.value = "claude";
        option6.text = "Claude.ai";

        const option7 = document.createElement("option");
        option7.value = "you";
        option7.text = "You.com";

        const option8 = document.createElement("option");
        option8.value = "andi";
        option8.text = "Andi";

        aiProvider.appendChild(option1);
        aiProvider.appendChild(option2);
        aiProvider.appendChild(option3);
        aiProvider.appendChild(option4);
        aiProvider.appendChild(option5);
        aiProvider.appendChild(option6);
        aiProvider.appendChild(option7);
        aiProvider.appendChild(option8);

        // Get the selected option
        if (searchEngine.aiProvider === "llama31") {
            selectedOption = aiProvider.querySelector(`option[value=poe]`);
        } else {
            selectedOption = aiProvider.querySelector(`option[value=${searchEngine.aiProvider}]`);
        }

        // Set the selected property of the option to true
        selectedOption.selected = true;

        aiProvider.addEventListener('change', (e) => {
            saveChanges(e, 'aiProvider');
        });

        textareaPrompt = document.createElement('textarea');
        //textareaPrompt.classList.add('row-2');
        textareaPrompt.setAttribute('rows', 4);
        textareaPrompt.setAttribute('cols', 50);
        textareaPrompt.value = searchEngine.prompt;
        textareaPrompt.addEventListener('change', (e) => {
            saveChanges(e, 'prompt');
        });
    } else {
        // If line item is a search engine
        inputQueryString = document.createElement('input');
        inputQueryString.setAttribute('type', 'url');
        inputQueryString.setAttribute('value', searchEngine.url);
        // Event handler for query string changes
        inputQueryString.addEventListener('change', (e) => {
            saveChanges(e, 'url');
        });

        // If the search engine uses an HTTP POST request
        if (!searchEngine.url.includes('?') && searchEngine.formData) {
            if (logToConsole) console.log(searchEngine.formData);
            textareaFormData = document.createElement('textarea');
            //textareaFormData.classList.add('row-2');
            textareaFormData.setAttribute('rows', 4);
            textareaFormData.setAttribute('cols', 50);
            textareaFormData.value = searchEngine.formData;
            textareaFormData.addEventListener('change', (e) => {
                saveChanges(e, 'formData');
            });
        }
    }

    // Deletion button for each search engine or prompt line item
    const removeButton = createButton('ion-ios-trash', 'remove', remove + ' ' + searchEngineName);

    // Input elements for each search engine composing each line item
    const chkShowSearchEngine = document.createElement('input');
    const favicon = document.createElement('img');
    const inputSearchEngineName = document.createElement('input');
    const inputKeyword = document.createElement('input');
    const inputKeyboardShortcut = document.createElement('input');
    const chkMultiSearch = document.createElement('input');

    // Event handler for 'show search engine' checkbox click event
    chkShowSearchEngine.addEventListener('click', visibleChanged); // when users check or uncheck the checkbox

    // Event handler for click on favicon
    favicon.addEventListener('click', editFavicon);

    // Event handlers for search engine name changes
    inputSearchEngineName.addEventListener('change', (e) => {
        saveChanges(e, 'name');
    });

    // Event handler for keyword text changes
    inputKeyword.addEventListener('change', (e) => {
        saveChanges(e, 'keyword');
    }); // when users leave the input field and content has changed

    // Event handlers for adding a keyboard shortcut
    inputKeyboardShortcut.addEventListener('keyup', handleKeyboardShortcut);
    inputKeyboardShortcut.addEventListener('keydown', (e) => {
        if (logToConsole) console.log(e);
        if (e.target.nodeName !== 'INPUT') return;
        if ((os === 'macOS' && e.metaKey) || ((os === 'Windows' || os === 'Linux') && e.ctrlKey) || (!isInFocus(e.target)) || (e.key === 'Escape')) {
            if (logToConsole) console.log("Keys pressed: " + keysPressed);
            keysPressed = {};
            return;
        }
        const key = e.key;
        if (isKeyAllowed(key)) keysPressed[key] = key;
        if (logToConsole) console.log(keysPressed);
    });
    inputKeyboardShortcut.addEventListener('change', handleKeyboardShortcutChange);

    // Event handler for 'include search engine in multi-search' checkbox click event
    chkMultiSearch.addEventListener('click', multiTabChanged); // when users check or uncheck the checkbox

    // Deletion button event handler
    removeButton.addEventListener('click', removeEventHandler);

    // Set attributes for all the elements composing a search engine or line item
    chkShowSearchEngine.setAttribute('type', 'checkbox');
    chkShowSearchEngine.setAttribute('data-i18n-title', 'showSearchEngine');
    chkShowSearchEngine.setAttribute('id', id + '-chk');
    chkShowSearchEngine.checked = searchEngine.show;

    favicon.setAttribute('src', `data:${searchEngine.imageFormat || 'image/png'};base64,${searchEngine.base64}`);

    inputSearchEngineName.setAttribute('type', 'text');
    inputSearchEngineName.setAttribute('id', id + '-name');
    inputSearchEngineName.setAttribute('data-i18n-placeholder', 'searchEngineName');
    inputSearchEngineName.setAttribute('value', searchEngineName);

    inputKeyword.setAttribute('type', 'text');
    inputKeyword.setAttribute('id', id + '-kw');
    inputKeyword.classList.add('keyword');
    inputKeyword.setAttribute('data-i18n-placeholder', 'placeHolderKeyword');
    inputKeyword.setAttribute('value', searchEngine.keyword);

    inputKeyboardShortcut.setAttribute('type', 'text');
    inputKeyboardShortcut.setAttribute('id', id + '-kbsc');
    inputKeyboardShortcut.classList.add('kb-shortcut');
    inputKeyboardShortcut.setAttribute('data-i18n-placeholder', 'keyboardShortcut');
    inputKeyboardShortcut.setAttribute('value', searchEngine.keyboardShortcut);

    chkMultiSearch.setAttribute('type', 'checkbox');
    chkMultiSearch.setAttribute('id', id + '-mt');
    chkMultiSearch.setAttribute('data-i18n-title', 'multipleSearchEngines');
    chkMultiSearch.checked = searchEngine.multitab;

    // Attach all the elements composing a search engine to the line item
    lineItem.appendChild(chkShowSearchEngine);
    lineItem.appendChild(favicon);
    if (id.startsWith("chatgpt-")) {
        lineItem.appendChild(aiProvider);
    }
    lineItem.appendChild(inputSearchEngineName);
    lineItem.appendChild(inputKeyword);
    lineItem.appendChild(inputKeyboardShortcut);
    if (!(id.startsWith("link-") && searchEngine.url.startsWith('javascript:'))) {
        lineItem.appendChild(chkMultiSearch);
    }
    if (!id.startsWith("chatgpt-")) {
        lineItem.appendChild(inputQueryString);
    } else {
        lineItem.appendChild(textareaPrompt);
    }
    if (textareaFormData) {
        lineItem.appendChild(textareaFormData);
    }
    lineItem.appendChild(removeButton);

    return lineItem;
}

function updatePopupStyles(popup, darkMode) {
    popup.document.body.style.backgroundColor = darkMode ? '#222' : '#fff';
    const faviconTitle = popup.document.querySelector('h3');
    faviconTitle.style.color = darkMode ? '#ddd' : '#333';
    const helpText = popup.document.querySelector('em');
    helpText.style.color = darkMode ? '#ddd' : '#333';
}

function editFavicon(e) {
    if (logToConsole) console.log(e);
    // Find closest <li> parent
    const lineItem = e.target.closest('div');
    if (!lineItem) return;
    const id = lineItem.getAttribute('id');
    const imageFormat = searchEngines[id].imageFormat;
    const base64Image = searchEngines[id].base64;
    const searchEngineName = searchEngines[id].name;
    const popupWidth = 560; // Width of the popup window
    const popupHeight = 550; // Height of the popup window
    const left = Math.floor((window.screen.width - popupWidth) / 2);
    const top = Math.floor((window.screen.height - popupHeight) / 2);
    const windowFeatures = `popup, width=${popupWidth}, height=${popupHeight}, left=${left}, top=${top}`;
    const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    let newBase64;
    let contentType;

    // Create the popup window
    const popup = window.open('', '_blank', windowFeatures);

    // Update initial styles
    const darkMode = mediaQueryList.matches;

    // Listen for changes in color scheme preference
    mediaQueryList.addEventListener('change', (event) => {
        const darkMode = event.matches;
        updatePopupStyles(popup, darkMode);
    });

    // Set the CSS rule for the body of the popup
    popup.document.body.style.display = 'grid';
    popup.document.body.style.gridTemplateColumns = '1fr 1fr';
    popup.document.body.style.gridTemplateRows = 'auto 30px';
    popup.document.body.style.fontFamily = 'Raleway, Helvetica, sans-serif';
    popup.document.body.style.marginRight = '20px';

    // Create the first cell for displaying the favicon image
    const faviconCell = document.createElement('div');
    faviconCell.style.gridRow = '1 / span 2';
    faviconCell.style.width = '200px';
    faviconCell.style.height = '500px';

    // Create an image element for displaying the favicon
    const faviconImg = document.createElement('img');
    faviconImg.src = `data:${imageFormat || 'image/png'};base64,${base64Image}`;
    faviconImg.style.width = '100%';
    faviconImg.style.height = 'auto';
    faviconImg.style.padding = '10px';
    faviconImg.style.margin = '0';

    // Create a title containing the search engine name
    const imageTitle = document.createElement('h3');
    imageTitle.textContent = searchEngineName;
    imageTitle.style.padding = '10px';
    imageTitle.style.margin = '0';

    // Add a section to instruct users how to change the favicon image
    const help = document.createElement('em');
    help.textContent = "Drag & drop a new image over the existing favicon image. Then click on the 'Save new icon' button for your changes to take effect.";
    help.style.display = 'inline-block';
    help.style.padding = '10px';
    help.style.lineHeight = '1.3em';

    // Append the image to the first cell
    faviconCell.appendChild(faviconImg);
    faviconCell.appendChild(imageTitle);
    faviconCell.appendChild(help);

    // Create the second cell for the content-editable div
    const editableDivCell = document.createElement('div');
    editableDivCell.style.gridColumn = '2';
    editableDivCell.style.gridRow = '1';
    editableDivCell.style.width = '300px';
    editableDivCell.style.height = '460px';
    editableDivCell.style.overflowX = 'hidden'; // Allow vertical overflow only
    editableDivCell.style.overflowY = 'hidden'; // Prevent vertical overflow

    // Create the content-editable div
    const editableDiv = document.createElement('div');
    editableDiv.contentEditable = false;
    editableDiv.style.width = '100%';
    editableDiv.style.height = '100%';
    editableDiv.style.padding = '10px';
    editableDiv.style.fontSize = '13px';
    editableDiv.style.color = '#2B2A33';
    editableDiv.style.backgroundColor = '#ccc';
    editableDiv.style.overflow = 'auto';
    editableDiv.style.overflowWrap = 'break-word'; // Enable word wrapping
    editableDiv.textContent = base64Image;

    // Append the editable div to the second cell
    editableDivCell.appendChild(editableDiv);

    // Create the third cell for the button
    const buttonCell = document.createElement('div');
    buttonCell.style.gridColumn = '2';
    buttonCell.style.gridRow = '2';
    buttonCell.style.width = '300px';
    buttonCell.style.height = '30px';
    buttonCell.style.marginTop = '15px';
    buttonCell.style.display = 'flex';
    //buttonCell.style.gap = '10px';

    /*     // Create the "Clear" button
        const clearButton = document.createElement('button');
        clearButton.style.width = '100px';
        clearButton.style.height = '100%';
        clearButton.style.marginLeft = '10px';
        clearButton.textContent = 'Clear';
    
        // Handle clear button click event
        clearButton.addEventListener('click', () => {
            editableDiv.textContent = '';
        });
    
        // Create the "Copy" button
        const copyButton = document.createElement('button');
        copyButton.style.width = '100px';
        copyButton.style.height = '100%';
        copyButton.textContent = 'Copy';
    
        // Handle copy button click event
        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(editableDiv.textContent)
                .then(() => {
                    if (logToConsole) console.log('Text copied to clipboard.');
                })
                .catch((err) => {
                    if (logToConsole) console.error('Failed to copy text to clipboard:', err);
                });
        }); */

    // Create the "Replace favicon" button
    const replaceButton = document.createElement('button');
    replaceButton.style.width = '100%';
    replaceButton.style.height = '100%';
    replaceButton.style.color = '#2B2A33';
    replaceButton.textContent = 'Save new icon';

    // Handle button click event
    replaceButton.addEventListener('click', () => {
        // Save the new favicon image to local storage
        searchEngines[id].imageFormat = contentType;
        searchEngines[id].base64 = newBase64;
        sendMessage('saveSearchEngines', searchEngines);
        popup.close();
    });

    // Append the buttons to the third cell
    // buttonCell.appendChild(clearButton);
    // buttonCell.appendChild(copyButton);
    buttonCell.appendChild(replaceButton);

    // Handle drag and drop event
    faviconImg.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    faviconImg.addEventListener('drop', (e) => {
        e.preventDefault();

        const file = e.dataTransfer.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
            newBase64 = event.target.result.replace(/^.*?,/, '');
            contentType = file.type; // Get the content type of the dropped file

            // Replace the favicon image with the dragged image
            faviconImg.src = `data:${contentType};base64,${newBase64}`;

            // Update the base64 string in the editable div
            editableDiv.textContent = newBase64;
        };

        reader.readAsDataURL(file);
    });

    // Append the cells to the body of the popup
    popup.document.body.appendChild(faviconCell);
    popup.document.body.appendChild(editableDivCell);
    popup.document.body.appendChild(buttonCell);

    updatePopupStyles(popup, darkMode);
}

function createFolderItem(id) {
    const name = searchEngines[id]['name'];
    const keyword = searchEngines[id]['keyword'];
    const keyboardShortcut = searchEngines[id]['keyboardShortcut'];
    const folderItem = document.createElement('div');
    const icon = document.createElement('img');
    const inputFolderName = document.createElement('input');
    const inputFolderKeyword = document.createElement('input');
    const inputFolderKeyboardShortcut = document.createElement('input');

    // Add icon click event handler
    icon.addEventListener('click', editFavicon);

    // Event handlers for search engine name changes
    inputFolderName.addEventListener('change', folderNameChanged);

    // Event handlers for keyword text changes
    inputFolderKeyword.addEventListener('change', folderKeywordChanged);

    // Event handlers for adding a keyboard shortcut
    inputFolderKeyboardShortcut.addEventListener('keyup', handleKeyboardShortcut);
    inputFolderKeyboardShortcut.addEventListener('keydown', (e) => {
        if (logToConsole) console.log(e);
        if (e.target.nodeName !== 'INPUT') return;
        if ((os === 'macOS' && e.metaKey) || ((os === 'Windows' || os === 'Linux') && e.ctrlKey) || (!isInFocus(e.target)) || (e.key === 'Escape')) {
            if (logToConsole) console.log("Keys pressed: " + keysPressed);
            keysPressed = {};
            return;
        }
        const key = e.key;
        if (isKeyAllowed(e)) keysPressed[key] = e.code;
        if (logToConsole) console.log(keysPressed);
    });
    inputFolderKeyboardShortcut.addEventListener('change', handleKeyboardShortcutChange);

    // Add deletion button to folder
    const removeButton = createButton('ion-ios-trash', 'remove', `${remove} ${name} folder`);

    // Add deletion button event handler
    removeButton.addEventListener('click', removeEventHandler);

    icon.setAttribute('src', `data:${searchEngines[id].imageFormat || 'image/png'};base64,${searchEngines[id].base64}`);

    folderItem.setAttribute('id', id);
    folderItem.classList.add('folder');
    folderItem.setAttribute('data-id', id);

    inputFolderName.setAttribute('type', 'text');
    inputFolderName.classList.add('name');
    inputFolderName.setAttribute('data-i18n-placeholder', 'folderName');
    inputFolderName.setAttribute('value', name);

    inputFolderKeyword.setAttribute('type', 'text');
    inputFolderKeyword.classList.add('keyword');
    inputFolderKeyword.setAttribute('data-i18n-placeholder', 'placeHolderKeyword');
    inputFolderKeyword.setAttribute('value', keyword);

    inputFolderKeyboardShortcut.setAttribute('type', 'text');
    inputFolderKeyboardShortcut.setAttribute('id', id + '-kbsc');
    inputFolderKeyboardShortcut.classList.add('kb-shortcut');
    inputFolderKeyboardShortcut.setAttribute('data-i18n-placeholder', 'keyboardShortcut');
    inputFolderKeyboardShortcut.setAttribute('value', keyboardShortcut);

    folderItem.appendChild(icon);
    folderItem.appendChild(inputFolderName);
    folderItem.appendChild(inputFolderKeyword);
    folderItem.appendChild(inputFolderKeyboardShortcut);
    folderItem.appendChild(removeButton);

    return folderItem;
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

function sortSearchEnginesAlphabeticallyInFolder(folderId) {
    let folderChildren = [...searchEngines[folderId].children]; // Copy the array
    let se = [];
    let children = [];
    let counter = 0;

    if (logToConsole) console.log(folderId);
    if (logToConsole) console.log(folderChildren);

    // Collect search engines and identify folders for recursive sorting
    for (let id of folderChildren) {
        if (logToConsole) console.log(id);
        if (id.startsWith("separator-")) continue;
        se.push({ id: id, name: searchEngines[id].name });

        if (searchEngines[id].isFolder) {
            sortSearchEnginesAlphabeticallyInFolder(id);
        }
    }

    // Extract names for sorting
    let names = se.map(entry => entry.name);

    // Sort names alphabetically, handling numbers and strings separately
    names = sortAlphabetically(names);
    if (logToConsole) console.log(names);

    // Rebuild the children list in sorted order
    for (let name of names) {
        for (let entry of se) {
            if (entry.name === name) {
                children.push(entry.id);
                searchEngines[entry.id].index = counter++;
                break;  // Ensure each entry is only matched once
            }
        }
    }

    if (logToConsole) console.log(folderId + " children: ");
    if (logToConsole) console.log(children);

    searchEngines[folderId].children = children;
}

async function sortSearchEnginesAlphabetically() {
    sortSearchEnginesAlphabeticallyInFolder('root');
    await sendMessage('saveSearchEngines', searchEngines);
    displaySearchEngines();
}

function clearKeyboardShortcuts() {
    for (let id in searchEngines) {
        searchEngines[id].keyboardShortcut = "";
    }
    displaySearchEngines();
    saveSearchEngines();
}

async function reset() {
    const response = await sendMessage('reset', null);
    if (response.action === "resetCompleted") {
        // Reset reset settings to their default state and save changes to storage sync
        resetPreferences.checked = false;
        forceSearchEnginesReload.checked = false;
        forceFaviconsReload.checked = false;
        await updateResetOptions();
    }
}

// Begin of user event handlers
function removeSearchEngine(e) {
    // Find closest <div> parent
    const lineItem = e.target.closest('div');
    if (!lineItem) return;
    const id = lineItem.getAttribute('id');
    const pn = lineItem.parentNode;
    let parentId = pn.getAttribute('id');
    if (parentId === 'searchEngines') parentId = 'root';
    if (logToConsole) console.log(id, pn);

    if (!searchEngines[id].isFolder) {
        // Remove the line item and its corresponding search engine
        pn.removeChild(lineItem);
        delete searchEngines[id];
    } else {
        // If the line item is a folder, display a warning message
        const remove = confirm(`Are you sure you want to delete the folder ${searchEngines[id].name} and all of its contents?`);
        if (remove) {
            // Remove the folder and its children
            pn.removeChild(lineItem);
            removeFolder(id);
        } else {
            return;
        }
    }

    // Remove the id from the parent's children
    searchEngines[parentId].children.splice(searchEngines[parentId].children.indexOf(id), 1);

    // Save the updated search engines
    if (logToConsole) console.log(searchEngines);
    sendMessage('saveSearchEngines', searchEngines);
}

function removeFolder(id) {
    // Protect against trying to remove the root folder
    if (id === 'root') return;

    // Remove all the folder's children
    for (const childId of searchEngines[id].children) {
        if (searchEngines[childId].isFolder) {
            removeFolder(childId);
        }
        delete searchEngines[childId];
    }

    // Remove the folder itself
    delete searchEngines[id];
}

function visibleChanged(e) {
    const lineItem = e.target.parentNode;
    const id = lineItem.getAttribute('id');
    const visible = e.target.checked;

    searchEngines[id]['show'] = visible;

    sendMessage('saveSearchEngines', searchEngines);
}

function folderNameChanged(e) {
    const lineItem = e.target.parentNode;
    const id = lineItem.getAttribute('id');
    const folderName = e.target.value;

    searchEngines[id]['name'] = folderName;

    sendMessage('saveSearchEngines', searchEngines);
}

function folderKeywordChanged(e) {
    const lineItem = e.target.parentNode;
    const id = lineItem.getAttribute('id');
    const keyword = e.target.value;

    searchEngines[id]['keyword'] = keyword;

    sendMessage('saveSearchEngines', searchEngines);
}

// Handle the input of a keyboard shortcut for a search engine in the Options page
function handleKeyboardShortcut(e) {
    if (logToConsole) console.log(e);
    if (e.target.nodeName !== 'INPUT' || !isKeyAllowed(e) || !Object.keys(keysPressed).length > 0) return;
    // If the CMD key is pressed on macOS or CTRL key is pressed on Windows or Linux
    if ((os === 'macOS' && e.metaKey) || ((os === 'Windows' || os === 'Linux') && e.ctrlKey) || (!isInFocus(e.target)) || (e.key === 'Escape')) {
        if (logToConsole) console.log("Keys pressed: " + Object.keys(keysPressed));
        keysPressed = {};
        return;
    }
    e.preventDefault();

    if (logToConsole) console.log(os);
    if (logToConsole) console.log(keysPressed);

    let input;
    let id = null;

    if (e.target.id === 'kb-shortcut') {
        // If entering a new search engine keyboard shortcut
        input = kbsc;
    } else if (e.target.id === 'prompt-kb-shortcut') {
        // If entering a new prompt keyboard shortcut
        input = promptKbsc;
    } else if (e.target.id === 'folder-kb-shortcut') {
        // If entering a new folder keyboard shortcut
        input = folderKbsc;
    } else {
        // If changing an existing search engine keyboard shortcut
        const lineItem = e.target.parentNode;
        id = lineItem.getAttribute('id');
        input = document.getElementById(id + '-kbsc');
    }

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
        keyboardShortcut += key.toLowerCase();
    }

    // Save the identified keyboard shortcut
    if (logToConsole) console.log(keyboardShortcut);
    input.value = keyboardShortcut;
    keysPressed = {};
    if (id !== null) {
        searchEngines[id]['keyboardShortcut'] = keyboardShortcut;
        sendMessage('saveSearchEngines', searchEngines);
    }
}

function handleKeyboardShortcutChange(e) {
    const lineItem = e.target.parentNode;
    const id = lineItem.getAttribute('id');
    const input = document.getElementById(id + '-kbsc');
    const keyboardShortcut = input.value;
    if (logToConsole) console.log(id, keyboardShortcut);
    searchEngines[id]['keyboardShortcut'] = keyboardShortcut;

    sendMessage('saveSearchEngines', searchEngines);
}

function multiTabChanged(e) {
    if (logToConsole) console.log(e.target);
    let lineItem = e.target.parentNode;
    let id = lineItem.getAttribute('id');
    let multiTab = e.target.checked;

    if (logToConsole) console.log(`Multisearch ${(multiTab ? 'enabled' : 'disabled')} for search engine ${searchEngines[id].name}`);

    searchEngines[id]['multitab'] = multiTab;

    sendMessage('saveSearchEngines', searchEngines);
}

function saveChanges(e, property) {
    const lineItem = e.target.parentNode;
    const id = lineItem.getAttribute('id');
    const newValue = e.target.value;

    searchEngines[id][property] = newValue;

    if (property === 'aiProvider') {
        sendMessage('saveAIEngine', { 'id': id, 'aiProvider': newValue });
    } else {
        sendMessage('saveSearchEngines', searchEngines);
    }
}

// End of user event handlers

function readData() {
    searchEngines = {};

    const divSearchEngines = document.getElementById('searchEngines');
    const lineItems = divSearchEngines.children;

    // Add 'root' folder to search engines
    const root = {
        index: 0,
        name: 'Root',
        isFolder: true,
        children: []
    }

    // Add search engine id or folder id to children of root folder
    Array.from(lineItems).forEach(item => {
        root.children.push(item.id);
    });

    searchEngines['root'] = root;

    let i = 0;
    // // Read all search engines and folders
    Array.from(lineItems).forEach(item => {
        readLineItem(item, i);
        i++;
    });

    return searchEngines;
}

function readFolder(lineItem, i) {
    const icon = lineItem.querySelector('img');
    const src = icon.src;
    const splitSrc = src.split(",");
    const imageFormat = splitSrc[0].split(":")[1].split(";")[0];
    const base64String = splitSrc[1];
    if (logToConsole) console.log(`Id: ${lineItem.id}`);
    if (logToConsole) console.log(`imageFormat: ${imageFormat}, base64String: ${base64String}`);
    const folder = {
        index: i,
        name: lineItem.querySelector('input.name').value,
        keyword: lineItem.querySelector('input.keyword').value,
        keyboardShortcut: lineItem.querySelector('input.kb-shortcut').value,
        isFolder: true,
        children: [],
        imageFormat: imageFormat,
        base64: base64String
    }

    // Add children of folder
    lineItem.querySelectorAll('div').forEach(item => {
        folder.children.push(item.id);
    });

    searchEngines[lineItem.id] = folder;

    let j = 0;
    // Read all search engines and folders that are children of lineItem
    lineItem.querySelectorAll('div').forEach(item => {
        readLineItem(item, j);
        j++;
    });
}

function readLineItem(lineItem, i) {
    const input = lineItem.firstChild;
    const id = lineItem.id;
    // If the line item is a separator
    if (input !== null && input.nodeName === 'HR' && id.startsWith("separator-")) {
        searchEngines[id] = {};
        searchEngines[id]['index'] = i;
    }
    // If the line item is an AI prompt
    else if (input !== null && input.nodeName === 'INPUT' && input.getAttribute('type') === 'checkbox' && id.startsWith("chatgpt-")) {
        const icon = lineItem.querySelector('img');
        const src = icon.src;
        const splitSrc = src.split(",");
        const imageFormat = splitSrc[0].split(":")[1].split(";")[0];
        const base64String = splitSrc[1];
        const aiProvider = lineItem.querySelector('select');
        const label = aiProvider.nextSibling;
        const keyword = label.nextSibling;
        const keyboardShortcut = keyword.nextSibling;
        const multiTab = keyboardShortcut.nextSibling;
        const prompt = multiTab.nextSibling;
        if (logToConsole) {
            console.log(aiProvider);
            console.log(label);
            console.log(keyword);
            console.log(keyboardShortcut);
            console.log(multiTab);
            console.log(prompt);
        }
        searchEngines[id] = {};
        searchEngines[id]['index'] = i;
        searchEngines[id]['aiProvider'] = aiProvider.value;
        searchEngines[id]['name'] = label.value;
        searchEngines[id]['keyword'] = keyword.value;
        searchEngines[id]['keyboardShortcut'] = keyboardShortcut.value;
        searchEngines[id]['multitab'] = multiTab.checked;
        searchEngines[id]['prompt'] = prompt.value;
        searchEngines[id]['show'] = input.checked;
        searchEngines[id]['imageFormat'] = imageFormat;
        searchEngines[id]['base64'] = base64String;
    }
    // If the line item is a search engine
    else if (input !== null && input.nodeName === 'INPUT' && input.getAttribute('type') === 'checkbox') {
        const icon = lineItem.querySelector('img');
        const src = icon.src;
        const splitSrc = src.split(",");
        const imageFormat = splitSrc[0].split(":")[1].split(";")[0];
        const base64String = splitSrc[1];
        const label = icon.nextSibling;
        const keyword = label.nextSibling;
        const keyboardShortcut = keyword.nextSibling;
        let url, multiTab, formData;
        if (keyboardShortcut.nextSibling.value.startsWith('javascript:')) {
            url = keyboardShortcut.nextSibling;
        } else {
            multiTab = keyboardShortcut.nextSibling;
            url = multiTab.nextSibling;
            formData = (!url.nextSibling.classList.contains('remove') ? url.nextSibling : null);
        }
        searchEngines[id] = {};
        searchEngines[id]['index'] = i;
        searchEngines[id]['name'] = label.value;
        searchEngines[id]['keyword'] = keyword.value;
        searchEngines[id]['keyboardShortcut'] = keyboardShortcut.value;
        if (multiTab && typeof (multiTab.checked) === 'boolean') searchEngines[id]['multitab'] = multiTab.checked;
        searchEngines[id]['url'] = url.value;
        searchEngines[id]['show'] = input.checked;
        searchEngines[id]['imageFormat'] = imageFormat;
        searchEngines[id]['base64'] = base64String;
        if (formData) searchEngines[id]['formData'] = formData.value;
    }
    // If the line item is a folder
    else if (lineItem.classList.contains('folder')) {
        readFolder(lineItem, i);
    }
}

// Save the list of search engines to be displayed in the context menu
function saveSearchEngines() {
    searchEngines = {};
    searchEngines = readData();
    if (logToConsole) console.log('Search engines READ from the Options page:\n', searchEngines);
    sendMessage('saveSearchEngines', searchEngines);
}

function testSearchEngine() {
    sendMessage('testSearchEngine', {
        url: document.getElementById('url').value
    });
}

function testChatGPTPrompt() {
    const provider = document.getElementById('ai-provider').value;
    sendMessage('testPrompt', {
        provider: provider
    });
}

function addSeparator() {
    const n = searchEngines['root'].children.length;
    let id = "separator-" + Math.floor(Math.random() * 1000000000000);

    // Ensure new is unique
    while (!isIdUnique(id)) {
        id = "separator-" + Math.floor(Math.random() * 1000000000000);
    }

    searchEngines[id] = {
        index: n
    };

    // Add separator as child of 'root'
    searchEngines['root'].children.push(id);

    const divSearchEngines = document.getElementById('searchEngines');
    const lineItem = createLineItem(id);
    divSearchEngines.appendChild(lineItem);

    sendMessage('addNewSearchEngine', {
        id: id,
        searchEngine: searchEngines[id]
    });
}

function addSearchEngine() {
    const n = searchEngines['root'].children.length;
    const divSearchEngines = document.getElementById('searchEngines');
    let strUrl = url.value;
    let testUrl = '';
    let id = sename.value.trim().replaceAll(' ', '-').toLowerCase();
    id = id.substring(0, 25);

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
        index: n,
        name: sename.value,
        keyword: keyword.value,
        keyboardShortcut: kbsc.value,
        multitab: multitab.checked,
        url: url.value,
        show: show.checked,
        isFolder: false
    };

    if (logToConsole) console.log('New search engine: ' + id + '\n' + JSON.stringify(searchEngines[id]));

    // Add search engine as child of 'root'
    searchEngines['root'].children.push(id);

    const lineItem = createLineItem(id);
    divSearchEngines.appendChild(lineItem);

    sendMessage('addNewSearchEngine', {
        id: id,
        searchEngine: searchEngines[id]
    });

    // Clear HTML input fields to add a new search engine
    clearAddSearchEngine();
}

function addChatGPTPrompt() {
    const n = searchEngines['root'].children.length;
    const divSearchEngines = document.getElementById('searchEngines');
    let id = "chatgpt-" + Math.floor(Math.random() * 1000000000000);

    // Ensure new is unique
    while (!isIdUnique(id)) {
        id = "chatgpt-" + Math.floor(Math.random() * 1000000000000);
    }

    // Minimal requirements to add a prompt
    if (!(aiProvider.value && promptName.value && promptText.value)) {
        notify('Please at least select an AI Provider and provide a prompt name and a prompt.');
        return;
    }

    searchEngines[id] = {
        index: n,
        aiProvider: aiProvider.value,
        name: promptName.value,
        keyword: promptKeyword.value,
        keyboardShortcut: promptKbsc.value,
        multitab: promptMultitab.checked,
        prompt: promptText.value,
        show: promptShow.checked,
        isFolder: false
    };

    // Add AI prompt as child of 'root'
    searchEngines['root'].children.push(id);

    const lineItem = createLineItem(id);
    divSearchEngines.appendChild(lineItem);

    sendMessage('addNewPrompt', {
        id: id,
        searchEngine: searchEngines[id]
    });

    // Clear HTML input fields to add a new prompt
    clearAddChatGPTPrompt();
}

function addFolder() {
    const divSearchEngines = document.getElementById('searchEngines');
    const n = searchEngines['root'].children.length;
    const name = folderName.value;
    const keyword = folderKeyword.value || '';
    const keyboardShortcut = folderKbsc.value || '';
    let id = name.trim().replaceAll(' ', '-').toLowerCase();

    // Ensure new id is unique
    while (!isIdUnique(id)) {
        id = name.trim().replaceAll(' ', '-').toLowerCase() + '-' + Math.floor(Math.random() * 1000000000000);
    }

    // The new folder will be saved as a search engine entry
    // Folders don't possess all the properties that search engines do
    // A folder doesn't have a query string url property
    // A folder may have children (search engines don't have children)
    searchEngines[id] = {
        index: n,
        name: name,
        keyword: keyword,
        keyboardShortcut: keyboardShortcut,
        isFolder: true,
        children: [], // Array of search engine and/or subfolder ids
        imageFormat: 'image/png',
        base64: base64FolderIcon
    };

    // Add folder as child of 'root'
    searchEngines['root'].children.push(id);

    // Append folder to search engine list
    const folderItem = createFolderItem(id);
    divSearchEngines.appendChild(folderItem);

    // Clear HTML input fields to add a new folder
    clearAddFolder();

    sendMessage('addNewSearchEngine', {
        id: id,
        searchEngine: searchEngines[id]
    });
}

function clearAddSearchEngine() {
    // Clear check boxes and text box entries of the line used to add a new search engine
    show.checked = true;
    sename.value = null;
    keyword.value = null;
    kbsc.value = null;
    multitab.checked = false;
    url.value = null;
}

function clearAddChatGPTPrompt() {
    // Clear check boxes and text box entries of the line used to add a new search engine
    aiProvider.value = '';
    promptShow.checked = true;
    promptName.value = null;
    promptKeyword.value = null;
    promptKbsc.value = null;
    promptMultitab.checked = false;
    promptText.value = null;
}

function clearAddFolder() {
    // Clear text box entries of the line used to add a new folder
    folderName.value = null;
    folderKeyword.value = null;
    folderKbsc.value = null;
}

async function setOptions(options) {
    if (isEmpty(options)) return;
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
            active.style.display = 'block';
            position.style.display = 'block';
            privacy.style.display = 'none';
            break;
        case 'sameTab':
            sameTab.checked = true;
            active.style.display = 'none';
            position.style.display = 'none';
            privacy.style.display = 'none';
            break;
        case 'openNewWindow':
            openNewWindow.checked = true;
            active.style.display = 'block';
            position.style.display = 'none';
            privacy.style.display = 'block';
            break;
        case 'openSidebar':
            openSidebar.checked = true;
            active.style.display = 'none';
            position.style.display = 'none';
            privacy.style.display = 'none';
            break;
        default:
            openNewTab.checked = true;
            active.style.display = 'block';
            position.style.display = 'block';
            privacy.style.display = 'none';
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

    if (options.overwriteSearchEngines === true) {
        overwriteSearchEngines.checked = true;
    } else {
        // Default value for overwriteSearchEngines is false
        overwriteSearchEngines.checked = false;
    }

    if (options.privateMode === true) {
        privateMode.checked = true;
    } else {
        // Default value for privateMode is false
        privateMode.checked = false;
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

    if (options.displayFavicons === false) {
        displayFavicons.checked = false;
    } else {
        // Default setting is to fetch favicons for context menu search engines
        displayFavicons.checked = true;
    }

    // Options for the Icons Grid
    quickIconGrid.checked = options.quickIconGrid;
    closeGridOnMouseOut.checked = options.closeGridOnMouseOut;
    xOffset.value = options.offsetX;
    yOffset.value = options.offsetY;
    disableAltClick.checked = options.disableAltClick;

    if (options.resetPreferences === true) {
        resetPreferences.checked = true;
    } else {
        // Default setting is to not reset preferences
        resetPreferences.checked = false;
    }

    if (options.forceSearchEnginesReload === true) {
        forceSearchEnginesReload.checked = true;
    } else {
        // Default setting is to not reload default search engines
        forceSearchEnginesReload.checked = false;
    }

    if (options.forceFaviconsReload === true) {
        forceFaviconsReload.checked = true;
    } else {
        // Default setting is to not reload default favicons
        forceFaviconsReload.checked = false;
    }

    switch (options.multiMode) {
        case 'multiNewWindow':
            multiNewWindow.checked = true;
            break;
        case 'multiActiveTab':
            multiActiveTab.checked = true;
            break;
        case 'multiAfterLastTab':
            multiAfterLastTab.checked = true;
            break;
        default:
            break;
    }

    searchEngineSiteSearch.value = options.siteSearch || "Google";
}

// Restore the list of search engines and the options to be displayed in the options page
async function restoreOptionsPage() {
    try {
        const options = await getStoredData(STORAGE_KEYS.OPTIONS);
        // Set debugging mode
        if (options !== undefined && options !== null) {
            if ('logToConsole' in options) {
                logToConsole = options.logToConsole;
            }
        }

        searchEngines = await getStoredData(STORAGE_KEYS.SEARCH_ENGINES) || {};
        if (logToConsole) {
            console.log('Search engines retrieved from local storage:\n');
            console.log(searchEngines);
        }
        if (!isEmpty(options)) setOptions(options);
        if (logToConsole) {
            console.log('Options have been reset.');
            console.log(options);
        }
        displaySearchEngines();
    } catch (err) {
        if (logToConsole) console.error(err);
    }
}

async function saveToLocalDisk() {
    saveSearchEngines();
    let fileToDownload = new Blob([JSON.stringify(searchEngines, null, 2)], {
        type: 'text/json',
        name: 'searchEngines.json'
    });

    await sendMessage('saveSearchEnginesToDisk', window.URL.createObjectURL(fileToDownload));
}

async function handleFileUpload() {
    const options = await getStoredData(STORAGE_KEYS.OPTIONS);
    const upload = document.getElementById('upload');
    const jsonFile = upload.files[0];

    const fileContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = reject;
        reader.readAsText(jsonFile);
    });

    let newSearchEngines = {};
    newSearchEngines = JSON.parse(fileContent);
    if (options.overwriteSearchEngines) {
        searchEngines = {};
        searchEngines = newSearchEngines;
    } else {
        // Add the imported search engines to the existing ones avoiding duplicated IDs
        if (newSearchEngines.root?.children) {

            // 1. Identify duplicate IDs
            let duplicateIds = {};
            for (let id in newSearchEngines) {
                if (!searchEngines[id] || id === 'root') continue;
                const oldId = id;
                while (!isIdUnique(id)) {
                    id = id + "-" + Math.floor(Math.random() * 1000000000000);
                }
                id = id.trim();
                duplicateIds[oldId] = id;
            }

            // 2. Replace duplicate IDs in children arrays
            for (let id in newSearchEngines) {
                if (!newSearchEngines[id].children) continue;
                for (let childId of newSearchEngines[id].children) {
                    if (duplicateIds[childId]) {
                        newSearchEngines[id].children[newSearchEngines[id].children.indexOf(childId)] = duplicateIds[childId];
                    }
                }
            }

            // 3. Replace duplicate IDs in the main object
            for (let id in newSearchEngines) {
                if (duplicateIds[id]) {
                    newSearchEngines[duplicateIds[id]] = newSearchEngines[id];
                    delete newSearchEngines[id];
                }
            }

            // 4. Update children of the root folder of search engines
            for (let childId of newSearchEngines.root.children) {
                if (!searchEngines['root'].children.includes(childId)) {
                    searchEngines['root'].children.push(childId);
                }
            }

            // 5. Remove root folder from new search engines
            delete newSearchEngines.root;

            // 6. Merge the new search engines with the existing ones
            searchEngines = { ...searchEngines, ...newSearchEngines };
        }
    }
    await sendMessage('saveSearchEngines', searchEngines);
    displaySearchEngines();
}

async function sendOptionUpdate(updateType, data) {
    await sendMessage('updateOptions', { updateType, data });
}

async function updateSearchOptions() {
    let em = exactMatch.checked;
    await sendOptionUpdate('searchOptions', { exactMatch: em });
}

async function updateTabMode() {
    if (sameTab.checked || openSidebar.checked) {
        active.style.display = 'none';
        position.style.display = 'none';
        privacy.style.display = 'none';
    } else {
        active.style.display = 'block';
        if (openNewWindow.checked) {
            position.style.display = 'none';
            privacy.style.display = 'block';
        } else {
            position.style.display = 'block';
            privacy.style.display = 'none';
        }
    }

    let data = {};
    data['tabMode'] = document.querySelector('input[name="results"]:checked').value;
    data['tabActive'] = tabActive.checked;
    data['lastTab'] = lastTab.checked;
    data['privateMode'] = privateMode.checked;
    await sendOptionUpdate('tabMode', data);
}

async function updateOverwriteSearchEngines() {
    const ose = overwriteSearchEngines.checked;
    await sendOptionUpdate('overwriteSearchEngines', { overwriteSearchEngines: ose });
}

async function updateMultiMode() {
    let data = {};
    data['multiMode'] = document.querySelector('input[name="ms_results"]:checked').value;
    await sendOptionUpdate('multiMode', data);
}

// Check if the favicons should be displayed in the context menu
async function updateDisplayFavicons() {
    let fav = displayFavicons.checked;
    await sendOptionUpdate('displayFavicons', { displayFavicons: fav });
}

async function updateQuickIconGrid() {
    await sendOptionUpdate('quickIconGrid', { quickIconGrid: quickIconGrid.checked });
}

async function updateCloseGridOnMouseOut() {
    await sendOptionUpdate('closeGridOnMouseOut', { closeGridOnMouseOut: closeGridOnMouseOut.checked });
}

async function updateXOffset() {
    await sendOptionUpdate('offset', { offsetX: xOffset.value });
}

async function updateYOffset() {
    await sendOptionUpdate('offset', { offsetY: yOffset.value });
}

async function updateDisableAltClick() {
    await sendOptionUpdate('disableAltClick', { disableAltClick: disableAltClick.checked });
}

async function updateOptionsMenuLocation() {
    let omat = optionsMenuLocation.value;
    await sendOptionUpdate('optionsMenuLocation', { optionsMenuLocation: omat });
}

async function updateSiteSearchSetting() {
    await sendOptionUpdate('siteSearch', {
        siteSearch: searchEngineSiteSearch.value,
        siteSearchUrl: searchEngineSiteSearch.selectedOptions[0].dataset.url
    });
}

async function updateResetOptions() {
    const resetOptions = {
        forceSearchEnginesReload: forceSearchEnginesReload.checked,
        resetPreferences: resetPreferences.checked,
        forceFaviconsReload: forceFaviconsReload.checked
    };
    await sendOptionUpdate('resetOptions', { resetOptions });
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

async function init() {
    await initMetaKey();
    await restoreOptionsPage();
    await checkForDownloadsPermission();
}

async function checkForDownloadsPermission() {
    const downloads = { permissions: ['downloads'] };
    const hasDownloadsPermission = await browser.permissions.contains(downloads);
    if (hasDownloadsPermission) {
        btnDownload.disabled = false;
    } else {
        btnDownload.disabled = true;
    }
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

// Function to check if an elementis in focus
function isInFocus(element) {
    return (document.activeElement === element);
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
