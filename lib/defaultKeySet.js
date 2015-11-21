
var typeforce = require('typeforce')
var toKey = require('@tradle/kiki').toKey
var requiredKeys = require('./requiredKeys')
var extend = require('extend')

module.exports = function createDefaultKeys (options) {
  typeforce({
    networkName: 'String'
  }, options)

  return requiredKeys.map(function (k) {
    k = extend({}, k)
    if (k.type === 'bitcoin') {
      k.networkName = options.networkName
    }

    return toKey(k, true) // gen a new one
  })
}
