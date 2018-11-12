'use strict';

const { MIME_PNG } = require('../mime');

const dataURLToArrayBuffer = dataURL => {
  const string = atob(dataURL.replace(/.+,/, ''));
  const view = new Uint8Array(string.length);
  for (let i = 0; i < string.length; i++) {
    view[i] = string.charCodeAt(i);
  }
  return view.buffer;
};

const Image = {
  /**
   * Create imageData from image
   * @access private
   * @param {ArrayBuffer} arrayBuffer image buffer
   * @returns {ImageData} imageData
   */
  decode (arrayBuffer) {
    return new Promise(resolve => {
      const url = URL.createObjectURL(new Blob([arrayBuffer]));
      const img = document.createElement('img');
      img.src = url;
      img.onload = () => {
        const { naturalHeight: height, naturalWidth: width } = img;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const { data } = ctx.getImageData(0, 0, width, height);
        resolve({
          data,
          height,
          width
        });
      };
    });
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
  encode (image, mime = MIME_PNG) {
    return new Promise(resolve => {
      const { data, height, width } = image;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      const imageData = ctx.createImageData(width, height);
      const dataData = imageData.data;
      for (let i = 0; i < dataData.length; i++) {
        dataData[i] = data[i];
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(dataURLToArrayBuffer(canvas.toDataURL(mime)));
    });
  }
};

module.exports = Image;
