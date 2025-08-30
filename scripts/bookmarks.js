/// Import browser polyfill for compatibility with Chrome and other browsers
import '/libs/browser-polyfill.min.js';

document.addEventListener('DOMContentLoaded', getBookmarkItems);

// Function to fetch page description from URL
async function fetchPageDescription(url) {
    try {
        // Use a CORS proxy or handle CORS issues
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors'
        });

        if (!response.ok) {
            return null;
        }

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Try to get meta description first
        const metaDescription = doc.querySelector('meta[name="description"]');
        if (metaDescription && metaDescription.content) {
            return metaDescription.content.trim();
        }

        // Fallback to Open Graph description
        const ogDescription = doc.querySelector('meta[property="og:description"]');
        if (ogDescription && ogDescription.content) {
            return ogDescription.content.trim();
        }

        // Fallback to first paragraph
        const firstParagraph = doc.querySelector('p');
        if (firstParagraph && firstParagraph.textContent) {
            const text = firstParagraph.textContent.trim();
            return text.length > 200 ? text.substring(0, 200) + '...' : text;
        }

        return null;
    } catch (error) {
        console.log('Failed to fetch description for:', url, error);
        return null;
    }
}

async function getBookmarkItems() {
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

    // Process bookmarks with descriptions
    for (let item of bookmarkItems) {
        const da = "Date added: " + new Date(item.dateAdded).toLocaleDateString();
        let li = document.createElement('li');
        li.className = 'bookmark-item';

        let title = document.createElement('h3');
        title.textContent = item.title;
        title.className = 'bookmark-title';

        let url = document.createElement('a');
        url.href = item.url;
        url.textContent = item.url;
        url.target = '_blank';
        url.className = 'bookmark-url';

        let description = document.createElement('p');
        description.textContent = 'Loading description...';
        description.className = 'bookmark-description';

        let dateAdded = document.createElement('p');
        dateAdded.textContent = da;
        dateAdded.className = 'bookmark-date';

        li.appendChild(title);
        li.appendChild(url);
        li.appendChild(description);
        li.appendChild(dateAdded);
        ol.appendChild(li);

        // Fetch description asynchronously
        fetchPageDescription(item.url).then(desc => {
            if (desc) {
                description.textContent = desc;
            } else {
                // No description available
                description.textContent = '';
                description.className = 'bookmark-description no-description';
            }
        });
    }
}