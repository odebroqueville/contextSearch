/// Import browser polyfill for compatibility with Chrome and other browsers
import '/libs/browser-polyfill.min.js';

/* ---------------------------------------------
 * Storage helpers
 * ------------------------------------------- */
async function getSearchEngines() {
    const result = await browser.storage.local.get('searchEngines');
    return result.searchEngines || {};
}

async function saveSearchEngines(searchEngines) {
    await browser.runtime.sendMessage({
        action: 'saveSearchEngines',
        data: JSON.parse(JSON.stringify(searchEngines))
    });
}

/* ---------------------------------------------
 * Generic helpers
 * ------------------------------------------- */
function decodeHtmlEntities(text) {
    if (!text || typeof text !== 'string') return text;
    const entities = {
        '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
        '&#x27;': "'", '&#x2F;': '/', '&#39;': "'", '&nbsp;': ' ',
        '&copy;': '©', '&reg;': '®', '&trade;': '™', '&hellip;': '…',
        '&mdash;': '—', '&ndash;': '–', '&lsquo;': '\u2018', '&rsquo;': '\u2019',
        '&ldquo;': '\u201C', '&rdquo;': '\u201D'
    };
    return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity);
}

function isKeyAllowed(keyOrEvent) {
    const key = typeof keyOrEvent === 'string' ? keyOrEvent : keyOrEvent.key;
    const disallowed = [
        'Tab','Enter','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',
        'Escape',' ','Delete','Backspace','Home','End',
        'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12','F13','F14','F15','F16','F17','F18','F19'
    ];
    return !disallowed.includes(key);
}

function isInFocus(element) {
    return document.activeElement === element;
}

function isIdUnique(searchEngines, testId) {
    return !Object.prototype.hasOwnProperty.call(searchEngines, testId);
}

/* ---------------------------------------------
 * Platform / meta key helpers
 * ------------------------------------------- */
/**
 * Unified OS detection. Tries runtime message first (if background supplies it),
 * then falls back to browser.runtime.getPlatformInfo, and finally userAgent sniffing.
 * Returns one of: 'macOS','Windows','Linux','Android','iOS' or null.
 */
async function getOS() {
    try {
        // Attempt a background-assisted detection (if implemented)
        const api = typeof browser !== 'undefined' ? browser : chrome;
        if (api?.runtime?.sendMessage) {
            try {
                const resp = await api.runtime.sendMessage({ action: 'getOS' });
                if (resp && resp.os && resp.os !== 'Unknown') return resp.os;
            } catch (_) { /* ignore */ }
        }
        // Fallback to platformInfo (Firefox/Chromium extension API)
        if (browser?.runtime?.getPlatformInfo) {
            try {
                const info = await browser.runtime.getPlatformInfo();
                if (info?.os) {
                    switch (info.os) {
                        case 'mac': return 'macOS';
                        case 'win': return 'Windows';
                        case 'linux': return 'Linux';
                        case 'android': return 'Android';
                        case 'ios': return 'iOS';
                        default: break;
                    }
                }
            } catch (_) { /* ignore */ }
        }
        // User agent heuristic
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('mac os x')) return 'macOS';
        if (ua.includes('windows')) return 'Windows';
        if (ua.includes('android')) return 'Android';
        if (ua.includes('linux')) return 'Linux';
        if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) return 'iOS';
        return null;
    } catch (e) {
        console.error('getOS failed:', e);
        return null;
    }
}

/**
 * Returns meta key label depending on OS and preferred style.
 * style='display' -> user‑facing label (cmd+, win+, super+, meta+)
 * style='token'   -> canonical token used in internal storage (meta)
 */
function getMetaKey(os, style = 'display') {
    if (style === 'token') return 'meta';
    if (os === 'macOS') return 'cmd+';
    if (os === 'Windows') return 'win+';
    if (os === 'Linux') return 'super+';
    return 'meta+'; // Fallback
}

/* ---------------------------------------------
 * Bookmark folder helpers
 * ------------------------------------------- */
function findOrCreateBookmarksFolder(searchEngines) {
    for (const id in searchEngines) {
        if (searchEngines[id].isFolder && searchEngines[id].name === 'Bookmarks') {
            return id;
        }
    }
    const folderId = 'bookmarks-folder-' + Date.now();
    if (!searchEngines.root) {
        searchEngines.root = {
            index: 0,
            name: 'Root',
            isFolder: true,
            children: []
        };
    }
    const rootChildren = searchEngines.root.children;
    searchEngines[folderId] = {
        index: rootChildren.length,
        name: 'Bookmarks',
        isFolder: true,
        children: [],
        show: true
    };
    rootChildren.push(folderId);
    return folderId;
}

function findBookmarksFolder(searchEngines) {
    for (const id in searchEngines) {
        if (searchEngines[id].isFolder && searchEngines[id].name === 'Bookmarks') {
            return id;
        }
    }
    return null;
}

function isItemBookmarked(searchEngines, itemUrl) {
    const folderId = findBookmarksFolder(searchEngines);
    if (!folderId) return false;
    const folder = searchEngines[folderId];
    if (!folder || !folder.children) return false;
    for (const childId of folder.children) {
        const child = searchEngines[childId];
        if (child && child.url === itemUrl) return true;
    }
    return false;
}

/* ---------------------------------------------
 * Bookmark add/remove
 * ------------------------------------------- */
async function addItemToBookmarks(itemUrl, itemTitle) {
    const searchEngines = await getSearchEngines();
    const folderId = findOrCreateBookmarksFolder(searchEngines);
    const folder = searchEngines[folderId];
    if (isItemBookmarked(searchEngines, itemUrl)) return false;
    let id = 'link-' + itemTitle.trim().replaceAll(' ', '-').toLowerCase();
    id = id.substring(0, 25);
    while (searchEngines[id]) {
        id = 'link-' + itemTitle.trim().replaceAll(' ', '-').toLowerCase() + '-' + Date.now();
    }
    searchEngines[id] = {
        index: folder.children.length,
        name: itemTitle,
        keyword: '',
        keyboardShortcut: '',
        multitab: false,
        url: itemUrl,
        show: true,
        isFolder: false
    };
    folder.children.push(id);
    await saveSearchEngines(searchEngines);
    return true;
}

async function removeItemFromBookmarks(itemUrl) {
    const searchEngines = await getSearchEngines();
    const folderId = findBookmarksFolder(searchEngines);
    if (!folderId) return false;
    const folder = searchEngines[folderId];
    if (!folder || !folder.children) return false;
    for (let i = 0; i < folder.children.length; i++) {
        const childId = folder.children[i];
        const child = searchEngines[childId];
        if (child && child.url === itemUrl) {
            folder.children.splice(i, 1);
            delete searchEngines[childId];
            for (let j = i; j < folder.children.length; j++) {
                const remainingId = folder.children[j];
                if (searchEngines[remainingId]) {
                    searchEngines[remainingId].index = j;
                }
            }
            await saveSearchEngines(searchEngines);
            return true;
        }
    }
    return false;
}

/* ---------------------------------------------
 * UI helper (bookmark icon)
 * ------------------------------------------- */
function createBookmarkIcon(itemUrl, itemTitle, isBookmarked, onToggle) {
    const iconContainer = document.createElement('div');
    iconContainer.className = 'bookmark-icon-container';
    const icon = document.createElement('img');
    icon.className = 'bookmark-icon';
    icon.src = isBookmarked ? '/icons/bookmark-grey-icon.svg' : '/icons/bookmark-red-icon.svg';
    icon.alt = isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks';
    icon.title = isBookmarked ? 'Remove from Context Search bookmarks' : 'Add to Context Search bookmarks';
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
            if (onToggle) onToggle(isBookmarked);
        } catch (err) {
            console.error('Error toggling bookmark:', err);
        }
    });
    iconContainer.appendChild(icon);
    return iconContainer;
}

/* ---------------------------------------------
 * Exports
 * ------------------------------------------- */
export {
    // Storage
    getSearchEngines,
    saveSearchEngines,
    // Bookmark helpers
    findOrCreateBookmarksFolder,
    findBookmarksFolder,
    isItemBookmarked,
    addItemToBookmarks,
    removeItemFromBookmarks,
    createBookmarkIcon,
    // Generic helpers
    decodeHtmlEntities,
    isKeyAllowed,
    isInFocus,
    isIdUnique,
    // Platform helpers
    getOS,
    getMetaKey
};
