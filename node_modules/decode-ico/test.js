/* eslint-env mocha */

'use strict'

const fs = require('fs')
const path = require('path')
const assert = require('assert')

const globby = require('globby')
const lodepng = require('lodepng')

const decodeIco = require('./')

const testCases = globby.sync('fixtures/*.ico')

function loadPng (filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(filename, (err, data) => {
      if (err) return reject(err)

      resolve(lodepng.decode(data))
    })
  })
}

for (const testCase of testCases) {
  const name = path.basename(testCase, '.ico')
  const source = fs.readFileSync(testCase)

  describe(`Decoding of ${name}.ico`, () => {
    const targetPaths = globby.sync(`fixtures/${name}-*.png`)

    let result
    it('decodes the source', () => {
      result = decodeIco(source)
    })

    for (let idx = 0; idx < targetPaths.length; idx++) {
      it(`extracts image #${idx}`, () => {
        const actual = result[idx]

        return loadPng(targetPaths[idx]).then((expected) => {
          assert.strictEqual(actual.width, expected.width)
          assert.strictEqual(actual.height, expected.height)
          assert.strictEqual(actual.hotspot, null)
          assert([1, 4, 8, 16, 24, 32].indexOf(actual.bpp) !== -1)

          const imageData = (actual.type === 'png')
            ? lodepng.decode(actual.data)
            : Promise.resolve(actual)

          return imageData.then((imageData) => {
            assert.strictEqual(imageData.data.length, expected.data.length, 'The decoded data should match the target data (length)')
            assert.ok(Buffer.compare(Buffer.from(imageData.data), expected.data) === 0, 'The decoded data should match the target data (bytes)')
          })
        })
      })
    }
  })
}

describe('Decoding of dino.cur', () => {
  let result
  it('decodes the source', () => {
    result = decodeIco(fs.readFileSync('fixtures/dino.cur'))
  })

  it(`extracts image #0`, () => {
    const actual = result[0]

    return loadPng('fixtures/dino-0.png').then((expected) => {
      assert.strictEqual(actual.width, expected.width)
      assert.strictEqual(actual.height, expected.height)
      assert.deepStrictEqual(actual.hotspot, { x: 1, y: 2 })

      const imageData = (actual.type === 'png')
        ? lodepng.decode(actual.data)
        : Promise.resolve(actual)

      return imageData.then((imageData) => {
        assert.strictEqual(imageData.data.length, expected.data.length, 'The decoded data should match the target data (length)')
        assert.ok(Buffer.compare(Buffer.from(imageData.data), expected.data) === 0, 'The decoded data should match the target data (bytes)')
      })
    })
  })
})
