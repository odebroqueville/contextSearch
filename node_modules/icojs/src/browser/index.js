'use strict';

const Image = require('./image');
const isICO = require('../is-ico');
const parseICO = require('../parse');
const { MIME_PNG } = require('../mime');

const parse = (arrayBuffer, mime = MIME_PNG) => parseICO(arrayBuffer, mime, Image);

const ICO = {
  isICO,
  parse
};

module.exports = ICO;
