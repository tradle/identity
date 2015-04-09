
var assert = require('assert');
var extend = require('extend');
var inherits = require('util').inherits;
var bitcoin = require('bitcoinjs-lib');
var utils = require('../utils');
var ECSignature = bitcoin.ECSignature;
var Key = require('./key');

function BitcoinKey(info) {
  assert(info.networkName, '"networkName" is required')
  Key.call(this, info);
}

inherits(BitcoinKey, Key);
BitcoinKey.type = 'bitcoin';

BitcoinKey.prototype.toJSON = function(exportPrivateKey) {
  return extend(Key.prototype.toJSON.call(this, exportPrivateKey), {
    address: this.address()
  });
}

BitcoinKey.prototype.address = function() {
  return this.prop('address') || this.fingerprintFromPub(this.pub());
}

BitcoinKey.prototype.sign = function(msg) {
  return this.priv().sign(utils.hash(msg)).toDER().toString('hex');
}

BitcoinKey.prototype.verify = function(msg, sig) {
  if (!(sig instanceof ECSignature)) {
    if (typeof sig === 'string') sig = new Buffer(sig, 'hex');

    sig = ECSignature.fromDER(sig);
  }

  return this.pub().verify(utils.hash(msg), sig);
}

BitcoinKey.gen = function(networkName) {
  return new BitcoinKey({
    networkName: networkName || 'bitcoin',
    priv: bitcoin.ECKey.makeRandom(true)
  });
}

BitcoinKey.prototype.parsePriv = function(str) {
  return bitcoin.ECKey.fromWIF(str);
}

BitcoinKey.prototype.parsePub = function(str) {
  return bitcoin.ECPubKey.fromHex(str);
}

BitcoinKey.prototype.pubFromPriv = function(priv) {
  return priv.pub;
}

BitcoinKey.prototype.fingerprint = function() {
  return this.fingerprintFromPub(this.pub());
}

BitcoinKey.prototype.fingerprintFromPub = function(pub, networkName) {
  return this.pub()
    .getAddress(this.network())
    .toString();
}

BitcoinKey.prototype.network = function(networkName) {
  networkName = networkName || this.prop('networkName');
  return bitcoin.networks[networkName];
}

BitcoinKey.prototype.stringifyPriv = function(priv) {
  return (priv || this.priv()).toWIF(this.network());
}

BitcoinKey.prototype.stringifyPub = function(pub) {
  return (pub || this.pub()).toHex();
}

module.exports = BitcoinKey;
