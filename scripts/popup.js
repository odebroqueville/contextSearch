/// Import browser polyfill for compatibility with Chrome and other browsers
import '/libs/browser-polyfill.min.js';

// Import constants to use STORAGE_KEYS
import { STORAGE_KEYS } from './constants.js';

// Make the listener async to use await
document.addEventListener('DOMContentLoaded', async () => {
    const aiEngines = ['chatgpt', 'gemini', 'grok', 'perplexity', 'poe', 'claude', 'you', 'andi'];
    const inputArea = document.getElementById('inputArea');
    const outputArea = document.getElementById('outputArea');
    let tagStyled = false;

    // --- Load logToConsole from storage ---
    let logToConsole = false; // Default value
    try {
        // Fetch using the correct key directly
        const data = await browser.storage.local.get(STORAGE_KEYS.LOG_TO_CONSOLE);
        // Check if the key exists and is a boolean
        if (typeof data[STORAGE_KEYS.LOG_TO_CONSOLE] === 'boolean') {
            logToConsole = data[STORAGE_KEYS.LOG_TO_CONSOLE];
        }
    } catch (error) {
        console.error("Error loading logToConsole setting from storage:", error);
        // Keep the default value if loading fails
    }
    // --------------------------------------

    // Focus the textarea when the popup opens
    inputArea.focus();

    inputArea.addEventListener('keyup', (event) => {
        if (event.key === ' ') {
            const words = inputArea.value.trim().split(/\s+/);
            const firstWord = words[0].toLowerCase();

            if (aiEngines.includes(firstWord) && !tagStyled) {
                styleAsTag(firstWord);
            }
        } else if (event.key === 'Backspace' && tagStyled && inputArea.selectionStart === 0) {
            event.preventDefault();
            unstyleTag();
        } else if (event.key === 'Enter') {
            event.preventDefault();
            executeAISearch();
        } else if (event.key === 'Escape') {
            window.close();
        }
    });

    function styleAsTag(firstWord) {
        const buttonSpan = document.createElement('span');
        buttonSpan.className = 'button';
        buttonSpan.textContent = firstWord;
        outputArea.appendChild(buttonSpan);
        inputArea.value = inputArea.value.replace(firstWord, '').trim();
        inputArea.focus();
        tagStyled = true;
    }

    function getAIEngine() {
        const outputHTML = outputArea.innerHTML.trim();
        return outputHTML.replace(/<span class="button">/g, '').replace(/<\/span>/g, '');
    }

    function unstyleTag() {
        const aiEngine = getAIEngine();
        if (aiEngines.includes(aiEngine)) {
            outputArea.innerHTML = '';
        }
        inputArea.value = aiEngine + inputArea.value.trim();
        tagStyled = false;
    }

    async function executeAISearch() {
        const aiEngine = getAIEngine();
        const prompt = inputArea.value.trim();
        if (tagStyled && aiEngine && prompt) {
            // Prepare the message data
            const messagePayload = {
                action: 'executeAISearch',
                data: { aiEngine, prompt }
            };

            try {
                // 1. Send the message and wait for acknowledgment
                await browser.runtime.sendMessage(messagePayload);

                // 2. Close the window *after* the message has been acknowledged
                window.close();

            } catch (error) {
                // Use logToConsole value loaded from storage
                if (logToConsole) console.error(`Error sending/handling executeAISearch message: ${error.message}`);
                // Optionally, inform the user via an alert or keep the popup open
                // alert(`Error: ${error.message}`); 
            }
        }
    }
});
