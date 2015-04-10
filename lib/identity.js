
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
var arrayMethods = ['some', 'forEach', 'map', 'reduce'];
// var DEFAULT_KEY_CATEGORY = 'identity';
var KEYS_KEY = 'pubkeys';
var Types = require('./sectionTypes');
var PROP_TO_CL = {
  contact: Types.Contact,
  websites: Types.Website,
  photos: Types.Photo,
  payments: Types.Payment,
  profiles: Types.Profile,
  statements: Types.Statement,
  connections: Types.Connection
};

// https://github.com/openname/specifications/blob/master/profiles/profiles-v03.md
var VERSION = '0.3';
var RESERVED_KEYS = [
  'name', 'location', 'summary', 'websites', 'contact', 'photos',
  'pubkeys', 'payments', 'profiles', 'connections', 'statements',
  'auth', 'v'
];

function Identity() {
  this._props = {};
  this._keys = [];
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

Identity.prototype.keys = function() {
  return this._keys;
}

Identity.prototype.addKey = function(key) {
  key = toKey(key);
  assert(key instanceof Key);

  var foundDuplicate = this._keys.some(function(dup) {
    return dup.equals(key);
  });

  if (foundDuplicate) throw new Error('duplicate key');

  this._keys.push(key);
  return this;
}

Identity.prototype.exportKeys = function(exportPrivateKeys) {
  return this._keys.map(function(key) {
    return key.toJSON(exportPrivateKeys);
  });
}

/**
 * get the private key for a given public key
 * @param  {String|Key} key - public key
 * @return {KeyPair} the corresponding private key if this Identity has it, undefined otherwise
 */
Identity.prototype.getPrivateKey = function(key) {
  var pubKeyStr = typeof key === 'string' ? key : key.pubKeyString();
  return find(this._keys, function(k) {
    return k.pubKeyString() === pubKeyStr && k.priv() && k;
  });
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

/**
 * Sign obj with all of this identity's keys
 * @param  {String|Object} obj [description]
 * @return {Object} keys and their respective signatures
 */
Identity.prototype.signAll = function(obj) {
  var str = stringify(obj);
  return this._keys.map(function(key) {
    if (!key.priv()) throw new Error('missing private key for ' + key.pub());

    return extend({ _sig: key.sign(str) }, key.toJSON());
  });
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
  var ident = new Identity();
  if (typeof json === 'string') json = JSON.parse(json);

  var unsigned;
  var keys = json[KEYS_KEY] || [];
  var hasSigs;
  var unsignedKeys = keys.map(function(key) {
    if ('_sig' in key) {
      hasSigs = true;
      return omit(key, '_sig');
    }
    else return key;
  });

  if (hasSigs) {
    unsigned = omit(json, KEYS_KEY);
    unsigned[KEYS_KEY] = unsignedKeys;
    var unsignedStr = stringify(unsigned);

    unsignedKeys.forEach(function(key, idx) {
      var sig = keys[idx]._sig;
      if (!sig) return;

      key = toKey(key);

      if (!key.verify(unsignedStr, sig)) throw new Error('invalid signature');

      keys[idx] = key;
    });

    json = unsigned;
  }

  keys.forEach(function(key, idx) {
    try {
      ident.addKey(toKey(key));
    } catch (err) {
      if (/unrecognized key type/.test(err.message)) {
        console.warn('Don\'t have an implementation for key type: ' + key.type);
      }
      else throw err;
    }
  });

  Object.keys(json).forEach(function(p) {
    if (p in PROP_TO_CL) {
      var Cl = PROP_TO_CL[p];
      ident.set(p, json[p].map(function(props, idx) {
        return props instanceof Cl ? props : new Cl(props);
      }));
    }
  });

  return ident;
}

;['name', 'location'].forEach(function(prop) {
  Identity.prototype[prop] = function(val) {
    if (typeof val !== 'undefined') {
      val = val.formatted ? val : { formatted: val };
      return this.set(prop, val);
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
    if (!(val instanceof Cl)) val = new Cl(val);

    var col = this._props[prop] = this._props[prop] || [];
    col.push(val);
    return this;
  }
});

module.exports = Identity;
