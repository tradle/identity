
var utils = require('./utils');
var HashMap = require('hashmap');
var PUB_KEY_INDEX = {
  name: 'pub',
  unique: true
};

var defaultIndices = [
  PUB_KEY_INDEX,
  {
    name: 'address',
    unique: true
  }
]

/**
 * Address book for Identity objects. Each pub key in an identity must be unique
 * @param {[type]} options [description]
 */
function AddressBook(options) {
  options = options || {};

  this._indices = (options.indices || defaultIndices).slice();
  if (!this._indices.some(function(i) { return i.name === PUB_KEY_INDEX.name })) {
    this._indices.push(PUB_KEY_INDEX);
  }

  this._indices.forEach(indexBy, this);

  function indexBy(index) {
    var name = index.name;
    var map = this[getMapName(name)] = new HashMap();
    this[getMethodName(name)] = function(key, val) {
      if (arguments.length === 1) return map.get(key);
      else map.set(key, val);
    }

    if (index.unique && !this.size) {
      this.size = function() {
        return map.count();
      }
    }
  }
}

AddressBook.prototype.__byIndex = function(index, key, val) {
  var name = index.name;
  if (arguments.length === 2) return this[getMethodName(name)](key);
  else return this[getMethodName(name)](key, val);
}

/**
 * add an identity to the address book
 * @param {Identity} identity
 */
AddressBook.prototype.add = function(identity, replace) {
  var size = this.size();
  identity.forEachKey(function(key) {
    if (!replace) {
      this._indices.forEach(function(index) {
        if (!index.unique) return;

        var pVal = key.prop(index.name);
        if (typeof pVal !== 'undefined' && this.__byIndex(index, pVal)) {
          throw new Error('already have an identity with this ' + index.name);
        }
      }, this);
    }

    this._indices.forEach(function(index) {
      var pVal = key.prop(index.name);
      if (typeof pVal !== 'undefined') this.__byIndex(index, pVal, {
        key: key,
        identity: identity
      });
    }, this);
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
    this._indices.forEach(function(index) {
      this[getMapName(index.name)].remove(key.prop(index.name));
    }, this);
  }, this);

  return this.size() < size;
}

function result(obj, prop) {
  var val = obj[prop];
  if (typeof val === 'function') return val.call(obj);
  else return val;
}

function getMapName(index) {
  return '_by' + capFirst(index);
}

function getMethodName(index) {
  return 'by' + capFirst(index);
}

function capFirst(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

module.exports = AddressBook;
