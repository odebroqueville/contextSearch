/// Import browser polyfill for compatibility with Chrome and other browsers
import '/libs/browser-polyfill.min.js';

document.addEventListener('DOMContentLoaded', getBookmarkItems);

// Function to safely decode HTML entities
function decodeHtmlEntities(text) {
    const entities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#x27;': "'",
        '&#x2F;': '/',
        '&#39;': "'",
        '&nbsp;': ' ',
        '&copy;': '©',
        '&reg;': '®',
        '&trade;': '™',
        '&hellip;': '…',
        '&mdash;': '—',
        '&ndash;': '–',
        '&lsquo;': '\u2018',
        '&rsquo;': '\u2019',
        '&ldquo;': '\u201C',
        '&rdquo;': '\u201D'
    };
    
    return text.replace(/&[#\w]+;/g, (entity) => {
        return entities[entity] || entity;
    });
}

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
        
        // Use regex to extract meta descriptions to avoid CSP issues with DOMParser
        // Try to get meta description first
        const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
        if (metaDescMatch && metaDescMatch[1]) {
            return decodeHtmlEntities(metaDescMatch[1].trim());
        }

        // Fallback to Open Graph description
        const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']*)["']/i);
        if (ogDescMatch && ogDescMatch[1]) {
            return decodeHtmlEntities(ogDescMatch[1].trim());
        }

        // Alternative meta description format
        const altMetaMatch = html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i);
        if (altMetaMatch && altMetaMatch[1]) {
            return decodeHtmlEntities(altMetaMatch[1].trim());
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
    
    if (searchTerms && searchTerms.trim() !== "" && searchTerms !== "recent") {
        h2.textContent = "Bookmarks search results for " + searchTerms;
    } else if (searchTerms === "recent") {
        h2.textContent = "Recent bookmarks";
    } else {
        h2.textContent = "All bookmarks";
    }
    console.log(bookmarkItems);
    console.log(searchTerms);

    // Pagination setup
    const itemsPerPage = 10;
    const totalItems = bookmarkItems.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    let currentPage = 1;

    // Create pagination container
    const paginationContainer = document.createElement('div');
    paginationContainer.id = 'pagination-container';
    paginationContainer.className = 'pagination-container';
    
    // Create a wrapper div for h2 and pagination controls on the same line
    const headerWrapper = document.createElement('div');
    headerWrapper.className = 'header-wrapper';
    
    // Insert wrapper before h2, then move h2 into wrapper
    h2.parentNode.insertBefore(headerWrapper, h2);
    headerWrapper.appendChild(h2);
    headerWrapper.appendChild(paginationContainer);
    
    // Create separate container for page info below
    const pageInfoContainer = document.createElement('div');
    pageInfoContainer.id = 'page-info-container';
    pageInfoContainer.className = 'page-info-container';
    headerWrapper.parentNode.insertBefore(pageInfoContainer, headerWrapper.nextSibling);

    // Function to render items for a specific page
    function renderPage(page) {
        // Clear existing items by removing all child elements
        while (ol.firstChild) {
            ol.removeChild(ol.firstChild);
        }
        
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
        const pageItems = bookmarkItems.slice(startIndex, endIndex);

        // Set the starting number for the ordered list based on current page
        ol.start = startIndex + 1;

        // Process bookmarks with descriptions for current page
        for (let item of pageItems) {
            const da = "Date added: " + new Date(item.dateAdded).toLocaleDateString();
            let li = document.createElement('li');
            li.className = 'bookmark-item';

            let title = document.createElement('h3');
            // Decode HTML entities in the title safely
            title.textContent = decodeHtmlEntities(item.title);
            title.className = 'bookmark-title';

            let url = document.createElement('a');
            if (item.url && item.url.trim() !== "") {
                url.href = item.url;
                url.textContent = item.url;
                url.target = '_blank';
            } else {
                url.textContent = '(No URL - likely a folder)';
                url.style.color = '#666';
                url.style.fontStyle = 'italic';
            }
            url.className = 'bookmark-url';

            let description = document.createElement('p');
            description.textContent = 'Loading description...';
            description.className = 'bookmark-description';

            let dateAdded = document.createElement('p');
            dateAdded.textContent = da;
            dateAdded.className = 'bookmark-date';

            li.appendChild(title);
            if (item.url && item.url.trim() !== "") {
                li.appendChild(url);
            }
            li.appendChild(description);
            li.appendChild(dateAdded);
            ol.appendChild(li);

            // Fetch description asynchronously (only for valid URLs)
            if (item.url && item.url.startsWith('http')) {
                fetchPageDescription(item.url).then(desc => {
                    if (desc) {
                        description.textContent = desc;
                    } else {
                        // No description available
                        description.textContent = '';
                        description.className = 'bookmark-description no-description';
                    }
                });
            } else {
                // No URL (likely a folder) or invalid URL
                description.textContent = '';
                description.className = 'bookmark-description no-description';
            }
        }
    }

    // Function to render pagination controls
    function renderPaginationControls() {
        // Clear existing controls by removing all child elements
        while (paginationContainer.firstChild) {
            paginationContainer.removeChild(paginationContainer.firstChild);
        }
        
        if (totalPages <= 1) {
            return; // No pagination needed
        }

        // Previous button
        if (currentPage > 1) {
            const prevButton = document.createElement('button');
            prevButton.textContent = '← Previous';
            prevButton.className = 'pagination-button prev-button';
            prevButton.onclick = () => {
                currentPage--;
                renderPage(currentPage);
                renderPaginationControls();
            };
            paginationContainer.appendChild(prevButton);
        }

        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust start if we're near the end
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Show first page if not in range
        if (startPage > 1) {
            const firstPageButton = document.createElement('button');
            firstPageButton.textContent = '1';
            firstPageButton.className = 'pagination-button page-number';
            firstPageButton.onclick = () => {
                currentPage = 1;
                renderPage(currentPage);
                renderPaginationControls();
            };
            paginationContainer.appendChild(firstPageButton);
            
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'pagination-ellipsis';
                paginationContainer.appendChild(ellipsis);
            }
        }

        // Page number buttons
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i.toString();
            pageButton.className = 'pagination-button page-number';
            
            if (i === currentPage) {
                pageButton.classList.add('current-page');
            }
            
            pageButton.onclick = () => {
                currentPage = i;
                renderPage(currentPage);
                renderPaginationControls();
            };
            paginationContainer.appendChild(pageButton);
        }

        // Show last page if not in range
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'pagination-ellipsis';
                paginationContainer.appendChild(ellipsis);
            }
            
            const lastPageButton = document.createElement('button');
            lastPageButton.textContent = totalPages.toString();
            lastPageButton.className = 'pagination-button page-number';
            lastPageButton.onclick = () => {
                currentPage = totalPages;
                renderPage(currentPage);
                renderPaginationControls();
            };
            paginationContainer.appendChild(lastPageButton);
        }

        // Next button
        if (currentPage < totalPages) {
            const nextButton = document.createElement('button');
            nextButton.textContent = 'Next →';
            nextButton.className = 'pagination-button next-button';
            nextButton.onclick = () => {
                currentPage++;
                renderPage(currentPage);
                renderPaginationControls();
            };
            paginationContainer.appendChild(nextButton);
        }

        // Page info - put in separate container below
        while (pageInfoContainer.firstChild) {
            pageInfoContainer.removeChild(pageInfoContainer.firstChild);
        }
        const pageInfo = document.createElement('div');
        pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${totalItems} items)`;
        pageInfo.className = 'pagination-info';
        pageInfoContainer.appendChild(pageInfo);
    }

    // Initial render
    renderPage(currentPage);
    renderPaginationControls();
}