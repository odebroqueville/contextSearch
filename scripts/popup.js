/// Import browser polyfill for compatibility with Chrome and other browsers
import '/libs/browser-polyfill.min.js';

/* global DEBUG_VALUE */

// Make the listener async to use await
document.addEventListener('DOMContentLoaded', async () => {
    const aiEngines = ['chatgpt', 'gemini', 'grok', 'perplexity', 'poe', 'claude', 'andi'];
    const inputArea = document.getElementById('inputArea');
    const outputArea = document.getElementById('outputArea');
    let tagStyled = false;

    const logToConsole = DEBUG_VALUE; // Debug (from environment)

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
        const tabIndex = new URLSearchParams(window.location.search).get('tabIndex') || 0; // Get tabIndex from URL or default to 0
        if (tagStyled && aiEngine && prompt) {
            // Prepare the message data
            const messagePayload = {
                action: 'executeAISearch',
                data: { aiEngine, prompt, tabIndex }
            };

            try {
                // 1. Send the message and wait for acknowledgment
                await browser.runtime.sendMessage(messagePayload);

                // 2. Close the window *after* the message has been acknowledged
                window.close();

            } catch (error) {
                if (logToConsole) console.error(`Error sending/handling executeAISearch message: ${error.message}`);
                // Optionally, inform the user via an alert or keep the popup open
                // alert(`Error: ${error.message}`); 
            }
        }
    }
});
