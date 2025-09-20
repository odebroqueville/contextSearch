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
            executeCommand();
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

    function isReservedKeyword(word) {
        return ['.', '!', '!h', 'history', '!b', 'bookmarks'].includes(word);
    }

    async function executeCommand() {
        const raw = inputArea.value.trim();
        if (!raw) return;
        const firstWord = raw.split(/\s+/)[0].toLowerCase();

        // If user started with an AI engine tag styled previously
        if (tagStyled && aiEngines.includes(getAIEngine())) {
            const aiEngine = getAIEngine();
            const prompt = raw;
            const tabIndex = new URLSearchParams(window.location.search).get('tabIndex') || 0;
            const messagePayload = { action: 'executeAISearch', data: { aiEngine, prompt, tabIndex } };
            try {
                await browser.runtime.sendMessage(messagePayload);
                window.close();
            } catch (error) {
                if (logToConsole) console.error(`Error sending/handling executeAISearch message: ${error.message}`);
            }
            return;
        }

        // If first word is an AI engine but not styled (user hit enter too fast), still treat as AI
        if (aiEngines.includes(firstWord) && raw.split(/\s+/).length > 1) {
            const aiEngine = firstWord;
            const prompt = raw.split(/\s+/).slice(1).join(' ');
            const tabIndex = new URLSearchParams(window.location.search).get('tabIndex') || 0;
            const messagePayload = { action: 'executeAISearch', data: { aiEngine, prompt, tabIndex } };
            try {
                await browser.runtime.sendMessage(messagePayload);
                window.close();
            } catch (error) {
                if (logToConsole) console.error(`Error sending/handling executeAISearch message: ${error.message}`);
            }
            return;
        }

        // Otherwise treat as omnibox-style command (no need for leading 'cs ')
        if (isReservedKeyword(firstWord) || raw.includes(' ')) {
            try {
                await browser.runtime.sendMessage({ action: 'executeCommandLine', data: { input: raw } });
                window.close();
            } catch (error) {
                if (logToConsole) console.error(`Error sending executeCommandLine message: ${error.message}`);
            }
        }
    }
});
