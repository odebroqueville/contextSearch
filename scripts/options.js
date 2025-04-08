/// Import browser polyfill for compatibility with Chrome and other browsers
import '/libs/browser-polyfill.min.js';

/// Import constants
import { base64FolderIcon } from './favicons.js';
import { STORAGE_KEYS, SORTABLE_BASE_OPTIONS } from './constants.js';

/// Global constants

/* global Sortable */
const sortableOptions = {
    ...SORTABLE_BASE_OPTIONS,
    onEnd: saveSearchEnginesOnDragEnded
};

// Storage container and div for addSearchEngine
const container = document.getElementById('container');

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

// Import/export
const btnDownload = document.getElementById('download');
const btnUpload = document.getElementById('upload');

// Translations
const add = browser.i18n.getMessage('add');
const remove = browser.i18n.getMessage('remove');
const addANewItem = browser.i18n.getMessage('addANewItem');
const folder = browser.i18n.getMessage('folder');
const addANewFolder = browser.i18n.getMessage('subheader62');
const removeFolderConfirmPrefix = browser.i18n.getMessage('removeFolderConfirmPrefix');
const removeFolderConfirmSuffix = browser.i18n.getMessage('removeFolderConfirmSuffix');
const removeSearchEngineConfirm = browser.i18n.getMessage('removeSearchEngineConfirm');
const popupBlockedMessage = browser.i18n.getMessage('popupBlockedMessage');

/// Global variables
let os = null;
let meta = '';
let searchEngines = {};
let keysPressed = {};
let logToConsole = true;

/// Event listeners

window.addEventListener('message', async (event) => {
    if (event.origin !== window.location.origin) return; // Security check

    const receivedData = event.data;
    if (receivedData.parentId && receivedData.id && receivedData.searchEngine) {
        const { parentId, id, searchEngine } = receivedData;

        await addNewSearchEngine(parentId, id, searchEngine);
        // Update indices and save
        updateIndices('root');
        await sendMessage('saveSearchEngines', searchEngines);
    }
});

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('DOM Content Loaded in options.js');
        showLoadingState();
        os = await getOS();
        await init();
    } catch (err) {
        console.error('Error during initialization:', err);
        showErrorState('Error during initialization. Please try refreshing the page.');
    }
});

// Message, Storage, and Permissions event handlers
browser.runtime.onMessage.addListener(handleMessage);
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

// Import/export
btnDownload.addEventListener('click', saveToLocalDisk);
btnUpload.addEventListener('change', handleFileUpload);

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
        if (logToConsole) console.log('Starting options page initialization...');
        initMetaKey();
        if (logToConsole) console.log('Meta key initialized');

        await restoreOptionsPage();
        if (logToConsole) console.log('Options page restored');

        await checkForDownloadsPermission();
        if (logToConsole) console.log('Downloads permission checked');

        if (logToConsole) console.log('Initialization complete.');
    } catch (error) {
        console.error('Error during initialization:', error);
        showErrorState('Failed to initialize options page. Please refresh.');
    }
}

function showLoadingState() {
    let div = document.getElementById('searchEngines');

    if (!div && container) {
        div = document.createElement('div');
        div.setAttribute('id', 'searchEngines');
        div.classList.add('folder');
        container.appendChild(div);
    }

    if (div) {
        // Clear existing content
        while (div.firstChild) {
            div.removeChild(div.firstChild);
        }
        // Add loading message
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.textContent = 'Loading search engines';
        div.appendChild(loadingDiv);
        if (logToConsole) console.log('Loading state shown');
    }
}

function showErrorState(message) {
    const div = document.getElementById('searchEngines');
    if (div) {
        // Clear existing content
        while (div.firstChild) {
            div.removeChild(div.firstChild);
        }
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        div.appendChild(errorDiv);
    }
}

// Restore the list of search engines and the options to be displayed in the options page
async function restoreOptionsPage() {
    try {
        if (logToConsole) console.log('Starting restoreOptionsPage...');

        // Get options first, including logToConsole setting
        const options = await getStoredData(STORAGE_KEYS.OPTIONS);
        if (options?.logToConsole) logToConsole = options.logToConsole;
        if (!isEmpty(options)) {
            await setOptions(options);
            if (logToConsole) console.log('Options loaded:', options);
        } else {
            console.warn('No options found in storage');
        }

        // Wait for search engines to be loaded
        searchEngines = await getStoredData(STORAGE_KEYS.SEARCH_ENGINES);
        if (isEmpty(searchEngines)) {
            // Try to trigger a reload of search engines from the service worker
            const reloadResult = await sendMessage('reloadSearchEngines');
            if (reloadResult?.success) {
                searchEngines = await getStoredData(STORAGE_KEYS.SEARCH_ENGINES);
                if (logToConsole) console.log('Successfully reloaded search engines');
            }

            if (isEmpty(searchEngines)) {
                throw new Error('Search engines not found in storage and reload attempt failed. Please try refreshing the page.');
            }
        }

        if (logToConsole) console.log(`${Object.keys(searchEngines).length} search engines loaded.`);
        displaySearchEngines();
        if (logToConsole) console.log('Options page has been restored.');
    } catch (err) {
        console.error('Error in restoreOptionsPage:', err);
        showErrorState(`Error loading search engines: ${err.message}. If this is your first time opening the options page, please try refreshing. If the problem persists, try resetting the extension.`);
        throw err; // Re-throw to ensure the error is caught by init()
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

// Display the list of search engines
function displaySearchEngines() {
    // Get or create the searchEngines div
    let div = document.getElementById('searchEngines');

    if (!div && container) {
        // If searchEngines div doesn't exist, create it
        div = document.createElement('div');
        div.setAttribute('id', 'searchEngines');
        div.classList.add('folder');
        container.appendChild(div);
    } else if (div) {
        // Clear existing content if div exists
        while (div.firstChild) {
            div.removeChild(div.firstChild);
        }
    }

    if (logToConsole) console.log(searchEngines);

    expand('root', null);
    i18n();
}

async function saveSearchEnginesOnDragEnded(evt) {
    const draggedElement = evt.item;
    const oldParentEl = evt.from; // The DOM element of the old parent list
    const newParentEl = evt.to;   // The DOM element of the new parent list

    // Identify the old and new parent folder's ids using findClosestFolder
    let oldParentFolderId = findClosestFolder(oldParentEl)?.id;
    let newParentFolderId = findClosestFolder(newParentEl)?.id;

    if (!oldParentFolderId || !newParentFolderId) {
        console.error("Could not determine old or new parent folder ID.", { oldParentEl, newParentEl });
        return; // Stop if parent IDs are missing
    }

    // Normalize the top-level DOM ID 'searchEngines' to the data key 'root'
    if (oldParentFolderId === 'searchEngines') oldParentFolderId = 'root';
    if (newParentFolderId === 'searchEngines') newParentFolderId = 'root';

    if (logToConsole) {
        console.log(`Processing move: item=${draggedElement.getAttribute('data-id')}, from DOM=${oldParentEl.id}, to DOM=${newParentEl.id}, from data=${oldParentFolderId}, to data=${newParentFolderId}`);
    }

    // --- Rebuild Children Arrays from DOM ---

    // Helper function to get children IDs from a list element's direct item children
    const getChildrenIdsFromDOM = (listElement) => {
        console.log("[getChildrenIdsFromDOM] Processing list element:", listElement?.id, listElement);
        if (!listElement) {
            console.error("[getChildrenIdsFromDOM] Received null or undefined listElement!");
            return [];
        }

        const childrenIds = [];

        // Selector finds:
        // 1. '.search-engine' elements that are direct children of listElement
        // 2. '.folder' elements that are direct children of listElement
        // 3. '.search-engine' elements that are direct children of a '.folder-children' div
        // 4. '.folder' elements that are direct children of a '.folder-children' div
        // Adjust '.search-engine' or '.folder' if your actual classes differ
        const selector = ':scope > .search-engine, :scope > .folder, :scope > .folder-children > .search-engine, :scope > .folder-children > .folder';

        console.log("[getChildrenIdsFromDOM] Using combined selector:", selector);

        // Query the main listElement using the combined selector
        const childElements = listElement.querySelectorAll(selector);

        console.log("[getChildrenIdsFromDOM] Found child elements NodeList:", childElements);
        if (childElements.length === 0) {
            console.warn("[getChildrenIdsFromDOM] No child elements found matching selector in:", listElement?.id);
        }

        // --- IMPORTANT: Ensure Correct Order ---
        // The order returned by querySelectorAll might not match the visual DOM order
        // if elements are mixed (direct children and nested children).
        // We might need to re-sort based on DOM position if the order is wrong.
        // For now, let's see if this selector finds the elements correctly.

        childElements.forEach((el, index) => {
            const id = el.getAttribute('data-id');
            console.log(`[getChildrenIdsFromDOM] Child ${index}:`, el, 'data-id:', id);
            if (id) {
                childrenIds.push(id);
            } else {
                console.warn("[getChildrenIdsFromDOM] Found child element without data-id:", el, "in list:", listElement?.id || 'Unknown List');
            }
        });

        console.log("[getChildrenIdsFromDOM] Returning children IDs:", childrenIds);
        return childrenIds;
    };

    // Get the final children order for the NEW parent directly from the DOM
    const newChildrenIds = getChildrenIdsFromDOM(newParentEl);
    if (searchEngines[newParentFolderId]) {
        if (logToConsole) console.log(`Updating ${newParentFolderId} children from DOM:`, newChildrenIds);
        // Directly assign the array derived from the DOM
        searchEngines[newParentFolderId].children = newChildrenIds;
    } else {
        console.error(`New parent folder ${newParentFolderId} not found in searchEngines data.`);
        // Consider adding error handling or UI feedback here
        return; // Stop if data structure is unexpectedly missing
    }

    // If the item moved to a DIFFERENT parent, update the OLD parent's children too
    if (oldParentEl !== newParentEl) {
        const oldChildrenIds = getChildrenIdsFromDOM(oldParentEl);
        if (searchEngines[oldParentFolderId]) {
            if (logToConsole) console.log(`Updating ${oldParentFolderId} children from DOM:`, oldChildrenIds);
            // Directly assign the array derived from the DOM
            searchEngines[oldParentFolderId].children = oldChildrenIds;
        } else {
            console.error(`Old parent folder ${oldParentFolderId} not found in searchEngines data.`);
            // Consider adding error handling or UI feedback here
            // Decide if you should return or continue; continuing might leave data inconsistent
            return;
        }
    }
    // --- End Rebuilding Children Arrays ---


    if (logToConsole) {
        console.log(`Data children for ${newParentFolderId} after DOM rebuild:`, JSON.stringify(searchEngines[newParentFolderId]?.children));
        if (oldParentFolderId !== newParentFolderId) {
            console.log(`Data children for ${oldParentFolderId} after DOM rebuild:`, JSON.stringify(searchEngines[oldParentFolderId]?.children));
        }
    }

    // Update the 'index' property for ALL items based on their new positions in the arrays.
    // This should now work correctly because the children arrays reflect the DOM order.
    updateIndices('root');

    if (logToConsole) console.log("Final searchEngines structure before saving:", JSON.stringify(searchEngines));
    await sendMessage('saveSearchEngines', searchEngines);
}

// Expand folder
async function expand(folderId, parentDiv) {
    const folder = searchEngines[folderId];
    let folderDiv; // This will be the outer folder div OR the root div
    let sortableTargetDiv; // This will be the div to attach SortableJS to and append children

    if (folderId === 'root') {
        folderDiv = document.getElementById('searchEngines');
        sortableTargetDiv = folderDiv; // For root, Sortable is on the main div
        // Ensure Sortable is initialized on root (if not already)
        // This check might need refinement based on how displaySearchEngines works
        if (!folderDiv.classList.contains('sortable-initialized')) { // Example check
            new Sortable(sortableTargetDiv, sortableOptions);
            folderDiv.classList.add('sortable-initialized'); // Mark as initialized
        }
    } else {
        // Create the folder item (which now includes header and empty children container)
        folderDiv = createFolderItem(folderId);
        parentDiv.appendChild(folderDiv);
        // Find the specific container for children within the created folder item
        sortableTargetDiv = folderDiv.querySelector('.folder-children'); // << Find the children container
        if (!sortableTargetDiv) {
            console.error("Could not find .folder-children container in", folderDiv);
            return; // Stop if structure is wrong
        }
        // Initialize SortableJS on the children container
        new Sortable(sortableTargetDiv, sortableOptions); // << Attach Sortable here
    }

    // Append children to the sortableTargetDiv
    folder.children.forEach((f) => {
        if (!searchEngines[f] || searchEngines[f].aiProvider === 'exa') return;
        const childData = searchEngines[f]; // Renamed for clarity
        if (childData.isFolder) {
            // Pass the sortableTargetDiv as the parent for nested folders
            expand(f, sortableTargetDiv); // Recursive call
        } else {
            const div = createLineItem(f);
            sortableTargetDiv.appendChild(div); // << Append items here
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
    // Use optional chaining in case folderId itself is invalid or lacks children
    const children = searchEngines[folderId]?.children;
    if (!children) {
        // Log a warning if the folder or its children array doesn't exist
        console.warn(`updateIndices: Folder with ID "${folderId}" not found or has no children array.`);
        return;
    }

    for (let childId of children) {
        // *** Add check: Ensure the child entry exists in searchEngines ***
        if (searchEngines[childId]) {
            searchEngines[childId].index = children.indexOf(childId);
            if (logToConsole) console.log(childId, searchEngines[childId].index);
            // Check if it's a folder and recursively update (use optional chaining for safety)
            if (searchEngines[childId].isFolder && searchEngines[childId].children?.length > 0) {
                updateIndices(childId);
            }
        } else {
            // Log an error if a child ID exists in the array but not in the main object
            console.error(`updateIndices: Child ID "${childId}" found in children of folder "${folderId}", but does not exist in searchEngines object. Data might be inconsistent.`);
            // Consider removing the invalid ID here as a recovery step, but fixing the source is better:
            // const invalidIndex = searchEngines[folderId].children.indexOf(childId);
            // if (invalidIndex > -1) {
            //     searchEngines[folderId].children.splice(invalidIndex, 1);
            //     console.warn(`updateIndices: Removed invalid child ID "${childId}" from folder "${folderId}".`);
            // }
        }
    }
}

function findParentId(itemId) {
    if (!searchEngines[itemId]) {
        console.warn(`Item with ID: ${itemId} not found.`);
        return 'root';
    }
    for (const potentialParentId in searchEngines) {
        const potentialParent = searchEngines[potentialParentId];
        if (potentialParent.isFolder && Array.isArray(potentialParent.children)) {
            if (potentialParent.children.includes(itemId)) {
                return potentialParentId;
            }
        }
    }
    return 'root';
}

async function openAddSearchEngineOrFolderPopup(e) {
    const popupWidth = 1000; // Set the width of the popup
    const popupHeight = 400; // Set the height of the popup
    const left = Math.floor((window.screen.width - popupWidth) / 2); // Center horizontally
    const top = Math.floor((window.screen.height - popupHeight) / 2); // Center vertically
    const windowFeatures = `width=${popupWidth},height=${popupHeight},left=${left},top=${top},resizable,
    scrollbars`;
    const lineItemId = e.target.closest('div[data-id]')?.dataset.id;
    // Add a check to ensure lineItemId is valid
    if (!lineItemId || !searchEngines[lineItemId]) {
        console.error("Could not determine the item ID or the item doesn't exist.");
        return; // Exit if we can't find the item
    }
    const parentId = findParentId(lineItemId);
    const newIndex = searchEngines[lineItemId].index + 1;
    const dataToSend = {
        parentId: parentId,
        newIndex: newIndex
    };

    // Open the popup window
    const queryParams = new URLSearchParams(dataToSend).toString();
    const popup = window.open(
        `/html/addSearchEngineOrFolder.html?${queryParams}`, // Path to the HTML file
        '_blank', // Open in a new window
        windowFeatures // Window features
    );

    if (popup) {
        popup.focus();
    } else {
        // Popup blocked
        alert(popupBlockedMessage);
    }
}

function createButton(btnType, btnTitle) {
    const button = document.createElement('button');
    const icon = document.createElement('img');
    const condition = btnType === 'add';
    button.setAttribute('type', 'button');
    button.setAttribute('title', btnTitle);
    button.classList.add(btnType); // Class can be 'add' or 'remove'
    icon.setAttribute('src', condition ? '/icons/uxwing-plus-green-icon.svg' : '/icons/uxwing-minus-red-icon.svg');
    icon.setAttribute('width', '32'); // Set the width to 32px
    icon.setAttribute('height', '32'); // Set the height to 32px
    button.appendChild(icon);
    return button;
}

// Display a single separator, search engine or prompt in a row or line item
function createLineItem(id) {
    const searchEngine = searchEngines[id];
    const searchEngineName = searchEngine.name;
    const lineItem = document.createElement('div');
    lineItem.setAttribute('id', id);
    lineItem.classList.add('search-engine');
    lineItem.setAttribute('data-id', id);

    let inputQueryString;
    let textareaPrompt;
    let aiProvider;
    let selectedOption;
    let textareaFormData;

    // If line item is a separator
    if (id.startsWith("separator-")) {
        const hr = document.createElement('hr');
        hr.id = id; // Set the element ID
        hr.dataset.id = id; // Add data-id for consistent reading by getChildrenIdsFromDOM
        hr.classList.add('separator');
        const addButton = createButton('add', add + ' separator');
        addButton.addEventListener('click', openAddSearchEngineOrFolderPopup);
        const removeButton = createButton('remove', remove + ' separator');
        removeButton.addEventListener('click', removeSearchEngine);
        lineItem.appendChild(hr);
        lineItem.appendChild(addButton);
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
        option3.text = "Gemini";

        const option9 = document.createElement("option");
        option9.value = "grok";
        option9.text = "Grok";

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
        aiProvider.appendChild(option9);
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

        aiProvider.addEventListener('change', async (e) => {
            await saveChanges(e, 'aiProvider');
        });

        textareaPrompt = document.createElement('textarea');
        textareaPrompt.setAttribute('rows', 4);
        textareaPrompt.setAttribute('cols', 50);
        textareaPrompt.value = searchEngine.prompt;
        textareaPrompt.addEventListener('change', async (e) => {
            await saveChanges(e, 'prompt');
        });
    } else {
        // If line item is a search engine
        inputQueryString = document.createElement('input');
        inputQueryString.setAttribute('type', 'url');
        inputQueryString.setAttribute('value', searchEngine.url);
        // Event handler for query string changes
        inputQueryString.addEventListener('change', async (e) => {
            await saveChanges(e, 'url');
        });

        // If the search engine uses an HTTP POST request
        if (!searchEngine.url.includes('?') && searchEngine.formData) {
            if (logToConsole) console.log(searchEngine.formData);
            textareaFormData = document.createElement('textarea');
            textareaFormData.setAttribute('rows', 4);
            textareaFormData.setAttribute('cols', 50);
            textareaFormData.value = searchEngine.formData;
            textareaFormData.addEventListener('change', async (e) => {
                await saveChanges(e, 'formData');
            });
        }
    }

    // Add and deletion button for each search engine or prompt line item
    const addButton = createButton('add', addANewItem);
    const removeButton = createButton('remove', remove + ' ' + searchEngineName);

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
    inputSearchEngineName.addEventListener('change', async (e) => {
        await saveChanges(e, 'name');
    });

    // Event handler for keyword text changes
    inputKeyword.addEventListener('change', async (e) => {
        await saveChanges(e, 'keyword');
    }); // when users leave the input field and content has changed

    // Event handlers for adding a keyboard shortcut
    inputKeyboardShortcut.addEventListener('keyup', handleKeyboardShortcutKeyUp);
    inputKeyboardShortcut.addEventListener('keydown', handleKeyboardShortcutKeyDown);
    inputKeyboardShortcut.addEventListener('change', handleKeyboardShortcutChange);

    // Event handler for 'include search engine in multi-search' checkbox click event
    chkMultiSearch.addEventListener('click', multiTabChanged); // when users check or uncheck the checkbox

    // Add and deletion button event handler
    addButton.addEventListener('click', openAddSearchEngineOrFolderPopup);
    removeButton.addEventListener('click', removeSearchEngine);

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
    lineItem.appendChild(addButton);
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

async function editFavicon(e) {
    if (logToConsole) console.log(e);
    // Find closest <li> parent
    const lineItem = e.target.closest('div[data-id]');
    if (logToConsole) console.log('Favicon edit requested for line item:', lineItem);
    if (!lineItem) return;
    const id = lineItem.getAttribute('data-id');
    if (logToConsole) console.log('Favicon edit requested for id:', id);
    if (!id || !searchEngines[id]) return;
    const image = lineItem.querySelector('img');
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

    // Create the "Replace favicon" button
    const replaceButton = document.createElement('button');
    replaceButton.style.width = '100%';
    replaceButton.style.height = '100%';
    replaceButton.style.color = '#2B2A33';
    replaceButton.textContent = 'Save new icon';

    // Handle button click event
    replaceButton.addEventListener('click', async () => {
        // Save the new favicon image to local storage
        searchEngines[id].imageFormat = contentType;
        searchEngines[id].base64 = newBase64;
        image.src = `data:${contentType};base64,${newBase64}`;
        await sendMessage('saveSearchEngines', searchEngines);
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
    const folderItem = document.createElement('div'); // Outer container
    const folderHeader = document.createElement('div'); // Header container
    const folderChildrenContainer = document.createElement('div'); // Children container << NEW
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
    inputFolderKeyboardShortcut.addEventListener('keyup', handleKeyboardShortcutKeyUp);
    inputFolderKeyboardShortcut.addEventListener('keydown', handleKeyboardShortcutKeyDown);
    inputFolderKeyboardShortcut.addEventListener('change', handleKeyboardShortcutChange);

    // Add and deletion button for folder
    const addButton = createButton('add', addANewFolder);
    const removeButton = createButton('remove', `${remove} ${name} ${folder}`);

    // Add and deletion button event handler
    addButton.addEventListener('click', openAddSearchEngineOrFolderPopup);
    removeButton.addEventListener('click', removeSearchEngine);

    icon.setAttribute('src', `data:${searchEngines[id].imageFormat || 'image/png'};base64,${searchEngines[id].base64}`);

    folderItem.setAttribute('id', id);
    folderItem.classList.add('folder');
    folderItem.setAttribute('data-id', id);

    folderHeader.classList.add('folder-header'); // Add class for styling/selection

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

    // Append controls to the header div
    folderHeader.appendChild(icon);
    folderHeader.appendChild(inputFolderName);
    folderHeader.appendChild(inputFolderKeyword);
    folderHeader.appendChild(inputFolderKeyboardShortcut);
    folderHeader.appendChild(addButton);
    folderHeader.appendChild(removeButton);

    folderChildrenContainer.classList.add('folder-children'); // Add class for selection << NEW

    // Append header and children container to the main folder item
    folderItem.appendChild(folderHeader);
    folderItem.appendChild(folderChildrenContainer); // << NEW

    return folderItem; // Return the outer div
}

async function clearAll() {
    let divSearchEngines = document.getElementById('searchEngines');
    let lineItems = divSearchEngines.childNodes;
    for (let i = 0; i < lineItems.length; i++) {
        let input = lineItems[i].firstChild;
        if (input != null && input.nodeName == 'INPUT' && input.getAttribute('type') == 'checkbox') {
            input.checked = false;
        }
    }
    await saveSearchEngines();
}

async function selectAll() {
    let divSearchEngines = document.getElementById('searchEngines');
    let lineItems = divSearchEngines.childNodes;
    for (let i = 0; i < lineItems.length; i++) {
        let input = lineItems[i].firstChild;
        if (input != null && input.nodeName == 'INPUT' && input.getAttribute('type') == 'checkbox') {
            input.checked = true;
        }
    }
    await saveSearchEngines();
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

async function clearKeyboardShortcuts() {
    for (let id in searchEngines) {
        searchEngines[id].keyboardShortcut = "";
    }
    displaySearchEngines();
    await saveSearchEngines();
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
async function removeSearchEngine(e) {
    e.stopPropagation();
    // Find closest parent div with a data-id attribute
    const lineItem = e.target.closest('div[data-id]'); // Use data-id selector
    if (!lineItem) {
        console.error("Could not find parent item for removal:", e.target);
        return;
    }
    const id = lineItem.dataset.id; // Use data-id
    if (!id) {
        console.error("Found item has no data-id:", lineItem);
        return;
    }
    const pn = lineItem.parentNode;
    if (!pn) {
        console.error("Found item has no parent node:", lineItem);
        return;
    }

    // Determine parent ID
    let parentId;
    if (pn.id === 'searchEngines') {
        parentId = 'root';
    } else if (pn.dataset.id) {
        parentId = pn.dataset.id;
    } else {
        console.error("Could not determine parent ID for item:", id, pn);
        return; // Cannot proceed without parent ID
    }

    if (logToConsole) console.log(`Attempting to remove: id=${id}, parentId=${parentId}`, lineItem, pn);

    // Check if search engine exists before accessing properties
    if (!searchEngines[id]) {
        console.error(`Search engine with id "${id}" not found in searchEngines object.`, searchEngines);
        pn.removeChild(lineItem); // Remove the visual element anyway
        // Attempt to clean up parent's children array if possible
        if (searchEngines[parentId] && searchEngines[parentId].children) {
            const index = searchEngines[parentId].children.indexOf(id);
            if (index > -1) {
                searchEngines[parentId].children.splice(index, 1);
                await sendMessage('saveSearchEngines', searchEngines); // Save cleaned state
            }
        }
        return; // Stop further processing
    }

    // Check parent exists before attempting removal logic
    if (!searchEngines[parentId]) {
        console.error(`Parent search engine with id "${parentId}" not found.`);
        // Optionally remove the orphaned item visually
        pn.removeChild(lineItem);
        return;
    }

    if (!searchEngines[id].isFolder) {
        let remove;
        if (id.startsWith("separator-")) {
            remove = true;
        } else {
            remove = confirm(`${removeSearchEngineConfirm} ${searchEngines[id].name}?`);
        }
        if (remove) {
            // Remove the id from the parent's children *before* deleting the engine
            if (searchEngines[parentId].children) {
                const index = searchEngines[parentId].children.indexOf(id);
                if (index > -1) {
                    searchEngines[parentId].children.splice(index, 1);
                } else {
                    console.warn(`Could not find child ${id} in parent ${parentId}'s children array.`);
                }
            } else {
                console.warn(`Parent ${parentId} has no children array.`);
            }
            // Remove the line item and its corresponding search engine data
            pn.removeChild(lineItem);
            delete searchEngines[id];
        } else {
            return;
        }
    } else {
        // If the line item is a folder, display a warning message
        const remove = confirm(`${removeFolderConfirmPrefix} ${searchEngines[id].name} ${removeFolderConfirmSuffix}?`);
        if (remove) {
            // Remove the id from the parent's children *before* deleting the folder data
            if (searchEngines[parentId].children) {
                const index = searchEngines[parentId].children.indexOf(id);
                if (index > -1) {
                    searchEngines[parentId].children.splice(index, 1);
                } else {
                    console.warn(`Could not find child folder ${id} in parent ${parentId}'s children array.`);
                }
            } else {
                console.warn(`Parent ${parentId} has no children array.`);
            }
            // Remove the folder element and its data
            pn.removeChild(lineItem);
            removeFolder(id); // This function handles deleting the folder and its descendants from searchEngines
        } else {
            return;
        }
    }

    // Save the updated search engines
    if (logToConsole) console.log("Updated searchEngines:", searchEngines);
    await sendMessage('saveSearchEngines', searchEngines);
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

async function visibleChanged(e) {
    const lineItem = e.target.parentNode;
    const id = lineItem.getAttribute('id');
    const visible = e.target.checked;

    searchEngines[id]['show'] = visible;

    await sendMessage('saveSearchEngines', searchEngines);
}

async function folderNameChanged(e) {
    const lineItem = e.target.parentNode;
    const id = lineItem.getAttribute('id');
    const folderName = e.target.value;

    searchEngines[id]['name'] = folderName;

    await sendMessage('saveSearchEngines', searchEngines);
}

async function folderKeywordChanged(e) {
    const lineItem = e.target.parentNode;
    const id = lineItem.getAttribute('id');
    const keyword = e.target.value;

    searchEngines[id]['keyword'] = keyword;

    await sendMessage('saveSearchEngines', searchEngines);
}

// Handle the input of a keyboard shortcut for a search engine in the Options page
function handleKeyboardShortcutKeyUp(e) {
    const releasedKey = e.key;
    if (logToConsole) console.log('keyup:', releasedKey, 'keysPressed:', keysPressed);

    // List of modifier keys
    const modifierKeys = [meta, 'Control', 'Alt', 'Shift'];

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
    let id = null;

    // Determine the target input field
    const lineItem = e.target.closest('.search-engine, .folder'); // Use closest to find parent item
    if (!lineItem) {
        keysPressed = {};
        console.error('Could not find parent line item or folder for shortcut input');
        return;
    }
    id = lineItem.getAttribute('id');
    input = document.getElementById(id + '-kbsc');
    if (!input) {
        keysPressed = {};
        console.error(`Could not find input element #${id}-kbsc`);
        return;
    }

    // Define the desired order for modifier keys
    const modifierOrder = { meta: 1, 'Control': 2, 'Alt': 3, 'Shift': 4 };
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

    // This ensures the change handler runs for existing items immediately after keyup finalization.
    if (id !== null) {
        const changeEvent = new Event('change', { bubbles: true });
        input.dispatchEvent(changeEvent);
    }
}

async function handleKeyboardShortcutChange(e) {
    const lineItem = e.target.parentNode;
    const id = lineItem.getAttribute('id');
    const input = document.getElementById(id + '-kbsc');
    const keyboardShortcut = input.value;
    if (logToConsole) console.log(`id: ${id}, keyboardShortcut: ${keyboardShortcut}`);
    searchEngines[id]['keyboardShortcut'] = keyboardShortcut;

    await sendMessage('saveSearchEngines', searchEngines);
}

async function multiTabChanged(e) {
    if (logToConsole) console.log(e.target);
    let lineItem = e.target.parentNode;
    let id = lineItem.getAttribute('id');
    let multiTab = e.target.checked;

    if (logToConsole) console.log(`Multisearch ${(multiTab ? 'enabled' : 'disabled')} for search engine ${searchEngines[id].name}`);

    searchEngines[id]['multitab'] = multiTab;

    await sendMessage('saveSearchEngines', searchEngines);
}

async function saveChanges(e, property) {
    const lineItem = e.target.parentNode;
    const id = lineItem.getAttribute('id');
    const newValue = e.target.value;

    searchEngines[id][property] = newValue;

    if (property === 'aiProvider') {
        await sendMessage('saveAIEngine', { 'id': id, 'aiProvider': newValue });
    } else {
        await sendMessage('saveSearchEngines', searchEngines);
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
        children: [], // Array of search engine and/or subfolder ids
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
async function saveSearchEngines() {
    searchEngines = readData();
    if (logToConsole) console.log('Search engines READ from the Options page:\n', searchEngines);
    await sendMessage('saveSearchEngines', searchEngines);
}

async function addNewSearchEngine(parentId, id, searchEngine) {
    // ... (Create search engine item and add to searchEngines) ...
    searchEngines[id] = { ...searchEngine };

    if (searchEngine.isFolder) {
        // Get favicon for the folder
        searchEngines[id]['imageFormat'] = 'image/png';
        searchEngines[id]['base64'] = base64FolderIcon;
    } else if (!id.startsWith("separator-")) {
        // Get favicon for the search engine
        const response = await sendMessage('getFavicon', { id, searchEngine });
        if (response && response.success) {
            searchEngines[id]['imageFormat'] = response.imageFormat;
            searchEngines[id]['base64'] = response.base64;
        }
    }



    // Add search engine to children of parent folder
    if (searchEngines[parentId] && searchEngines[parentId].children) {
        searchEngines[parentId].children.splice(searchEngine.index, 0, id);
    } else {
        console.error(`Parent with ID ${parentId} or its children array not found.`);
        // Handle error appropriately, maybe add to root?
        // Or ensure parentId is always valid before calling this function.
    }
    displaySearchEngines();
}

async function setOptions(options) {
    if (isEmpty(options)) return;

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

async function saveToLocalDisk() {
    await saveSearchEngines();
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

// Shared handler for keydown events on shortcut input fields
function handleKeyboardShortcutKeyDown(e) {
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
