var Key = require('./key')
var inherits = require('util').inherits
var extend = require('extend')
var DSA = require('otr').DSA
var BigInt = require('otr/vendor/bigint')
var bits2bigInt = require('otr/lib/helpers').bits2bigInt

/**
 * elliptic curve key
 * @param {Object} props
 * @param {String|KeyPair} props.priv - optional, private key
 * @param {String|KeyPair} props.pub - optional, public key
 */
function DSAKey (props) {
  Key.call(this, props)
}

inherits(DSAKey, Key)
DSAKey.type = 'dsa'

// DSAKey.prototype.validate = function() {
//   return (this.priv() || this.pub()).validate()
// }

DSAKey.prototype.sign = function (msg) {
  var sig = this.priv().sign(msg)
  return toString(sig)
}

DSAKey.prototype.verify = function (msg, sig) {
  sig = parseSig(sig)
  return DSA.verify(this.pub(), msg, sig[0], sig[1])
}

DSAKey.gen = function (options) {
  options = options || {}
  return new DSAKey(extend({
    purpose: 'sign',
    priv: new DSA()
  }, options))
}

DSAKey.prototype.parsePriv = function (priv) {
  return DSA.parsePrivate(priv)
}

DSAKey.prototype.parsePub = function (pub) {
  return DSA.parsePublic(new Buffer(pub, 'base64').toString('binary'))
}

DSAKey.prototype.stringifyPriv = function (priv) {
  return (priv || this.priv()).packPrivate()
}

DSAKey.prototype.stringifyPub = function (pub) {
  var packed = (pub || this.pub()).packPublic()
  return new Buffer(packed, 'binary').toString('base64')
}

DSAKey.prototype.pubFromPriv = function (priv) {
  return DSA.parsePublic((priv || this.priv()).packPublic())
}

DSAKey.prototype.fingerprintFromPub = function (pub) {
  if (typeof pub === 'string') pub = this.parsePub(pub)

  return pub.fingerprint()
}

function toString (sig) {
  return new Buffer(
    BigInt.bigInt2bits(sig[0], 20) + BigInt.bigInt2bits(sig[1], 20),
    'binary'
  ).toString('base64')
}

function parseSig (sig) {
  sig = new Buffer(sig, 'base64').toString('binary')
  var r = bits2bigInt(sig.slice(0, 20))
  var s = bits2bigInt(sig.slice(20))
  return [r, s]
}

module.exports = DSAKey
