document.addEventListener('DOMContentLoaded', getHistoryItems);

async function getHistoryItems() {
    const bookmarkItems = (await browser.storage.local.get('bookmarkItems')).bookmarkItems;
    const searchTerms = (await browser.storage.local.get('searchTerms')).searchTerms;
    await browser.storage.local.remove(['bookmarkItems', 'searchTerms']);
    const ol = document.getElementById('bookmarkItems');
    const h2 = document.getElementById('title');
    if (searchTerms && searchTerms !== "recent") {
        h2.textContent = "Bookmarks search results for " + searchTerms;
    } else if (searchTerms === "recent") {
        h2.textContent = "Recent bookmarks";
    } else {
        h2.textContent = "All bookmarks";
    }
    console.log(bookmarkItems);
    console.log(searchTerms);
    for (let item of bookmarkItems) {
        const da = "Date added: " + new Date(item.dateAdded);
        let li = document.createElement('li');
        li.style.margin = '0px';
        li.style.padding = '0px';
        let title = document.createElement('h3');
        title.textContent = item.title;
        let url = document.createElement('p');
        url.textContent = item.url;
        let dateAdded = document.createElement('p');
        dateAdded.textContent = da;
        li.appendChild(title);
        li.appendChild(url);
        li.appendChild(dateAdded);
        ol.appendChild(li);
    }
}