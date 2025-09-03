/// Import browser polyfill for compatibility with Chrome and other browsers
import '/libs/browser-polyfill.min.js';

// Function to get stored search engines
async function getSearchEngines() {
    const result = await browser.storage.local.get('searchEngines');
    return result.searchEngines || {};
}

// Function to save search engines
async function saveSearchEngines(searchEngines) {
    await browser.runtime.sendMessage({ 
        action: 'saveSearchEngines', 
        data: JSON.parse(JSON.stringify(searchEngines)) 
    });
}

// Function to find or create the "Bookmarks" folder
function findOrCreateBookmarksFolder(searchEngines) {
    // Look for existing "Bookmarks" folder
    for (const id in searchEngines) {
        if (searchEngines[id].isFolder && searchEngines[id].name === 'Bookmarks') {
            return id;
        }
    }
    
    // Create "Bookmarks" folder if it doesn't exist
    const bookmarksFolderId = 'bookmarks-folder-' + Date.now();
    const rootChildren = searchEngines.root ? searchEngines.root.children : [];
    
    searchEngines[bookmarksFolderId] = {
        index: rootChildren.length,
        name: 'Bookmarks',
        isFolder: true,
        children: [],
        show: true
    };
    
    if (!searchEngines.root) {
        searchEngines.root = {
            index: 0,
            name: 'Root',
            isFolder: true,
            children: []
        };
    }
    
    searchEngines.root.children.push(bookmarksFolderId);
    
    return bookmarksFolderId;
}

// Function to check if an item is bookmarked
function isItemBookmarked(searchEngines, itemUrl) {
    const bookmarksFolderId = findBookmarksFolder(searchEngines);
    if (!bookmarksFolderId) return false;
    
    const bookmarksFolder = searchEngines[bookmarksFolderId];
    if (!bookmarksFolder || !bookmarksFolder.children) return false;
    
    // Check if any bookmark in the folder matches this item
    for (const childId of bookmarksFolder.children) {
        const child = searchEngines[childId];
        if (child && child.url === itemUrl) {
            return true;
        }
    }
    
    return false;
}

// Function to find existing "Bookmarks" folder (without creating)
function findBookmarksFolder(searchEngines) {
    for (const id in searchEngines) {
        if (searchEngines[id].isFolder && searchEngines[id].name === 'Bookmarks') {
            return id;
        }
    }
    return null;
}

// Function to add an item to bookmarks
async function addItemToBookmarks(itemUrl, itemTitle) {
    const searchEngines = await getSearchEngines();
    const bookmarksFolderId = findOrCreateBookmarksFolder(searchEngines);
    const bookmarksFolder = searchEngines[bookmarksFolderId];
    
    // Check if already bookmarked
    if (isItemBookmarked(searchEngines, itemUrl)) {
        return false; // Already bookmarked
    }
    
    // Generate unique ID for the bookmark
    let id = 'link-' + itemTitle.trim().replaceAll(' ', '-').toLowerCase();
    id = id.substring(0, 25);
    
    // Ensure ID is unique
    while (searchEngines[id]) {
        id = 'link-' + itemTitle.trim().replaceAll(' ', '-').toLowerCase() + '-' + Date.now();
    }
    
    // Create the bookmark entry
    searchEngines[id] = {
        index: bookmarksFolder.children.length,
        name: itemTitle,
        keyword: '',
        keyboardShortcut: '',
        multitab: false,
        url: itemUrl,
        show: true,
        isFolder: false
    };
    
    // Add to bookmarks folder
    bookmarksFolder.children.push(id);
    
    // Save changes
    await saveSearchEngines(searchEngines);
    return true;
}

// Function to remove an item from bookmarks
async function removeItemFromBookmarks(itemUrl) {
    const searchEngines = await getSearchEngines();
    const bookmarksFolderId = findBookmarksFolder(searchEngines);
    
    if (!bookmarksFolderId) return false;
    
    const bookmarksFolder = searchEngines[bookmarksFolderId];
    if (!bookmarksFolder || !bookmarksFolder.children) return false;
    
    // Find and remove the matching bookmark
    for (let i = 0; i < bookmarksFolder.children.length; i++) {
        const childId = bookmarksFolder.children[i];
        const child = searchEngines[childId];
        
        if (child && child.url === itemUrl) {
            // Remove from folder children array
            bookmarksFolder.children.splice(i, 1);
            
            // Delete the bookmark entry
            delete searchEngines[childId];
            
            // Update indices for remaining bookmarks
            for (let j = i; j < bookmarksFolder.children.length; j++) {
                const remainingChildId = bookmarksFolder.children[j];
                if (searchEngines[remainingChildId]) {
                    searchEngines[remainingChildId].index = j;
                }
            }
            
            // Save changes
            await saveSearchEngines(searchEngines);
            return true;
        }
    }
    
    return false;
}

// Function to create bookmark icon element
function createBookmarkIcon(itemUrl, itemTitle, isBookmarked, onToggle) {
    const iconContainer = document.createElement('div');
    iconContainer.className = 'bookmark-icon-container';
    
    const icon = document.createElement('img');
    icon.className = 'bookmark-icon';
    icon.src = isBookmarked ? '/icons/bookmark-grey-icon.svg' : '/icons/bookmark-red-icon.svg';
    icon.alt = isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks';
    icon.title = isBookmarked ? 'Remove from Context Search bookmarks' : 'Add to Context Search bookmarks';
    
    // Add click handler
    icon.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            let success;
            if (isBookmarked) {
                success = await removeItemFromBookmarks(itemUrl);
                if (success) {
                    icon.src = '/icons/bookmark-red-icon.svg';
                    icon.alt = 'Add to bookmarks';
                    icon.title = 'Add to Context Search bookmarks';
                    isBookmarked = false;
                }
            } else {
                success = await addItemToBookmarks(itemUrl, itemTitle);
                if (success) {
                    icon.src = '/icons/bookmark-grey-icon.svg';
                    icon.alt = 'Remove from bookmarks';
                    icon.title = 'Remove from Context Search bookmarks';
                    isBookmarked = true;
                }
            }
            
            if (onToggle) {
                onToggle(isBookmarked);
            }
        } catch (error) {
            console.error('Error toggling bookmark:', error);
        }
    });
    
    iconContainer.appendChild(icon);
    return iconContainer;
}

export {
    getSearchEngines,
    isItemBookmarked,
    addItemToBookmarks,
    removeItemFromBookmarks,
    createBookmarkIcon
};
