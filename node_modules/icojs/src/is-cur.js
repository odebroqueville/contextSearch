'use strict';

const toDataView = require('to-data-view');

/**
 * Check the ArrayBuffer is valid CUR.
 * @access private
 * @param {ArrayBuffer|Buffer} source ArrayBuffer or Buffer object
 * @returns {Boolean} arg is CUR or not
 */
const isCUR = source => {
  const dataView = toDataView(source);
  return dataView.getUint16(0, true) === 0 && dataView.getUint16(2, true) === 2;
};

module.exports = isCUR;
