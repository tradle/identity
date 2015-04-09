
'use strict';

var extend = require('extend');
var inherits = require('util').inherits;
var typeforce = require('typeforce');
var omit = require('object.omit');
var utils = require('./utils');
var stringify = require('tradle-utils').stringify;
var find = utils.find;
var Keys = require('./keys');
var Key = require('./keys/key');
var toKey = require('./toKey');
var assert = require('assert');
var Contact = require('./types/Contact');
var Photo = require('./types/Photo');
var arrayMethods = ['some', 'forEach', 'map', 'reduce'];
var DEFAULT_KEY_CATEGORY = 'identity';
var KEYS_KEY = 'pubkeys';
var PROP_TO_CL = {
  contact: require('./types/contact'),
  websites: require('./types/website'),
  photos: require('./types/photo'),
  payments: require('./types/payment'),
  profiles: require('./types/profile'),
  statements: require('./types/statement'),
  connections: require('./types/connection')
};

// https://github.com/openname/specifications/blob/master/profiles/profiles-v03.md
var VERSION = '0.3';
var RESERVED_KEYS = [
  'name', 'location', 'summary', 'websites', 'contact', 'photos',
  'pubkeys', 'payments', 'profiles', 'connections', 'statements',
  'auth', 'v'
];

function Identity(props) {
  var self = this;

  this._props = extend(true, {}, props);
  delete this._props._keys;

  this._keys = {};
  // this._keyByHash = {};
  if (props[KEYS_KEY]) {
    for (var cat in props[KEYS_KEY]) {
      props[KEYS_KEY][cat].forEach(function(key) {
        this.addKey(cat, key);
      }, this);
    }
  }

  arrayMethods.forEach(proxyArrayMethod.bind(this));
}

Identity.prototype.set = function(prop, val) {
  this._props[prop] = val;
  return this;
}

Identity.prototype.summary = function(val) {
  if (typeof val === 'undefined') return this._props.summary;
  else this.set('summary', val);

  return this;
}

Identity.prototype.keys = function(category) {
  return category ? this._keys[category] : this._keys;
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
  props[KEYS_KEY] = this.exportKeys(exportPrivateKeys);
  props.v = VERSION;
  return props;
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
  var withSigs = {};
  withSigs[KEYS_KEY] = this.signAll(json);
  return extend(true, json, withSigs);
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
  var keys = json[KEYS_KEY];
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
    unsigned = omit(json, KEYS_KEY);
    unsigned[KEYS_KEY] = unsignedKeys;
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

['name', 'location'].forEach(function(prop) {
  Identity.prototype[prop] = function(val) {
    if (typeof val !== 'undefined') {
      return this.set(prop, {
        formatted: val
      });
    }
    else {
      val = this._props[prop];
      return val && val.formatted;
    }
  }
});

/**
 * add methods to Identity prototype:
 *   photos(), addPhoto(), contacts(), addContact(), etc.
 */
Object.keys(PROP_TO_CL).forEach(function(prop) {
  var Cl = PROP_TO_CL[prop];
  Identity.prototype[prop] = function(val) {
    return this._props[prop];
  }

  var singular = /s$/.test(prop) ? prop.slice(0, prop.length - 1) : prop;
  Identity.prototype['add' + utils.capFirst(singular)] = function(val) {
    assert(val instanceof Cl);
    var col = this._props[prop] = this._props[prop] || [];
    col.push(val);
  }
});

module.exports = Identity;
