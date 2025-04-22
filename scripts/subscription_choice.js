import ExtPay from '/libs/ExtPay.js';

const extpay = ExtPay('context-search');

document.getElementById('trialBtn').addEventListener('click', () => {
    extpay.openTrialPage('7-day');
    setTimeout(() => window.close(), 100);
});

document.getElementById('subBtn').addEventListener('click', () => {
    extpay.openPaymentPage().then(() => window.close());
});
