var HASH_TYPE = 'sha256'
var crypto = require('crypto')

module.exports = {
  hash: function (str) {
    return crypto.createHash(HASH_TYPE).update(str).digest()
  },
  find: function (arr, fn, ctx) {
    var match
    arr.some(function (arg, idx) {
      match = ctx ? fn.call(ctx, arg, idx) : fn(arg, idx)
      return match === true ? arg : match
    })

    return match
  },
  capFirst: function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }
}
