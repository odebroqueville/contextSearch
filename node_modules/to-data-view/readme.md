# To DataView

Create a `DataView` over an `ArrayBuffer` (commonly used in the browsers) or a `Buffer` (commonly used in Node.js).

## Installation

```sh
npm install --save to-data-view
```

## Usage

```js
const toDataView = require('to-data-view')

// This function will accept both `ArrayBuffer` and `Buffer` as input
function awesomeParser (source) {
  const view = toDataView(source)

  // ...
}
```

## API

### `toDataView(data: ArrayBuffer | Buffer): DataView`

Return a `DataView` instance that uses the same memory as the provided `ArrayBuffer` or `Buffer`.
