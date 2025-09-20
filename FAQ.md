## 1. Do {searchTerms}, %s and {selection} refer to the same text?

Short answer: conceptually yes—they all represent the user’s query text. Practically, use {selection} going forward.

### Details

Canonical variable: {selection} is the rich-variable equivalent of the query text (usually the current selection, or the typed query in omnibox/grid).
Legacy aliases: {searchTerms} and %s are legacy placeholders kept for compatibility (e.g., OpenSearch templates).

### Where they match

GET engine URLs: {selection}, {searchTerms}, and %s resolve to the same text and are URL-encoded.
POST engine action/form data: they resolve to the same text and are inserted raw (not URL-encoded).
Bookmarklets (javascript:): they resolve to the same text and are inserted raw.

### Where to prefer {selection}

AI prompt templates: use {selection}. Legacy {searchTerms}/%s are not guaranteed to expand here.

### Notes

If no page selection exists, the “query text” is whatever the user provided (e.g., omnibox input); otherwise it’s the current selection (including selections in inputs/textareas).
{selection_html} is different: it preserves rich HTML of the selection; {selection}/{searchTerms}/%s are plain text.
