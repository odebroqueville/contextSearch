/// Import browser polyfill for compatibility with Chrome and other browsers
import '/libs/browser-polyfill.min.js';
import ExtPay from '/libs/ExtPay.js';

/* global DEBUG_VALUE */
const logToConsole = DEBUG_VALUE;
const extpay = ExtPay('context-search');

document.getElementById('trialBtn').addEventListener('click', () => {
    extpay.openTrialPage('7-day');
    setTimeout(() => window.close(), 100);
});

document.getElementById('subBtn').addEventListener('click', () => {
    extpay.openPaymentPage().then(() => window.close());
});

function i18n() {
    translateContent('data-i18n', 'textContent');
    translateContent('data-i18n-placeholder', 'placeholder');
    translateContent('data-i18n-title', 'title');
}

// Translate content based on data attributes
function translateContent(attribute, type) {
    let i18nElements = document.querySelectorAll('[' + attribute + ']');

    if (logToConsole) console.log(`Translating ${i18nElements.length} elements`);
    if (logToConsole) console.log('Translating:', i18nElements);

    i18nElements.forEach(i => {
        const i18n_attrib = i.getAttribute(attribute); // Get key before try block
        try {
            const message = browser.i18n.getMessage(i18n_attrib); // Call getMessage

            if (logToConsole) console.log(`Translating key: "${i18n_attrib}" used by element:`, i, 'Message:', message);

            // Check if the message is empty or same as the key (indicates missing translation)
            if (!message || message === i18n_attrib) {
                if (logToConsole) console.warn(`Translation missing for key: "${i18n_attrib}" used by element:`, i);
                // Optionally, leave the original text/placeholder/title instead of setting empty string
                return; // Skip applying the empty/missing translation
            }

            switch (type) {
                case 'textContent':
                    i.textContent = message;
                    break;
                case 'placeholder':
                    i.placeholder = message;
                    break;
                case 'title':
                    i.title = message;
                    break;
                default:
                    break;
            }
        } catch (ex) { // Catch errors during getMessage itself
            if (logToConsole) console.error(`Error getting translation for key "${i18n_attrib}":`, ex, "Element:", i);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    i18n();
});