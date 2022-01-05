# Context Search

Firefox add-on to search selected text in a web page using your favorite search engines.

## How does it work

<ul>
<li>Select some text on a webpage</li>
<li>Right click (or Alt-click) on a selection</li>
<li>A context menu (or a grid of icons) appears, displaying the list of search engines chosen in the extension's preferences</li>
<li>Click on the search engine with which you’d like to search for the selected text</li>
</ul>

The search results will appear as defined in the extension's preferences page.

The extension includes an Image analysis tool. To analyse an image, right-click on the image and select: "Image analysis...". If present, the EXIF tags will appear in the sidebar along with a color histogram and color palette. A map will also show where the image was taken and in which direction if the GPS data is available.

## Managing search engines

To manage your favorite search engines, you can go to the preferences page of Context Search. You can reach this page by opening the extensions page (Addon Manager) where all your add-ons are listed and then clicking on the "Preferences" button.

![How to define a search engine](images/searchEngineDescription.png)

Please refer to the 4th screenshot above.

<ol>
<li>The checkbox at the start of a line determines whether the search engine should appear in the context menu.</li>
<li>The next item on the line contains the name of the search engine and is followed by a keyword.</li>
<li>This keyword is used in the url address bar (or omnibox) after the word “cs “ and before the search terms (e.g. to search for linux using the search engine Wikipedia, you would type: ‘cs w linux’, where w is the keyword assigned to Wikipedia).</li>
<li>Next, you can assign a keyboard shortcut to a search engine to perform a quick search. Please note that not all key combinations will work as some may be reserved by the browser or your system.</li>
<li>The second checkbox specifies whether you’d like to use the search engine in a “multi-search”. A “multi-search” is a search performed using multiple search engines and can be selected in the context menu of in the grid of icons.</li>
<li>The checkbox is followed by the search query string. This is the generic url you would use to perform a search. Search query strings may contain the parameters %s or {searchTerms} where you'd like your search terms, i.e. the selected text, to appear.</li>
<li>Click on and drag the move icon to the left of the trash icon to move each search engine up or down in the list.</li>
<li>Click on the trash icon to remove a search engine from the list.</li>
</ol>

The 'Reset' button will re-load the default list of search engines and their associated favicons.

You can also import a JSON file containing your own list of search engines. It is strongly recommended to export your customized list of search engines as a backup in case anything goes wrong.

## How to add a search engine to your custom list

* visit mycroftproject.com and right-click on the main link of a listed search engine
* use the page action (i.e. Context Search icon in the address bar) to add a search engine if the website supports open search
* add a search engine manually via the Options page (you can test the query string before adding the search engine)

## How to perform a search in the omnibox

In the omnibox (or url address bar), type 'cs ' (without the quotes, and where cs stands for Context Search) followed by the keyword you have chosen for your seaarch engine in the extension's preferences, e.g. 'w ' (again without quotes) for Wikipedia, followed by your search term(s). The dot ('.') and the exclamation mark ('!') are reserved keywords.

Here are some examples:

cs w atom
will search for the word 'atom' in Wikipedia.

cs .
will open the Options page

cs ! cold fusion
will perform a multi-search for the search terms 'cold fusion'

## Advanced feature

You can add a regular expression to each search engine. If the selected text matches the regex, then the search engine will appear in the context menu. As an example, imagine you had a search engine for booking.com and another for tripadvisor.com and you would like these search engines to appear in the context menu when a selection contains the word 'hotel'. Then, for those search engines, you'd enter the regex /hotel/. If you then make any other selection that doesn't contain the word "hotel" in it, those search engines won't appear in the context menu. There's a very useful website for building a regex: https://regex101.com. Another example is, if you select an IP address, then you might want the search engine corresponding to whatismyipaddress.com to appear. The regex here is a little more complicated to establish, but Google can help: search Google for "regex for ip address".

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

## Special thanks to the following contributors

<ul>
<li>Carl Scheller for implementing the drag & drop feature to move search engines in the Options page</li>
<li>Geoffrey De Belie for the Dutch translation</li>
<li>Krzysztof Galazka for the Polish translation</li>
<li>Sergio Tombesi for the Italian and Spanish translations</li>
<li>Fushan Wen for the Chinese translation</li>
<li>Sveinn í Felli for the Icelandic translation</li>
</ul>

## Code made by others used in this extension

<ul>
<li>exif.js v2.3.0 originally by Jacob Seidelin and modified by Bart van der Wal which can be found on Github: https://github.com/exif-js/exif-js/blob/v2.3.0/exif.js</li>
<li>2 libraries from RGraph v6.05 by Richard Heyes: Rgraph.svg.common.core.js which may be found here: https://www.rgraph.net/libraries/src/RGraph.svg.common.core.js and RGraph.svg.line.js which may be found here: https://www.rgraph.net/libraries/src/RGraph.svg.line.js</li>
<li>SortableJS v1.14.0 minified with many contributors, which can be found on GitHub here: https://github.com/SortableJS/Sortable/blob/1.14.0/Sortable.min.js</li>
<li>Leaflet v1.7.1 minified by Vladimir Agafonkin downloaded from https://leafletjs.com/download.html</li>
<li>Color Thief v2.3.2 minified by Lokesh Dhakar available from https://github.com/lokesh/color-thief/blob/master/dist/color-thief.min.js</li>
</ul>
