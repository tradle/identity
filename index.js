
'use strict';

var extend = require('extend');
var inherits = require('util').inherits;
var omit = require('object.omit');
var utils = require('./utils');
var ec = utils.ec;
var DEFAULT_KEY_PURPOSE = 'identity';

function Identity(props) {
  // if ('_keys' in props) throw new Error('"_keys" is a reserved property');

  this._props = extend(true, {}, props);
  delete this._props._keys;

  this._keys = {};
  if (!props._keys) return this;

  for (var purpose in props._keys) {
    var keys = props._keys[purpose];
    for (var pubKey in keys) {
      var priv = typeof keys[pubKey] === 'string' && keys[pubKey];
      this.addKey({
        purpose: purpose,
        priv: priv,
        pub: pubKey
      });
    }
  }
}

Identity.prototype.genKey = function() {
  return ec.genKeyPair();
}

Identity.prototype.addNewKey = function(purpose) {
  return this.addKey({
    purpose: purpose,
    priv: this.genKey()
  });
}

Identity.prototype.addKey = function(options) {
  options = options || {};
  var purpose = options.purpose || DEFAULT_KEY_PURPOSE;
  var key;
  if (options.priv) key = utils.toPrivKey(options.priv);
  else if (options.pub) key = utils.toPubKey(options.pub);
  else throw new Error('to generate a new key, use addNewKey');

  var validitity = key.validate();
  if (!validitity.result) throw new Error(validitity.reason);

  var family = this._keys[purpose] || (this._keys[purpose] = {});
  var pubKey = utils.pubKeyString(key);
  if (pubKey in family) throw new Error('duplicate key');

  family[pubKey] = key;
  return this;
}

/**
 * get the private key for a given public key
 * @param  {String|KeyPair} key - public key
 * @param  {String} purpose - optional, the key's purpose (bitcoin, identity, etc.)
 * @return {KeyPair} the corresponding private key if this Identity has it, undefined otherwise
 */
Identity.prototype.getPrivateKey = function(key, purpose) {
  var purposes;
  if (typeof purpose === 'undefined') {
    purposes = Object.keys(this._keys);
  }
  else if (typeof purpose === 'string') {
    purposes = [purpose];
  }

  var keyStr = utils.pubKeyString(key);
  var priv;
  purposes.some(function(purpose) {
    var family = this._keys[purpose];
    return priv = family && family[keyStr];
  }, this);

  if (priv && priv.priv) {
    return utils.toPrivKey(priv.getPrivate(utils.ENCODING));
  }
}

Identity.verify = function(data, key, signature) {
  return utils.verify(data, key, signature);
}

Identity.prototype.sign = function(data, key) {
  if (!key.priv) key = this.getPrivateKey(key);

  if (!key) throw new Error('key not found');

  return utils.sign(data, key);
}

/**
 * export identity to json
 * @param  {Boolean} exportPrivateKeys - include private keys in exported json
 * @return {Object}
 */
Identity.prototype.toJSON = function(exportPrivateKeys) {
  var props = extend(true, {}, this._props);

  props._keys = this.keys(exportPrivateKeys);
  return props;
}

Identity.prototype.keys = function(exportPrivateKeys) {
  var keys = {};

  for (var purpose in this._keys) {
    var exported = keys[purpose] = {};
    var family = this._keys[purpose];
    for (var pub in family) {
      if (exportPrivateKeys) {
        exported[pub] = family[pub].getPrivate(utils.ENCODING);
      }
      else {
        exported[pub] = {};
      }
    }
  }

  return keys;
}

Identity.prototype.signAll = function(obj) {
  var str = utils.stringify(obj);
  var sigTree = {};

  for (var purpose in this._keys) {
    var family = this._keys[purpose];
    var sigs = sigTree[purpose] = {};
    for (var pub in family) {
      var key = family[pub];
      if (!key.priv) throw new Error('missing private key for ' + pub);

      sigs[pub] = {
        _sig: utils.sign(str, key)
      }
    }
  }

  return sigTree;
}

Identity.prototype.exportSigned = function() {
  var json = this.toJSON();
  var sigTree = this.signAll(json);
  return extend(true, json, {
    _keys: sigTree
  });
}

Identity.prototype.toString = function(sign) {
  return utils.stringify(this.toJSON(sign));
}

Identity.fromJSON = function(json) {
  if (typeof json === 'string') json = JSON.parse(json);

  var parts = utils.splitDataAndSigs(json);
  var unsigned = parts.unsigned;
  var sigs = parts.sigs;

  utils.verifySigs(unsigned, sigs);

  return new Identity(unsigned);
}

Identity.prototype.keys = function(purpose) {
  // dangerous, better return an immutable object
  return this._keys[purpose];
}

module.exports = Identity;
