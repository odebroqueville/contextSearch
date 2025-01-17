/// Import browser polyfill for compatibility with Chrome and other browsers
import '/libs/browser-polyfill.min.js';

document.addEventListener('DOMContentLoaded', getHistoryItems);

async function getHistoryItems() {
    const historyItems = (await browser.storage.local.get('historyItems')).historyItems;
    const searchTerms = (await browser.storage.local.get('searchTerms')).searchTerms;
    await browser.storage.local.remove(['historyItems', 'searchTerms']);
    const ol = document.getElementById('historyItems');
    const h2 = document.getElementById('title');
    if (searchTerms) {
        h2.textContent = "History search results for " + searchTerms;
    } else {
        h2.textContent = "All history";
    }
    console.log(historyItems);
    console.log(searchTerms);
    for (let item of historyItems) {
        const lvt = "Last Visit Time: " + new Date(item.lastVisitTime);
        let li = document.createElement('li');
        li.style.margin = '0px';
        li.style.padding = '0px';
        let title = document.createElement('h3');
        title.textContent = item.title;
        let url = document.createElement('p');
        url.textContent = item.url;
        let lastVisitTime = document.createElement('p');
        lastVisitTime.textContent = lvt;
        li.appendChild(title);
        li.appendChild(url);
        li.appendChild(lastVisitTime);
        ol.appendChild(li);
    }
}