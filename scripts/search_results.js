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

function getBody(html) { 
    let x = html.indexOf("<body");
    x = html.indexOf(">", x);    
    let y = html.lastIndexOf("</body>"); 
    return html.slice(x + 1, y);
}

function handleResponse(response) {
    if (response === undefined || response === null) return; 
    let content = getBody(response);
    let results = document.getElementById("results");
    if (logToConsole) console.log(content);
    results.innerHTML =  content;
}