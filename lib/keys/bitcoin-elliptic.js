var ECKey = require('./ec')
var extend = require('extend')
var inherits = require('util').inherits
var curve = 'secp256k1'
// var bitcoin = require('bitcoinjs-lib')

function BitcoinKey (info) {
  info = extend(true, { curve: curve }, info)
  ECKey.call(this, info)
}

inherits(BitcoinKey, ECKey)
BitcoinKey.CURVE = curve

BitcoinKey.prototype.toJSON = function (exportPrivateKey) {
  var json = ECKey.prototype.toJSON.apply(this, arguments)
  json.address = this.address()
  return json
}

BitcoinKey.prototype.address = function () {
  var addr = this.get('address')
  if (!addr) {
    throw new Error('not implemented yet')
  // this.set('address', addr)
  }

  return addr
}

BitcoinKey.gen = function () {
  return ECKey.gen(curve)
}

module.exports = BitcoinKey
