
var typeforce = require('typeforce')
var toKey = require('@tradle/kiki').toKey
var requiredKeys = require('./requiredKeys')
var extend = require('extend')
var DEFAULT_CURVE = 'p256'

module.exports = function createDefaultKeys (options) {
  typeforce({
    networkName: 'String'
  }, options)

  return requiredKeys.map(function (k) {
    k = extend({}, k)
    if (k.type === 'bitcoin') {
      k.networkName = options.networkName
    }

    if (k.type === 'ec' && !k.curve) {
      k.curve = DEFAULT_CURVE
    }

    return toKey(k, true) // gen a new one
  })
}
