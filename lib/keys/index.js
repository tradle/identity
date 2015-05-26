// var BitcoinKey = require('./bitcoin-elliptic')
var BitcoinKey = require('./bitcoinjs-lib')
var ECKey = require('./ec')
var DSAKey = require('./dsa')
var Key = require('./key')

module.exports = {
  Base: Key,
  Bitcoin: BitcoinKey,
  EC: ECKey,
  DSA: DSAKey,
  default: BitcoinKey
}
