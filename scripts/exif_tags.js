const logToConsole = true;

(function(){
    if (logToConsole) console.log(`Retrieving Exif tags..`);
    requestImageData();
}())

function requestImageData(){
    browser.runtime.sendMessage({action: "returnImageData"})
        .then(handleResponse)
        .catch((err)=>{
            if (logToConsole) {
                console.error(err);
                console.log("Failed to retrieve image EXIF tags.");
            }
        });
}

function handleResponse(message) {
    let imageUrl = message.imageUrl;
    let imageTags = message.imageTags;
    let content = document.getElementById("content");
    let table = document.createElement("table");
    for (let tag in imageTags) {
        if (tag === "undefined" || isEmpty(imageTags[tag])) continue;
        let tr = document.createElement("tr");
        let tdTag = document.createElement("td");
        tdTag.setAttribute("class", "key");
        let tdValue = document.createElement("td");
        tdValue.setAttribute("class", "value");
        let tdTagText = document.createTextNode(tag);
        tdTag.appendChild(tdTagText);
        let o = imageTags[tag];
        if (Array.isArray(o)) {
            let tdValueText = document.createTextNode("Array");
            tdValue.appendChild(tdValueText);
            tr.appendChild(tdTag);
            tr.appendChild(tdValue);
            table.appendChild(tr);
            continue;
        }
        if (typeof(o) === "object") {
            if (logToConsole) console.log(JSON.stringify(imageTags[tag]));
            tr.appendChild(tdTag);
            table.appendChild(tr);
            for (let key in o) {
                if (logToConsole) console.log(`${key}:\n${o[key]}`);
                if (key === undefined) continue;
                let row = document.createElement("tr");
                let tagKey = document.createElement("td");
                let tagValue = document.createElement("td");
                tagKey.setAttribute("class", "key increment");
                tagValue.setAttribute("class", "value");
                let tagKeyText = document.createTextNode(key.toString());
                let tagValueText = document.createTextNode(o[key].toString());
                tagKey.appendChild(tagKeyText);
                tagValue.appendChild(tagValueText);
                row.appendChild(tagKey);
                row.appendChild(tagValue);
                table.appendChild(row);
            }
        } else {
            let tdValueText = document.createTextNode(`${imageTags[tag]}`);
            tdValue.appendChild(tdValueText);
            tr.appendChild(tdTag);
            tr.appendChild(tdValue);
            table.appendChild(tr);
        }        
    }
    content.appendChild(table);
}

// Test if an object is empty
function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}