# Context Search

Firefox add-on to search selected text in a web page using your favorite search engines.

## How does it work?
<ul>
<li>Select some text on a webpage</li>
<li>Right click (or Alt-click) on a selection</li>
<li>A context menu (or a grid of icons) appears, displaying the list of search engines chosen in the extension's preferences</li>
<li>Click on the search engine with which you’d like to search for the selected text</li>
</ul>

The search results will appear as defined in the extension's preferences page.

UPDATE 28/03/2019: The extension now also includes an EXIF viewer. To view the EXIF tags associated with an image, right-click on the image and select: "View EXIF tags..". If present, the EXIF tags will appear in the sidebar along with a color histogram.

## Managing search engines
To manage your favorite search engines, you can go to the preferences page of Context Search. You can reach this page by opening the extensions page (Addon Manager) where all your add-ons are listed and then clicking on the "Preferences" button.

![How to define a search engine](images/searchEngineDescription.jpg)

<ol>
<li>The checkbox at the start of a line determines whether the search engine should appear in the context menu.</li>
<li>The next item on the line contains the name of the search engine and is followed by a keyword.</li>
<li>This keyword is used in the url address bar (or omnibox) after the word “cs “ and before the search terms (e.g. to search for linux using the search engine Wikipedia, you would type: ‘cs w linux’, where w is the keyword assigned to Wikipedia).</li>
<li>The second checkbox specifies whether you’d like to use the search engine in a “multi-search”. A “multi-search” is a search performed using multiple search engines and can be selected in the context menu.</li>
<li>The checkbox is followed by the search query string. This is the generic url you would use to perform a search. Search query strings may contain the parameters %s or {searchTerms} where you'd like your search terms to appear, i.e. the selected text.</li>
<li>The up and down arrows move each search engine up or down in the list.</li>
<li>Click on the trash icon to remove a search engine from the list.</li>
</ol>

The 'Reset' button will re-load the default list of search engines and their associated favicons.

You can also import a JSON file containing your own list of search engines. It is strongly recommended to export your customized list of search engines as a backup in case anything goes wrong.

## How to perform a search in the omnibox

In the omnibox (or url address bar), type 'cs ' (without the quotes, and where cs stands for Context Search) followed by the keyword you have chosen for your seaarch engine in the extension's preferences, e.g. 'w ' (again without quotes) for Wikipedia, followed by your search term(s).

Here is an example:
cs w atom

The above will search for the word 'atom' in Wikipedia.

## The main structure of a JSON file containing the search engines
```javascript
{
  "id": {
    "index": 0,
    "name": "search engine's name",
    "keyword": "keyword to be used in an omnibox search",
    "multitab": "takes the value true or false depending on whether this search engine should be included in a multi-search or not",
    "url": "search engine query string (without the search terms)",
    "show": "takes the value true if the search engine is to be shown in the context menu or false if not",
    "base64": "a base 64 string representation of the search engine's favicon" 
  }
}
```

Here is an example of a JSON file containing 3 search engines:
```javascript
{
  "bing": {
    "index": 0,
    "name": "Bing",
    "keyword": "b",
    "multitab": false,
    "url": "https://www.bing.com/search?q=",
    "show": true,
    "base64": ""
  },
  "google": {
    "index": 1,
    "name": "Google",
    "keyword": "g",
    "multitab": false,
    "url": "https://www.google.com/search?q=",
    "show": true,
    "base64": ""
  },
  "yahoo": {
    "index": 2,
    "name": "Yahoo!",
    "keyword": "y",
    "multitab": false,
    "url": "https://search.yahoo.com/search?p=",
    "show": true,
    "base64": ""
  }  
}
```

It is not required to provide the base 64 string representation of any search engine's favicon. This string will automatically be loaded for you.

The Firefox add-on may be found here:
https://addons.mozilla.org/firefox/addon/contextual-search/

## Special thanks to the following contributors for the translations

<ul>
<li>Geoffrey De Belie for the Dutch translation</li>
<li>Krzysztof Galazka for the Polish translation</li>
<li>Sergio Tombesi for the Italian and Spanish translations</li>
<li>Fushan Wen for the Chinese translation</li>
</ul>

## Code made by others used in this extension

<ul>
<li>exif.js v2.3.0 originally by Jacob Seidelin and modified by Bart van der Wal which can be found on Github: https://github.com/exif-js/exif-js</li>
<li>Rgraph v5.01 by Richard Heyes, which can be found here: https://www.rgraph.net/</li>
</ul>
