console.log(`Requesting search results..`);
requestSearchResults();

function requestSearchResults() {
	browser.runtime.sendMessage({ action: 'returnSearchResults' }).catch((err) => {
		console.error(err);
		console.log('Failed to retrieve search results.');
	});
}
