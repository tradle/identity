
// var BitcoinKey = require('./bitcoin-elliptic');
var BitcoinKey = require('./bitcoinjs-lib');
var ECKey = require('./ec');
var Key = require('./key');

var types = module.exports = {
  Base: Key,
  Bitcoin: BitcoinKey,
  EC: ECKey,
  default: BitcoinKey
}
