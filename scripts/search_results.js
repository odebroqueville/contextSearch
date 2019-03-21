const logToConsole = true;

(function(){
    if (logToConsole) console.log(`Requesting search results..`);
    requestSearchResults();
}())

function requestSearchResults(){
    browser.runtime.sendMessage({action: "returnSearchResults"})
        .then(handleResponse)
        .catch((err)=>{
            if (logToConsole) {
                console.error(err);
                console.log("Failed to retrieve search results.");
            }
        });
}

function handleResponse(response) {
    let content = response.content;
    if (logToConsole) console.log(content);
    if (content === undefined || content === null || content === "") return; 
    let results = document.getElementById("results");
    results.innerHTML =  content;
}