'use strict';

const toDataView = require('to-data-view');

/**
 * Check the ArrayBuffer is valid ICO.
 * @alias module:ICO
 * @param {ArrayBuffer|Buffer} source ICO file data.
 * @returns {Boolean} True if arg is ICO.
 */
const isICO = source => {
  const dataView = toDataView(source);
  return dataView.getUint16(0, true) === 0 && dataView.getUint16(2, true) === 1;
};

module.exports = isICO;
