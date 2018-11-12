const assert = require('assert')
const toDataView = require('./')

assert(toDataView(Buffer.from('test')) instanceof DataView)
assert(toDataView(new ArrayBuffer(10)) instanceof DataView)
