// CodeMirror 6-based CSS editor (npm imports bundled at build time)
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { css as cssLang } from '@codemirror/lang-css';

// Params from URL (do NOT double-decode; URLSearchParams already decodes)
const params = new URLSearchParams(window.location.search);
const engineId = params.get('id') || '';
const engineName = params.get('name') || '';
const urlCSS = params.get('css');

// Resolve initial CSS safely; if absent or invalid, we'll fallback to storage
let initialCSS = '';
try {
    initialCSS = (urlCSS == null || urlCSS === 'undefined') ? '' : String(urlCSS);
} catch (_) {
    initialCSS = '';
}

let view = null;

window.addEventListener('DOMContentLoaded', async () => {
    // Title
    const titleElement = document.getElementById('editor-title');
    if (titleElement && engineName) {
        titleElement.textContent = `CSS Editor: ${engineName}`;
    }

    // Determine starting CSS: prefer URL param; if missing/invalid, pull from storage
    let startCSS = initialCSS;
    if (!startCSS && engineId) {
        try {
            const storage = (typeof browser !== 'undefined' && browser.storage && browser.storage.local)
                ? browser.storage.local
                : (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local)
                    ? chrome.storage.local
                    : null;
            if (storage && typeof storage.get === 'function') {
                const result = await storage.get('quickPreview');
                const qp = result && result.quickPreview ? result.quickPreview : {};
                const cssFromStorage = qp.engines && qp.engines[engineId] && qp.engines[engineId].customCSS;
                if (typeof cssFromStorage === 'string') {
                    startCSS = cssFromStorage;
                }
            }
        } catch (_) {
            // ignore and use empty/default
        }
    }

    // Create CM6 editor
    const parent = document.getElementById('editor');
    const startState = EditorState.create({
        doc: startCSS || '',
        extensions: [
            cssLang(),
            history(),
            keymap.of([
                ...defaultKeymap,
                ...historyKeymap,
                {
                    key: 'Mod-s',
                    preventDefault: true,
                    run: () => {
                        saveCSS();
                        return true;
                    },
                },
            ]),
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
            highlightActiveLine(),
            EditorView.lineWrapping,
            EditorView.updateListener.of(() => {}),
        ],
    });

    view = new EditorView({ state: startState, parent });

    // Buttons
    document.querySelector('.cancel')?.addEventListener('click', cancelEdit);
    document.querySelector('.save')?.addEventListener('click', saveCSS);
});

function cancelEdit() {
    window.close();
}

function saveCSS() {
    const css = view ? view.state.doc.toString() : '';
    if (window.opener) {
        window.opener.postMessage(
            {
                type: 'quickPreviewCSS',
                id: engineId,
                css,
            },
            window.location.origin
        );
    }
    window.close();
}
