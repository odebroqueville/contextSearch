// Get URL parameters
const params = new URLSearchParams(window.location.search);
const engineId = params.get('id');
const engineName = params.get('name');
const currentCSS = params.get('css') || '';

// Initialize the page on load
window.addEventListener('DOMContentLoaded', () => {
    // Set the title
    const titleElement = document.getElementById('editor-title');
    if (titleElement && engineName) {
        titleElement.textContent = `CSS Editor: ${decodeURIComponent(engineName)}`;
    }

    // Set the current CSS value
    const textarea = document.getElementById('css-editor');
    if (textarea) {
        textarea.value = decodeURIComponent(currentCSS);
    }

    // Add event listeners to buttons
    const cancelButton = document.querySelector('.cancel');
    const saveButton = document.querySelector('.save');

    if (cancelButton) {
        cancelButton.addEventListener('click', cancelEdit);
    }

    if (saveButton) {
        saveButton.addEventListener('click', saveCSS);
    }
});

function cancelEdit() {
    console.log('[CSS Editor] Cancel button clicked');
    window.close();
}

function saveCSS() {
    console.log('[CSS Editor] Save button clicked');
    const css = document.getElementById('css-editor').value;
    console.log('[CSS Editor] Saving CSS:', css);
    console.log('[CSS Editor] Engine ID:', engineId);

    if (window.opener) {
        window.opener.postMessage(
            {
                type: 'quickPreviewCSS',
                id: engineId,
                css: css,
            },
            window.location.origin
        );
        console.log('[CSS Editor] Message sent to opener');
    } else {
        console.error('[CSS Editor] No window.opener available');
    }

    window.close();
}
