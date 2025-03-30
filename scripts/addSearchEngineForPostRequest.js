/// Import browser polyfill for compatibility with Chrome and other browsers
import '/libs/browser-polyfill.min.js';

// Add event listeners to the Cancel and OK buttons.
document.getElementById('cancel').addEventListener('click', closeModal);
document.getElementById('ok').addEventListener('click', submitForm);

async function submitForm() {
    const searchEngineName = document.getElementById('searchEngineName').value;
    const keyword = document.getElementById('keyword').value;
    const keyboardShortcut = document.getElementById('keyboardShortcut').value;

    // You can perform further actions with the form data, for example:
    console.log("Search Engine Name:", searchEngineName);
    console.log("Keyword:", keyword);
    console.log("Keyboard Shortcut:", keyboardShortcut);

    // Send the data back to the background script
    await browser.runtime.sendMessage({ action: 'addNewPostSearchEngine', data: { searchEngineName, keyword, keyboardShortcut } });

    closeModal();
}

function closeModal() {
    window.close();
}