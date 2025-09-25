/// Import browser polyfill for compatibility with Chrome and other browsers
import '/libs/browser-polyfill.min.js';

/* global DEBUG_VALUE */

// Make the listener async to use await
document.addEventListener('DOMContentLoaded', async () => {
    const aiEngines = ['chatgpt', 'gemini', 'grok', 'perplexity', 'poe', 'claude', 'andi'];
    const inputArea = document.getElementById('inputArea');
    const outputArea = document.getElementById('outputArea');
    const tagsContainer = document.getElementById('tags');
    const promptsContainer = document.getElementById('prompts');
    const searchInput = document.getElementById('promptcat-search');
    let tagStyled = false;

    // Catalog state (from PromptCatDB)
    const catalogState = {
        loaded: false,
        prompts: [], // [{ id, title, body, tags, folderId, isLocked }]
        tags: [], // [string]
        activeTag: null, // null => all
        query: '',
    };

    // Minimal IndexedDB access to read PromptCat data without loading promptcat.js UI
    const PromptCatDB = (() => {
        let db = null;
        function open() {
            return new Promise((resolve) => {
                // Open existing DB without specifying version to avoid unintended upgrades
                const req = indexedDB.open('PromptCatDB');
                req.onerror = () => resolve(null); // Resolve null on error; we'll just have empty data
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

    // Minimal CryptoService (decrypt only) copied from promptcat.js for locked prompts
    const CryptoService = {
        encoder: new TextEncoder(),
        decoder: new TextDecoder(),
        _base64ToArrayBuffer(base64) {
            try {
                const binary_string = window.atob(base64);
                const len = binary_string.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) bytes[i] = binary_string.charCodeAt(i);
                return bytes.buffer;
            } catch (_) {
                return null;
            }
        },
        async _deriveKey(password, salt) {
            const keyMaterial = await window.crypto.subtle.importKey('raw', this.encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
            return window.crypto.subtle.deriveKey(
                { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                false,
                ['decrypt']
            );
        },
        async decrypt(encryptedData, password) {
            if (typeof encryptedData !== 'object' || !encryptedData?.ct || !password) return null;
            try {
                const salt = this._base64ToArrayBuffer(encryptedData.salt);
                const iv = this._base64ToArrayBuffer(encryptedData.iv);
                if (!salt || !iv) return null;
                const key = await this._deriveKey(password, salt);
                const decryptedContent = await window.crypto.subtle.decrypt(
                    { name: 'AES-GCM', iv: iv },
                    key,
                    this._base64ToArrayBuffer(encryptedData.ct)
                );
                return this.decoder.decode(decryptedContent);
            } catch (e) {
                return null;
            }
        },
    };

    function isEncryptedBody(body) {
        return body && typeof body === 'object' && Object.prototype.hasOwnProperty.call(body, 'ct');
    }

    async function loadPromptCatalogOnce() {
        if (catalogState.loaded) return;
        const db = await PromptCatDB.open();
        if (!db) {
            catalogState.loaded = true;
            return;
        }
        const [prompts, tags] = await Promise.all([PromptCatDB.getAll('prompts'), PromptCatDB.getAll('globalTags')]);
        catalogState.prompts = Array.isArray(prompts) ? prompts : [];
        catalogState.tags = Array.isArray(tags) ? tags.map((t) => t.id ?? t).filter(Boolean) : [];
        catalogState.loaded = true;
        renderTagsPills();
        renderPromptButtons();
    }

    function clearContainer(el) {
        while (el.firstChild) el.removeChild(el.firstChild);
    }

    function renderTagsPills() {
        clearContainer(tagsContainer);
        // Build a unique tag set from prompts and global tags
        const allTags = new Set(catalogState.tags);
        catalogState.prompts.forEach((p) => (p.tags || []).forEach((t) => allTags.add(t)));
        const sorted = Array.from(allTags).sort((a, b) => String(a).localeCompare(String(b)));

        // No selection initially; clicking a pill toggles selection
        sorted.forEach((tag) => {
            const pill = document.createElement('button');
            pill.type = 'button';
            pill.className = 'tag-pill';
            pill.textContent = tag;
            pill.dataset.tag = tag;
            if (catalogState.activeTag === tag) pill.classList.add('active');
            pill.addEventListener('click', (e) => {
                e.stopPropagation();
                // Toggle behavior
                if (catalogState.activeTag === tag) catalogState.activeTag = null;
                else catalogState.activeTag = tag;
                // Re-render pills to reflect active state and update prompts list
                renderTagsPills();
                renderPromptButtons();
            });
            tagsContainer.appendChild(pill);
        });
        // Add a click-catcher that fills the remaining space on the last line to ensure
        // clicks to the right of the last tag clear selection reliably.
        const catcher = document.createElement('div');
        catcher.className = 'tags-click-catcher';
        catcher.addEventListener('click', (e) => {
            e.stopPropagation();
            if (catalogState.activeTag !== null) {
                catalogState.activeTag = null;
                renderTagsPills();
                renderPromptButtons();
            }
        });
        // Ensure catcher is after the last pill so it fills remaining line space
        tagsContainer.appendChild(catcher);
    }

    function renderPromptButtons() {
        clearContainer(promptsContainer);
        const list = document.createElement('div');
        list.className = 'prompt-button-list';
        let filtered = catalogState.activeTag
            ? catalogState.prompts.filter((p) => (p.tags || []).includes(catalogState.activeTag))
            : catalogState.prompts;
        const q = (catalogState.query || '').trim().toLowerCase();
        if (q) filtered = filtered.filter((p) => String(p.title || '').toLowerCase().includes(q));
        // Simple sort by title for consistency
        filtered
            .slice()
            .sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')))
            .forEach((p) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'prompt-title-btn';
                btn.textContent = p.title || 'Untitled Prompt';
                btn.dataset.promptId = String(p.id);
                btn.addEventListener('click', async () => {
                    let bodyText = '';
                    if (isEncryptedBody(p.body)) {
                        const pwd = window.prompt('This prompt is locked. Enter password to insert it:');
                        if (!pwd) return;
                        const decrypted = await CryptoService.decrypt(p.body, pwd);
                        if (!decrypted) {
                            window.alert('Incorrect password.');
                            return;
                        }
                        bodyText = decrypted;
                    } else {
                        bodyText = typeof p.body === 'string' ? p.body : '';
                    }
                    // Place the prompt immediately after the AI engine.
                    // If the engine is styled (tagStyled), inputArea holds only the text after the engine.
                    // If not styled but the first word is an engine, keep that first word and replace the rest.
                    if (tagStyled) {
                        inputArea.value = bodyText;
                    } else {
                        const raw = inputArea.value.trim();
                        const parts = raw.split(/\s+/);
                        const first = parts[0]?.toLowerCase() || '';
                        if (aiEngines.includes(first)) {
                            inputArea.value = first + (bodyText ? ' ' + bodyText : '');
                        } else {
                            // Fallback, just set the body
                            inputArea.value = bodyText;
                        }
                    }
                    inputArea.focus();
                    // Move cursor to end
                    inputArea.selectionStart = inputArea.selectionEnd = inputArea.value.length;
                });
                list.appendChild(btn);
            });
        promptsContainer.appendChild(list);
    }

    function showCatalogUI(visible) {
        tagsContainer.style.display = visible ? 'flex' : 'none';
        promptsContainer.style.display = visible ? 'block' : 'none';
        if (searchInput) searchInput.style.display = visible ? 'block' : 'none';
        if (visible) {
            void loadPromptCatalogOnce();
        }
    }

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

    // Toggle catalog visibility when first word matches an AI engine, even if not styled yet
    inputArea.addEventListener('input', () => {
        if (tagStyled) return; // already visible via styled tag (created on space)
        const raw = inputArea.value; // do not trim, we need to detect the presence of a space
        const trimmed = raw.trim();
        const first = trimmed.split(/\s+/)[0]?.toLowerCase() || '';
        const hasEngine = aiEngines.includes(first);
        // Show only if the engine is followed by at least one space at the start
        const show = hasEngine && new RegExp(`^\\s*${first}\\s`).test(raw);
        showCatalogUI(show);
    });

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            catalogState.query = searchInput.value || '';
            renderPromptButtons();
        });
    }

    // Clicking on the tags container (but not a specific tag) clears selection
    tagsContainer.addEventListener('click', (e) => {
        const pill = e.target.closest('.tag-pill');
        if (pill) return; // handled on pill itself
        if (catalogState.activeTag !== null) {
            catalogState.activeTag = null;
            renderTagsPills();
            renderPromptButtons();
        }
    });

    function styleAsTag(firstWord) {
        const buttonSpan = document.createElement('span');
        buttonSpan.className = 'chatbot';
        buttonSpan.textContent = firstWord;
        outputArea.appendChild(buttonSpan);
        inputArea.value = inputArea.value.replace(firstWord, '').trim();
        inputArea.focus();
        tagStyled = true;
        showCatalogUI(true);
    }

    function getAIEngine() {
        // Extract the first tag-like span we inserted
        const btn = outputArea.querySelector('span.chatbot');
        return btn ? btn.textContent.trim() : '';
    }

    function unstyleTag() {
        const aiEngine = getAIEngine();
        if (aiEngines.includes(aiEngine)) {
            // Clear without innerHTML
            outputArea.textContent = '';
        }
        inputArea.value = aiEngine + inputArea.value.trim();
        tagStyled = false;
        showCatalogUI(false);
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
