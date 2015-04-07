
var assert = require('assert');
var extend = require('extend');
var inherits = require('util').inherits;
var bitcoin = require('bitcoinjs-lib');
var bip32
var Key = require('./key');

function BitcoinKey(info) {
  assert(info.pub || info.priv, '"pub" or "priv" required')

  if (info.priv) assert(info.priv instanceof bitcoin.ECKey);

  if (info.pub) assert(info.pub instanceof bitcoin.ECPubKey);
  else info.pub = info.priv.pub;

  Key.call(this, info);
}

inherits(BitcoinKey, Key);

BitcoinKey.prototype.toJSON = function(exportPrivateKey) {
  var json = Key.prototype.toJSON.apply(this, arguments);
  json.address = json.address || this.address();
  return json;
}

BitcoinKey.prototype.address = function() {
  return this.prop('address') || this.pub().getAddress().toString();
}

BitcoinKey.gen = function() {
  return new BitcoinKey({
    priv: bitcoin.ECKey.makeRandom(true)
  });
}

module.exports = BitcoinKey;
