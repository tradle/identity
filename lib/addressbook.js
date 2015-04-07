
var utils = require('./utils');
var HashMap = require('hashmap');

/**
 * Address book for Identity objects. Each pub key in an identity must be unique
 * @param {[type]} options [description]
 */
function AddressBook(options) {
  this._byPubKey = new HashMap();
  this._byHash = new HashMap();
}

/**
 * add an identity to the address book
 * @param {Identity} identity
 */
AddressBook.prototype.add = function(identity, replace) {
  var size = this.size();
  identity.forEachKey(function(key) {
    var pub = key.pub();
    if (!replace && this.byPubKey(pub)) throw new Error('already have an identity with key ' + key);

    this._byPubKey.set(pub, identity);
    if (key.hash) this._byHash.set(key.hash, identity);
  }, this);

  return this.size() > size;
}

/**
 * remove an identity from the address book
 * @param  {Identity} identity
 */
AddressBook.prototype.remove = function(identity) {
  var size = this.size();
  identity.forEachKey(function(key) {
    this._byPubKey.remove(key.pub());
    var hash = key.hash();
    if (hash) this._byHash.remove(key.hash());
  }, this);

  return this.size() < size;
}

AddressBook.prototype.size = function() {
  return this._byPubKey.count();
}

/**
 * find an identity in the address book by one of its pubKeys
 * @param  {String} hash
 * @return {Identity}
 */
AddressBook.prototype.byHash = function(hash) {
  return this._byHash.get(hash);
}

/**
 * find an identity in the address book by one of its pubKeys
 * @param  {String} pubKey
 * @return {Identity}
 */
AddressBook.prototype.byPubKey = function(pubKey) {
  return this._byPubKey.get(pubKey);
}

module.exports = AddressBook;
