const fs = require('fs')
const lodepng = require('lodepng')

const decodeIco = require('../')

const source = fs.readFileSync(process.argv[2])
const images = decodeIco(source)

function writeFile (path, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, data, (err) => (err ? reject(err) : resolve()))
  })
}

Promise.all(images.map((image, idx) => {
  const postfix = `-${idx}.png`

  const data = (image.type === 'png')
    ? Promise.resolve(image.data)
    : lodepng.encode(image)

  return data.then((data) => {
    return writeFile(`${process.argv[3]}${postfix}`, image.data)
  })
})).catch((err) => {
  process.exitCode = 1
  console.error(err.stack)
})
