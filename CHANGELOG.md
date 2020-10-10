4.1.5
=========

* Implements feature request #93
* Updates Rgraph to version 5.26

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
