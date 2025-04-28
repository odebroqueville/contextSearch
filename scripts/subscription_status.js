/// Import browser polyfill for compatibility with Chrome and other browsers
import '/libs/browser-polyfill.min.js';
import ExtPay from '/libs/ExtPay.js';
import { trialActive, daysRemaining, noTrialStarted, startTrial, trialExpired, subscriptionActive, subscriptionInactive, pay } from './constants';

const extpay = ExtPay('context-search');
const statusDiv = document.getElementById('status');

async function renderStatus() {
    // Clear previous content
    statusDiv.innerHTML = '';

    const user = await extpay.getUser();
    console.log('User status:', user); // Log user object
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
            console.log('Attempting to open trial page via background script...'); // Log before call
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

document.addEventListener('DOMContentLoaded', renderStatus);
