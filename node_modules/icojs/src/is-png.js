'use strict';

const toDataView = require('to-data-view');

/**
 * Check the ArrayBuffer is valid PNG.
 * @access private
 * @param {ArrayBuffer|Buffer} source ArrayBuffer or Buffer object
 * @returns {Boolean} arg is PNG or not
 */
const isPNG = source => {
  const dataView = toDataView(source);
  return dataView.getUint32(0, false) === 0x89504E47 && dataView.getUint32(4, false) === 0x0D0A1A0A;
};

module.exports = isPNG;
