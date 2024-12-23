document.addEventListener('DOMContentLoaded', async () => {
    // Focus on the No button by default to prevent accidental removal of a bookmark
    document.getElementById("noBtn").focus();

    // Retrieve the parent tab's url from the URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const url = urlParams.get('url');

    // Get the buttons
    const yesBtn = document.getElementById("yesBtn");
    const noBtn = document.getElementById("noBtn");

    let searchEngines = await browser.storage.local.get();

    // Handle Yes button click
    yesBtn.onclick = async () => {
        for (const id in searchEngines) {
            if (id.startsWith('link-') && searchEngines[id].url && searchEngines[id].url === url) {
                delete searchEngines[id];
                await sendMessage('saveSearchEngines', searchEngines);
                window.close();
                break;
            }
        }
        // If no matching bookmark found, display a warning message for 4 seconds
        const warning = document.getElementById("warning");
        setTimeout(() => {
            warning.style.color = 'red';
            warning.style.weight = 'bold';
            warning.textContent = 'The bookmark could not be found in Context Search';
        }, 4000);
        warning.textContent = '';
        window.close();
    }

    // Handle No button click
    noBtn.onclick = () => {
        window.close();
    }
});

// Send a message to the background script
async function sendMessage(action, data) {
    await browser.runtime.sendMessage({ action: action, data: JSON.parse(JSON.stringify(data)) })
        .catch(e => {
            if (logToConsole) console.error(e);
        });
}