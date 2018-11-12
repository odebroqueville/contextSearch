'use strict';

const Image = require('./image');
const isICO = require('../is-ico');
const parseICO = require('../parse');
const parseICOSync = require('../parse/sync');
const { MIME_PNG } = require('../mime');

/**
 * Parse ICO and return some images.
 * @alias module:ICO
 * @param {ArrayBuffer|Buffer} buffer ICO file data.
 * @param {String} [mime=image/png] MIME type for output.
 * @returns {Promise<ParsedImage[]>} Resolves to an array of {@link ParsedImage}.
 */
const parse = (buffer, mime = MIME_PNG) => parseICO(buffer, mime, Image);

/**
 * Parse ICO and return some images synchronously **(Node.js only)**.
 * @alias module:ICO
 * @param {ArrayBuffer|Buffer} buffer ICO file data.
 * @param {String} [mime=image/png] MIME type for output.
 * @returns {ParsedImage[]} Returns an array of {@link ParsedImage}.
 */
const parseSync = (buffer, mime = MIME_PNG) => parseICOSync(buffer, mime, Image);

/**
 * @module ICO
 */
const ICO = {
  isICO,
  parse,
  parseSync
};

module.exports = ICO;
