/// Import browser polyfill for compatibility with Chrome and other browsers
import '/libs/browser-polyfill.min.js';

/// Import constants to use STORAGE_KEYS
import { STORAGE_KEYS } from './constants.js';

/* global DEBUG_VALUE */
const logToConsole = typeof DEBUG_VALUE !== 'undefined' ? DEBUG_VALUE : false;

document.addEventListener('DOMContentLoaded', async () => {
    // Focus on the No button by default to prevent accidental removal of a bookmark
    document.getElementById('noBtn').focus();

    // Retrieve the parent tab's url from the URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const url = urlParams.get('url');

    // Get the buttons
    const yesBtn = document.getElementById('yesBtn');
    const noBtn = document.getElementById('noBtn');

    // Get stored search engines
    const searchEngines = await getStoredData(STORAGE_KEYS.SEARCH_ENGINES);

    // Handle Yes button click
    yesBtn.onclick = async () => {
        for (const id in searchEngines) {
            if (id.startsWith('link-') && searchEngines[id].url && searchEngines[id].url === url) {
                delete searchEngines[id];
                await sendMessage('saveSearchEngines', searchEngines);
                window.close();
                break;
            }
        }
        // If no matching bookmark found, display a warning message for 4 seconds
        const warning = document.getElementById('warning');
        setTimeout(() => {
            warning.style.color = 'red';
            warning.style.weight = 'bold';
            warning.textContent = 'The bookmark could not be found in Context Search';
        }, 4000);
        warning.textContent = '';
        window.close();
    };

    // Handle No button click
    noBtn.onclick = () => {
        window.close();
    };
});

// Send a message to the background script
async function sendMessage(action, data) {
    await browser.runtime.sendMessage({ action: action, data: JSON.parse(JSON.stringify(data)) }).catch((e) => {
        if (logToConsole) console.error(e);
    });
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
