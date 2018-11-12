module.exports = function toDataView (data) {
  if (data instanceof Uint8Array) {
    return new DataView(data.buffer, data.byteOffset, data.byteLength)
  }

  if (data instanceof ArrayBuffer) {
    return new DataView(data)
  }

  throw new TypeError('Expected `data` to be an ArrayBuffer or Uint8Array')
}
