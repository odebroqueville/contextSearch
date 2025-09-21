/// Import browser polyfill for compatibility with Chrome and other browsers
import '/libs/browser-polyfill.min.js';
import ExtPay from '/libs/ExtPay.js';
import { trialActive, daysRemaining, noTrialStarted, startTrial, trialExpired, subscriptionActive, subscriptionInactive, pay } from './constants.js';

/* global DEBUG_VALUE */
const logToConsole = DEBUG_VALUE;

const extpay = ExtPay('context-search');
const statusDiv = document.getElementById('status');

async function renderStatus() {
    // Clear previous content without innerHTML
    statusDiv.textContent = '';

    const user = await extpay.getUser();
    if (logToConsole) console.log('User status:', user); // Log user object
    const now = new Date();
    const sevenDaysMs = 1000 * 60 * 60 * 24 * 7;
    let trialDaysRemaining = 0;

    if (user.trialStartedAt) {
        const elapsed = now - user.trialStartedAt;
        trialDaysRemaining = Math.max(0, Math.ceil((sevenDaysMs - elapsed) / (1000 * 60 * 60 * 24)));
    }

    // Display statuses
    if (trialDaysRemaining > 0) {
        const p = document.createElement('p');
        p.textContent = `${trialActive} ${trialDaysRemaining} ${daysRemaining}`;
        statusDiv.appendChild(p);
    } else if (!user.paid && !user.trialStartedAt) {
        const p = document.createElement('p');
        p.textContent = `${noTrialStarted}`;
        statusDiv.appendChild(p);

        const trialBtn = document.createElement('button');
        trialBtn.textContent = `${startTrial}`;
        trialBtn.addEventListener('click', () => {
            if (logToConsole) console.log('Attempting to open trial page via background script...'); // Log before call
            // Ask the background script to open the trial page
            browser.runtime.sendMessage({ action: "openTrialPage" });
            // Close the popup after sending the message
            setTimeout(() => window.close(), 100);
        });
        statusDiv.appendChild(trialBtn);
    } else if (trialDaysRemaining <= 0 && user.trialStartedAt) {
        const p = document.createElement('p');
        p.textContent = `${trialExpired}`;
        statusDiv.appendChild(p);
    }

    // Paid status
    if (user.paid) {
        const p = document.createElement('p');
        p.textContent = `${subscriptionActive}`;
        statusDiv.appendChild(p);
    } else {
        const p = document.createElement('p');
        p.textContent = `${subscriptionInactive}`;
        statusDiv.appendChild(p);

        const payBtn = document.createElement('button');
        payBtn.textContent = `${pay}`;
        payBtn.addEventListener('click', () => {
            // Ask background script to open payment page
            browser.runtime.sendMessage({ action: "openPaymentPage" });
            setTimeout(() => window.close(), 100);
        });
        statusDiv.appendChild(payBtn);
    }
}

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
    renderStatus();
    i18n();
});
