# icojs

[![npm](https://img.shields.io/npm/v/icojs.svg)](https://www.npmjs.com/package/icojs)
[![Build Status](https://travis-ci.org/egy186/icojs.svg?branch=master)](https://travis-ci.org/egy186/icojs)
[![dependencies Status](https://david-dm.org/egy186/icojs/status.svg)](https://david-dm.org/egy186/icojs)
[![Coverage Status](https://coveralls.io/repos/github/egy186/icojs/badge.svg?branch=master)](https://coveralls.io/github/egy186/icojs?branch=master)
[![codebeat badge](https://codebeat.co/badges/85bd457f-39b6-43d8-bf8e-c80ace07a8d7)](https://codebeat.co/projects/github-com-egy186-icojs)

A JavaScript library to use ICO.
Works on both Node.js and the browser.

## Install

```sh
npm install icojs
```

### Node.js:

```js
const ICO = require('icojs');
```

### Browser:

```js
const ICO = require('icojs/browser')
```

or

```html
<script type="text/javascript" src="node_modules/icojs/dist/ico.js"></script>
```

To fully use this library, browsers must support **JavaScript typed arrays**, **Canvas API** and **Promise**.
Chrome, Edge 12, Firefox and Safari 9 support these functions.

## Example

### Node.js:

```js
const fs = require('fs');
const ICO = require('icojs');

const buffer = fs.readFileSync('favicon.ico');
ICO.parse(buffer, 'image/png').then(images => {
  // save as png files
  images.forEach(image => {
    const file = `${image.width}x${image.height}-${image.bpp}bit.png`;
    const data = Buffer.from(image.buffer);
    fs.writeFileSync(file, data);
  });
});
```

### Browser:

```html
<input type="file" id="input-file" />
<script>
  document.getElementById('input-file').addEventListener('change', function (evt) {
    // use FileReader for converting File object to ArrayBuffer object
    var reader = new FileReader();
    reader.onload = function (e) {
      ICO.parse(e.target.result).then(function (images) {
        // logs images
        console.dir(images);
      })
    };
    reader.readAsArrayBuffer(evt.target.files[0]);
  }, false);
</script>
```

## Demo

[https://egy186.github.io/icojs/#demo](https://egy186.github.io/icojs/#demo)

## API

<a name="module_ICO"></a>

### ICO

* [ICO](#module_ICO)
    * [isICO(source)](#exp_module_ICO--isICO) ⇒ <code>Boolean</code> ⏏
    * [parse(buffer, [mime])](#exp_module_ICO--parse) ⇒ <code>Promise.&lt;Array.&lt;ParsedImage&gt;&gt;</code> ⏏
    * [parseSync(buffer, [mime])](#exp_module_ICO--parseSync) ⇒ [<code>Array.&lt;ParsedImage&gt;</code>](#ParsedImage) ⏏

<a name="exp_module_ICO--isICO"></a>

#### isICO(source) ⇒ <code>Boolean</code> ⏏
Check the ArrayBuffer is valid ICO.

**Kind**: global method of [<code>ICO</code>](#module_ICO)  
**Returns**: <code>Boolean</code> - True if arg is ICO.  

| Param | Type | Description |
| --- | --- | --- |
| source | <code>ArrayBuffer</code> \| <code>Buffer</code> | ICO file data. |

<a name="exp_module_ICO--parse"></a>

#### parse(buffer, [mime]) ⇒ <code>Promise.&lt;Array.&lt;ParsedImage&gt;&gt;</code> ⏏
Parse ICO and return some images.

**Kind**: global method of [<code>ICO</code>](#module_ICO)  
**Returns**: <code>Promise.&lt;Array.&lt;ParsedImage&gt;&gt;</code> - Resolves to an array of [ParsedImage](#ParsedImage).  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| buffer | <code>ArrayBuffer</code> \| <code>Buffer</code> |  | ICO file data. |
| [mime] | <code>String</code> | <code>image/png</code> | MIME type for output. |

<a name="exp_module_ICO--parseSync"></a>

#### parseSync(buffer, [mime]) ⇒ [<code>Array.&lt;ParsedImage&gt;</code>](#ParsedImage) ⏏
Parse ICO and return some images synchronously **(Node.js only)**.

**Kind**: global method of [<code>ICO</code>](#module_ICO)  
**Returns**: [<code>Array.&lt;ParsedImage&gt;</code>](#ParsedImage) - Returns an array of [ParsedImage](#ParsedImage).  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| buffer | <code>ArrayBuffer</code> \| <code>Buffer</code> |  | ICO file data. |
| [mime] | <code>String</code> | <code>image/png</code> | MIME type for output. |


## Typedefs

<a name="ParsedImage"></a>

### ParsedImage : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| width | <code>Number</code> | Image width. |
| height | <code>Number</code> | Image height. |
| bpp | <code>Number</code> | Image color depth as bits per pixel. |
| buffer | <code>ArrayBuffer</code> | Image buffer. |


## License

MIT license
