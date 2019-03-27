// Constants
const logToConsole = true;
const histogram = document.getElementById("histogram");
const content = document.getElementById("content");

// Global variables - initialisation
let imageUrl = "";
let imageTags = {};
let redValues = array256(0);
let greenValues = array256(0);
let blueValues = array256(0);

// Main
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
    imageUrl = message.imageUrl;
    if (logToConsole) console.log(imageUrl);
    imageTags = message.imageTags;
    if (logToConsole) console.log(imageTags);
    loadImageData()
        .then((data)=>{
            let canvas = data.canvas;
            let ctx = data.ctx;
            extractRGBValues(canvas, ctx);
            plotHistogram();
            displayExifTags();
        })
        .catch((err) => {
            if (logToConsole) console.error(err);
        });
}

function loadImageData(){
    return new Promise(
        (resolve, reject) => {
            let img = new Image();
            img.src = imageUrl;
            if (logToConsole) console.log(imageUrl);
            let imageCanvas = document.createElement('canvas');
            let ctxImageCanvas = imageCanvas.getContext('2d');
            img.onload = function() {
                ctxImageCanvas.drawImage(img, 0, 0, img.width, img.height);
                img.style.display = 'none';
                resolve({canvas: imageCanvas, ctx: ctxImageCanvas});
            };
            img.onerror = (err) => {
                if (logToConsole) console.error(err);
            }
        }
    )

}

function extractRGBValues(canvas, ctx) {
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let y=0; y < canvas.height; y++) {
        for (let x=0; x < canvas.width; x++) {
            redValues[getRGBAColorsForCoord(x, y, imageData)[0]]++;
            greenValues[getRGBAColorsForCoord(x, y, imageData)[1]]++;
            blueValues[getRGBAColorsForCoord(x, y, imageData)[2]]++;
        }
    }
    if (logToConsole) console.log(redValues);
}

function getRGBAColorsForCoord(x, y, imageData) {
    var red = y * (imageData.width * 4) + x * 4;
    return [imageData.data[red], imageData.data[red + 1], imageData.data[red + 2], imageData.data[red + 3]];
}

function array256(defaultValue) {
    let arr = [];
    for (let i=0; i<256; i++) {
        arr[i] = defaultValue; 
    }
    return arr;
}

function plotHistogram() {
    new RGraph.SVG.Line({
        id: 'histogram',
        data: [
            redValues,
            greenValues,
            blueValues
        ],
        options: {
            backgroundGrid: false,
            shadow: false,
            title: 'Color Histogram',
            titleFont: 'Arial',
            titleColor: 'white',
            titleSize: 10,
            marginBottom: 5,
            marginLeft: 5,
            marginRight: 5,
            marginTop: 5,
            linewidth: 2,
            spline: true,
            filled: true,
            colors: [
                'rgba(255,0,0,0.6)',
                'rgba(0,255,0,0.6)',
                'rgba(0,0,255,0.6)'
            ]
        }
    }).draw();
}

function displayExifTags(){
    let h = window.innerHeight + "px";
    content.style.height = "100%";
    let table = document.createElement("table");
    for (let tag in imageTags) {
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
            tr.appendChild(tdTag);
            table.appendChild(tr);
            for (let key in o) {
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