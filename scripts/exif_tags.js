// Constants
// Debug
const logToConsole = true;

// Save original method before overwriting it below.
const _setPosOriginal = L.Marker.prototype._setPos;

const declinationUrl =
	'https://emmcalc.geomag.info?magneticComponent=d&lat1=latitude&lon1=longitude&startYear=date&resultFormat=json';
const zoomLevel = 12; // default zoom level for open street map
const markerSize = 40; // default marker size
const palette = document.getElementById('palette');
const content = document.getElementById('content');
const map = document.getElementById('map');
const summary = {
	Artist: 'Photographer',
	CameraOwnerName: 'Camera owner',
	Copyright: 'Copyright',
	Make: 'Camera make',
	Model: 'Camera model',
	DateTimeOriginal: 'Date & time',
	ExposureTime: 'Shutter speed(s)',
	FNumber: 'Aperture',
	ISOSpeedRatings: 'ISO sensitivity',
	FocalLength: 'Focal length(mm)',
	WhiteBalance: 'White balance',
	Flash: 'Flash status',
	ExposureBias: 'Exposure bias',
	MeteringMode: 'Metering mode',
	ExposureProgram: 'Exposure program',
	GPSLatitude: 'GPS Latitude',
	GPSLongitude: 'GPS Longitude',
	GPSAltitude: 'GPS Altitude(m)',
	GPSImgDirectionRef: 'GPS Image Direction Reference',
	GPSImgDirection: 'GPS Image Direction'
};

// Global variables - initialisation
/* global ColorThief, L, RGraph */
let displayExifSummary = true;
let imageUrl = '';
let imageTags = {};
let redValues = array256(0);
let greenValues = array256(0);
let blueValues = array256(0);
let latitude;
let longitude;
let latSign;
let longSign;
let heading;
let center;
let myMap;
let myMarker;

Math.radians = (degrees) => degrees * Math.PI / 180;

// Main
(function() {
	if (logToConsole) console.log(`Retrieving Exif tags..`);
	requestImageData();

	L.Marker.addInitHook(function() {
		const anchor = this.options.icon.options.iconAnchor;
		this.options.rotationOrigin = anchor ? `${anchor[0]}px ${anchor[1]}px` : 'center center';
		// Ensure marker remains rotated during dragging.
		this.on('drag', (data) => {
			this._rotate();
		});
	});

	L.Marker.include({
		// _setPos is alled when update() is called, e.g. on setLatLng()
		_setPos: function(pos) {
			_setPosOriginal.call(this, pos);
			if (this.options.rotation) this._rotate();
		},
		_rotate: function() {
			this._icon.style[`${L.DomUtil.TRANSFORM}Origin`] = this.options.rotationOrigin;
			this._icon.style[L.DomUtil.TRANSFORM] += ` rotate(${this.options.rotation}deg)`;
		}
	});
})();

function requestImageData() {
	browser.runtime.sendMessage({ action: 'returnImageData' }).then(handleResponse).catch((err) => {
		if (logToConsole) {
			console.error(err);
			console.log('Failed to retrieve image EXIF tags.');
		}
	});
}

async function getDisplayExifSummary() {
	let data = await browser.storage.sync.get(null);
	if (logToConsole) console.log(data.options);
	return data.options.displayExifSummary;
}

// Test if an object is empty
function isEmpty(value) {
	if (typeof value === 'number') return false;
	else if (typeof value === 'string') return value.trim().length === 0;
	else if (Array.isArray(value)) return value.length === 0;
	else if (typeof value === 'object') return value == null || Object.keys(value).length === 0;
	else if (typeof value === 'boolean') return false;
	else return !value;
}

function convertToDecimalDegrees(dms) {
	return dms[0] + dms[1] / 60 + dms[2] / 3600;
}

async function handleResponse(message) {
	// let src = '';
	imageUrl = message.imageUrl;
	if (logToConsole) console.log(imageUrl);
	imageTags = message.imageTags;
	if (!isEmpty(imageTags['ExposureTime'])) {
		imageTags['ExposureTime'] = '1/' + Math.round(1 / imageTags['ExposureTime']).toString();
	}
	if (isEmpty(imageTags['GPSLatitude'])) {
		map.style.visibility = 'none';
		map.style.height = 0;
	} else {
		map.style.visibility = 'visible';
		map.style.height = '300px';
		if (imageTags['GPSLatitudeRef'] === 'S') {
			latSign = -1;
		} else {
			latSign = 1;
		}
		if (imageTags['GPSLongitudeRef'] === 'W') {
			longSign = -1;
		} else {
			longSign = 1;
		}
		latitude = latSign * convertToDecimalDegrees(imageTags['GPSLatitude']);
		longitude = longSign * convertToDecimalDegrees(imageTags['GPSLongitude']);
		let magneticDeclination = 0;
		let startYear = imageTags['DateTimeOriginal'].substr(0, 4);
		if (logToConsole) console.log(startYear);
		if (imageTags['GPSImgDirectionRef'] === 'M') {
			let url = declinationUrl
				.replace(/latitude/, latitude.toString())
				.replace(/longitude/, longitude.toString())
				.replace(/date/, startYear);
			if (logToConsole) console.log(url);
			let jsonResponse = await fetchJSON(url);
			if (logToConsole) console.log(jsonResponse);
			magneticDeclination = jsonResponse.result[0].declination;
			if (logToConsole) console.log(magneticDeclination);
		}
		heading = Math.round(imageTags['GPSImgDirection'] + magneticDeclination);
		center = [ latitude, longitude ];
		let osm = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contr.'
			}),
			ggl = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
				maxZoom: 20,
				subdomains: [ 'mt0', 'mt1', 'mt2', 'mt3' ],
				attribution: '© 2020 Google, Maxar Technologies'
			});
		let baseMaps = {
			OpenStreetMap: osm,
			GoogleSatImagery: ggl
		};
		let overlays = {
			//add any overlays here
		};
		//myMap = L.map('map').setView(center, zoomLevel);
		myMap = L.map('map', {
			center: center,
			zoom: zoomLevel,
			layers: [ osm ]
		});
		myMarker = L.marker(center, markerOptions(markerSize, heading)).addTo(myMap);
		L.control.layers(baseMaps, overlays, { position: 'bottomleft' }).addTo(myMap);
		/* 		myMap.addLayer(
			L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
				maxZoom: 20,
				subdomains: [ 'mt0', 'mt1', 'mt2', 'mt3' ],
				attribution: 'Map data: © Google, Maxar Technologies 2020'
			})
		); */
		/* 		myMap.addLayer(
			L.tileLayer('https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}@2x.png', {
				attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contr.'
			})
		); */
		myMap.whenReady((_) => {
			L.DomUtil.create('div', 'indicator', myMarker._icon.parentNode);
			updateIndicatorPos(myMarker, heading);
		});
		myMap.on('zoom', (data) => {
			updateIndicatorPos(myMarker);
		});
	}
	if (logToConsole) console.log(imageTags);
	loadImageData()
		.then((data) => {
			let canvas = data.canvas;
			let ctx = data.ctx;
			let image = data.image;
			extractRGBValues(canvas, ctx);
			plotHistogram();
			displayColorPalette(image, 6);
			displayExifTags();
		})
		.catch((err) => {
			if (logToConsole) console.error(err);
		});
}

function loadImageData() {
	return new Promise((resolve, reject) => {
		let img = new Image();
		img.src = imageUrl;
		img.crossOrigin = 'anonymous';
		if (logToConsole) console.log(imageUrl);
		let imageCanvas = document.createElement('canvas');
		let ctxImageCanvas = imageCanvas.getContext('2d');
		img.onload = function() {
			ctxImageCanvas.drawImage(img, 0, 0, img.width, img.height);
			img.style.display = 'none';
			resolve({ image: img, canvas: imageCanvas, ctx: ctxImageCanvas });
		};
		img.onerror = (err) => {
			if (logToConsole) console.error(err);
			reject(err);
		};
	});
}

function extractRGBValues(canvas, ctx) {
	let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
	for (let y = 0; y < canvas.height; y++) {
		for (let x = 0; x < canvas.width; x++) {
			redValues[getRGBAColorsForCoord(x, y, imageData)[0]]++;
			greenValues[getRGBAColorsForCoord(x, y, imageData)[1]]++;
			blueValues[getRGBAColorsForCoord(x, y, imageData)[2]]++;
		}
	}
	if (logToConsole) console.log(redValues);
}

function getRGBAColorsForCoord(x, y, imageData) {
	var red = y * (imageData.width * 4) + x * 4;
	return [ imageData.data[red], imageData.data[red + 1], imageData.data[red + 2], imageData.data[red + 3] ];
}

function array256(defaultValue) {
	let arr = [];
	for (let i = 0; i < 256; i++) {
		arr[i] = defaultValue;
	}
	return arr;
}

function plotHistogram() {
	new RGraph.SVG.Line({
		id: 'histogram',
		data: [ redValues, greenValues, blueValues ],
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
			colors: [ 'rgba(255,0,0,0.6)', 'rgba(0,255,0,0.6)', 'rgba(0,0,255,0.6)' ]
		}
	}).draw();
}

async function displayColorPalette(image, numberOfColors) {
	const colorThief = new ColorThief();
	const colorPalette = await colorThief.getPalette(image, numberOfColors);
	let r, g, b, span;
	for (let rgb of colorPalette) {
		r = rgb[0];
		g = rgb[1];
		b = rgb[2];
		if (logToConsole) console.log(r, g, b);
		span = document.createElement('div');
		span.setAttribute('class', 'color');
		span.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
		palette.appendChild(span);
	}
	if (logToConsole) console.log(colorPalette);
}

async function displayExifTags() {
	displayExifSummary = await getDisplayExifSummary();
	if (logToConsole) console.log(displayExifSummary);
	//let h = window.innerHeight + 'px';
	let table = document.createElement('table');
	let exifTags = {};
	//content.style.height = h;
	if (displayExifSummary) {
		for (let tag in summary) {
			if (imageTags[tag]) exifTags[summary[tag]] = imageTags[tag];
		}
		imageTags = exifTags;
	}
	for (let tag in imageTags) {
		if (tag === 'thumbnail' || tag === undefined || isEmpty(imageTags[tag])) continue;
		let tr = document.createElement('tr');
		let tdTag = document.createElement('td');
		tdTag.setAttribute('class', 'key');
		let tdValue = document.createElement('td');
		tdValue.setAttribute('class', 'value');
		let tdTagText = document.createTextNode(tag);
		tdTag.appendChild(tdTagText);
		let text = imageTags[tag];
		if (tag === 'GPS Image Direction Reference') {
			switch (imageTags[tag]) {
				case 'M':
					text = 'Magnetic North';
					break;
				case 'T':
					text = 'True North';
					break;
				default:
			}
		}
		if (tag === 'Focal length(mm)' || tag === 'GPS Altitude(m)' || tag === 'GPS Image Direction') {
			text = Math.round(text);
		}
		if (Array.isArray(text)) {
			switch (tag) {
				case 'GPSLongitude':
				case 'GPS Longitude':
					text =
						text[0].toString() +
						'°' +
						text[1].toString() +
						"'" +
						text[2].toString() +
						'"' +
						(longSign >= 0 ? 'E' : 'W');
					break;
				case 'GPSLatitude':
				case 'GPS Latitude':
					text =
						text[0].toString() +
						'°' +
						text[1].toString() +
						"'" +
						text[2].toString() +
						'"' +
						(latSign >= 0 ? 'N' : 'S');
					break;
				default:
					text = 'Array';
			}
		}
		if (typeof text === 'object') {
			tr.appendChild(tdTag);
			table.appendChild(tr);
			for (let key in text) {
				if (key === undefined) continue;
				let row = document.createElement('tr');
				let tagKey = document.createElement('td');
				let tagValue = document.createElement('td');
				tagKey.setAttribute('class', 'key increment');
				tagValue.setAttribute('class', 'value');
				let tagKeyText = document.createTextNode(key.toString());
				let tagValueText = document.createTextNode(text[key].toString());
				tagKey.appendChild(tagKeyText);
				tagValue.appendChild(tagValueText);
				row.appendChild(tagKey);
				row.appendChild(tagValue);
				table.appendChild(row);
			}
			continue;
		}
		let tdValueText = document.createTextNode(text);
		tdValue.appendChild(tdValueText);
		tr.appendChild(tdTag);
		tr.appendChild(tdValue);
		table.appendChild(tr);
	}
	content.appendChild(table);
}

function markerOptions(size, heading) {
	const iconOptions = {
		iconSize: [ size, size ],
		iconAnchor: [ size / 2, size / 2 ],
		className: 'mymarker',
		html:
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M 16 3 C 8.832031 3 3 8.832031 3 16 C 3 23.167969 8.832031 29 16 29 C 23.167969 29 29 23.167969 29 16 C 29 8.832031 23.167969 3 16 3 Z M 16 5 C 22.085938 5 27 9.914063 27 16 C 27 22.085938 22.085938 27 16 27 C 9.914063 27 5 22.085938 5 16 C 5 9.914063 9.914063 5 16 5 Z M 16 8.875 L 9.59375 15.28125 L 11 16.71875 L 15 12.71875 L 15 23 L 17 23 L 17 12.71875 L 21 16.71875 L 22.40625 15.28125 Z"/></svg>'
	};
	return {
		draggable: false,
		icon: L.divIcon(iconOptions),
		rotation: heading
	};
}

function updateIndicatorPos(marker, heading) {
	const pos = marker._icon._leaflet_pos;
	const indicator = marker._icon.nextElementSibling;
	if (heading) indicator.innerHTML = `🧭 ${heading}°`;
	indicator.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
}

function fetchJSON(url) {
	return new Promise((resolve, reject) => {
		const reqHeader = new Headers();
		reqHeader.append('Content-Type', 'application/json');

		const initObject = {
			method: 'GET',
			headers: reqHeader
		};

		const userRequest = new Request(url, initObject);

		fetch(userRequest)
			.then((response) => {
				if (logToConsole) console.log(response);
				return response.json();
			})
			.then((data) => {
				if (logToConsole) console.log(data);
				resolve(data);
			})
			.catch((err) => {
				if (logToConsole) console.error(err);
				reject(err);
			});
	});
}
