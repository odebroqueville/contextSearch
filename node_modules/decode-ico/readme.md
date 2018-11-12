# Decode ICO

Decode `.ico` icons

## Installation

```sh
npm install --save decode-ico
```

## Usage

```js
const decodeIco = require('decode-ico')
const fs = require('fs')

const source = fs.readFileSync('favicon.ico')
const images = decodeIco(source)

console.log(images[0])
//=> { width: 16, height: 16, type: 'bmp', data: Uint8Array(...), bpp: 32, hotspot: null }

console.log(images[1])
//=> { width: 32, height: 32, type: 'bmp', data: Uint8Array(...), bpp: 32, hotspot: null }
```

## API

### `decodeIco(source: ArrayBuffer | Buffer) => Image[]`

Decodes the `.ico` file in the given buffer, and returns an array of images.

Each image has the following properties:

- `width: Number` - The width of the image, in pixels
- `height: Number` - The height of the image, in pixels
- `type: String` - The type of image, will be one of `bmp` or `png`
- `bpp: Number` - The color depth of the image as the number of bits used per pixel
- `data: Uint8Array` - The data of the image, format depends on `type`, see below
- `hotspot: null | Hotspot` - If the image is a cursor (`.cur`), this is the hotspot

The format of the `data` parameter depends on the type of image. When the image is of type `bmp`, the `data` array will hold raw pixel data in the RGBA order, with integer values between 0 and 255 (included). When the type is `png`, the array will be png data.

The `hotspot` property will either be `null`, or an object with an `x` and `y` property.

💡 The `png` data can be written to a file with the `.png` extension directly, or be decoded by [node-lodepng](https://github.com/LinusU/node-lodepng) which will give you the same raw format as the `bmp` type.
