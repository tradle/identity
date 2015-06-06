var extend = require('extend')
var inherits = require('util').inherits
var bitcoin = require('bitcoinjs-lib')
var ECSignature = bitcoin.ECSignature
var Key = require('./key')

function BitcoinKey (props) {
  props = extend(true, {
    networkName: 'bitcoin',
    purpose: 'payment'
  }, props)

  Key.call(this, props)
}

inherits(BitcoinKey, Key)
BitcoinKey.type = 'bitcoin'

BitcoinKey.prototype.address = function () {
  return this.fingerprintFromPub(this.pub())
}

BitcoinKey.prototype._sign = function (msg) {
  return this.priv().sign(msg).toDER().toString('hex')
}

BitcoinKey.prototype._verify = function (msg, sig) {
  if (!(sig instanceof ECSignature)) {
    if (typeof sig === 'string') sig = new Buffer(sig, 'hex')

    sig = ECSignature.fromDER(sig)
  }

  return this.pub().verify(msg, sig)
}

BitcoinKey.prototype.parsePriv = function (str) {
  return bitcoin.ECKey.fromWIF(str)
}

BitcoinKey.prototype.parsePub = function (str) {
  return bitcoin.ECPubKey.fromHex(str)
}

BitcoinKey.prototype.pubFromPriv = function (priv) {
  return (priv || this.priv()).pub
}

BitcoinKey.prototype.fingerprintFromPub = function (pub, networkName) {
  return this.pub()
    .getAddress(this.network())
    .toString()
}

BitcoinKey.prototype.network = function (networkName) {
  networkName = networkName || this.get('networkName')
  return bitcoin.networks[networkName]
}

BitcoinKey.prototype.stringifyPriv = function (priv) {
  return (priv || this.priv()).toWIF(this.network())
}

BitcoinKey.prototype.stringifyPub = function (pub) {
  return (pub || this.pub()).toHex()
}

BitcoinKey.gen = function (props) {
  if (typeof props === 'string') {
    props = {
      networkName: props
    }
  }

  props = props || {}
  if (!props.networkName) props.networkName = 'bitcoin'

  props.priv = bitcoin.ECKey.makeRandom(true)
  return new BitcoinKey(props)
}

module.exports = BitcoinKey
