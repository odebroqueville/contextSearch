document.addEventListener('DOMContentLoaded', () => {
    const CryptoService = {
        encoder: new TextEncoder(),
        decoder: new TextDecoder(),

        _base64ToArrayBuffer(base64) {
            const binary_string = window.atob(base64);
            const len = binary_string.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binary_string.charCodeAt(i);
            }
            return bytes.buffer;
        },

        _arrayBufferToBase64(buffer) {
            let binary = '';
            const bytes = new Uint8Array(buffer);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return window.btoa(binary);
        },

        async _deriveKey(password, salt) {
            const keyMaterial = await window.crypto.subtle.importKey('raw', this.encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
            return window.crypto.subtle.deriveKey(
                { name: 'PBKDF2', salt: salt, iterations: 100000, hash: 'SHA-256' },
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );
        },

        async encrypt(text, password) {
            if (!text || !password) return text;
            try {
                const salt = window.crypto.getRandomValues(new Uint8Array(16));
                const iv = window.crypto.getRandomValues(new Uint8Array(12));
                const key = await this._deriveKey(password, salt);

                const encryptedContent = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, this.encoder.encode(text));

                return {
                    ct: this._arrayBufferToBase64(encryptedContent),
                    iv: this._arrayBufferToBase64(iv),
                    salt: this._arrayBufferToBase64(salt),
                };
            } catch (e) {
                console.error('Encryption failed', e);
                return text; // fallback
            }
        },

        async decrypt(encryptedData, password) {
            if (typeof encryptedData !== 'object' || !encryptedData.ct || !password) return encryptedData;
            try {
                const salt = this._base64ToArrayBuffer(encryptedData.salt);
                const iv = this._base64ToArrayBuffer(encryptedData.iv);
                const key = await this._deriveKey(password, salt);

                const decryptedContent = await window.crypto.subtle.decrypt(
                    { name: 'AES-GCM', iv: iv },
                    key,
                    this._base64ToArrayBuffer(encryptedData.ct)
                );

                return this.decoder.decode(decryptedContent);
            } catch (e) {
                console.error('Decryption failed', e);
                return null; // Return null on failure (e.g., wrong password)
            }
        },
    };

    const DB = (function () {
        const DB_NAME = 'PromptCatDB';
        const DB_VERSION = 2;
        let db;

        const STORES = {
            PROMPTS: 'prompts',
            FOLDERS: 'folders',
            TAGS: 'globalTags',
            SETTINGS: 'settings',
        };

        function open() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(DB_NAME, DB_VERSION);
                request.onerror = () => reject('Error opening database');
                request.onsuccess = (event) => {
                    db = event.target.result;
                    resolve(db);
                };
                request.onupgradeneeded = (event) => {
                    db = event.target.result;
                    if (!db.objectStoreNames.contains(STORES.PROMPTS)) {
                        db.createObjectStore(STORES.PROMPTS, { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains(STORES.FOLDERS)) {
                        db.createObjectStore(STORES.FOLDERS, { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains(STORES.TAGS)) {
                        db.createObjectStore(STORES.TAGS, { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
                    }
                };
            });
        }

        function get(storeName, key) {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(key);
                request.onsuccess = (event) => resolve(event.target.result);
                request.onerror = () => reject(`Error getting item ${key} from ${storeName}`);
            });
        }

        function getAll(storeName) {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();
                request.onsuccess = (event) => resolve(event.target.result);
                request.onerror = () => reject(`Error getting all from ${storeName}`);
            });
        }

        function put(storeName, item) {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.put(item);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(`Error putting item in ${storeName}`);
            });
        }

        function bulkPut(storeName, items) {
            return new Promise((resolve, reject) => {
                if (items.length === 0) return resolve();
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                items.forEach((item) => store.put(item));
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(`Error bulk putting items in ${storeName}`);
            });
        }

        function remove(storeName, key) {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(key);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(`Error deleting item ${key} from ${storeName}`);
            });
        }

        function bulkRemove(storeName, keys) {
            return new Promise((resolve, reject) => {
                if (keys.length === 0) return resolve();
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                keys.forEach((key) => store.delete(key));
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(`Error bulk deleting from ${storeName}`);
            });
        }

        function clear(storeName) {
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.clear();
                request.onsuccess = () => resolve();
                request.onerror = () => reject(`Error clearing store ${storeName}`);
            });
        }

        function getStorageUsage() {
            return new Promise((resolve, reject) => {
                if (!db) {
                    return resolve(0);
                }

                let totalSize = 0;
                const transaction = db.transaction(db.objectStoreNames, 'readonly');
                const stores = Array.from(db.objectStoreNames);

                stores.forEach((storeName) => {
                    const store = transaction.objectStore(storeName);
                    const request = store.getAll();

                    request.onsuccess = (event) => {
                        const items = event.target.result;
                        const size = new TextEncoder().encode(JSON.stringify(items)).length;
                        totalSize += size;
                    };
                });

                transaction.oncomplete = () => {
                    resolve(totalSize);
                };

                transaction.onerror = () => {
                    reject('Error calculating storage usage');
                };
            });
        }

        return {
            open,
            getAll,
            put,
            bulkPut,
            remove,
            bulkRemove,
            clear,
            getStorageUsage,
            get,
            STORES,
        };
    })();

    const UI = {
        app: document.getElementById('app'),
        sidebar: document.getElementById('sidebar'),
        sidebarOverlay: document.getElementById('sidebar-overlay'),
        mainContent: document.getElementById('main-content'),
        sidebarToggle: document.getElementById('sidebar-toggle'),
        mobileNewPromptFab: document.getElementById('mobile-new-prompt-fab'),
        promptList: document.getElementById('prompt-list'),
        promptListContainer: document.getElementById('prompt-list-container'),
        promptListControls: document.querySelector('.prompt-list-controls'),
        newPromptPlaceholder: document.getElementById('new-prompt-placeholder'),
        promptDetails: document.getElementById('prompt-details'),
        promptDetailsContainer: document.getElementById('prompt-details-container'),
        noPromptSelected: document.getElementById('no-prompt-selected'),
        promptTitle: document.getElementById('prompt-title'),
        promptBody: document.getElementById('prompt-body'),
        promptNotes: document.getElementById('prompt-notes'),
        promptFolder: document.getElementById('prompt-folder'),
        promptFolderContainer: document.getElementById('prompt-folder-container'),
        promptFolderValue: document.getElementById('prompt-folder-value'),
        promptFolderOptions: document.getElementById('prompt-folder-options'),
        promptLockSwitch: document.getElementById('prompt-lock-switch'),
        copyPromptBtn: document.getElementById('copy-prompt-btn'),
        expandPromptBtn: document.getElementById('expand-prompt-btn'),
        expandNotesBtn: document.getElementById('expand-notes-btn'),
        newPromptBtn: document.getElementById('new-prompt-btn'),
        savePromptBtn: document.getElementById('save-prompt'),
        deletePromptBtn: document.getElementById('delete-prompt'),
        search: document.getElementById('search'),
        primaryNavList: document.getElementById('primary-nav-list'),
        folderList: document.getElementById('folder-list'),
        newFolderContainer: document.getElementById('new-folder-container'),
        newFolderToggleBtn: document.getElementById('new-folder-toggle-btn'),
        newFolderName: document.getElementById('new-folder-name'),
        addFolderBtn: document.getElementById('add-folder-btn'),
        newTagContainer: document.getElementById('new-tag-container'),
        newTagToggleBtn: document.getElementById('new-tag-toggle-btn'),
        newTagName: document.getElementById('new-tag-name'),
        addTagBtn: document.getElementById('add-tag-btn'),
        tagsContainer: document.getElementById('tags-container'),
        tagsInput: document.getElementById('tags-input'),
        tagSuggestions: document.getElementById('tag-suggestions'),
        charCounter: document.getElementById('char-counter'),
        tagsList: document.getElementById('tags-list'),
        sortBy: document.getElementById('sort-by'),
        selectModeBtn: document.getElementById('select-mode-btn'),
        selectAllBtn: document.getElementById('select-all-btn'),
        bulkActionBar: document.getElementById('bulk-action-bar'),
        bulkMoveBtn: document.getElementById('bulk-move-btn'),
        bulkDeleteBtn: document.getElementById('bulk-delete-btn'),
        bulkExportBtn: document.getElementById('bulk-export-btn'),
        importFileInput: document.getElementById('import-file-input'),
        backToTopBtn: document.getElementById('back-to-top-btn'),
        mobileSearchBtn: document.getElementById('mobile-search-btn'),
        mobileSearchBar: document.getElementById('mobile-search-bar'),
        mobileSearchInput: document.getElementById('mobile-search-input'),
        closeSearchBtn: document.getElementById('close-search-btn'),
        moveModal: document.getElementById('move-modal'),
        moveCount: document.getElementById('move-count'),
        moveFolderSelect: document.getElementById('move-folder-select'),
        movePasswordContainer: document.getElementById('move-password-container'),
        movePasswordInput: document.getElementById('move-password-input'),
        deleteFolderModal: document.getElementById('delete-folder-modal'),
        resetDataModal: document.getElementById('reset-data-modal'),
        folderSettingsModal: document.getElementById('folder-settings-modal'),
        folderSettingsTitle: document.getElementById('folder-settings-title'),
        renameFolderInput: document.getElementById('rename-folder-input'),
        saveRenameBtn: document.getElementById('save-rename-btn'),
        toggleLockFolderBtn: document.getElementById('toggle-lock-folder-btn'),
        cancelFolderSettingsBtn: document.getElementById('cancel-folder-settings-btn'),
        deleteFolderFromSettingsBtn: document.getElementById('delete-folder-from-settings-btn'),
        exitConfirmationModal: document.getElementById('exit-confirmation-modal'),
        fullscreenPromptModal: document.getElementById('fullscreen-prompt-modal'),
        fullscreenPromptTitle: document.getElementById('fullscreen-prompt-title'),
        fullscreenPromptTextarea: document.getElementById('fullscreen-prompt-textarea'),
        closeFullscreenBtn: document.getElementById('close-fullscreen-btn'),
        saveAndCloseFullscreenBtn: document.getElementById('save-and-close-fullscreen-btn'),
        genericModal: document.getElementById('generic-modal'),
        settingsBtn: document.getElementById('settings-btn'),
        settingsModal: document.getElementById('settings-modal'),
        importBtnModal: document.getElementById('import-btn-modal'),
        exportBtnModal: document.getElementById('export-btn-modal'),
        resetDataBtnModal: document.getElementById('reset-data-btn-modal'),
        closeSettingsModalBtn: document.getElementById('close-settings-modal-btn'),
        manageTagsBtn: document.getElementById('manage-tags-btn'),
        manageTagsModal: document.getElementById('manage-tags-modal'),
        manageTagsList: document.getElementById('manage-tags-list'),
        closeManageTagsBtn: document.getElementById('close-manage-tags-btn'),
    };

    // ===== Helpers to avoid innerHTML =====
    const SVG_NS = 'http://www.w3.org/2000/svg';
    function svgEl(name, attrs = {}) {
        const el = document.createElementNS(SVG_NS, name);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
        return el;
    }
    function buildLockIcon() {
        const svg = svgEl('svg', { class: 'lock-icon' });
        const use = svgEl('use', { href: '#icon-lock' });
        svg.appendChild(use);
        return svg;
    }
    function buildGearIcon() {
        const svg = svgEl('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            width: '16',
            height: '16',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '2',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
        });
        const circle = svgEl('circle', { cx: '12', cy: '12', r: '3' });
        const path = svgEl('path', {
            d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82-.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',
        });
        svg.append(circle, path);
        return svg;
    }
    function buildCopyIcon() {
        const svg = svgEl('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '2',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            class: 'copy-icon',
        });
        const rect = svgEl('rect', { x: '9', y: '9', width: '13', height: '13', rx: '2', ry: '2' });
        const path = svgEl('path', { d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' });
        svg.append(rect, path);
        return svg;
    }
    function buildCheckIcon() {
        const svg = svgEl('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '2',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            class: 'check-icon',
        });
        const poly = svgEl('polyline', { points: '20 6 9 17 4 12' });
        svg.appendChild(poly);
        return svg;
    }
    function buildStarIcon() {
        const svg = svgEl('svg', {
            xmlns: 'http://www.w3.org/2000/svg',
            viewBox: '0 0 24 24',
            fill: 'currentColor',
        });
        const path = svgEl('path', { d: 'M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z' });
        svg.appendChild(path);
        return svg;
    }
    function highlightTextFragment(text, query) {
        const frag = document.createDocumentFragment();
        if (!query) {
            frag.appendChild(document.createTextNode(text || ''));
            return frag;
        }
        const re = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        let lastIndex = 0;
        let m;
        while ((m = re.exec(text)) !== null) {
            if (m.index > lastIndex) frag.appendChild(document.createTextNode(text.slice(lastIndex, m.index)));
            const mark = document.createElement('mark');
            mark.textContent = m[0];
            frag.appendChild(mark);
            lastIndex = m.index + m[0].length;
        }
        if (lastIndex < text.length) frag.appendChild(document.createTextNode(text.slice(lastIndex)));
        return frag;
    }
    function computeMatchSnippetData(text, query, maxLength = 70) {
        if (!text || !query) return null;
        const lines = text.split('\n');
        let bestLine = '';
        let index = -1;
        for (const line of lines) {
            const idx = line.toLowerCase().indexOf(query.toLowerCase());
            if (idx > -1) {
                bestLine = line;
                index = idx;
                break;
            }
        }
        if (index === -1) return null;
        const qLen = query.length;
        if (bestLine.length <= maxLength) {
            return { text: bestLine, ranges: [[index, index + qLen]], prefix: false, suffix: false };
        }
        const half = Math.floor((maxLength - qLen) / 2);
        let startIndex = index - half;
        let endIndex = index + qLen + half;
        let prefix = true;
        let suffix = true;
        if (startIndex <= 0) {
            startIndex = 0;
            prefix = false;
        }
        if (endIndex >= bestLine.length) {
            endIndex = bestLine.length;
            suffix = false;
        }
        const snippet = bestLine.substring(startIndex, endIndex);
        const rangeStart = index - startIndex;
        const rangeEnd = rangeStart + qLen;
        return { text: snippet, ranges: [[rangeStart, rangeEnd]], prefix, suffix };
    }
    function renderHighlightedSnippet(snippetData) {
        const frag = document.createDocumentFragment();
        if (!snippetData) return frag;
        if (snippetData.prefix) frag.appendChild(document.createTextNode('...'));
        const text = snippetData.text;
        const [start, end] = snippetData.ranges[0];
        if (start > 0) frag.appendChild(document.createTextNode(text.slice(0, start)));
        const mark = document.createElement('mark');
        mark.textContent = text.slice(start, end);
        frag.appendChild(mark);
        if (end < text.length) frag.appendChild(document.createTextNode(text.slice(end)));
        if (snippetData.suffix) frag.appendChild(document.createTextNode('...'));
        return frag;
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    async function updateStorageUsage() {
        try {
            const usage = await DB.getStorageUsage();
            const formattedUsage = formatBytes(usage);
            const button = UI.resetDataBtnModal;

            const textNode = Array.from(button.childNodes).find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.includes('Reset'));
            if (textNode) {
                textNode.textContent = ` Reset (${formattedUsage})`;
            }
        } catch (error) {
            console.error('Failed to update storage usage:', error);
        }
    }

    const ModalService = {
        show: (config) => {
            return new Promise((resolve) => {
                const modal = config.modalId ? document.getElementById(config.modalId) : UI.genericModal;
                if (!modal || modal.classList.contains('show')) return resolve(false);

                const modalTitle = modal.querySelector('.modal-title-js') || modal.querySelector('h3');
                const modalMessage = modal.querySelector('.modal-message-js') || modal.querySelector('p');
                const modalInput = modal.querySelector('.modal-input-js') || UI.genericModal.querySelector('input');
                const modalConfirmBtn = modal.querySelector('.modal-confirm-js');
                const modalCancelBtn = modal.querySelector('.modal-cancel-js');
                const errorEl = document.getElementById('generic-modal-error');
                const rememberContainer = document.getElementById('generic-modal-remember-container');
                const rememberCb = document.getElementById('generic-modal-remember-cb');

                if (config.title && modalTitle) modalTitle.textContent = config.title;
                // Do not use innerHTML in WebExtensions. Treat message as plain text.
                if (config.message && modalMessage) {
                    // If a Node is passed, render it; otherwise set textContent.
                    if (config.message instanceof Node) {
                        modalMessage.replaceChildren(config.message);
                    } else {
                        modalMessage.textContent = String(config.message);
                    }
                }

                // Reset fields
                errorEl.style.display = 'none';
                rememberContainer.style.display = 'none';
                modalInput.style.display = 'none';

                if (modalCancelBtn) modalCancelBtn.style.display = 'inline-flex';
                if (modalConfirmBtn) modalConfirmBtn.classList.remove('danger');
                if (config.type === 'alert' && modalCancelBtn) {
                    modalCancelBtn.style.display = 'none';
                }

                const needsValidation = config.type === 'password' && typeof config.validate === 'function';
                const hasInput = config.type === 'prompt' || config.type === 'password';

                if (hasInput) {
                    modalInput.style.display = 'block';
                    modalInput.value = config.defaultValue || '';
                    modalInput.placeholder = config.placeholder || '';
                    modalInput.type = config.type === 'password' ? 'password' : 'text';
                    setTimeout(() => modalInput.focus(), 50);
                }

                if (needsValidation) {
                    rememberContainer.style.display = 'block';
                    rememberCb.checked = false;
                }

                if (modalConfirmBtn) modalConfirmBtn.textContent = config.confirmBtnText || 'OK';
                if (modalCancelBtn) modalCancelBtn.textContent = config.cancelBtnText || 'Cancel';
                if (config.danger && modalConfirmBtn) modalConfirmBtn.classList.add('danger');

                showModal(modal);

                const onConfirm = async () => {
                    if (needsValidation) {
                        const password = modalInput.value;
                        if (!password) return;
                        const isValid = await config.validate(password);
                        if (isValid) {
                            const remember = rememberCb.checked;
                            cleanup();
                            resolve({ password, remember });
                        } else {
                            errorEl.textContent = 'Incorrect password, please try again.';
                            errorEl.style.display = 'block';
                            modalInput.focus();
                            modalInput.select();
                        }
                    } else if (hasInput) {
                        cleanup();
                        resolve(modalInput.value);
                    } else {
                        cleanup();
                        resolve(true);
                    }
                };
                const onCancel = () => {
                    cleanup();
                    resolve(hasInput ? null : false);
                };
                const onOverlayClick = (e) => {
                    if (e.target === modal) onCancel();
                };

                let cleanup = () => {
                    cleanup = () => {}; // Prevent double calls
                    hideModal(modal);
                    modalConfirmBtn.removeEventListener('click', onConfirm);
                    modalCancelBtn.removeEventListener('click', onCancel);
                    modal.removeEventListener('click', onOverlayClick);
                };

                modalConfirmBtn.addEventListener('click', onConfirm);
                modalCancelBtn.addEventListener('click', onCancel);
                modal.addEventListener('click', onOverlayClick);
            });
        },
        alert: (message, title = 'Alert') =>
            ModalService.show({
                type: 'alert',
                title,
                message,
                confirmBtnText: 'OK',
            }),
        confirm: (message, config = {}) => ModalService.show({ type: 'confirm', ...config, message }),
        prompt: (message, config = {}) => ModalService.show({ type: 'prompt', ...config, message }),
        password: (message, config = {}) =>
            ModalService.show({
                type: 'password',
                ...config,
                message,
                title: config.title || 'Password Required',
            }),
    };

    async function initResize() {
        const resizer = document.getElementById('resizer');
        const left = document.getElementById('prompt-list-container');

        if (window.innerWidth <= 768) {
            left.style.width = ''; // Reset width for mobile view
            resizer.style.display = 'none';
            return;
        }

        resizer.style.display = 'flex';

        const minWidth = 260; // Corresponds to min-width in CSS
        const defaultWidth = '42%'; // Corresponds to width in CSS (%)

        // Load saved width
        const savedWidth = await DB.get(DB.STORES.SETTINGS, 'panelWidth');
        if (savedWidth) {
            left.style.width = savedWidth.value;
        } else {
            left.style.width = defaultWidth;
        }

        if (resizeListenersAttached) return;

        const handleMouseMove = (e) => {
            const containerWidth = UI.mainContent.offsetWidth;
            let newLeftWidth = e.clientX - left.getBoundingClientRect().left;

            if (newLeftWidth < minWidth) newLeftWidth = minWidth;
            if (newLeftWidth > containerWidth - minWidth) newLeftWidth = containerWidth - minWidth;

            left.style.width = newLeftWidth + 'px';
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            DB.put(DB.STORES.SETTINGS, {
                key: 'panelWidth',
                value: left.style.width,
            });
        };

        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });

        resizer.addEventListener('dblclick', () => {
            left.style.width = defaultWidth;
            DB.put(DB.STORES.SETTINGS, { key: 'panelWidth', value: defaultWidth });
        });

        resizeListenersAttached = true;
    }

    let state = {
        prompts: [],
        folders: [],
        globalTags: [],
        currentTags: [],
        view: { type: 'folder', id: 'all' },
        currentPromptId: null,
        isCreatingNew: false,
        isSelectMode: false,
        selectedPromptIds: new Set(),
        sortBy: 'dateCreated_desc',
        folderToDeleteId: null,
        folderToEditId: null,
        copyTimeout: null,
        quickCopyTimeouts: {},
        fullscreenTarget: null,
        isLeaving: false,
        sessionPasswords: {}, // { 'folder-123': 'pass', 'prompt-456': 'pass2' }
        decryptedCache: {}, // { 12345: { body: '...', notes: '...' } }
        newPromptLockInfo: null, // { password: '...' }
    };
    let resizeListenersAttached = false;

    async function init() {
        await DB.open();
        await loadData();
        attachEventListeners();
        initResize();
        updateUI();
        history.replaceState({ appState: 'base' }, '');
    }
    async function loadData() {
        state.prompts = await DB.getAll(DB.STORES.PROMPTS);
        state.folders = await DB.getAll(DB.STORES.FOLDERS);
        const storedTags = await DB.getAll(DB.STORES.TAGS);
        state.globalTags = storedTags.map((t) => t.id); // Convert back to simple array
    }

    function updateUI() {
        const detailsVisible = state.isCreatingNew || !!state.currentPromptId;
        renderSidebarNav();
        renderSidebarTags();
        renderPrompts();
        renderPromptDetails(detailsVisible);
        updateBulkActionUI();
        UI.app.classList.toggle('sidebar-is-open', UI.sidebar.classList.contains('visible'));
        UI.app.classList.toggle('details-visible-mobile', detailsVisible && window.innerWidth <= 768);
    }

    function renderSidebarNav() {
        const allPromptsCount = state.prompts.length;
        const favoritesCount = state.prompts.filter((p) => p.isFavorite).length;
        const lockedPromptsCount = state.prompts.filter((p) => p.isLocked || state.folders.find((f) => f.id === p.folderId)?.isLocked).length;
        const makeNavLi = (id, label, count) => {
            const li = document.createElement('li');
            li.dataset.type = 'folder';
            li.dataset.id = id;
            if (state.view.type === 'folder' && state.view.id === id) li.classList.add('active');
            const name = document.createElement('span');
            name.className = 'item-name';
            name.textContent = label;
            const meta = document.createElement('div');
            meta.className = 'nav-item-meta';
            const cnt = document.createElement('span');
            cnt.className = 'item-count';
            cnt.textContent = String(count);
            meta.appendChild(cnt);
            li.append(name, meta);
            return li;
        };
        UI.primaryNavList.replaceChildren(
            makeNavLi('all', 'All Prompts', allPromptsCount),
            makeNavLi('favorites', 'Favorites', favoritesCount),
            makeNavLi('locked', 'Locked', lockedPromptsCount)
        );
        UI.folderList.textContent = '';
        state.folders.forEach((folder) => {
            const folderCount = state.prompts.filter((p) => p.folderId === folder.id).length;
            const li = document.createElement('li');
            li.dataset.type = 'folder';
            li.dataset.id = folder.id;
            li.classList.toggle('active', state.view.type === 'folder' && state.view.id === folder.id);
            const nameSpan = document.createElement('span');
            nameSpan.className = 'item-name';
            nameSpan.textContent = folder.name;
            const meta = document.createElement('div');
            meta.className = 'folder-meta';
            if (folder.isLocked) meta.appendChild(buildLockIcon());
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'folder-settings-btn';
            btn.dataset.folderId = String(folder.id);
            btn.title = 'Folder Settings';
            btn.appendChild(buildGearIcon());
            const count = document.createElement('span');
            count.className = 'item-count';
            count.textContent = String(folderCount);
            meta.append(btn, count);
            li.append(nameSpan, meta);
            UI.folderList.appendChild(li);
        });
    }

    function renderSidebarTags() {
        const allUniqueTags = [...new Set([...state.prompts.flatMap((p) => p.tags || []), ...state.globalTags])].sort();
        UI.tagsList.textContent = '';
        allUniqueTags.forEach((tag) => {
            const tagCount = state.prompts.filter((p) => (p.tags || []).includes(tag)).length;
            const tagEl = document.createElement('div');
            tagEl.className = 'tag-item';
            tagEl.dataset.type = 'tag';
            tagEl.dataset.id = tag;
            if (state.view.type === 'tag' && state.view.id === tag) tagEl.classList.add('active');
            const label = document.createTextNode(tag);
            const count = document.createElement('span');
            count.className = 'item-count';
            count.textContent = String(tagCount);
            tagEl.append(label, count);
            UI.tagsList.appendChild(tagEl);
        });
    }
    // Replaced by computeMatchSnippetData + renderHighlightedSnippet

    function getSearchQuery() {
        const desktopQuery = UI.search.value.trim().toLowerCase();
        const mobileQuery = UI.mobileSearchInput.value.trim().toLowerCase();
        return window.innerWidth <= 768 ? mobileQuery : desktopQuery;
    }

    function getFilteredAndSortedPrompts() {
        let list = [...state.prompts];
        const query = getSearchQuery();

        if (query) {
            list = list.filter((p) => {
                const folder = state.folders.find((f) => f.id === p.folderId);
                const isLockedByDB = (folder && folder.isLocked) || p.isLocked;

                let searchableBody = '';
                let searchableNotes = '';

                if (!isLockedByDB) {
                    searchableBody = p.body || '';
                    searchableNotes = p.notes || '';
                } else {
                    const cachedData = state.decryptedCache[p.id];
                    if (cachedData) {
                        searchableBody = cachedData.body || '';
                        searchableNotes = cachedData.notes || '';
                    }
                }

                const titleMatch = (p.title || '').toLowerCase().includes(query);
                const bodyMatch = searchableBody.toLowerCase().includes(query);
                const notesMatch = searchableNotes.toLowerCase().includes(query);
                const tagMatch = (p.tags || []).join(' ').toLowerCase().includes(query);

                if (titleMatch || bodyMatch || notesMatch || tagMatch) {
                    // Store raw text; rendering will highlight safely later
                    p._matchContextText = bodyMatch ? searchableBody : notesMatch ? searchableNotes : '';
                    return true;
                }
                p._matchContextText = '';
                return false;
            });
            if (state.view.type !== 'search') {
                state.view = { type: 'search' };
                renderSidebarNav();
            }
        } else if (state.view.type === 'tag') {
            list.forEach((p) => (p._matchContextText = ''));
            list = list.filter((p) => (p.tags || []).includes(state.view.id));
        } else if (state.view.type === 'folder') {
            list.forEach((p) => (p._matchContextText = ''));
            if (state.view.id === 'favorites') list = list.filter((p) => p.isFavorite);
            else if (state.view.id === 'locked') list = list.filter((p) => p.isLocked || state.folders.find((f) => f.id === p.folderId)?.isLocked);
            else if (state.view.id !== 'all') list = list.filter((p) => p.folderId === state.view.id);
        }
        const [sortKey, sortDir] = state.sortBy.split('_');
        list.sort((a, b) => {
            let valA = a[sortKey],
                valB = b[sortKey];
            if (sortKey === 'title') {
                valA = (valA || '').toLowerCase();
                valB = (valB || '').toLowerCase();
            }
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    }

    function renderPrompts() {
        UI.promptList.querySelectorAll('li').forEach((li) => li.remove());
        const promptsToRender = getFilteredAndSortedPrompts();
        UI.newPromptPlaceholder.classList.toggle(
            'visible',
            promptsToRender.length === 0 && !UI.search.value.trim() && !UI.mobileSearchInput.value.trim()
        );
        promptsToRender.forEach((prompt) => {
            const li = document.createElement('li');
            li.dataset.id = prompt.id;
            li.setAttribute('draggable', 'true');
            li.classList.toggle('active', prompt.id === state.currentPromptId && !state.isSelectMode);
            li.classList.toggle('selected', state.isSelectMode && state.selectedPromptIds.has(prompt.id));

            const folder = state.folders.find((f) => f.id === prompt.folderId);
            const isLocked = (folder && folder.isLocked) || prompt.isLocked;

            const query = getSearchQuery();
            const info = document.createElement('div');
            info.className = 'prompt-info';

            const titleSpan = document.createElement('span');
            titleSpan.className = 'prompt-list-title';
            const titleText = prompt.title || 'Untitled Prompt';
            if (query) titleSpan.appendChild(highlightTextFragment(titleText, query));
            else titleSpan.textContent = titleText;
            info.appendChild(titleSpan);

            if (query) {
                const contextSource = prompt._matchContextText;
                if (contextSource) {
                    const snippet = computeMatchSnippetData(contextSource, query);
                    if (snippet) {
                        const ctxDiv = document.createElement('div');
                        ctxDiv.className = 'prompt-match-context';
                        ctxDiv.appendChild(renderHighlightedSnippet(snippet, query));
                        info.appendChild(ctxDiv);
                    }
                }
            }

            const tagsDiv = document.createElement('div');
            tagsDiv.className = 'prompt-list-tags';
            (prompt.tags || []).forEach((tag) => {
                const t = document.createElement('span');
                t.className = 'prompt-list-tag';
                t.dataset.tag = tag;
                t.textContent = tag;
                tagsDiv.appendChild(t);
            });
            info.appendChild(tagsDiv);

            const actions = document.createElement('div');
            actions.className = 'prompt-actions';
            if (isLocked) actions.appendChild(buildLockIcon());
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'quick-copy-btn';
            btn.title = 'Copy Prompt';
            btn.dataset.id = String(prompt.id);
            btn.append(
                buildCopyIcon(),
                (() => {
                    const c = buildCheckIcon();
                    c.style.display = 'none';
                    return c;
                })()
            );
            actions.appendChild(btn);

            const fav = document.createElement('span');
            fav.className = 'favorite-toggle' + (prompt.isFavorite ? ' active' : '');
            fav.dataset.id = String(prompt.id);
            fav.title = 'Toggle Favorite';
            fav.appendChild(buildStarIcon());
            actions.appendChild(fav);

            li.append(info, actions);
            UI.promptList.appendChild(li);
        });
    }

    async function renderPromptDetails(show, temporaryPassword = null) {
        if (show) {
            UI.noPromptSelected.style.display = 'none';
            UI.promptDetails.style.display = 'flex';

            if (state.isCreatingNew) {
                UI.promptTitle.value = '';
                UI.promptBody.value = '';
                UI.promptNotes.value = '';
                UI.promptFolder.value =
                    state.view.type === 'folder' && state.view.id !== 'all' && state.view.id !== 'favorites' ? state.view.id : 'all';
                UI.promptLockSwitch.checked = !!state.newPromptLockInfo;
                UI.promptLockSwitch.disabled = false;
                loadTags([]);
            } else {
                const prompt = state.prompts.find((p) => p.id === state.currentPromptId);
                if (prompt) {
                    const folder = state.folders.find((f) => f.id === prompt.folderId);
                    const isLockedByFolder = folder && folder.isLocked;
                    const isLockedIndividually = prompt.isLocked;
                    const isLocked = isLockedByFolder || isLockedIndividually;

                    const key = isLockedByFolder ? `folder-${folder.id}` : `prompt-${prompt.id}`;
                    let password = temporaryPassword || state.sessionPasswords[key];

                    // If prompt is locked and we don't have a password, ask for it
                    if (isLocked && !password) {
                        const itemType = isLockedByFolder ? 'folder' : 'prompt';
                        const item = isLockedByFolder ? folder : prompt;

                        const result = await ModalService.password(`Enter password for ${itemType} "${item.name || item.title}"`, {
                            validate: async (pwd) => {
                                if (!pwd) return false;
                                const check = await CryptoService.decrypt(item.passwordCheck, pwd);
                                return check === String(item.id);
                            },
                        });

                        if (result) {
                            password = result.password;
                            // Store password for session if user requested to remember
                            if (result.remember) {
                                state.sessionPasswords[key] = password;
                            }

                            // Cache decrypted content
                            if (isLockedByFolder) {
                                const promptsToCache = state.prompts.filter((p) => p.folderId === folder.id);
                                for (const p of promptsToCache) {
                                    const body = await CryptoService.decrypt(p.body, password);
                                    const notes = await CryptoService.decrypt(p.notes, password);
                                    state.decryptedCache[p.id] = { body, notes };
                                }
                            } else {
                                // Locked individually
                                const body = await CryptoService.decrypt(prompt.body, password);
                                const notes = await CryptoService.decrypt(prompt.notes, password);
                                state.decryptedCache[prompt.id] = { body, notes };
                            }
                        } else {
                            // If password was cancelled, close the prompt details view
                            _internalCloseDetailsView();
                            return;
                        }
                    }

                    UI.promptTitle.value = prompt.title;
                    UI.promptBody.value = isLocked ? await CryptoService.decrypt(prompt.body, password) : prompt.body;
                    UI.promptNotes.value = isLocked ? await CryptoService.decrypt(prompt.notes, password) : prompt.notes || '';
                    UI.promptFolder.value = prompt.folderId || 'all';

                    UI.promptLockSwitch.checked = isLockedIndividually;
                    UI.promptLockSwitch.disabled = isLockedByFolder;

                    loadTags(prompt.tags || []);
                }
            }
            // Render folder dropdown after setting the folder value
            renderFolderDropdown();
            updateCharCounter();
        } else {
            UI.noPromptSelected.style.display = 'flex';
            UI.promptDetails.style.display = 'none';
        }
    }

    function renderFolderDropdown() {
        const selectedFolderId = UI.promptFolder.value;
        const selectedFolder = state.folders.find((f) => f.id == selectedFolderId);
        const isLocked = selectedFolder?.isLocked ? '🔓 ' : '';
        UI.promptFolderValue.textContent = selectedFolder ? `${isLocked}${selectedFolder.name}` : 'No Folder';
        UI.promptFolderValue.dataset.value = selectedFolderId || 'all';

        UI.promptFolderOptions.textContent = '';
        const createNew = document.createElement('div');
        createNew.className = 'custom-select-option create-new';
        createNew.dataset.value = '--create-new--';
        createNew.textContent = 'Create New Folder';
        UI.promptFolderOptions.appendChild(createNew);
        const noFolder = document.createElement('div');
        noFolder.className = 'custom-select-option';
        noFolder.dataset.value = 'all';
        noFolder.textContent = 'No Folder';
        UI.promptFolderOptions.appendChild(noFolder);
        state.folders.forEach((folder) => {
            const lockIcon = folder.isLocked ? '🔓 ' : '';
            const option = document.createElement('div');
            option.className = 'custom-select-option';
            option.dataset.value = folder.id;
            option.textContent = `${lockIcon}${folder.name}`;
            if (folder.id == selectedFolderId) {
                option.classList.add('active');
            }
            UI.promptFolderOptions.appendChild(option);
        });
    }

    function _internalCloseDetailsView() {
        const animationDuration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--animation-duration')) * 1000;
        if (window.innerWidth > 768) {
            UI.promptDetails.classList.add('closing');
        }
        UI.app.classList.remove('details-visible-mobile');
        setTimeout(async () => {
            if (window.innerWidth > 768) UI.promptDetails.classList.remove('closing');
            const currentActive = UI.promptList.querySelector(`li[data-id="${state.currentPromptId}"]`);
            if (currentActive) currentActive.classList.remove('active');
            state.isCreatingNew = false;
            state.currentPromptId = null;
            state.newPromptLockInfo = null; // Clear lock info for new prompts

            // Clear decrypted cache when closing prompt details
            state.decryptedCache = {};

            renderPromptDetails(false);
        }, animationDuration);
    }

    function _internalCloseSidebar() {
        UI.app.classList.remove('sidebar-is-open');
        UI.sidebar.classList.remove('visible');
        UI.sidebarOverlay.classList.remove('visible');
    }

    function openPromptDetailsView(isNew, promptId = null, temporaryPassword = null) {
        if (window.innerWidth <= 768 && history.state?.appState !== 'details') {
            history.pushState({ appState: 'details' }, '');
        }
        const currentActive = UI.promptList.querySelector('li.active');
        if (currentActive) currentActive.classList.remove('active');
        state.isCreatingNew = isNew;
        state.currentPromptId = promptId;
        state.newPromptLockInfo = null;

        if (!isNew) {
            const newActive = UI.promptList.querySelector(`li[data-id="${promptId}"]`);
            if (newActive) newActive.classList.add('active');
        }
        renderPromptDetails(true, temporaryPassword);
        UI.app.classList.add('details-visible-mobile');
        if (window.innerWidth <= 768) {
            _internalCloseSidebar();
        }
    }

    function openMobileSidebar() {
        if (window.innerWidth <= 768 && history.state?.appState !== 'sidebar') {
            history.pushState({ appState: 'sidebar' }, '');
        }
        UI.app.classList.add('sidebar-is-open');
        UI.sidebar.classList.add('visible');
        UI.sidebarOverlay.classList.add('visible');
    }

    function renderTags() {
        UI.tagsContainer.querySelectorAll('.tag').forEach((tagEl) => tagEl.remove());
        state.currentTags.forEach((tagText) => {
            const tagEl = document.createElement('span');
            tagEl.className = 'tag';
            tagEl.appendChild(document.createTextNode(tagText));
            const remove = document.createElement('span');
            remove.className = 'remove-tag';
            remove.dataset.tag = tagText;
            remove.textContent = '×';
            tagEl.appendChild(remove);
            UI.tagsContainer.insertBefore(tagEl, UI.tagsInput);
        });
    }
    function addTag(tagText) {
        const text = tagText.trim().replace(/,/g, '');
        if (text && !state.currentTags.includes(text)) {
            state.currentTags.push(text);
            renderTags();
        }
    }
    function removeTag(tagText) {
        state.currentTags = state.currentTags.filter((t) => t !== tagText);
        renderTags();
    }
    function loadTags(tagsArray) {
        state.currentTags = [...(tagsArray || [])];
        renderTags();
    }
    function updateCharCounter() {
        UI.charCounter.textContent = `${UI.promptBody.value.length} characters`;
    }

    function toggleSelectMode() {
        state.isSelectMode = !state.isSelectMode;
        UI.promptListControls.classList.toggle('select-mode-active', state.isSelectMode);
        if (state.isSelectMode) {
            if (state.currentPromptId) {
                const currentActive = UI.promptList.querySelector(`li[data-id="${state.currentPromptId}"]`);
                if (currentActive) currentActive.classList.remove('active');
                state.currentPromptId = null;
                renderPromptDetails(false);
                UI.app.classList.remove('details-visible-mobile');
            }
        } else {
            state.selectedPromptIds.clear();
            UI.promptList.querySelectorAll('li.selected').forEach((li) => li.classList.remove('selected'));
        }
        updateBulkActionUI();
    }

    function updateBulkActionUI() {
        UI.selectAllBtn.classList.toggle('visible', state.isSelectMode);
        UI.bulkActionBar.classList.toggle('visible', state.isSelectMode && state.selectedPromptIds.size > 0);
    }

    function showModal(modalElement) {
        if (modalElement.classList.contains('show')) return;
        modalElement.classList.remove('closing');
        modalElement.style.display = 'flex';
        void modalElement.offsetWidth;
        modalElement.classList.add('show');
    }

    function hideModal(modalElement) {
        if (!modalElement.classList.contains('show')) return;
        const animationDuration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--animation-duration')) * 1000 || 300;
        modalElement.classList.add('closing');
        setTimeout(() => {
            modalElement.classList.remove('show', 'closing');
            modalElement.style.display = 'none';
        }, animationDuration);
    }

    function getPromptDetailsState() {
        return {
            title: UI.promptTitle.value,
            body: UI.promptBody.value,
            notes: UI.promptNotes.value,
            folderId: UI.promptFolder.value,
            tags: [...state.currentTags],
            isLocked: UI.promptLockSwitch.checked,
        };
    }

    function setPromptDetailsState(details) {
        UI.promptTitle.value = details.title;
        UI.promptBody.value = details.body;
        UI.promptNotes.value = details.notes;
        UI.promptFolder.value = details.folderId;
        UI.promptLockSwitch.checked = details.isLocked;
        loadTags(details.tags);
        updateCharCounter();
    }

    function attachEventListeners() {
        UI.newPromptBtn.addEventListener('click', () => openPromptDetailsView(true));
        UI.mobileNewPromptFab.addEventListener('click', () => {
            if (UI.app.classList.contains('fullscreen-active')) handleCloseFullscreen();
            else if (UI.app.classList.contains('details-visible-mobile')) history.back();
            else openPromptDetailsView(true);
        });
        document.getElementById('new-prompt-placeholder-btn').addEventListener('click', () => openPromptDetailsView(true));
        UI.savePromptBtn.addEventListener('click', handleSavePrompt);
        UI.deletePromptBtn.addEventListener('click', handleDeletePrompt);
        UI.promptLockSwitch.addEventListener('change', handlePromptLockToggle);
        UI.search.addEventListener('input', () => updateUI());
        UI.mobileSearchInput.addEventListener('input', () => updateUI());
        UI.copyPromptBtn.addEventListener('click', handleCopyPrompt);
        UI.expandPromptBtn.addEventListener('click', () => handleOpenFullscreen('prompt'));
        UI.expandNotesBtn.addEventListener('click', () => handleOpenFullscreen('notes'));
        UI.primaryNavList.addEventListener('click', handleSidebarNavClick);
        UI.folderList.addEventListener('click', handleSidebarNavClick);
        UI.tagsList.addEventListener('click', handleSidebarNavClick);
        UI.promptList.addEventListener('click', handlePromptListClick);
        UI.newFolderToggleBtn.addEventListener('click', () => {
            const container = UI.newFolderContainer;
            container.classList.toggle('visible');
            if (container.classList.contains('visible')) {
                UI.newFolderName.focus();
                setTimeout(() => container.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
            }
        });
        UI.addFolderBtn.addEventListener('click', handleAddFolder);
        UI.newTagToggleBtn.addEventListener('click', () => {
            const container = UI.newTagContainer;
            container.classList.toggle('visible');
            if (container.classList.contains('visible')) {
                UI.newTagName.focus();
                setTimeout(() => container.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
            }
        });
        UI.addTagBtn.addEventListener('click', handleAddGlobalTag);
        UI.sortBy.addEventListener('change', (e) => {
            state.sortBy = e.target.value;
            renderPrompts();
        });
        UI.selectModeBtn.addEventListener('click', toggleSelectMode);
        UI.selectAllBtn.addEventListener('click', handleSelectAll);
        UI.bulkDeleteBtn.addEventListener('click', handleBulkDelete);
        UI.bulkMoveBtn.addEventListener('click', handleBulkMove);
        UI.bulkExportBtn.addEventListener('click', handleBulkExport);
        UI.importFileInput.addEventListener('change', handleImport);
        UI.backToTopBtn.addEventListener('click', () => UI.promptList.scrollTo({ top: 0, behavior: 'smooth' }));
        UI.promptList.addEventListener('scroll', () => UI.backToTopBtn.classList.toggle('visible', UI.promptList.scrollTop > 300));
        UI.sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            openMobileSidebar();
        });
        UI.sidebarOverlay.addEventListener('click', () => history.back());
        UI.mobileSearchBtn.addEventListener('click', () => {
            UI.mobileSearchBar.classList.add('visible');
            UI.mobileSearchInput.focus();
        });
        UI.closeSearchBtn.addEventListener('click', () => {
            UI.mobileSearchBar.classList.remove('visible');
            UI.mobileSearchInput.value = '';
            updateUI();
        });
        UI.promptBody.addEventListener('input', updateCharCounter);
        UI.tagsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-tag')) removeTag(e.target.dataset.tag);
            else UI.tagsInput.focus();
        });
        UI.tagsInput.addEventListener('keydown', handleTagInputKeydown);
        UI.tagsInput.addEventListener('input', handleTagInput);
        UI.tagsInput.addEventListener('focus', () => renderTagSuggestions(UI.tagsInput.value));
        UI.tagsInput.addEventListener('blur', () => {
            setTimeout(() => (UI.tagSuggestions.style.display = 'none'), 150);
        });
        UI.tagSuggestions.addEventListener('mousedown', handleSuggestionClick);
        UI.fullscreenPromptModal.addEventListener('click', (e) => {
            if (e.target === UI.fullscreenPromptModal) handleCloseFullscreen();
        });
        UI.closeFullscreenBtn.addEventListener('click', handleCloseFullscreen);
        UI.saveAndCloseFullscreenBtn.addEventListener('click', handleSaveAndCloseFullscreen);
        UI.saveRenameBtn.addEventListener('click', handleRenameFolder);
        UI.toggleLockFolderBtn.addEventListener('click', handleToggleFolderLock);
        UI.deleteFolderFromSettingsBtn.addEventListener('click', handleDeleteFolderTrigger);
        document.getElementById('export-folder-btn').addEventListener('click', handleExportSingleFolder);
        UI.cancelFolderSettingsBtn.addEventListener('click', () => hideModal(UI.folderSettingsModal));
        UI.folderSettingsModal.addEventListener('click', (e) => {
            if (e.target === UI.folderSettingsModal) hideModal(UI.folderSettingsModal);
        });
        document.getElementById('confirm-delete-folder-move-prompts').addEventListener('click', () => {
            hideModal(UI.deleteFolderModal);
            handleDeleteFolderMove();
        });
        document.getElementById('confirm-delete-folder-and-prompts').addEventListener('click', () => {
            hideModal(UI.deleteFolderModal);
            handleDeleteFolderAndPrompts();
        });
        document.getElementById('cancel-delete-folder-btn').addEventListener('click', () => hideModal(UI.deleteFolderModal));
        document.getElementById('confirm-move-btn').addEventListener('click', () => {
            handleConfirmMove();
        });
        document.getElementById('cancel-move-btn').addEventListener('click', () => hideModal(UI.moveModal));
        UI.moveFolderSelect.addEventListener('change', handleMoveFolderSelectChange);
        document.getElementById('confirm-reset-btn').addEventListener('click', () => {
            hideModal(UI.resetDataModal);
            handleResetAllData();
        });
        document.getElementById('cancel-reset-btn').addEventListener('click', () => hideModal(UI.resetDataModal));
        window.addEventListener('popstate', handlePopState);

        // Settings Modal Listeners
        UI.settingsBtn.addEventListener('click', () => {
            showModal(UI.settingsModal);
            updateStorageUsage();
        });
        UI.closeSettingsModalBtn.addEventListener('click', () => hideModal(UI.settingsModal));
        UI.settingsModal.addEventListener('click', (e) => {
            if (e.target === UI.settingsModal) hideModal(UI.settingsModal);
        });
        UI.importBtnModal.addEventListener('click', () => {
            hideModal(UI.settingsModal);
            UI.importFileInput.click();
        });
        UI.exportBtnModal.addEventListener('click', handleExport);

        UI.resetDataBtnModal.addEventListener('click', () => {
            hideModal(UI.settingsModal);
            setTimeout(() => showModal(UI.resetDataModal), 350);
        });

        // Tag Management Modal
        UI.manageTagsBtn.addEventListener('click', openManageTagsModal);
        UI.closeManageTagsBtn.addEventListener('click', () => hideModal(UI.manageTagsModal));
        UI.manageTagsModal.addEventListener('click', (e) => {
            if (e.target === UI.manageTagsModal) hideModal(UI.manageTagsModal);
        });
        UI.manageTagsList.addEventListener('click', handleTagActionClick);

        // Tag selection in manage tags modal
        UI.manageTagsList.addEventListener('click', (e) => {
            const tagItem = e.target.closest('.tag-manage-item');
            if (tagItem && !e.target.closest('.tag-action-btn')) {
                // Toggle selected class on clicked item
                const isSelected = tagItem.classList.contains('selected');
                // Remove selected class from all items
                UI.manageTagsList.querySelectorAll('.tag-manage-item').forEach((item) => {
                    item.classList.remove('selected');
                });
                // Add selected class to clicked item if it wasn't already selected
                if (!isSelected) {
                    tagItem.classList.add('selected');
                }
            }
        });

        // Enter key to click OK
        UI.newFolderName.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') UI.addFolderBtn.click();
        });
        UI.newTagName.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') UI.addTagBtn.click();
        });
        UI.movePasswordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('confirm-move-btn').click();
        });
        UI.renameFolderInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') UI.saveRenameBtn.click();
        });
        document.getElementById('generic-modal-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') document.getElementById('generic-modal-confirm-btn').click();
        });

        // Custom Folder Dropdown
        UI.promptFolderValue.addEventListener('click', () => UI.promptFolderContainer.classList.toggle('open'));
        UI.promptFolderOptions.addEventListener('click', handleFolderOptionSelect);
        document.addEventListener('click', (e) => {
            if (!UI.promptFolderContainer.contains(e.target)) {
                UI.promptFolderContainer.classList.remove('open');
            }
        });

        // Drag and Drop
        UI.promptList.addEventListener('dragstart', handleDragStart);
        UI.primaryNavList.addEventListener('dragover', handleDragOver);
        UI.primaryNavList.addEventListener('dragleave', handleDragLeave);
        UI.primaryNavList.addEventListener('drop', handleDrop);
        UI.folderList.addEventListener('dragover', handleDragOver);
        UI.folderList.addEventListener('dragleave', handleDragLeave);
        UI.folderList.addEventListener('drop', handleDrop);
        document.body.addEventListener('dragend', handleDragEnd);

        window.addEventListener('resize', initResize);
    }

    function handleDragStart(e) {
        const li = e.target.closest('li');
        if (!li) return;

        const promptId = li.dataset.id;
        const prompt = state.prompts.find((p) => p.id == promptId);
        if (!prompt) return;

        // Prevent dragging locked prompts
        const folder = state.folders.find((f) => f.id === prompt.folderId);
        if (prompt.isLocked || (folder && folder.isLocked)) {
            e.preventDefault();
            return;
        }

        e.dataTransfer.setData('text/plain', promptId);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => {
            li.classList.add('dragging');
        }, 0);
    }

    function handleDragEnd() {
        const draggingLi = UI.promptList.querySelector('li.dragging');
        if (draggingLi) {
            draggingLi.classList.remove('dragging');
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        const li = e.target.closest('li');
        if (li && li.dataset.type === 'folder') {
            li.classList.add('drag-over');
        }
    }

    function handleDragLeave(e) {
        const li = e.target.closest('li');
        if (li && li.dataset.type === 'folder') {
            li.classList.remove('drag-over');
        }
    }

    async function handleDrop(e) {
        e.preventDefault();
        const li = e.target.closest('li');
        if (!li) return;

        li.classList.remove('drag-over');

        const targetId = li.dataset.id;
        if (targetId === 'favorites' || targetId === 'locked') {
            return; // Cannot drop into these special views
        }

        const promptId = Number(e.dataTransfer.getData('text/plain'));
        const folderId = targetId === 'all' ? null : Number(targetId);

        const prompt = state.prompts.find((p) => p.id === promptId);
        if (prompt) {
            prompt.folderId = folderId;
            prompt.dateModified = Date.now();
            await DB.put(DB.STORES.PROMPTS, prompt);
            updateUI();
        }
    }

    function openManageTagsModal() {
        const allTags = [...new Set([...state.prompts.flatMap((p) => p.tags || []), ...state.globalTags])].sort();
        UI.manageTagsList.textContent = '';
        if (allTags.length === 0) {
            const p = document.createElement('p');
            p.style.textAlign = 'center';
            p.style.color = 'var(--text-secondary)';
            p.textContent = 'No tags found.';
            UI.manageTagsList.appendChild(p);
        } else {
            allTags.forEach((tag) => {
                const promptCount = state.prompts.filter((p) => (p.tags || []).includes(tag)).length;
                const item = document.createElement('div');
                item.className = 'tag-manage-item';
                item.dataset.tag = tag;

                const nameContainer = document.createElement('div');
                nameContainer.className = 'tag-name-container';
                const dot = document.createElement('span');
                dot.className = 'tag-color-dot';
                const name = document.createElement('span');
                name.textContent = `${tag} (${promptCount})`;
                nameContainer.append(dot, name);

                const actions = document.createElement('div');
                actions.className = 'tag-actions';
                const rename = document.createElement('button');
                rename.type = 'button';
                rename.className = 'tag-action-btn rename';
                rename.dataset.action = 'rename';
                rename.textContent = 'Rename';
                const del = document.createElement('button');
                del.type = 'button';
                del.className = 'tag-action-btn danger delete';
                del.dataset.action = 'delete';
                del.textContent = 'Delete';
                actions.append(rename, del);

                item.append(nameContainer, actions);
                UI.manageTagsList.appendChild(item);
            });
        }
        showModal(UI.manageTagsModal);
    }

    async function handleTagActionClick(e) {
        const button = e.target.closest('.tag-action-btn');
        if (!button) return;

        const action = button.dataset.action;
        const tagItem = button.closest('.tag-manage-item');
        const oldTagName = tagItem.dataset.tag;

        if (action === 'rename') {
            const newTagName = await ModalService.prompt('Enter the new name for this tag:', {
                title: 'Rename Tag',
                defaultValue: oldTagName,
                confirmBtnText: 'Rename',
            });

            if (newTagName && newTagName.trim() !== '' && newTagName !== oldTagName) {
                await handleRenameTag(oldTagName, newTagName.trim());
                openManageTagsModal(); // Refresh the modal
            }
        } else if (action === 'delete') {
            const confirmed = await ModalService.confirm(
                `Are you sure you want to delete the tag "${oldTagName}"? It will be removed from all associated prompts.`,
                {
                    title: 'Delete Tag',
                    confirmBtnText: 'Delete',
                    danger: true,
                }
            );

            if (confirmed) {
                await handleDeleteTag(oldTagName);
                openManageTagsModal(); // Refresh the modal
            }
        }
    }

    async function handleRenameTag(oldName, newName) {
        // Update global tags
        const globalTagIndex = state.globalTags.indexOf(oldName);
        if (globalTagIndex > -1) {
            state.globalTags.splice(globalTagIndex, 1, newName);
        }
        if (!state.globalTags.includes(newName)) {
            state.globalTags.push(newName);
        }
        await DB.remove(DB.STORES.TAGS, oldName);
        await DB.put(DB.STORES.TAGS, { id: newName });

        // Update prompts
        const promptsToUpdate = [];
        state.prompts.forEach((p) => {
            if (p.tags && p.tags.includes(oldName)) {
                p.tags = p.tags.map((t) => (t === oldName ? newName : t));
                // Ensure no duplicates if newName already existed
                p.tags = [...new Set(p.tags)];
                promptsToUpdate.push(p);
            }
        });

        if (promptsToUpdate.length > 0) {
            await DB.bulkPut(DB.STORES.PROMPTS, promptsToUpdate);
        }

        // Update current view if it was the renamed tag
        if (state.view.type === 'tag' && state.view.id === oldName) {
            state.view.id = newName;
        }

        // Update details view if open
        if (state.currentPromptId || state.isCreatingNew) {
            const detailsState = getPromptDetailsState();
            if (detailsState.tags.includes(oldName)) {
                detailsState.tags = detailsState.tags.map((t) => (t === oldName ? newName : t));
                setPromptDetailsState(detailsState);
            }
        }

        updateUI();
    }

    async function handleDeleteTag(tagName) {
        // Remove from global tags
        state.globalTags = state.globalTags.filter((t) => t !== tagName);
        await DB.remove(DB.STORES.TAGS, tagName);

        // Remove from prompts
        const promptsToUpdate = [];
        state.prompts.forEach((p) => {
            if (p.tags && p.tags.includes(tagName)) {
                p.tags = p.tags.filter((t) => t !== tagName);
                promptsToUpdate.push(p);
            }
        });

        if (promptsToUpdate.length > 0) {
            await DB.bulkPut(DB.STORES.PROMPTS, promptsToUpdate);
        }

        // If the current view is the deleted tag, switch to 'all'
        if (state.view.type === 'tag' && state.view.id === tagName) {
            state.view = { type: 'folder', id: 'all' };
        }

        // Update details view if open
        if (state.currentPromptId || state.isCreatingNew) {
            const detailsState = getPromptDetailsState();
            if (detailsState.tags.includes(tagName)) {
                detailsState.tags = detailsState.tags.filter((t) => t !== tagName);
                setPromptDetailsState(detailsState);
            }
        }

        updateUI();
    }

    function handlePopState() {
        if (window.innerWidth > 768) return;
        const isDetailsOpen = UI.app.classList.contains('details-visible-mobile');
        const isSidebarOpen = UI.app.classList.contains('sidebar-is-open');
        if (!isDetailsOpen && !isSidebarOpen && !state.isLeaving) {
            history.pushState({ appState: 'base' }, '');
            ModalService.show({
                modalId: 'exit-confirmation-modal',
                danger: true,
            }).then((confirmed) => {
                if (confirmed) {
                    state.isLeaving = true;
                    history.back();
                }
            });
            return;
        }
        if (isDetailsOpen) _internalCloseDetailsView();
        else if (isSidebarOpen) _internalCloseSidebar();
        state.isLeaving = false;
    }

    function handleOpenFullscreen(target) {
        state.fullscreenTarget = target;
        if (target === 'prompt') {
            UI.fullscreenPromptTitle.textContent = UI.promptTitle.value || 'Editing Prompt';
            UI.fullscreenPromptTextarea.value = UI.promptBody.value;
        } else if (target === 'notes') {
            UI.fullscreenPromptTitle.textContent = 'Editing Notes';
            UI.fullscreenPromptTextarea.value = UI.promptNotes.value;
        }
        UI.app.classList.add('fullscreen-active');
        showModal(UI.fullscreenPromptModal);
        setTimeout(() => UI.fullscreenPromptTextarea.focus(), 50);
    }

    function handleCloseFullscreen() {
        hideModal(UI.fullscreenPromptModal);
        UI.app.classList.remove('fullscreen-active');
        state.fullscreenTarget = null;
    }

    function handleSaveAndCloseFullscreen() {
        if (state.fullscreenTarget === 'prompt') {
            UI.promptBody.value = UI.fullscreenPromptTextarea.value;
            updateCharCounter();
        } else if (state.fullscreenTarget === 'notes') {
            UI.promptNotes.value = UI.fullscreenPromptTextarea.value;
        }
        handleCloseFullscreen();
    }

    async function handleFolderOptionSelect(e) {
        const target = e.target.closest('.custom-select-option');
        if (!target) return;

        const value = target.dataset.value;
        UI.promptFolderContainer.classList.remove('open');

        if (value === '--create-new--') {
            const folderName = await ModalService.prompt('Enter new folder name:', {
                title: 'Create Folder',
            });
            if (folderName && folderName.trim()) {
                const newFolder = {
                    id: Date.now(),
                    name: folderName.trim(),
                    isLocked: false,
                };
                await DB.put(DB.STORES.FOLDERS, newFolder);
                state.folders.push(newFolder);
                renderSidebarNav();
                UI.promptFolder.value = newFolder.id;
                renderFolderDropdown();
            }
        } else {
            UI.promptFolder.value = value;
            renderFolderDropdown();
        }
    }

    async function handleSavePrompt() {
        const title = UI.promptTitle.value.trim();
        const body = UI.promptBody.value;
        const notes = UI.promptNotes.value.trim();

        if (!title && !body && !notes) {
            await ModalService.alert('Prompt cannot be completely empty.', 'Cannot Save');
            return;
        }

        const now = Date.now();
        const folderId = UI.promptFolder.value === 'all' || UI.promptFolder.value === '--create-new--' ? null : Number(UI.promptFolder.value);
        let promptToSave;

        if (state.isCreatingNew) {
            promptToSave = {
                id: now,
                dateCreated: now,
                isFavorite: false,
                isLocked: false,
            };

            if (state.newPromptLockInfo) {
                const password = state.newPromptLockInfo.password;
                promptToSave.isLocked = true;
                promptToSave.body = await CryptoService.encrypt(body, password);
                promptToSave.notes = await CryptoService.encrypt(notes, password);
                promptToSave.passwordCheck = await CryptoService.encrypt(String(promptToSave.id), password);
            } else {
                promptToSave.body = body;
                promptToSave.notes = notes;
            }
            state.prompts.push(promptToSave);
        } else {
            promptToSave = state.prompts.find((p) => p.id === state.currentPromptId);
            const password = state.sessionPasswords[`folder-${folderId}`] || state.sessionPasswords[`prompt-${promptToSave.id}`];

            if (password) {
                promptToSave.body = await CryptoService.encrypt(body, password);
                promptToSave.notes = await CryptoService.encrypt(notes, password);
            } else {
                promptToSave.body = body;
                promptToSave.notes = notes;
            }
        }

        promptToSave.title = title;
        promptToSave.folderId = folderId;
        promptToSave.tags = state.currentTags;
        promptToSave.dateModified = now;

        await DB.put(DB.STORES.PROMPTS, promptToSave);

        if (window.innerWidth <= 768 && history.state?.appState === 'details') {
            history.back();
        } else {
            _internalCloseDetailsView();
        }
        updateUI();
    }

    function openFolderSettingsModal(folderId) {
        state.folderToEditId = folderId;
        const folder = state.folders.find((f) => f.id === folderId);
        if (!folder) return;
        UI.folderSettingsTitle.textContent = `Settings for "${folder.name}"`;
        UI.renameFolderInput.value = folder.name;
        UI.toggleLockFolderBtn.textContent = folder.isLocked ? 'Unlock' : 'Lock';
        showModal(UI.folderSettingsModal);
    }

    async function handleRenameFolder() {
        const newName = UI.renameFolderInput.value.trim();
        if (!newName || !state.folderToEditId) return;
        const folder = state.folders.find((f) => f.id === state.folderToEditId);
        if (folder) {
            folder.name = newName;
            await DB.put(DB.STORES.FOLDERS, folder);
            updateUI();
            hideModal(UI.folderSettingsModal);
        }
    }

    function handleDeleteFolderTrigger() {
        const folderId = state.folderToEditId;
        if (!folderId) return;
        hideModal(UI.folderSettingsModal);
        setTimeout(() => showDeleteConfirmationModal(folderId), 350);
    }

    function showDeleteConfirmationModal(folderId) {
        state.folderToDeleteId = folderId;
        const folder = state.folders.find((f) => f.id === folderId);
        if (!folder) return;
        const promptCount = state.prompts.filter((p) => p.folderId === folderId).length;
        const modal = UI.deleteFolderModal;
        modal.querySelector('h3').textContent = `Delete "${folder.name}"`;
        modal.querySelector('#confirm-delete-folder-move-prompts').style.display = promptCount > 0 ? 'flex' : 'none';
        modal.querySelector('#confirm-delete-folder-and-prompts').textContent =
            promptCount > 0 ? `Delete Folder & ${promptCount} Prompts` : `Delete Empty Folder`;
        modal.querySelector('#confirm-delete-folder-move-prompts').textContent = `Delete Folder & Move ${promptCount} Prompts`;
        modal.querySelector('p').textContent =
            promptCount > 0
                ? `This folder contains ${promptCount} prompt(s). What would you like to do?`
                : 'Are you sure you want to delete this empty folder?';
        showModal(UI.deleteFolderModal);
    }

    function handleSidebarNavClick(e) {
        const settingsBtn = e.target.closest('.folder-settings-btn');
        if (settingsBtn) {
            e.stopPropagation();
            openFolderSettingsModal(Number(settingsBtn.dataset.folderId));
            return;
        }
        const target = e.target.closest('[data-id]');
        if (!target) return;
        if (window.innerWidth <= 768 && history.state?.appState) {
            history.back();
        } else {
            _internalCloseDetailsView();
            _internalCloseSidebar();
        }
        UI.search.value = '';
        const { type, id } = target.dataset;
        if (state.view.type === type && state.view.id.toString() === id) {
            state.view = { type: 'folder', id: 'all' };
        } else {
            state.view = {
                type,
                id: type === 'folder' && !['all', 'favorites', 'locked'].includes(id) ? Number(id) : id,
            };
        }
        updateUI();
    }

    async function handleDeleteFolderMove() {
        if (state.folderToDeleteId === null) return;
        const folder = state.folders.find((f) => f.id === state.folderToDeleteId);

        const promptsToUpdate = state.prompts.filter((p) => p.folderId === state.folderToDeleteId);

        if (folder.isLocked) {
            const password = await ModalService.password(`Enter password for "${folder.name}" to decrypt prompts before moving.`);
            if (!password) return;

            const check = await CryptoService.decrypt(folder.passwordCheck, password);
            if (check !== String(folder.id)) {
                await ModalService.alert('Incorrect password.');
                return;
            }

            for (const p of promptsToUpdate) {
                p.body = await CryptoService.decrypt(p.body, password);
                p.notes = await CryptoService.decrypt(p.notes, password);
            }
        }

        promptsToUpdate.forEach((p) => (p.folderId = null));
        await DB.bulkPut(DB.STORES.PROMPTS, promptsToUpdate);

        await DB.remove(DB.STORES.FOLDERS, state.folderToDeleteId);
        state.folders = state.folders.filter((f) => f.id !== state.folderToDeleteId);
        if (state.view.id === state.folderToDeleteId) state.view = { type: 'folder', id: 'all' };
        state.folderToDeleteId = null;
        updateUI();
    }

    async function handleDeleteFolderAndPrompts() {
        if (state.folderToDeleteId === null) return;
        const promptIdsToDelete = state.prompts.filter((p) => p.folderId === state.folderToDeleteId).map((p) => p.id);
        await DB.bulkRemove(DB.STORES.PROMPTS, promptIdsToDelete);
        await DB.remove(DB.STORES.FOLDERS, state.folderToDeleteId);
        state.prompts = state.prompts.filter((p) => p.folderId !== state.folderToDeleteId);
        state.folders = state.folders.filter((f) => f.id !== state.folderToDeleteId);
        if (state.view.id === state.folderToDeleteId) state.view = { type: 'folder', id: 'all' };
        if (state.currentPromptId && !state.prompts.find((p) => p.id === state.currentPromptId)) {
            state.currentPromptId = null;
            _internalCloseDetailsView();
        }
        state.folderToDeleteId = null;
        updateUI();
    }

    async function handlePromptListClick(e) {
        const li = e.target.closest('li[data-id]');
        if (!li) return;
        const promptId = Number(li.dataset.id);
        const prompt = state.prompts.find((p) => p.id === promptId);
        if (!prompt) return;

        const favoriteToggle = e.target.closest('.favorite-toggle');
        const tag = e.target.closest('.prompt-list-tag');
        const quickCopyBtn = e.target.closest('.quick-copy-btn');
        if (quickCopyBtn) {
            e.stopPropagation();
            const folder = state.folders.find((f) => f.id === prompt.folderId);
            const isLocked = (folder && folder.isLocked) || prompt.isLocked;

            let bodyToCopy;
            if (isLocked) {
                const password = await ModalService.password('Enter password to copy content:');
                if (!password) return;

                const checkString = isLocked && folder?.isLocked ? String(folder.id) : String(prompt.id);
                const checkValue = isLocked && folder?.isLocked ? folder.passwordCheck : prompt.passwordCheck;
                const decryptedCheck = await CryptoService.decrypt(checkValue, password);

                if (decryptedCheck !== checkString) {
                    await ModalService.alert('Incorrect password.');
                    return;
                }
                bodyToCopy = await CryptoService.decrypt(prompt.body, password);
            } else {
                bodyToCopy = prompt.body;
            }

            navigator.clipboard.writeText(bodyToCopy).then(() => {
                if (state.quickCopyTimeouts[promptId]) clearTimeout(state.quickCopyTimeouts[promptId]);
                quickCopyBtn.classList.add('copied');
                quickCopyBtn.querySelector('.copy-icon').style.display = 'none';
                quickCopyBtn.querySelector('.check-icon').style.display = 'block';
                state.quickCopyTimeouts[promptId] = setTimeout(() => {
                    quickCopyBtn.classList.remove('copied');
                    quickCopyBtn.querySelector('.copy-icon').style.display = 'block';
                    quickCopyBtn.querySelector('.check-icon').style.display = 'none';
                    delete state.quickCopyTimeouts[promptId];
                }, 2000);
            });
            return;
        }
        if (favoriteToggle) {
            e.stopPropagation();
            prompt.isFavorite = !prompt.isFavorite;
            await DB.put(DB.STORES.PROMPTS, prompt);
            renderSidebarNav();
            if (state.view.type === 'folder' && state.view.id === 'favorites') {
                renderPrompts();
            } else {
                favoriteToggle.classList.toggle('active', prompt.isFavorite);
            }
            return;
        }
        if (tag) {
            e.stopPropagation();
            const newView = { type: 'tag', id: tag.dataset.tag };
            if (state.view.type === newView.type && state.view.id === newView.id) {
                state.view = { type: 'folder', id: 'all' };
            } else {
                state.view = newView;
            }
            state.currentPromptId = null;
            UI.search.value = '';
            updateUI();
            return;
        }

        if (state.isSelectMode) {
            li.classList.toggle('selected');
            if (state.selectedPromptIds.has(promptId)) state.selectedPromptIds.delete(promptId);
            else state.selectedPromptIds.add(promptId);
            updateBulkActionUI();
        } else {
            const folder = state.folders.find((f) => f.id === prompt.folderId);
            const isLockedByFolder = folder && folder.isLocked;
            const isLockedIndividually = prompt.isLocked;
            const isLocked = isLockedByFolder || isLockedIndividually;

            if (isLocked) {
                const item = isLockedByFolder ? folder : prompt;
                const itemType = isLockedByFolder ? 'folder' : 'prompt';
                const key = `${itemType}-${item.id}`;

                if (state.sessionPasswords[key]) {
                    openPromptDetailsView(false, promptId);
                    return;
                }

                const result = await ModalService.password(`Enter password for ${itemType} "${item.name || item.title}"`, {
                    validate: async (password) => {
                        if (!password) return false;
                        const check = await CryptoService.decrypt(item.passwordCheck, password);
                        return check === String(item.id);
                    },
                });

                if (result) {
                    if (result.remember) {
                        state.sessionPasswords[key] = result.password;
                    }

                    if (isLockedByFolder) {
                        const promptsToCache = state.prompts.filter((p) => p.folderId === folder.id);
                        for (const p of promptsToCache) {
                            const body = await CryptoService.decrypt(p.body, result.password);
                            const notes = await CryptoService.decrypt(p.notes, result.password);
                            state.decryptedCache[p.id] = { body, notes };
                        }
                    } else {
                        // Locked individually
                        const body = await CryptoService.decrypt(prompt.body, result.password);
                        const notes = await CryptoService.decrypt(prompt.notes, result.password);
                        state.decryptedCache[prompt.id] = { body, notes };
                    }

                    openPromptDetailsView(false, promptId, result.password);
                }
            } else {
                openPromptDetailsView(false, promptId);
            }
        }
    }

    async function handleAddFolder() {
        const folderName = UI.newFolderName.value.trim();
        if (folderName) {
            const newFolder = {
                id: Date.now(),
                name: folderName,
                isLocked: false,
                passwordCheck: null,
            };
            await DB.put(DB.STORES.FOLDERS, newFolder);
            state.folders.push(newFolder);
            UI.newFolderName.value = '';
            UI.newFolderContainer.classList.remove('visible');
            renderSidebarNav();
        }
    }

    async function handleAddGlobalTag() {
        const tagName = UI.newTagName.value.trim();
        if (tagName) {
            const allTags = new Set([...state.prompts.flatMap((p) => p.tags || []), ...state.globalTags]);
            if (!allTags.has(tagName)) {
                await DB.put(DB.STORES.TAGS, { id: tagName });
                state.globalTags.push(tagName);
                renderSidebarTags();
            }
            UI.newTagName.value = '';
            UI.newTagContainer.classList.remove('visible');
        }
    }

    function handleSelectAll() {
        const allVisibleItems = Array.from(UI.promptList.querySelectorAll('li'));
        const allVisibleIds = allVisibleItems.map((li) => Number(li.dataset.id));
        const allVisibleSelected = allVisibleItems.length > 0 && allVisibleItems.every((li) => li.classList.contains('selected'));
        if (allVisibleSelected) {
            allVisibleItems.forEach((li) => li.classList.remove('selected'));
            state.selectedPromptIds.clear();
        } else {
            allVisibleItems.forEach((li) => li.classList.add('selected'));
            state.selectedPromptIds = new Set(allVisibleIds);
        }
        updateBulkActionUI();
    }

    async function handleBulkDelete() {
        if (state.selectedPromptIds.size === 0) return;
        const confirmed = await ModalService.confirm(`Delete ${state.selectedPromptIds.size} selected prompts?`, {
            title: 'Confirm Deletion',
            confirmBtnText: 'Delete',
            danger: true,
        });
        if (confirmed) {
            const idsToDelete = Array.from(state.selectedPromptIds);
            await DB.bulkRemove(DB.STORES.PROMPTS, idsToDelete);
            state.prompts = state.prompts.filter((p) => !state.selectedPromptIds.has(p.id));
            if (state.selectedPromptIds.has(state.currentPromptId)) {
                _internalCloseDetailsView();
            }
            state.selectedPromptIds.clear();
            state.isSelectMode = false;
            updateUI();
        }
    }

    async function handleDeletePrompt() {
        if (!state.currentPromptId) return;
        const confirmed = await ModalService.confirm('Are you sure you want to delete this prompt?', {
            title: 'Confirm Deletion',
            confirmBtnText: 'Delete',
            danger: true,
        });
        if (confirmed) {
            const idToDelete = state.currentPromptId;
            await DB.remove(DB.STORES.PROMPTS, idToDelete);
            state.prompts = state.prompts.filter((p) => p.id !== idToDelete);
            if (window.innerWidth <= 768) history.back();
            else _internalCloseDetailsView();
            setTimeout(updateUI, 50);
        }
    }

    function handleBulkMove() {
        if (state.selectedPromptIds.size === 0) return;
        UI.moveCount.textContent = state.selectedPromptIds.size;
        UI.moveFolderSelect.textContent = '';
        const optAll = document.createElement('option');
        optAll.value = 'all';
        optAll.textContent = 'No Folder';
        UI.moveFolderSelect.appendChild(optAll);
        state.folders.forEach((folder) => {
            const isLocked = folder.isLocked ? '🔓 ' : '';
            const opt = document.createElement('option');
            opt.value = String(folder.id);
            opt.textContent = `${isLocked}${folder.name}`;
            UI.moveFolderSelect.appendChild(opt);
        });
        handleMoveFolderSelectChange(); // Check if initial selection is locked
        showModal(UI.moveModal);
    }

    function handleMoveFolderSelectChange() {
        const folderId = UI.moveFolderSelect.value;
        const folder = state.folders.find((f) => f.id == folderId);
        if (folder && folder.isLocked) {
            UI.movePasswordContainer.style.display = 'block';
            UI.movePasswordInput.value = '';
        } else {
            UI.movePasswordContainer.style.display = 'none';
        }
    }

    async function handleConfirmMove() {
        hideModal(UI.moveModal); // Hide modal first
        const newFolderId = UI.moveFolderSelect.value === 'all' ? null : Number(UI.moveFolderSelect.value);
        const promptsToUpdate = state.prompts.filter((p) => state.selectedPromptIds.has(p.id));
        const destFolder = state.folders.find((f) => f.id === newFolderId);

        let destPassword = null;
        if (destFolder && destFolder.isLocked) {
            destPassword = UI.movePasswordInput.value;
            const check = await CryptoService.decrypt(destFolder.passwordCheck, destPassword);
            if (check !== String(destFolder.id)) {
                await ModalService.alert('Incorrect password for the destination folder.');
                return;
            }
        }

        for (const prompt of promptsToUpdate) {
            const originalFolder = state.folders.find((f) => f.id === prompt.folderId);
            let currentBody = prompt.body;
            let currentNotes = prompt.notes;

            if (originalFolder && originalFolder.isLocked) {
                const oldPass = await ModalService.password(
                    `Enter password for "${originalFolder.name}" to move prompt "${prompt.title || 'Untitled'}"`
                );
                if (!oldPass) {
                    await ModalService.alert(`Skipping prompt.`);
                    continue;
                }
                const check = await CryptoService.decrypt(originalFolder.passwordCheck, oldPass);
                if (check !== String(originalFolder.id)) {
                    await ModalService.alert(`Skipping prompt: incorrect password for source folder.`);
                    continue;
                }
                currentBody = await CryptoService.decrypt(prompt.body, oldPass);
                currentNotes = await CryptoService.decrypt(prompt.notes, oldPass);
            } else if (prompt.isLocked) {
                const oldPass = await ModalService.password(`Enter password for prompt "${prompt.title || 'Untitled'}"`);
                if (!oldPass) {
                    await ModalService.alert(`Skipping prompt.`);
                    continue;
                }
                const check = await CryptoService.decrypt(prompt.passwordCheck, oldPass);
                if (check !== String(prompt.id)) {
                    await ModalService.alert(`Skipping prompt: incorrect password for prompt.`);
                    continue;
                }
                currentBody = await CryptoService.decrypt(prompt.body, oldPass);
                currentNotes = await CryptoService.decrypt(prompt.notes, oldPass);
            }

            prompt.isLocked = false;
            prompt.passwordCheck = null;

            if (destPassword) {
                prompt.body = await CryptoService.encrypt(currentBody, destPassword);
                prompt.notes = await CryptoService.encrypt(currentNotes, destPassword);
            } else {
                prompt.body = currentBody;
                prompt.notes = currentNotes;
            }
            prompt.folderId = newFolderId;
        }

        await DB.bulkPut(DB.STORES.PROMPTS, promptsToUpdate);
        state.selectedPromptIds.clear();
        state.isSelectMode = false;
        updateUI();
    }

    async function handleExportSingleFolder() {
        const folderId = state.folderToEditId;
        if (!folderId) return;

        const folder = state.folders.find((f) => f.id === folderId);
        if (!folder) return;

        const promptsInFolder = state.prompts.filter((p) => p.folderId === folderId);

        const dataToExport = {
            folders: [folder],
            prompts: promptsInFolder,
        };

        const dataStr = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `promptcat_folder_${folder.name}_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async function handleBulkExport() {
        if (state.selectedPromptIds.size === 0) {
            ModalService.alert('No prompts selected to export.', 'Export Empty');
            return;
        }
        const promptsToExport = state.prompts.filter((p) => state.selectedPromptIds.has(p.id));
        const dataToExport = {
            prompts: promptsToExport,
        };
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `promptcat_prompts_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data && (data.prompts || data.folders)) {
                    const isPartial =
                        (data.prompts && !data.folders) ||
                        (!data.prompts && data.folders) ||
                        (data.prompts && data.folders && data.globalTags === undefined);
                    let confirmed = true;
                    if (!isPartial) {
                        confirmed = await ModalService.confirm('This will overwrite all current data. This action cannot be undone.', {
                            title: 'Confirm Import',
                            confirmBtnText: 'Overwrite',
                            danger: true,
                        });
                    } else {
                        confirmed = await ModalService.confirm('This will add data from the selected file. Existing data will be kept.', {
                            title: 'Confirm Partial Import',
                            confirmBtnText: 'Append',
                        });
                    }

                    if (confirmed) {
                        if (!isPartial) {
                            await DB.clear(DB.STORES.PROMPTS);
                            await DB.clear(DB.STORES.FOLDERS);
                            await DB.clear(DB.STORES.TAGS);
                        }

                        if (data.folders) {
                            const existingFolders = await DB.getAll(DB.STORES.FOLDERS);
                            const existingFolderIds = new Set(existingFolders.map((f) => f.id));
                            const newFolders = data.folders.filter((f) => !existingFolderIds.has(f.id));
                            await DB.bulkPut(DB.STORES.FOLDERS, newFolders);
                        }

                        if (data.prompts) {
                            const existingPrompts = await DB.getAll(DB.STORES.PROMPTS);
                            const existingPromptIds = new Set(existingPrompts.map((p) => p.id));
                            const newPrompts = data.prompts.filter((p) => !existingPromptIds.has(p.id));
                            await DB.bulkPut(DB.STORES.PROMPTS, newPrompts);
                        }

                        if (data.globalTags) {
                            const existingTags = await DB.getAll(DB.STORES.TAGS);
                            const existingTagIds = new Set(existingTags.map((t) => t.id));
                            const newTags = data.globalTags.filter((t) => !existingTagIds.has(t)).map((tag) => ({ id: tag }));
                            await DB.bulkPut(DB.STORES.TAGS, newTags);
                        }

                        state.currentPromptId = null;
                        state.isCreatingNew = false;
                        state.view = { type: 'folder', id: 'all' };
                        await loadData();
                        updateUI();
                        await ModalService.alert('Import successful!', 'Success');
                    }
                } else {
                    await ModalService.alert('The selected file has an invalid format.', 'Import Error');
                }
            } catch (error) {
                await ModalService.alert('An error occurred while reading or parsing the file.', 'Import Error');
            }
        };
        reader.readAsText(file);
        UI.importFileInput.value = '';
    }

    async function handleExport() {
        if (state.prompts.length === 0 && state.folders.length === 0) {
            ModalService.alert("There's no data to export.", 'Export Empty');
            return;
        }
        const dataToExport = {
            prompts: await DB.getAll(DB.STORES.PROMPTS),
            folders: await DB.getAll(DB.STORES.FOLDERS),
            globalTags: (await DB.getAll(DB.STORES.TAGS)).map((t) => t.id),
        };
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `promptcat_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async function handleResetAllData() {
        await DB.clear(DB.STORES.PROMPTS);
        await DB.clear(DB.STORES.FOLDERS);
        await DB.clear(DB.STORES.TAGS);
        location.reload();
    }

    function renderTagSuggestions(inputValue) {
        if (!inputValue) {
            UI.tagSuggestions.style.display = 'none';
            return;
        }
        const allTags = [...new Set([...state.prompts.flatMap((p) => p.tags || []), ...state.globalTags])];
        const suggestions = allTags.filter((tag) => tag.toLowerCase().includes(inputValue.toLowerCase()) && !state.currentTags.includes(tag));
        if (suggestions.length > 0) {
            UI.tagSuggestions.textContent = '';
            suggestions.forEach((tag) => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.dataset.tag = tag;
                div.textContent = tag;
                UI.tagSuggestions.appendChild(div);
            });
            UI.tagSuggestions.style.display = 'block';
        } else {
            UI.tagSuggestions.style.display = 'none';
        }
    }

    function handleSuggestionClick(e) {
        const tag = e.target.dataset.tag;
        if (tag) {
            addTag(tag);
            UI.tagsInput.value = '';
            UI.tagSuggestions.style.display = 'none';
            UI.tagsInput.focus();
        }
    }

    function handleTagInput() {
        const value = UI.tagsInput.value;
        if (value.endsWith(',')) {
            addTag(value.slice(0, -1));
            UI.tagsInput.value = '';
        }
        renderTagSuggestions(UI.tagsInput.value);
    }

    function handleTagInputKeydown(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag(UI.tagsInput.value);
            UI.tagsInput.value = '';
            UI.tagSuggestions.style.display = 'none';
        }
    }

    function handleCopyPrompt() {
        if (navigator.clipboard) {
            navigator.clipboard
                .writeText(UI.promptBody.value)
                .then(() => {
                    if (state.copyTimeout) clearTimeout(state.copyTimeout);
                    UI.copyPromptBtn.classList.add('copied');
                    const originalTitle = UI.copyPromptBtn.title;
                    UI.copyPromptBtn.title = 'Copied!';
                    UI.copyPromptBtn.querySelector('.copy-icon-svg').style.display = 'none';
                    UI.copyPromptBtn.querySelector('.check-icon-svg').style.display = 'block';
                    state.copyTimeout = setTimeout(() => {
                        UI.copyPromptBtn.classList.remove('copied');
                        UI.copyPromptBtn.title = originalTitle;
                        UI.copyPromptBtn.querySelector('.copy-icon-svg').style.display = 'block';
                        UI.copyPromptBtn.querySelector('.check-icon-svg').style.display = 'none';
                    }, 2000);
                })
                .catch(() => {
                    ModalService.alert('Could not copy to clipboard.');
                });
        }
    }

    async function handleToggleFolderLock() {
        const folder = state.folders.find((f) => f.id === state.folderToEditId);
        if (!folder) return;

        hideModal(UI.folderSettingsModal); // Hide first to allow other modals

        if (folder.isLocked) {
            // Unlock
            const password = await ModalService.password(`Enter password to unlock "${folder.name}"`);
            if (!password) return;
            const check = await CryptoService.decrypt(folder.passwordCheck, password);
            if (check !== String(folder.id)) {
                await ModalService.alert('Incorrect password.');
                return;
            }
            folder.isLocked = false;
            folder.passwordCheck = null;
            const promptsToUpdate = state.prompts.filter((p) => p.folderId === folder.id);
            for (const p of promptsToUpdate) {
                p.body = await CryptoService.decrypt(p.body, password);
                p.notes = await CryptoService.decrypt(p.notes, password);
            }
            await DB.bulkPut(DB.STORES.PROMPTS, promptsToUpdate);
            await DB.put(DB.STORES.FOLDERS, folder);
        } else {
            // Lock
            const password = await ModalService.password(`Set a password for "${folder.name}"`);
            if (!password) return;
            folder.isLocked = true;
            folder.passwordCheck = await CryptoService.encrypt(String(folder.id), password);
            const promptsToUpdate = state.prompts.filter((p) => p.folderId === folder.id);
            for (const p of promptsToUpdate) {
                p.body = await CryptoService.encrypt(p.body, password);
                p.notes = await CryptoService.encrypt(p.notes, password);
            }
            await DB.bulkPut(DB.STORES.PROMPTS, promptsToUpdate);
            await DB.put(DB.STORES.FOLDERS, folder);
        }
        updateUI();
    }

    async function handlePromptLockToggle(e) {
        const isChecked = e.target.checked;
        const currentState = getPromptDetailsState();
        const scrollPosition = UI.promptList.scrollTop;

        if (state.isCreatingNew) {
            if (isChecked) {
                const password = await ModalService.password('Set a password for this new prompt:');
                if (password) {
                    state.newPromptLockInfo = { password };
                } else {
                    e.target.checked = false;
                    currentState.isLocked = false;
                }
            } else {
                state.newPromptLockInfo = null;
            }
            setPromptDetailsState(currentState);
            return;
        }

        const prompt = state.prompts.find((p) => p.id === state.currentPromptId);
        if (!prompt) return;

        if (isChecked) {
            // Locking
            const password = await ModalService.password('Set a password for this prompt:');
            if (password) {
                prompt.isLocked = true;
                prompt.body = await CryptoService.encrypt(UI.promptBody.value, password);
                prompt.notes = await CryptoService.encrypt(UI.promptNotes.value, password);
                prompt.passwordCheck = await CryptoService.encrypt(String(prompt.id), password);
                // Don't automatically store in session - only store if user chooses "remember"
                await DB.put(DB.STORES.PROMPTS, prompt);
            } else {
                e.target.checked = false;
            }
        } else {
            // Unlocking
            const password = await ModalService.password('Enter password to unlock:');
            if (password) {
                const check = await CryptoService.decrypt(prompt.passwordCheck, password);
                if (check === String(prompt.id)) {
                    prompt.isLocked = false;
                    prompt.body = await CryptoService.decrypt(prompt.body, password);
                    prompt.notes = await CryptoService.decrypt(prompt.notes, password);
                    delete prompt.passwordCheck;
                    // Don't automatically store in session - only store if user chooses "remember"
                    await DB.put(DB.STORES.PROMPTS, prompt);
                    // Update the UI with decrypted content
                    UI.promptBody.value = await CryptoService.decrypt(prompt.body, password);
                    UI.promptNotes.value = await CryptoService.decrypt(prompt.notes, password);
                    updateCharCounter();
                } else {
                    await ModalService.alert('Incorrect password.');
                    e.target.checked = true;
                }
            } else {
                e.target.checked = true;
            }
        }
        // Only update the prompt list, not the entire UI
        renderPrompts();
        UI.promptList.scrollTop = scrollPosition;
    }

    init();
});
