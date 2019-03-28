3.70
=========
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
=========
* Changes the sources to fetch favicons from heroku
* Fixes issue #127: Removes console logs triggered on keyboard events

3.68
=========
* Fixes bugs #113, #114 and #115 encountered in version 3.66
* Removes the Save Preferences button, which is no longer required, in the add-on's options page
* Removes the grid mode in the add-on's options page, as the grid of icons can now be launched using Shift-click
* Fixes "Export to local disk" in the add-ons options page: now produces a save dialog box
* Updated README file on GitHub

3.67
====
* Reverts back to version 3.65 due to major bugs with version 3.66.

3.66 (major bugs - should be avoided)
=========
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
====
* Completed translations in Polish & Italian
* Fix bug #95

3.64
====
* Fix bug #96

3.63
====
* Fix bug #94
* Typo error

3.62
====
* Fixes a bug that prevented the icon grid from loading

3.61
====
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
====
* Added translations in fr, nl and pl

3.59
====
* Added Clear button for 'Add new search engine'

3.58
====
* Improve privacy by preventing url leaks
