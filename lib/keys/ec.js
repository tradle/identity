var Key = require('./key')
var inherits = require('util').inherits
var EC = require('elliptic').ec
var extend = require('extend')
var assert = require('assert')
var crypto = require('crypto')
var PUB_PROPS = ['curve', 'pub']
var DEFAULT_CURVE = 'ed25519'
var curves = {}

/**
 * elliptic curve key
 * @param {Object} props
 * @param {String} props.curve
 * @param {String|KeyPair} props.priv - optional, private key
 * @param {String|KeyPair} props.pub - optional, public key
 */
function ECKey (props) {
  assert(typeof props.curve === 'string')
  this.ec = getCurve(props.curve)

  props.type = 'ec'
  Key.call(this, props)
}

inherits(ECKey, Key)
ECKey.type = 'ec'

ECKey.prototype.equals = function (key) {
  return PUB_PROPS.every(function (p) {
    return this.get(p) === key.get(p)
  }, this)
}

ECKey.prototype.validate = function () {
  return (this.priv() || this.pub()).validate()
}

ECKey.prototype.sign = function (msg) {
  return this.priv().sign(msg).toDER('hex')
}

ECKey.prototype.verify = function (msg, sig) {
  return this.pub().verify(msg, sig)
}

ECKey.gen = function (options) {
  var curve = options.curve || DEFAULT_CURVE
  var ec = getCurve(curve)

  options = extend(true, {
    curve: curve,
    priv: ec.genKeyPair()
  }, options || {})

  return new ECKey(options)
}

ECKey.prototype.parsePriv = function (priv) {
  return this.ec.keyFromPrivate(priv, 'hex')
}

ECKey.prototype.parsePub = function (pub) {
  return this.ec.keyFromPublic(pub, 'hex')
}

ECKey.prototype.stringifyPriv = function (priv) {
  return (priv || this.priv()).getPrivate('hex')
}

ECKey.prototype.stringifyPub = function (pub) {
  return (pub || this.pub()).getPublic(true, 'hex')
}

ECKey.prototype.pubFromPriv = function (priv) {
  return priv || this.priv() // only one key class in elliptic
}

ECKey.prototype.fingerprintFromPub = function (pub) {
  pub = this.stringifyPub(pub || this.pub())
  return crypto.createHash('sha256').update(pub).digest('hex')
}

function getCurve (name) {
  if (!curves[name]) curves[name] = new EC(name)

  return curves[name]
}

module.exports = ECKey
