
var Key = require('./key');
var inherits = require('util').inherits;
var extend = require('extend')
var DSA = require('otr').DSA;
var BigInt = require('otr/vendor/bigint')
var bits2bigInt = require('otr/lib/helpers').bits2bigInt

/**
 * elliptic curve key
 * @param {Object} props
 * @param {String|KeyPair} props.priv - optional, private key
 * @param {String|KeyPair} props.pub - optional, public key
 */
function DSAKey(props) {
  Key.call(this, props);
}

inherits(DSAKey, Key);
DSAKey.type = 'dsa';

// DSAKey.prototype.validate = function() {
//   return (this.priv() || this.pub()).validate();
// }

DSAKey.prototype.sign = function(msg) {
  var sig = this.priv().sign(msg)
  return toDER(sig)
}

DSAKey.prototype.verify = function(msg, sig) {
  sig = fromDER(sig)
  return DSA.verify(this.pub(), msg, sig[0], sig[1]);
}

DSAKey.gen = function(options) {
  options = options || {}
  return new DSAKey(extend({
    purpose: 'sign',
    priv: new DSA()
  }, options));
}

DSAKey.prototype.parsePriv = function(priv) {
  return DSA.parsePrivate(priv)
}

DSAKey.prototype.parsePub = function(pub) {
  return DSA.parsePublic(pub)
}

DSAKey.prototype.stringifyPriv = function(priv) {
  return (priv || this.priv()).packPrivate()
}

DSAKey.prototype.stringifyPub = function(pub) {
  return (pub || this.pub()).packPublic()
}

DSAKey.prototype.pubFromPriv = function(priv) {
  return DSA.parsePublic(this.stringifyPub(priv || this.priv()))
}

DSAKey.prototype.fingerprintFromPub = function(pub) {
  if (typeof pub === 'string') pub = this.parsePub(pub)

  return pub.fingerprint()
}

function toDER(sig) {
  return BigInt.bigInt2bits(sig[0], 20) + BigInt.bigInt2bits(sig[1], 20)
}

function fromDER(sig) {
  var r = bits2bigInt(sig.slice(0, 20))
  var s = bits2bigInt(sig.slice(20))
  return [r, s]
}

module.exports = DSAKey;
