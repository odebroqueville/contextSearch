/// Import browser polyfill for compatibility with Chrome and other browsers
import '/libs/browser-polyfill.min.js';

// Import bookmark utilities
import { getSearchEngines, isItemBookmarked, createBookmarkIcon } from './bookmark-utils.js';

document.addEventListener('DOMContentLoaded', getHistoryItems);

// Function to safely decode HTML entities without using innerHTML
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

async function getHistoryItems() {
    const historyItems = (await browser.storage.local.get('historyItems')).historyItems;
    const searchTerms = (await browser.storage.local.get('searchTerms')).searchTerms;
    await browser.storage.local.remove(['historyItems', 'searchTerms']);
    const ol = document.getElementById('historyItems');
    const h2 = document.getElementById('title');
    
    if (searchTerms && searchTerms.trim() !== "") {
        h2.textContent = "History search results for " + searchTerms;
    } else {
        h2.textContent = "All history";
    }
    console.log("Debug: historyItems received:", historyItems);
    console.log("Debug: historyItems length:", historyItems ? historyItems.length : 'undefined');
    console.log("Debug: searchTerms:", searchTerms);

    // Safety check - ensure historyItems is an array
    if (!historyItems || !Array.isArray(historyItems)) {
        console.error("Debug: historyItems is not a valid array:", historyItems);
        h2.textContent = "No history items found";
        return;
    }

    // Pagination setup
    const itemsPerPage = 10;
    const totalItems = historyItems.length;
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
    async function renderPage(page) {
        // Clear existing items by removing all child elements
        while (ol.firstChild) {
            ol.removeChild(ol.firstChild);
        }
        
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
        const pageItems = historyItems.slice(startIndex, endIndex);

        // Set the starting number for the ordered list based on current page
        ol.start = startIndex + 1;

        // Get fresh search engines for bookmark checking
        const currentSearchEngines = await getSearchEngines();

        // Process history items for current page
        for (let item of pageItems) {
            const lvt = "Last Visit Time: " + new Date(item.lastVisitTime).toLocaleDateString();
            let li = document.createElement('li');
            li.className = 'history-item';

            let title = document.createElement('h3');
            // Decode HTML entities in the title safely
            title.textContent = decodeHtmlEntities(item.title || 'Untitled');
            title.className = 'history-title';

            let url = document.createElement('p');
            url.textContent = item.url;
            url.className = 'history-url';

            let lastVisitTime = document.createElement('p');
            lastVisitTime.textContent = lvt;
            lastVisitTime.className = 'history-visit-time';

            // Add bookmark icon for history items
            if (item.url && item.url.trim() !== "") {
                const isBookmarked = isItemBookmarked(currentSearchEngines, item.url);
                const bookmarkIcon = createBookmarkIcon(item.url, item.title || 'Untitled', isBookmarked);
                li.appendChild(bookmarkIcon);
            }

            li.appendChild(title);
            li.appendChild(url);
            li.appendChild(lastVisitTime);
            ol.appendChild(li);
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
            prevButton.onclick = async () => {
                currentPage--;
                await renderPage(currentPage);
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
            firstPageButton.onclick = async () => {
                currentPage = 1;
                await renderPage(currentPage);
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
            
            pageButton.onclick = async () => {
                currentPage = i;
                await renderPage(currentPage);
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
            lastPageButton.onclick = async () => {
                currentPage = totalPages;
                await renderPage(currentPage);
                renderPaginationControls();
            };
            paginationContainer.appendChild(lastPageButton);
        }

        // Next button
        if (currentPage < totalPages) {
            const nextButton = document.createElement('button');
            nextButton.textContent = 'Next →';
            nextButton.className = 'pagination-button next-button';
            nextButton.onclick = async () => {
                currentPage++;
                await renderPage(currentPage);
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
    await renderPage(currentPage);
    renderPaginationControls();
}