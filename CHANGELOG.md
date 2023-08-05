4.6.2
=========

* Bug fix [#151](https://github.com/odebroqueville/contextSearch/issues/151)

4.6.1
---------

* Bug fix [#149](https://github.com/odebroqueville/contextSearch/issues/149)
* Fixes a bug where alt key couldn't be used for search engine keyboard shortcuts

4.6.0
---------

* Removed advanced feature related to regex
* Bug fix to allow Windows users of firefox to use the Alt key to display menu
* Bug fix: when using separators, Context Search would no longer be available in the context menu
* Added AI search options with ChatGPT, Google Bard, Perplexity.ai, Claude-instant on Poe, Llama2 on Poe and Poe Assistant (requires users to be logged in)

4.5.5
---------

* Bug fix [#143](https://github.com/odebroqueville/contextSearch/issues/143): Added Quick Icons Grid option
* Bug fix [#144](https://github.com/odebroqueville/contextSearch/issues/144): Added option to close Icons Grid on mouse out

4.5.4
---------

* Code cleanup
* Bug fixes for reset action in options page
* Changed method to retrieve favicons for better performance
* Added missing keyboard shortcut for Adobe Stock to default search engines

4.5.3
---------

* Bug fix [#145](https://github.com/odebroqueville/contextSearch/issues/145)
* Added translations for the Downloads Permission reminder
* Bug fix [#146](https://github.com/odebroqueville/contextSearch/issues/146) Export button is now disabled when the Downloads permission is disabled
* Added support for all favicon image formats by adding imageFormats field to the search engines local storage and modifying the data urls
* Changed the behaviour of the popup window to edit favicons: the base64 string can no longer be edited; the favicon image can only be changed by drag & drop
* Modified the getNewFavicon function: the favicon image is directly retrieved from the Firebase Cloud Function

4.5.2
---------

* Added the option to make a multisearch in the Omnibox using the same keyword for multiple different search engines

4.5.1
---------

* Bug fix [#141](https://github.com/odebroqueville/contextSearch/issues/141)

4.5.0
---------

* Added the option to use custom favicons for the search engines

4.4.7
---------

* Bug fix [#140](https://github.com/odebroqueville/contextSearch/issues/140)

4.4.6
---------

* Updated README and defaultSearchEngines files with keyboard shortcuts
* Added the option to include separators in the context menu
* Improved the code for the icon grid

4.4.5
---------

* Improved the search for favicons

4.4.4
---------

* Bug fix [#137](https://github.com/odebroqueville/contextSearch/issues/137)
* Bug fix [#138](https://github.com/odebroqueville/contextSearch/issues/138)

4.4.3
---------

* Bug fix : Alt key now toggles Firefox's main menu on and off in Windows OS (version 4.4.2 had broken the bug fix introduced in v4.4.1)

4.4.2
---------

* Bug fix : keyboard shortcuts were broken in CS 4.4.1
* Added Google Lens search to Google Reverse Image Search 

4.4.1
---------

* Bug fix : Alt key now toggles Firefox's main menu on and off in Windows OS
* Minor update to Icelandic translation

4.4.0
---------

* Updated SortableJS from 1.14.0 to 1.15.0
* Updated Google Reverse Image Search Url in selection.js

4.3.0
---------

* Bug fixes

4.2.9
---------

* Fixed bug where bookmarks and history search failed due to quota limitation excess for storage sync -> using storage local instead

4.2.8
---------

* Added bookmarks and history search from the Omnibox
* Removed Image Analysis Tool as exif.js is deprecated and stopped working
* Fix [#106](https://github.com/odebroqueville/contextSearch/issues/106) Added option to open search results in a private new window
* Fix [#134](https://github.com/odebroqueville/contextSearch/issues/134) Google Reverse Image Search
* Updated translations

4.2.7
---------

* Changed the way search engines are added from mycroftproject.com: users can now click on the Context Search icon that appears right before the search engine textual link
* Fix [#133](https://github.com/odebroqueville/contextSearch/issues/133) Notifications and Downloads now require optional permission to be enabled
* Fix [#125](https://github.com/odebroqueville/contextSearch/issues/125) Hide/Show Page action when required
* Fix [#126](https://github.com/odebroqueville/contextSearch/issues/126) Multisearch results may now be displayed in a new window or, in the current window, right after the active tab or after the last tab
* Added translations for multisearch options

4.2.6
---------

* Minor corrections to German translations
* Fix [#129](https://github.com/odebroqueville/contextSearch/issues/129) missing documentation for advanced features
* Fix bug [#130](https://github.com/odebroqueville/contextSearch/issues/130)

4.2.5
---------

* Fixes bugs #122, #123 and #124 

4.2.4
---------

* Fixes bugs #110, #118, #119 and #120
* Includes features enhancements: it is now possible to select text and carry out searches from within the sidebar

4.2.3
---------

* Fixes bug [#117](https://github.com/odebroqueville/contextSearch/issues/117)
* Updates Arabic, Dutch, French, German, Italian, Japanese, Russian, Spanish translations

4.2.2
---------

* Fixes bug [#116](https://github.com/odebroqueville/contextSearch/issues/116)
* Adds keyboard shortcuts to search engines

4.2.1
---------

* Updates search engine Wikipedia
* Hides the Page action icon if no opensearch plugin is available
* Fixes bug [#103](https://github.com/odebroqueville/contextSearch/issues/103)
* Fixes bug where saving ("Export to local disk") search engines to local disk would fail
* Fixes bug where a reset to force the reload of default search engines would fail
* Fixes bug where Alt-click search would fail to search for selected text and selected text would get unselected
* Fixes bug where new search engine would not be added to context menu after clicking on Page action icon 
* Updates libraries Leaflet to 1.7.1 and Color Thief to 2.3.2 as these library updates were not correctly propagated to CS 4.2.0

4.2.0
---------

* Adds Icelandic translation
* Updates RGraph to v6.05
* Updates Sortable to v1.14.0
* Fixes Google Translate search engine

4.1.6
---------

* Updates to latest libraries available: Color Thief 2.3.2, RGraph 5.26, SortableJS 1.10.2 and Leaflet 1.7.1

4.1.5
---------

* Implements feature request #93 : users can now search the current site by chosing one of the following search engines: Google, Bing, DuckDuckGo, Ecosia, Lilo, Qwant, Startpage, Swisscows, Yahoo
* New translations for 'siteSearch' and 'titleSiteSearch' have been added
* Fixes bug whereby default search engines would fail to load when storage sync was empty
* Updates RGraph to version 5.26

4.1.4
---------

* Needed to correct changelog in 4.1.3

4.1.3
---------

* Fixes bugs #96 and #97

4.1.2
---------

* Fixes bug #94

4.1.1
---------

* Fixes bug #92 as well as bugs introduced in 4.1.0

4.1.0
---------

* Fixes issues #82, #85 and #91
* Updates Rgraph to version 5.25
* Fixes dependabot security alert by upgrading jpeg-js to version 0.4.0 at least

4.0.0
---------

* Fixes #81 : search terms may now include percentage sign
* Fixes #83 : adopting major release update to force update from users stuck at 3.72

3.9.5
---------

* Adds a color palette to the image analysis tool

3.9.4
---------

* Fixes bug #79 where the wrong search engine was triggered from context menu when carrying out a search

3.9.3
---------

* Fixes bug #77 by retaining sort order in the context menu as well
* Fixes bug #75 by displaying map right after EXIF tags

3.9.2
---------

* Fixes bugs #70 and #74 by using a different user agent
* Partially fixes bug #77 by retaining sort order in the Options page
* Adds a map to show where an image was taken and in which direction, if the EXIF GPS coordinates are available
* Gives users the option to show a summary of EXIF meta data or the full list of EXIF tags available
* Adds Korean and Arabic translations

3.9.1
---------

* Fixes bugs #66 and #68 whereby search results and exif tags wouldn't show in the sidebar
* Changed the way search results get displayed in the sidebar

3.9.0
---------

* Adds multisearch to the omnibox by using the keyword '!' after 'cs '
* Open Options page from omnibox by using the keyword '.' after cs
* It is now possible to add search engines from mycroftproject.com by right-clicking on the main (first) link of a search engine
* A page action now allows users to add an open search engine from a web page when available
* Improved the text definition of a multisearch on the Options page including the translations

3.8.9
---------

* Adds search option to match exact search string along with the corresponding translations (#7)

3.8.8
---------

* Fixes non-working version 3.8.7

3.8.7
---------

* When doing an Omnibox search using an unknown keyword, the default search engine will be used (partial fix for #45)
* Completes missing translations in french, german, italian, spanish, dutch, polish, russian, ukrainian, chinese and japanese
* Adds buttomn to sort search engines alphabetically

3.8.6
---------

* Fixes bugs #40, #56
* Extension updates will no longer replace a user's custom list of search engines with the default list (#57)
* Offers the option to open search results after the last tab (#46)

3.8.5
---------

* Fixes bugs #50, #51, #52, #54, #55
* Stores the extension's option in storage.sync
* Stores the search engines in storage.local
* Removes option to cache favicons to storage.sync
* Updates RGraph from version 5.22 to version 5.23

3.8.4
---------

* Updates RGraph from version 5.20 to version 5.22

3.8.3
---------

* Offers the option to disable the icon of grids (Alt + Click)

3.8.2
---------

* Updated Rgraph to version 5.20 released December 5th, 2019
* Changed Firefox minimum version required to 62.0 in manifest
* Updated README, CHANGELOG and manifest.json files accordingly

3.8.1
---------

* Fixes bugs #42 and #43
* Updated RGraph to latest version 5.11
* Updated manifest.json to version 3.8.1 and added strict minimum version 57.0 for Firefox
* Updated README and CHANGELOG files

3.8.0
---------

* Fixes bugs #26, #35, #36, #39, #40
* Replaces up & down arrows by drag & drop move icon to re-order the search engines list #31
* Adds multisearch icon to the grid of icons #17
* Updated README file
* Changed LICENSE from Mozilla Public License 2.0 to GNU GPLv3
* Removed console logs for production release

3.72
---------

* Fixes bug where context menu would disappear
* Fixes bug where the options in the context menu would disappear

3.71
---------

* Fixes major bugs introduced in version 3.70

3.70
---------

* Fixes bugs #2, #10, #11
* Hold option (Alt) key and click on selected text to launch the grid of icons
* Option to enable/disable grid of icons has been removed because now both context menu and grid of icons are accessible at all times
* Use of CORS anywhere API has been removed
* The JSON file containing the list of search engines now also includes favicons as base64 strings so that the favicons load faster and no longer require to make an HTTP request
* Search results can now be displayed in the sidebar, but, unfortunately, this feature is not supported for all search engines
* The extension now also includes an EXIF viewer which equally displays a color histogram
* Some reset options have been added to the extension's preferences page, namely to force favicons to be reloaded
* Updated README file on GitHub

3.69
---------

* Changes the sources to fetch favicons from heroku
* Fixes issue #127: Removes console logs triggered on keyboard events

3.68
---------

* Fixes bugs #113, #114 and #115 encountered in version 3.66
* Removes the Save Preferences button, which is no longer required, in the add-on's options page
* Removes the grid mode in the add-on's options page, as the grid of icons can now be launched using Shift-click
* Fixes "Export to local disk" in the add-ons options page: now produces a save dialog box
* Updated README file on GitHub

3.67
---------

* Reverts back to version 3.65 due to major bugs with version 3.66.

3.66 (major bugs - should be avoided)
---------

* Fix bug #97 again. Just need to set display to inline-block and add some padding to the fieldset container.
* Improve CSS (set border-box on all elements so we can use 100% reliably)
* Fix multisearch checkbox checked by default
* Identify new strings for translation and them to the manifest.json files
* Add test for empty URL and notification to the user instead of opening an invalid page
* Add title element onto the first checkbox as well
* Fix indentation for the Dutch and French locale
* Drop some global variables and make them local
* Rename some global variables to make their function as a preference clear
* Show checkbox checked by default, also when clearing
* Refactor code around rebuildContextMenu to be more clear
* Save select all / clear all immediately
* Preferences page: use the localised title as tab title as well
* Set browser_style to true to remove warning
* Improve Dutch locale
* Changed translation for favicons
* Add German, Ukrainian and Russian locale

3.65
---------

* Completed translations in Polish & Italian
* Fix bug #95

3.64
---------

* Fix bug #96

3.63
---------

* Fix bug #94
* Typo error

3.62
---------

* Fixes a bug that prevented the icon grid from loading

3.61
---------

* Add Chinese simplified translation
* Fixed minor bug: names with dots not allowed in messages.json
* Added support for translated placeholders and titles
* Completed translations for Dutch
* Completed translations for Spanish
* Completed translations for English & French
* Prepared file structure for translations
* Code cleanup
* Added use of IonIcons for up, down and remove buttons
* Fixes a small bug! Call i18n()

3.60
---------

* Added translations in fr, nl and pl

3.59
---------

* Added Clear button for 'Add new search engine'

3.58
---------

* Improve privacy by preventing url leaks
