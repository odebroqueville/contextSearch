// CodeMirror 6-based CSS editor (npm imports bundled at build time)
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { css as cssLang } from '@codemirror/lang-css';

// Params from URL
const params = new URLSearchParams(window.location.search);
const engineId = params.get('id');
const engineName = params.get('name');
const currentCSS = decodeURIComponent(params.get('css') || '');

let view = null;

window.addEventListener('DOMContentLoaded', () => {
    // Title
    const titleElement = document.getElementById('editor-title');
    if (titleElement && engineName) {
        titleElement.textContent = `CSS Editor: ${decodeURIComponent(engineName)}`;
    }

    // Create CM6 editor
    const parent = document.getElementById('editor');
    const startState = EditorState.create({
        doc: currentCSS,
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
