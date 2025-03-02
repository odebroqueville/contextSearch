/// Import browser polyfill for compatibility with Chrome and other browsers
import '/libs/browser-polyfill.min.js';

document.addEventListener('DOMContentLoaded', () => {
    const aiEngines = ['chatgpt', 'google', 'perplexity', 'poe', 'claude', 'you', 'andi'];
    const inputArea = document.getElementById('inputArea');
    const outputArea = document.getElementById('outputArea');
    let tagStyled = false;

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

    function executeAISearch() {
        const aiEngine = getAIEngine();
        const prompt = inputArea.value.trim();
        if (tagStyled && aiEngine && prompt) {
            browser.runtime.sendMessage({
                action: 'executeAISearch',
                data: { aiEngine, prompt }
            });
            outputArea.innerHTML = '';
            inputArea.value = '';
            tagStyled = false;
            window.close();
        }
    }
});
