'use strict'

const toDataView = require('to-data-view')

function makeDivisibleByFour (input) {
  const rest = input % 4

  return rest ? input + 4 - rest : input
}

class Bitmap {
  constructor (data, offset, props) {
    this.format = props.format
    this.offset = offset
    this.depth = props.colorDepth
    this.stride = makeDivisibleByFour(props.width * this.depth / 8)
    this.size = (this.stride * props.height)
    this.data = data.slice(this.offset, this.offset + this.size)

    if (this.size !== this.data.byteLength) {
      throw new Error('Truncated bitmap data')
    }
  }

  get (x, y, channel) {
    const idx = this.format.indexOf(channel)

    if (this.depth === 1) {
      const slice = this.data[(y * this.stride) + (x / 8 | 0)]
      const mask = 1 << (7 - (x % 8) * 1)

      return (slice & mask) >> (7 - (x % 8) * 1)
    }

    if (this.depth === 2) {
      const slice = this.data[(y * this.stride) + (x / 4 | 0)]
      const mask = 3 << (6 - (x % 4) * 2)

      return (slice & mask) >>> (6 - (x % 4) * 2)
    }

    if (this.depth === 4) {
      const slice = this.data[(y * this.stride) + (x / 2 | 0)]
      const mask = 15 << (4 - (x % 2) * 4)

      return (slice & mask) >>> (4 - (x % 2) * 4)
    }

    return this.data[(y * this.stride) + (x * (this.depth / 8)) + idx]
  }
}

function isPng (view, offset) {
  return (view.getUint32(offset + 0) === 0x89504e47 && view.getUint32(offset + 4) === 0x0d0a1a0a)
}

function pngBitsPerPixel (view, offset) {
  const bitDepth = view.getUint8(offset + 24)
  const colorType = view.getUint8(offset + 25)

  if (colorType === 0) return bitDepth * 1
  if (colorType === 2) return bitDepth * 3
  if (colorType === 3) return bitDepth * 1
  if (colorType === 4) return bitDepth * 2
  if (colorType === 6) return bitDepth * 4

  throw new Error('Invalid PNG colorType')
}

function pngWidth (view, offset) {
  return view.getUint32(offset + 16, false)
}

function pngHeight (view, offset) {
  return view.getUint32(offset + 20, false)
}

function decodeTrueColorBmp (data, props) {
  const colorDepth = props.colorDepth
  const height = props.height
  const width = props.width

  if (colorDepth !== 32 && colorDepth !== 24) {
    throw new Error(`A color depth of ${colorDepth} is not supported`)
  }

  const xor = new Bitmap(data, 0, { width, height, colorDepth, format: 'BGRA' })
  const and = (colorDepth === 24)
    ? new Bitmap(data, xor.offset + xor.size, { width, height, colorDepth: 1, format: 'A' })
    : null

  const result = new Uint8Array(width * height * 4)

  let idx = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      result[idx++] = xor.get(x, height - y - 1, 'R')
      result[idx++] = xor.get(x, height - y - 1, 'G')
      result[idx++] = xor.get(x, height - y - 1, 'B')

      if (colorDepth === 32) {
        result[idx++] = xor.get(x, height - y - 1, 'A')
      } else {
        result[idx++] = and.get(x, height - y - 1, 'A') ? 0 : 255
      }
    }
  }

  return result
}

function decodePaletteBmp (data, props) {
  const colorCount = props.colorCount
  const colorDepth = props.colorDepth
  const height = props.height
  const width = props.width

  if (colorDepth !== 8 && colorDepth !== 4 && colorDepth !== 2 && colorDepth !== 1) {
    throw new Error(`A color depth of ${colorDepth} is not supported`)
  }

  const colors = new Bitmap(data, 0, { width: colorCount, height: 1, colorDepth: 32, format: 'BGRA' })
  const xor = new Bitmap(data, colors.offset + colors.size, { width, height, colorDepth, format: 'C' })
  const and = new Bitmap(data, xor.offset + xor.size, { width, height, colorDepth: 1, format: 'A' })

  const result = new Uint8Array(width * height * 4)

  let idx = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const colorIndex = xor.get(x, height - y - 1, 'C')

      result[idx++] = colors.get(colorIndex, 0, 'R')
      result[idx++] = colors.get(colorIndex, 0, 'G')
      result[idx++] = colors.get(colorIndex, 0, 'B')
      result[idx++] = and.get(x, height - y - 1, 'A') ? 0 : 255
    }
  }

  return result
}

function decodeBmp (data, iconWidth, iconHeight) {
  const headerSize = data.getUint32(0, true)
  const bitmapWidth = (data.getUint32(4, true) / 1) | 0
  const bitmapHeight = (data.getUint32(8, true) / 2) | 0
  const colorDepth = data.getUint16(14, true)
  let colorCount = data.getUint32(32, true)

  if (colorCount === 0 && colorDepth <= 8) {
    colorCount = (1 << colorDepth)
  }

  const width = (bitmapWidth === 0 ? iconWidth : bitmapWidth)
  const height = (bitmapHeight === 0 ? iconHeight : bitmapHeight)

  const bitmapData = new Uint8Array(data.buffer, data.byteOffset + headerSize, data.byteLength - headerSize)

  const result = colorCount
    ? decodePaletteBmp(bitmapData, { width, height, colorDepth, colorCount })
    : decodeTrueColorBmp(bitmapData, { width, height, colorDepth })

  return { width, height, data: result, colorDepth }
}

module.exports = function decodeIco (input) {
  const view = toDataView(input)

  if (view.byteLength < 6) {
    throw new Error('Truncated header')
  }

  if (view.getUint16(0, true) !== 0) {
    throw new Error('Invalid magic bytes')
  }

  const type = view.getUint16(2, true)

  if (type !== 1 && type !== 2) {
    throw new Error('Invalid image type')
  }

  const length = view.getUint16(4, true)

  if (view.byteLength < 6 + (16 * length)) {
    throw new Error('Truncated image list')
  }

  return Array.from({ length }, (_, idx) => {
    const width = view.getUint8(6 + (16 * idx) + 0)
    const height = view.getUint8(6 + (16 * idx) + 1)
    const size = view.getUint32(6 + (16 * idx) + 8, true)
    const offset = view.getUint32(6 + (16 * idx) + 12, true)

    const hotspot = (type !== 2 ? null : {
      x: view.getUint16(6 + (16 * idx) + 4, true),
      y: view.getUint16(6 + (16 * idx) + 6, true)
    })

    if (isPng(view, offset)) {
      return {
        bpp: pngBitsPerPixel(view, offset),
        data: new Uint8Array(view.buffer, view.byteOffset + offset, size),
        height: pngHeight(view, offset),
        hotspot,
        type: 'png',
        width: pngWidth(view, offset)
      }
    }

    const data = new DataView(view.buffer, view.byteOffset + offset, size)
    const bmp = decodeBmp(data, width, height)

    return {
      bpp: bmp.colorDepth,
      data: bmp.data,
      height: bmp.height,
      hotspot,
      type: 'bmp',
      width: bmp.width
    }
  })
}
