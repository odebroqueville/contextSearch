requestSearchResults();

function requestSearchResults(){
    browser.runtime.sendMessage({action: "returnSearchResults"})
        .then(handleResponse)
        .catch((err)=>{
            if (logToConsole) {
                console.error(err);
                console.log("Failed to retrieve image EXIF tags.");
            }
        });
}

function handleResponse(response) {
    let content = document.getElementById("content");
    content.innerHTML = response;
}