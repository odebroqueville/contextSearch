/// Global variables
/* global Sortable */
// Debug
const logToConsole = false;

// Other 
const os = getOS();
const modifiers = ["Control", "Shift", "Alt", "Meta"];
let meta = '';
if (os === 'macOS') {
    meta = 'cmd+';
} else if (os === 'Windows') {
    meta = 'win+';
} else if (os === 'Linux') {
    meta = 'super+';
} else meta = 'meta+';

// Settings container and div for addSearchEngine
const divContainer = document.getElementById('container');

// Add Search Engine
const show = document.getElementById('show'); // Boolean
const sename = document.getElementById('name'); // String
const keyword = document.getElementById('keyword'); // String
const multitab = document.getElementById('multitab'); // Boolean
const url = document.getElementById('url'); // String
const kbsc = document.getElementById('kb-shortcut'); // String

// Add ChatGPT Prompt
const promptShow = document.getElementById('promptShow'); // Boolean
const promptName = document.getElementById('promptName'); // String
const promptKeyword = document.getElementById('promptKeyword'); // String
const promptMultitab = document.getElementById('promptMultitab'); // Boolean
const promptText = document.getElementById('prompt'); // String
const promptKbsc = document.getElementById('prompt-kb-shortcut'); // String
const aiProvider = document.getElementById('ai-provider');

// Add folder
// const folderName = document.getElementById('folderName');
// const folderKeyword = document.getElementById('folderKeyword');

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
const disableAltClick = document.getElementById('disableAltClick');
const resetPreferences = document.getElementById('resetPreferences');
const forceSearchEnginesReload = document.getElementById('forceSearchEnginesReload');
const forceFaviconsReload = document.getElementById('forceFaviconsReload');
const searchEngineSiteSearch = document.getElementById('siteSearch');
const multiNewWindow = document.getElementById('multiNewWindow');
const multiActiveTab = document.getElementById('multiActiveTab');
const multiAfterLastTab = document.getElementById('multiAfterLastTab');
const multiMode = document.getElementById('multiMode');

// All search engine buttons
const btnClearAll = document.getElementById('clearAll');
const btnSelectAll = document.getElementById('selectAll');
const btnSortAlpha = document.getElementById('sortAlphabetically');
const btnReset = document.getElementById('reset');

// Add new search engine buttons
const btnTest = document.getElementById('test');
const btnAdd = document.getElementById('addSearchEngine');
const btnClearAddSearchEngine = document.getElementById('clearAddSearchEngine');
const btnTestChatGPTPrompt = document.getElementById('testChatGPTPrompt');
const btnAddChatGPTPrompt = document.getElementById('addChatGPTPrompt');
const btnClearAddChatGPTPrompt = document.getElementById('clearAddChatGPTPrompt');
// const btnAddFolder = document.getElementById('addFolder');
// const btnClearAddFolder = document.getElementById('clearAddFolder');
const btnAddSeparator = document.getElementById('addSeparator');

// Import/export
const btnDownload = document.getElementById('download');
const btnUpload = document.getElementById('upload');

// Translation variables
const remove = browser.i18n.getMessage('remove');
// const folder = browser.i18n.getMessage('folder');
const multipleSearchEnginesSearch = browser.i18n.getMessage('multipleSearchEnginesSearch');
const titleShowEngine = browser.i18n.getMessage('titleShowEngine');
const placeHolderName = browser.i18n.getMessage('searchEngineName');
const placeHolderKeyword = browser.i18n.getMessage('placeHolderKeyword');
const placeHolderKeyboardShortcut = browser.i18n.getMessage('placeHolderKeyboardShortcut');
const notifySearchEngineUrlRequired = browser.i18n.getMessage('notifySearchEngineUrlRequired');

// Other variables
let numberOfSearchEngines = 0;
let searchEngines = {};
let keysPressed = {};

/// Event handlers
// document.addEventListener('DOMContentLoaded', restoreOptionsPage);
browser.runtime.onMessage.addListener(handleMessage);
browser.storage.onChanged.addListener(handleStorageChange);
browser.permissions.onAdded.addListener(handlePermissionsChanges);
browser.permissions.onRemoved.addListener(handlePermissionsChanges);

// Options changes event handlers
exactMatch.addEventListener('click', updateSearchOptions);
displayFavicons.addEventListener('click', updateDisplayFavicons);
quickIconGrid.addEventListener('click', updateQuickIconGrid);
closeGridOnMouseOut.addEventListener('click', updateCloseGridOnMouseOut);
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

/// All button click handlers
btnClearAll.addEventListener('click', clearAll);
btnSelectAll.addEventListener('click', selectAll);
btnSortAlpha.addEventListener('click', sortSearchEnginesAlphabetically);
btnReset.addEventListener('click', reset);

// Add new search engine button click handlers
btnTest.addEventListener('click', testSearchEngine);
btnAdd.addEventListener('click', addSearchEngine);
btnClearAddSearchEngine.addEventListener('click', clearAddSearchEngine);

// Add new ChatGPT Prompt button handlers
btnTestChatGPTPrompt.addEventListener('click', testChatGPTPrompt);
btnAddChatGPTPrompt.addEventListener('click', addChatGPTPrompt);
btnClearAddChatGPTPrompt.addEventListener('click', clearAddChatGPTPrompt);

// Add new folder or separator button click handlers
btnAddSeparator.addEventListener('click', addSeparator);
// btnAddFolder.addEventListener('click', addFolder);
// btnClearAddFolder.addEventListener('click', clearAddFolder);

// Import/export
btnDownload.addEventListener('click', saveToLocalDisk);
btnUpload.addEventListener('change', handleFileUpload);

// Handle incoming messages
function handleMessage(message) {
    if (logToConsole) console.log(message);
    if (message.action === 'resetCompleted') {
        restoreOptionsPage();
    }
}

// Handle Permissions changes for Downloads
function handlePermissionsChanges(Permissions) {
    console.log(`API permissions: ${Permissions.permissions}`);
    console.log(`Host permissions: ${Permissions.origins}`);
    checkForDownloadsPermission();
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

// Send a message to the background script
async function sendMessage(action, data) {
    await browser.runtime.sendMessage({ action: action, data: JSON.parse(JSON.stringify(data)) })
        .catch(e => {
            if (logToConsole) console.error(e);
        });
}

// Handle local and sync storage changes
function handleStorageChange(changes, area) {
    if (area === 'local') {
        if (logToConsole) {
            console.log('BEFORE CHANGES: ');
            console.log(searchEngines);
        }
        const ids = Object.keys(changes);
        if (logToConsole) {
            console.log(changes);
            console.log(ids);
        }
        for (const id of ids) {
            if (changes[id].newValue === undefined) {
                continue;
            }
            if (logToConsole) console.log(id);
            searchEngines[id] = changes[id].newValue;
            if (logToConsole) {
                console.log(`Search engine ${id}:\n`);
                console.log(searchEngines[id]);
            }
        }
        if (logToConsole) {
            console.log('AFTER CHANGES: ');
            console.log(searchEngines);
        }
        displaySearchEngines();
    } else if (area === 'sync') {
        let data = {};
        let optionKeys = Object.keys(changes);
        if (logToConsole) {
            console.log(changes);
            console.log(optionKeys);
        }
        for (let optionKey of optionKeys) {
            if (changes[optionKey].newValue !== undefined) data[optionKey] = changes[optionKey].newValue;
            if (logToConsole) {
                console.log(optionKey);
                console.log(changes[optionKey].newValue);
                console.log('---------------------------------------');
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

// Generic Error Handler
function onError(error) {
    if (logToConsole) console.log(`${error}`);
}

function removeEventHandler(e) {
    e.stopPropagation();
    removeSearchEngine(e);
}

// Display the list of search engines
function displaySearchEngines() {
    const div = document.getElementById('searchEngines');
    if (!isEmpty(div)) divContainer.removeChild(div);

    searchEngines = sortByIndex(searchEngines);
    numberOfSearchEngines = Object.keys(searchEngines).length;
    let divSearchEngines = document.createElement('ol');
    divSearchEngines.setAttribute('id', 'searchEngines');
    for (let i = 0; i < numberOfSearchEngines + 1; i++) {
        for (let id in searchEngines) {
            if (searchEngines[id].index === i) {
                const searchEngine = searchEngines[id];
                const lineItem = createLineItem(id, searchEngine, searchEngine.folder);
                divSearchEngines.appendChild(lineItem);

                // If folder, add search engines within folder
                if (searchEngine.folder && searchEngine.searchEngines) {
                    searchEngine.searchEngines.forEach(se => {
                        let seItem = createLineItem(se.id, se, false);
                        lineItem.querySelector('.subfolder').appendChild(seItem);
                    })
                }
            }
        }
    }
    divContainer.appendChild(divSearchEngines);
    numberOfSearchEngines = divSearchEngines.childNodes.length;

    // Initialize Sortable list
    new Sortable(divSearchEngines, {
        handle: '.sort',
        animation: 200,
        // On element drag ended, save search engines
        onEnd: saveSearchEngines
    });
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

// Display a single search engine in a row or line item
function createLineItem(id, searchEngine, isFolder = false) {
    // if (isFolder) { return createFolderItem(searchEngine.name, searchEngine.keyword); }

    const searchEngineName = searchEngine.name;
    const lineItem = document.createElement('li');
    lineItem.setAttribute('id', id);

    let inputQueryString;
    let textareaPrompt;
    let aiProvider;

    // If line item is a separator
    if (id.startsWith("separator-")) {
        const hr = document.createElement('hr');
        const sortTarget = document.createElement('i');
        sortTarget.classList.add('sort', 'icon', 'ion-arrow-move');
        const removeButton = createButton('ion-ios-trash', 'remove', remove + ' separator');
        removeButton.addEventListener('click', removeEventHandler);
        lineItem.appendChild(hr);
        lineItem.appendChild(sortTarget);
        lineItem.appendChild(removeButton);
        return lineItem;
    }

    // If line item is a ChatGPT prompt
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
        option3.value = "bard";
        option3.text = "Google Bard";

        const option4 = document.createElement("option");
        option4.value = "perplexity";
        option4.text = "Perplexity.ai";

        const option5 = document.createElement("option");
        option5.value = "llama2";
        option5.text = "Llama2 on Poe";

        const option6 = document.createElement("option");
        option6.value = "claude-instant";
        option6.text = "Claude-instant on Poe";

        const option7 = document.createElement("option");
        option7.value = "assistant";
        option7.text = "Poe Assistant";

        aiProvider.appendChild(option1);
        aiProvider.appendChild(option2);
        aiProvider.appendChild(option3);
        aiProvider.appendChild(option4);
        aiProvider.appendChild(option5);
        aiProvider.appendChild(option6);
        aiProvider.appendChild(option7);

        // Get the option with the value "chatgpt"
        const selectedOption = aiProvider.querySelector(`option[value=${searchEngine.aiProvider}]`);

        // Set the selected property of the option to true
        selectedOption.selected = true;

        aiProvider.addEventListener('change', (e) => {
            saveChanges(e, 'aiProvider');
        });

        textareaPrompt = document.createElement('textarea');
        textareaPrompt.classList.add('row-2');
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
    }

    // Navigation and deletion buttons for each search engine or line item
    // Create menu target for line item sorting
    const sortTarget = document.createElement('i');
    sortTarget.classList.add('sort', 'icon', 'ion-arrow-move');
    if (id.startsWith('chatgpt-')) {
        sortTarget.classList.add('row-2');
    }
    const removeButton = createButton('ion-ios-trash', 'remove', remove + ' ' + searchEngineName);
    if (id.startsWith('chatgpt-')) {
        removeButton.classList.add('row-2');
    }

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
    inputKeyboardShortcut.addEventListener('keydown', (event) => {
        const key = event.key;
        if (isKeyAllowed(event)) keysPressed[key] = event.code;
        if (logToConsole) console.log(keysPressed);
    });
    inputKeyboardShortcut.addEventListener('change', handleKeyboardShortcutChange);

    // Event handler for 'include search engine in multi-search' checkbox click event
    chkMultiSearch.addEventListener('click', multiTabChanged); // when users check or uncheck the checkbox

    // Navigation and deletion buttons event handlers
    removeButton.addEventListener('click', removeEventHandler);

    // Set attributes for all the elements composing a search engine or line item
    if (id.startsWith('chatgpt-')) {
        chkShowSearchEngine.classList.add('row-1');
    }
    chkShowSearchEngine.setAttribute('type', 'checkbox');
    chkShowSearchEngine.setAttribute('title', titleShowEngine);
    chkShowSearchEngine.setAttribute('id', id + '-chk');
    chkShowSearchEngine.checked = searchEngine.show;

    if (id.startsWith('chatgpt-')) {
        favicon.classList.add('row-1');
    }
    favicon.setAttribute('src', `data:${searchEngine.imageFormat || 'image/png'};base64,${searchEngine.base64}`);

    if (id.startsWith('chatgpt-')) {
        inputSearchEngineName.classList.add('row-2');
    }
    inputSearchEngineName.setAttribute('type', 'text');
    inputSearchEngineName.setAttribute('id', id + '-name');
    inputSearchEngineName.setAttribute('placeholder', placeHolderName);
    inputSearchEngineName.setAttribute('value', searchEngineName);

    if (id.startsWith('chatgpt-')) {
        inputKeyword.classList.add('row-2');
    }
    inputKeyword.setAttribute('type', 'text');
    inputKeyword.setAttribute('id', id + '-kw');
    inputKeyword.classList.add('keyword');
    inputKeyword.setAttribute('placeholder', placeHolderKeyword);
    inputKeyword.setAttribute('value', searchEngine.keyword);

    if (id.startsWith('chatgpt-')) {
        inputKeyboardShortcut.classList.add('row-2');
    }
    inputKeyboardShortcut.setAttribute('type', 'text');
    inputKeyboardShortcut.setAttribute('id', id + '-kbsc');
    inputKeyboardShortcut.classList.add('kb-shortcut');
    inputKeyboardShortcut.setAttribute('placeholder', placeHolderKeyboardShortcut);
    inputKeyboardShortcut.setAttribute('value', searchEngine.keyboardShortcut);

    if (id.startsWith('chatgpt-')) {
        chkMultiSearch.classList.add('row-2');
    }
    chkMultiSearch.setAttribute('type', 'checkbox');
    chkMultiSearch.setAttribute('id', id + '-mt');
    chkMultiSearch.setAttribute('title', multipleSearchEnginesSearch);
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
    lineItem.appendChild(chkMultiSearch);
    if (!id.startsWith("chatgpt-")) {
        lineItem.appendChild(inputQueryString);
    } else {
        lineItem.appendChild(textareaPrompt);
    }
    lineItem.appendChild(sortTarget);
    lineItem.appendChild(removeButton);

    return lineItem;
}

function editFavicon(e) {
    if (logToConsole) console.log(e);
    // Find closest <li> parent
    const lineItem = e.target.closest('li');
    if (!lineItem) return;
    const id = lineItem.getAttribute('id');
    const imageFormat = searchEngines[id].imageFormat;
    const base64Image = searchEngines[id].base64;
    const searchEngineName = searchEngines[id].name;
    const popupWidth = 550; // Width of the popup window
    const popupHeight = 550; // Height of the popup window
    const left = Math.floor((window.screen.width - popupWidth) / 2);
    const top = Math.floor((window.screen.height - popupHeight) / 2);
    const windowFeatures = `popup, width=${popupWidth}, height=${popupHeight}, left=${left}, top=${top}`;
    let newBase64;
    let contentType;

    // Create the popup window
    const popup = window.open('', 'editFaviconPopup', windowFeatures);

    // Set the CSS rule for the body of the popup
    popup.document.body.style.display = 'grid';
    popup.document.body.style.gridTemplateColumns = '1fr 1fr';
    popup.document.body.style.gridTemplateRows = 'auto 30px';
    popup.document.body.style.fontFamily = 'Raleway, Helvetica, sans-serif';

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
    //imageTitle.style.fontFamily = 'Raleway, Helvetica, sans-serif';
    imageTitle.style.padding = '10px';
    imageTitle.style.margin = '0';

    // Add a section to instruct users how to change the favicon image
    const help = document.createElement('em');
    help.textContent = "Drag & drop a new image over the existing favicon image. Then click on the 'Save' button for your changes to take effect.";
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
    editableDivCell.style.padding = '10px';
    editableDivCell.style.overflowX = 'hidden'; // Allow vertical overflow only
    editableDivCell.style.overflowY = 'hidden'; // Prevent vertical overflow

    // Create the content-editable div
    const editableDiv = document.createElement('div');
    editableDiv.contentEditable = false;
    editableDiv.style.width = '100%';
    editableDiv.style.height = '100%';
    editableDiv.style.fontSize = '13px';
    editableDiv.style.padding = '5px';
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
    buttonCell.style.gap = '10px';

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
    replaceButton.textContent = 'Save';

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

}


/* function createFolderItem(name, keyword) {
    const el = document.getElementById('ol#searchEngines');
    const folderItem = document.createElement('li');
    const icon = document.createElement('span');
    const inputFolderName = document.createElement('input');
    const inputFolderKeyword = document.createElement('input');
    const subFolder = document.createElement('div');

    // Event handlers for search engine name changes
    inputFolderName.addEventListener('change', folderNameChanged);

    // Event handlers for keyword text changes
    inputFolderKeyword.addEventListener('change', folderKeywordChanged); // when users leave the 

    // Navigation and deletion buttons for each search engine or line item
    // Create menu target for line item sorting
    const navDiv = document.createElement('div');
    navDiv.setAttribute('class', 'nav');
    const sortTarget = document.createElement('span');
    sortTarget.classList.add('sort', 'icon', 'ion-arrow-move');
    const removeButton = createButton('ion-ios-trash', 'remove', `${remove} ${name} ${folder}`);
    navDiv.appendChild(sortTarget);
    navDiv.appendChild(removeButton);

    folderItem.setAttribute('id', name);
    folderItem.setAttribute('class', 'folder');

    icon.setAttribute('class', 'icon ion-folder');

    inputFolderName.setAttribute('type', 'text');
    inputFolderName.setAttribute('data-i18n-placeholder', 'folderName');
    inputFolderName.setAttribute('value', name);

    inputFolderKeyword.setAttribute('type', 'text');
    inputFolderKeyword.setAttribute('class', 'keyword');
    inputFolderKeyword.setAttribute('data-i18n-placeholder', 'placeholderKeyword');
    inputFolderKeyword.setAttribute('value', keyword);

    subFolder.setAttribute('class', 'subfolder');

    folderItem.appendChild(icon);
    folderItem.appendChild(inputFolderName);
    folderItem.appendChild(inputFolderKeyword);
    folderItem.appendChild(navDiv);
    folderItem.appendChild(subFolder);

    // Initialize Sortable subfolder
    new Sortable(el.querySelector('.subfolder'), {
        group: 'nested',
        animation: 200,
        fallbackOnBody: true,
        onEnd: saveSearchEngines
    });

    return folderItem;
} */

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

function sortSearchEnginesAlphabetically() {
    let se = [];
    let counter = 0;
    for (let id in searchEngines) {
        se.push(searchEngines[id].name);
    }
    se = sortAlphabetically(se);
    if (logToConsole) console.log(se);
    for (let name of se) {
        for (let id in searchEngines) {
            if (searchEngines[id].name == name) {
                searchEngines[id].index = counter;
                counter++;
            }
        }
    }
    displaySearchEngines();
    saveSearchEngines();
}

function reset() {
    sendMessage('reset', null);
}

// Begin of user event handlers
function removeSearchEngine(e) {
    // Find closest <li> parent
    let lineItem = e.target.closest('li');
    if (!lineItem) return;
    let id = lineItem.getAttribute('id');
    let pn = lineItem.parentNode;
    if (logToConsole) console.log(id);

    pn.removeChild(lineItem);
    delete searchEngines[id];
    if (logToConsole) console.log(searchEngines);

    sendMessage('saveSearchEngines', searchEngines);
}

function visibleChanged(e) {
    const lineItem = e.target.parentNode;
    const id = lineItem.getAttribute('id');
    const visible = e.target.checked;

    searchEngines[id]['show'] = visible;

    sendMessage('saveSearchEngines', searchEngines);
}

/* function folderNameChanged(e) {
    let lineItem = e.target.parentNode;
    let id = lineItem.getAttribute('id');
    let searchEngineName = e.target.value;

    searchEngines[id]['name'] = searchEngineName;

    sendMessage('saveSearchEngines', searchEngines);
}

function folderKeywordChanged(e) {
    let lineItem = e.target.parentNode;
    let id = lineItem.getAttribute('id');
    let keyword = e.target.value;

    searchEngines[id]['keyword'] = keyword;

    sendMessage('saveSearchEngines', searchEngines);
} */

// Handle the input of a keyboard shortcut for a search engine in the Options page
function handleKeyboardShortcut(e) {
    if (e.target.nodeName !== 'INPUT' || !isKeyAllowed(e) || !Object.keys(keysPressed).length > 0) return;
    if ((os === 'macOS' && e.metaKey) || ((os === 'Windows' || os === 'Linux') && e.ctrlKey)) return;
    e.preventDefault();
    if (logToConsole) console.log(os);
    if (logToConsole) console.log(keysPressed);
    const lineItem = e.target.parentNode;
    const id = lineItem.getAttribute('id');
    const input = document.getElementById(id + '-kbsc');
    let keyboardShortcut = '';
    if (logToConsole) console.log(e);

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
    input.value = keyboardShortcut;
    keysPressed = {};
    searchEngines[id]['keyboardShortcut'] = keyboardShortcut;

    sendMessage('saveSearchEngines', searchEngines);
}

function handleKeyboardShortcutChange(e) {
    const lineItem = e.target.parentNode;
    const id = lineItem.getAttribute('id');
    const input = document.getElementById(id + '-kbsc');
    const keyboardShortcut = input.value;
    searchEngines[id]['keyboardShortcut'] = keyboardShortcut;

    sendMessage('saveSearchEngines', searchEngines);
}

function multiTabChanged(e) {
    if (logToConsole) console.log(searchEngines);
    if (logToConsole) console.log(e.target);
    let lineItem = e.target.parentNode;
    let id = lineItem.getAttribute('id');
    let multiTab = e.target.checked;

    searchEngines[id]['multitab'] = multiTab;

    sendMessage('saveSearchEngines', searchEngines);
}

function saveChanges(e, property) {
    const lineItem = e.target.parentNode;
    const id = lineItem.getAttribute('id');
    const newValue = e.target.value;

    searchEngines[id][property] = newValue;

    sendMessage('saveSearchEngines', searchEngines);
}

// End of user event handlers

function readData() {
    let oldSearchEngines = {};
    oldSearchEngines = searchEngines;
    searchEngines = {};

    let divSearchEngines = document.getElementById('searchEngines');
    let lineItems = divSearchEngines.childNodes;
    numberOfSearchEngines = lineItems.length;
    for (let i = 0; i < numberOfSearchEngines; i++) {
        const input = lineItems[i].firstChild;
        const id = lineItems[i].id;
        if (input !== null && input.nodeName === 'HR' && id.startsWith("separator-")) {
            searchEngines[id] = {};
            searchEngines[id]['index'] = i;
        }
        else if (input !== null && input.nodeName === 'INPUT' && input.getAttribute('type') === 'checkbox' && id.startsWith("chatgpt-")) {
            const aiProvider = lineItems[i].querySelector('select');
            const label = aiProvider.nextSibling;
            const keyword = label.nextSibling;
            const keyboardShortcut = keyword.nextSibling;
            const multiTab = keyboardShortcut.nextSibling;
            const prompt = multiTab.nextSibling;
            if (logToConsole) console.log(aiProvider);
            if (logToConsole) console.log(label);
            if (logToConsole) console.log(keyword);
            if (logToConsole) console.log(keyboardShortcut);
            if (logToConsole) console.log(multiTab);
            if (logToConsole) console.log(prompt);
            searchEngines[id] = {};
            searchEngines[id]['index'] = i;
            searchEngines[id]['aiProvider'] = aiProvider.value;
            searchEngines[id]['name'] = label.value;
            searchEngines[id]['keyword'] = keyword.value;
            searchEngines[id]['keyboardShortcut'] = keyboardShortcut.value;
            searchEngines[id]['multitab'] = multiTab.checked;
            searchEngines[id]['prompt'] = prompt.value;
            searchEngines[id]['show'] = input.checked;
            searchEngines[id]['imageFormat'] = oldSearchEngines[id].imageFormat;
            searchEngines[id]['base64'] = oldSearchEngines[id].base64;
        }
        // Add search engine
        else if (input !== null && input.nodeName === 'INPUT' && input.getAttribute('type') === 'checkbox') {
            const label = input.nextSibling.nextSibling;
            const keyword = label.nextSibling;
            const keyboardShortcut = keyword.nextSibling;
            const multiTab = keyboardShortcut.nextSibling;
            const url = multiTab.nextSibling;
            searchEngines[id] = {};
            searchEngines[id]['index'] = i;
            searchEngines[id]['name'] = label.value;
            searchEngines[id]['keyword'] = keyword.value;
            searchEngines[id]['keyboardShortcut'] = keyboardShortcut.value;
            searchEngines[id]['multitab'] = multiTab.checked;
            searchEngines[id]['url'] = url.value;
            searchEngines[id]['show'] = input.checked;
            searchEngines[id]['imageFormat'] = oldSearchEngines[id].imageFormat;
            searchEngines[id]['base64'] = oldSearchEngines[id].base64;
        }
        // Add folder
        else if (lineItems[i].classList.contains('folder')) {
            let folder = {
                index: i,
                name: id,
                keyword: lineItems[i].querySelector('input.keyword').value,
                folder: true,
                searchEngines: []
            }

            // Add search engines to folder
            lineItems[i].querySelectorAll('li').forEach(item => {
                folder.searchEngines.push({
                    index: i,
                    name: item.id,
                    keyword: item.querySelector('input.keyword').value,
                    multitab: item.querySelector('input[id$="-mt"]'),
                    url: item.querySelector('input[type="url"]').value,
                    show: item.firstChild.checked,
                    // TODO - not working; get base64
                    // base64: oldSearchEngines[lineItems[i].id].base64
                });
            })

            searchEngines[id] = folder
        }
    }
    return searchEngines;
}

// Save the list of search engines to be displayed in the context menu
function saveSearchEngines() {
    if (logToConsole) console.log('Search Engines BEFORE SAVE:\n', searchEngines);
    searchEngines = readData();
    if (logToConsole) console.log('Search Engines AFTER SAVE:\n', searchEngines);
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
    let id = "separator-" + Math.floor(Math.random() * 1000000000000);

    // Ensure new is unique
    while (!isIdUnique(id)) {
        id = "chatgpt-" + Math.floor(Math.random() * 1000000000000);
    }

    searchEngines[id] = {
        index: numberOfSearchEngines + 1
    };
    const divSearchEngines = document.getElementById('searchEngines');
    const lineItem = createLineItem(id, searchEngines[id], false);
    divSearchEngines.appendChild(lineItem);

    sendMessage('addNewSearchEngine', {
        id: id,
        searchEngine: searchEngines[id]
    });
}

function addSearchEngine() {
    const id = sename.value.replace(' ', '-').toLowerCase();
    const divSearchEngines = document.getElementById('searchEngines');
    let strUrl = url.value;
    let testUrl = '';

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
        index: numberOfSearchEngines + 1,
        name: sename.value,
        keyword: keyword.value,
        keyboardShortcut: kbsc.value,
        multitab: multitab.checked,
        url: url.value,
        show: show.checked,
        // parentFolder: null
    };

    if (logToConsole) console.log('New search engine: ' + id + '\n' + JSON.stringify(searchEngines[id]));

    const lineItem = createLineItem(id, searchEngines[id], false);
    divSearchEngines.appendChild(lineItem);

    sendMessage('addNewSearchEngine', {
        id: id,
        searchEngine: searchEngines[id]
    });

    // Clear HTML input fields to add a new search engine
    clearAddSearchEngine();
}

function addChatGPTPrompt() {
    let id = "chatgpt-" + Math.floor(Math.random() * 1000000000000);
    const divSearchEngines = document.getElementById('searchEngines');

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
        index: numberOfSearchEngines + 1,
        aiProvider: aiProvider.value,
        name: promptName.value,
        keyword: promptKeyword.value,
        keyboardShortcut: promptKbsc.value,
        multitab: promptMultitab.checked,
        prompt: promptText.value,
        show: promptShow.checked
    };

    const lineItem = createLineItem(id, searchEngines[id], false);
    divSearchEngines.appendChild(lineItem);

    sendMessage('addNewPrompt', {
        id: id,
        searchEngine: searchEngines[id]
    });

    // Clear HTML input fields to add a new prompt
    clearAddChatGPTPrompt();
}

/* function addFolder() {
    const divSearchEngines = document.getElementById('searchEngines');
    const name = folderName.value;
    const keyword = folderKeyword.value;
    const id = name.replace(' ', '-').toLowerCase();

    // Append folder to search engine list
    const folderItem = createFolderItem(name, keyword);
    divSearchEngines.appendChild(folderItem);

    // The new folder will be saved as a search engine entry
    // Folders don't possess all the properties that search engines do
    // A folder doesn't have a query string url property
    // A folder may have children; not a search engine
    searchEngines[id] = {
        index: numberOfSearchEngines,
        name: name,
        keyword: keyword,
        parentFolder: null, // Points to the id of the parent folder; takes the value null if there is none
        children: [] // Array of search engine and/or subfolder ids
    };

    // Clear HTML input fields to add a new folder
    clearAddFolder();

    sendMessage('addNewSearchEngine', {
        id: id,
        searchEngine: searchEngines[id]
    });
} */

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

/* function clearAddFolder() {
    // Clear text box entries of the line used to add a new folder
    folderName.value = null;
    folderKeyword.value = null;
} */

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
            active.style.visibility = 'visible';
            position.style.visibility = 'visible';
            privacy.style.visibility = 'hidden';
            break;
        case 'sameTab':
            sameTab.checked = true;
            active.style.visibility = 'hidden';
            position.style.visibility = 'hidden';
            privacy.style.visibility = 'hidden';
            break;
        case 'openNewWindow':
            openNewWindow.checked = true;
            active.style.visibility = 'visible';
            position.style.visibility = 'hidden';
            privacy.style.visibility = 'visible';
            break;
        case 'openSidebar':
            openSidebar.checked = true;
            active.style.visibility = 'hidden';
            position.style.visibility = 'hidden';
            privacy.style.visibility = 'hidden';
            break;
        default:
            openNewTab.checked = true;
            active.style.visibility = 'visible';
            position.style.visibility = 'visible';
            privacy.style.visibility = 'hidden';
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
        // Default setting is to fetch favicons for context menu list
        displayFavicons.checked = true;
    }

    quickIconGrid.checked = options.quickIconGrid;
    closeGridOnMouseOut.checked = options.closeGridOnMouseOut;
    disableAltClick.checked = options.disableAltClick;

    if (options.resetPreferences === false) {
        resetPreferences.checked = false;
    } else {
        // Default setting is to cache favicons in storage sync
        resetPreferences.checked = true;
    }

    if (options.forceSearchEnginesReload === false) {
        forceSearchEnginesReload.checked = false;
    } else {
        // Default setting is to cache favicons in storage sync
        forceSearchEnginesReload.checked = true;
    }

    if (options.forceFaviconsReload === false) {
        forceFaviconsReload.checked = false;
    } else {
        // Default setting is to cache favicons in storage sync
        forceFaviconsReload.checked = true;
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
        const data = await browser.storage.sync.get(null);
        const options = data.options;

        searchEngines = await browser.storage.local.get(null);
        if (logToConsole) {
            console.log('Search engines retrieved from local storage:\n');
            console.log(searchEngines);
        }
        if (!isEmpty(options)) setOptions(options);
        if (logToConsole) {
            console.log(options);
            console.log('Options have been reset.');
        }
        displaySearchEngines();
    } catch (err) {
        if (logToConsole) console.error(err);
    }
}

function saveToLocalDisk() {
    saveSearchEngines();
    let fileToDownload = new Blob([JSON.stringify(searchEngines, null, 2)], {
        type: 'text/json',
        name: 'searchEngines.json'
    });

    sendMessage('saveSearchEnginesToDisk', window.URL.createObjectURL(fileToDownload));
}

function handleFileUpload() {
    browser.storage.local.clear().then(() => {
        let upload = document.getElementById('upload');
        let jsonFile = upload.files[0];
        let reader = new FileReader();
        reader.onload = function (event) {
            searchEngines = JSON.parse(event.target.result);
            displaySearchEngines();
            saveSearchEngines();
        };
        reader.readAsText(jsonFile);
    }, onError);
}

function updateSearchOptions() {
    let em = exactMatch.checked;
    sendMessage('updateSearchOptions', { exactMatch: em });
}

function updateTabMode() {
    if (sameTab.checked || openSidebar.checked) {
        active.style.visibility = 'hidden';
        position.style.visibility = 'hidden';
        privacy.style.visibility = 'hidden';
    } else {
        active.style.visibility = 'visible';
        if (openNewWindow.checked) {
            position.style.visibility = 'hidden';
            privacy.style.visibility = 'visible';
        } else {
            position.style.visibility = 'visible';
            privacy.style.visibility = 'hidden';
        }
    }

    let data = {};
    data['tabMode'] = document.querySelector('input[name="results"]:checked').value;
    data['tabActive'] = tabActive.checked;
    data['lastTab'] = lastTab.checked;
    data['privateMode'] = privateMode.checked;
    sendMessage('updateTabMode', data);
}

function updateMultiMode() {
    let data = {};
    data['multiMode'] = document.querySelector('input[name="ms_results"]:checked').value;
    sendMessage('updateMultiMode', data);
}

// Check if the favicons should be displayed in the context menu
function updateDisplayFavicons() {
    let fav = displayFavicons.checked;
    sendMessage('updateDisplayFavicons', { displayFavicons: fav });
}

function updateQuickIconGrid() {
    sendMessage('updateQuickIconGrid', { quickIconGrid: quickIconGrid.checked });
}

function updateCloseGridOnMouseOut() {
    sendMessage('updateCloseGridOnMouseOut', { closeGridOnMouseOut: closeGridOnMouseOut.checked });
}

function updateDisableAltClick() {
    sendMessage('updateDisableAltClick', { disableAltClick: disableAltClick.checked });
}

function updateOptionsMenuLocation() {
    let omat = optionsMenuLocation.value;
    sendMessage('updateOptionsMenuLocation', { optionsMenuLocation: omat });
}

function updateSiteSearchSetting() {
    sendMessage('updateSiteSearchSetting', {
        siteSearch: searchEngineSiteSearch.value,
        siteSearchUrl: searchEngineSiteSearch.selectedOptions[0].dataset.url
    });
}

function updateResetOptions() {
    let resetOptions = {
        forceSearchEnginesReload: forceSearchEnginesReload.checked,
        resetPreferences: resetPreferences.checked,
        forceFaviconsReload: forceFaviconsReload.checked
    };
    sendMessage('updateResetOptions', { resetOptions: resetOptions });
}

// Ensure the ID generated is unique
async function isIdUnique(testId) {
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

function init() {
    restoreOptionsPage();
    checkForDownloadsPermission();
    i18n();
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

    for (let i in i18nElements) {
        try {
            if (i18nElements[i].getAttribute == null) continue;
            let i18n_attrib = i18nElements[i].getAttribute(attribute);
            let message = browser.i18n.getMessage(i18n_attrib);
            switch (type) {
                case 'textContent':
                    i18nElements[i].textContent = message;
                    break;
                case 'placeholder':
                    i18nElements[i].placeholder = message;
                    break;
                case 'title':
                    i18nElements[i].title = message;
                    break;
                default:
                    break;
            }
        } catch (ex) {
            if (logToConsole) console.error(`Translation for ${i18nElements[i]} could not be found`);
        }
    }
}

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

function isKeyAllowed(event) {
    const disallowedKeys = [
        'Tab', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Escape', ' ', 'Delete', 'Backspace', 'Home', 'End',
        'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
    ];

    return !disallowedKeys.includes(event.key);
}

init();
