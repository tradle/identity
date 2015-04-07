
// var BitcoinKey = require('./bitcoin-elliptic');
var BitcoinKey = require('./bitcoinjs-lib');
var ECKey = require('./ec');
var Key = require('./key');

module.exports = {
  base: Key,
  Base: Key,
  Bitcoin: BitcoinKey,
  bitcoin: BitcoinKey,
  EC: ECKey,
  ec: ECKey,
  default: BitcoinKey,
  toKey: function toKey(key) {
    if (key instanceof Key) return key;

    var KeyCl = module.exports[key.type];
    if (!KeyCl) throw new Error('unrecognized key type: ' + key.type);

    return new KeyCl(key);
  }
}
