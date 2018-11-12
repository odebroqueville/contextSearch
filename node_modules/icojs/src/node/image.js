'use strict';

const bmp = require('bmp-js');
const fileType = require('file-type');
const jpeg = require('jpeg-js');
const { MIME_BMP, MIME_JPEG, MIME_PNG } = require('../mime');
const { PNG } = require('pngjs');

const decoders = {
  [MIME_BMP]: bmp.decode,
  [MIME_JPEG]: jpeg.decode,
  [MIME_PNG]: PNG.sync.read
};

const encoders = {
  [MIME_BMP]: imageData => bmp.encode(imageData).data,
  [MIME_JPEG]: imageData => jpeg.encode(imageData).data,
  [MIME_PNG]: PNG.sync.write
};

const Image = {
  /**
   * Asynchronously create imageData from image
   * @access private
   * @param {ArrayBuffer} arrayBuffer image buffer
   * @returns {Promise<ImageData>} Resolves to imageData
   */
  decode (arrayBuffer) {
    try {
      const imageData = this.decodeSync(arrayBuffer);
      return Promise.resolve(imageData);
    } catch (err) {
      /* istanbul ignore next */
      return Promise.reject(err);
    }
  },
  /**
   * Create imageData from image
   * @access private
   * @param {ArrayBuffer|Buffer} arrayBuffer image buffer
   * @returns {ImageData} imageData
   */
  decodeSync (arrayBuffer) {
    const buffer = Buffer.from(arrayBuffer);
    const { mime } = fileType(buffer) || {};
    if (!(mime in decoders)) {
      throw new TypeError(`${mime} is not supported`);
    }
    const decoder = decoders[mime];
    const { data, height, width } = decoder(buffer);
    return {
      data: new Uint8ClampedArray(data),
      height,
      width
    };
  },
  /**
   * Asynchronously create image from imgData.data
   * @access private
   * @param {Object} image data
   * @param {Number} image.width img width
   * @param {Number} image.height img height
   * @param {Uint8ClampedArray} image.data same as imageData.data
   * @param {String} [mime=image/png] MIME type
   * @returns {Promise<ArrayBuffer>} Resolves to image
   */
  encode (image, mime) {
    try {
      const imageArrayBuffer = this.encodeSync(image, mime);
      return Promise.resolve(imageArrayBuffer);
    } catch (err) {
      /* istanbul ignore next */
      return Promise.reject(err);
    }
  },
  /**
   * Create image from imgData.data
   * @access private
   * @param {Object} image data
   * @param {Number} image.width img width
   * @param {Number} image.height img height
   * @param {Uint8ClampedArray} image.data same as imageData.data
   * @param {String} [mime=image/png] MIME type
   * @returns {ArrayBuffer} image
   */
  encodeSync (image, mime = MIME_PNG) {
    const imageData = {
      data: Buffer.from(image.data),
      height: image.height,
      width: image.width
    };
    const encoder = mime in encoders ? encoders[mime] : encoders[MIME_PNG];
    const imageBuffer = encoder(imageData);
    return imageBuffer.buffer.slice(imageBuffer.byteOffset, imageBuffer.byteOffset + imageBuffer.byteLength);
  }
};

module.exports = Image;
