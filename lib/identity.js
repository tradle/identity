
'use strict';

var extend = require('extend');
var inherits = require('util').inherits;
var omit = require('object.omit');
var utils = require('./utils');
var stringify = require('tradle-utils').stringify;
var find = utils.find;
var Keys = require('./keys');
var Key = require('./keys/key');
var toKey = require('./toKey');
var assert = require('assert');
var arrayMethods = ['some', 'forEach', 'map', 'reduce'];
var DEFAULT_KEY_CATEGORY = 'identity';

function Identity(props) {
  var self = this;

  this._props = extend(true, {}, props);
  delete this._props._keys;

  this._keys = {};
  // this._keyByHash = {};
  if (props._keys) {
    for (var cat in props._keys) {
      props._keys[cat].forEach(function(key) {
        this.addKey(cat, key);
      }, this);
    }
  }

  arrayMethods.forEach(proxyArrayMethod.bind(this));
}

Identity.prototype.addKey = function(category, key) {
  if (typeof category === 'object') {
    key = category;
    category = DEFAULT_KEY_CATEGORY;
  }

  if (typeof key === 'object') key = toKey(key);

  assert(typeof category === 'string');
  assert(key instanceof Key);

  var family = this._keys[category] = this._keys[category] || [];
  var foundDuplicate = family.some(function(dup) {
    return dup.equals(key);
  });

  if (foundDuplicate) throw new Error('duplicate key');

  family.push(key);
  return this;
}

/**
 * get the private key for a given public key
 * @param  {String|KeyPair} key - public key
 * @param  {String} category - optional, the key's category (bitcoin, identity, etc.)
 * @return {KeyPair} the corresponding private key if this Identity has it, undefined otherwise
 */
Identity.prototype.getPrivateKey = function(key, category) {
  var cats;
  if (typeof category === 'undefined') {
    cats = Object.keys(this._keys);
  }
  else if (typeof category === 'string') {
    cats = [category];
  }

  key = toKey(key);
  var priv = find(cats, function(category) {
    var family = this._keys[category];
    return find(family, function(k) {
      return k.equals(key) && k.priv() && k;
    });
  }, this);

  return priv;
}

Identity.verify = function(data, key, signature) {
  return key.verify(stringify(data), signature);
}

Identity.prototype.sign = function(data, pubKey) {
  var key = this.getPrivateKey(pubKey);

  if (!key) throw new Error('key not found');

  return key.sign(data);
}

/**
 * export identity to json
 * @param  {Boolean} exportPrivateKeys - include private keys in exported json
 * @return {Object}
 */
Identity.prototype.toJSON = function(exportPrivateKeys) {
  var props = extend({}, this._props);

  props._keys = this.exportKeys(exportPrivateKeys);
  return props;
}

Identity.prototype.keys = function(category) {
  return category ? this._keys[category] : this._keys;
}

Identity.prototype.exportKeys = function(exportPrivateKeys) {
  var keys = {};

  for (var category in this._keys) {
    var family = this._keys[category];
    keys[category] = family.map(function(key) {
      return key.toJSON(exportPrivateKeys);
    });
  }

  return keys;
}

Identity.prototype.signAll = function(obj) {
  var str = stringify(obj);
  var keysAndSigs = {};

  for (var category in this._keys) {
    var withSigs = keysAndSigs[category] = [];
    this._keys[category].forEach(function(key) {
      if (!key.priv()) throw new Error('missing private key for ' + key.pub());

      withSigs.push(extend({ _sig: key.sign(str) }, key.toJSON()));
    });
  }

  return keysAndSigs;
}

/**
 * export identity, with signatures proving ownership of all keys
 * @return {Object}
 */
Identity.prototype.exportSigned = function() {
  var json = this.toJSON();
  var sigTree = this.signAll(json);
  return extend(true, json, {
    _keys: sigTree
  });
}

/**
 * export identity, with signatures proving ownership of all keys
 * @return {String} string form of identity, with determinstic property order in stringified json
 */
Identity.prototype.toString = function(sign) {
  return stringify(this.toJSON(sign));
}

/**
 * load an identity, verifying any signatures present
 * @return {Identity}
 */
Identity.fromJSON = function(json) {
  if (typeof json === 'string') json = JSON.parse(json);

  var unsigned;
  var keys = json._keys;
  var unsignedKeys = {};
  var hasSigs;
  for (var cat in keys) {
    unsignedKeys[cat] = keys[cat].map(function(key) {
      if ('_sig' in key) {
        hasSigs = true;
        return omit(key, '_sig');
      }
      else return key;
    });
  }

  if (hasSigs) {
    unsigned = omit(json, '_keys');
    unsigned._keys = unsignedKeys;
    var unsignedStr = stringify(unsigned);

    for (var cat in unsignedKeys) {
      unsignedKeys[cat].forEach(function(key, idx) {
        key = toKey(key);
        var sig = keys[cat][idx]._sig;
        if (sig && !key.verify(unsignedStr, sig)) throw new Error('invalid signature');

        keys[cat][idx] = key;
      });
    }
  }

  for (var cat in keys) {
    var catKeys = keys[cat];
    catKeys.forEach(function(key, idx) {
      catKeys[idx] = toKey(key);
    });
  }

  return new Identity(unsigned || json);
}

function proxyArrayMethod(method) {
  this[method + 'Key'] = function(category, fn, ctx) {
    if (typeof category === 'function') {
      ctx = fn;
      fn = category;
      category = null;
    }

    if (category) {
      this._keys[category].forEach(fn, ctx);
    }
    else {
      for (var cat in this._keys) {
        this._keys[cat].forEach(fn, ctx);
      }
    }
  }.bind(this);
}

module.exports = Identity;
