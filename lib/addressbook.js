var HashMap = require('hashmap')
var PUB_KEY_INDEX = {
  name: 'pub',
  unique: true
}

var defaultIndices = [
  PUB_KEY_INDEX,
  {
    name: 'fingerprint',
    unique: true
  }
]

/**
 * Address book for Identity objects. Each pub key in an identity must be unique
 * @param {[type]} options [description]
 */
function AddressBook (options) {
  options = options || {}
  this._indices = []

  var indices = (options.indices || defaultIndices)
  indices.forEach(this.addIndex, this)
  this.addIndex(PUB_KEY_INDEX)
}

AddressBook.prototype.addIndex = function (index) {
  var self = this
  var name = index.name
  var mapName = getMapName(name)
  if (this[mapName]) return

  this._indices.push(index)
  var map = this[mapName] = new HashMap()
  var methodName = getMethodName(name)
  this[methodName] = function (key, val) {
    if (arguments.length === 1) return map.get(key)
    else map.set(key, val)
  }

  if (!this.size()) return

  var pubKeyMap = this[getMapName(PUB_KEY_INDEX.name)]
  pubKeyMap.forEach(function (val, key) {
    self._checkDup(index, val.key)
    self[methodName](val.key.get(index.name), val)
  })
}

AddressBook.prototype._checkDup = function (index, key) {
  if (!index.unique) return

  var pVal = key.get(index.name)
  if (typeof pVal !== 'undefined' && this.__byIndex(index, pVal)) {
    throw new Error('already have an identity with this ' + index.name)
  }
}

AddressBook.prototype.size = function () {
  return this[getMapName(PUB_KEY_INDEX.name)].count()
}

AddressBook.prototype.__byIndex = function (index, key, val) {
  var name = index.name
  if (arguments.length === 2) return this[getMethodName(name)](key)
  else return this[getMethodName(name)](key, val)
}

/**
 * add an identity to the address book
 * @param {Identity} identity
 */
AddressBook.prototype.add = function (identity, replace) {
  var size = this.size()
  identity.keys().forEach(function (key) {
    if (!replace) {
      this._indices.forEach(function (index) {
        if (!index.unique) return

        var pVal = key.get(index.name)
        if (typeof pVal !== 'undefined' && this.__byIndex(index, pVal)) {
          throw new Error('already have an identity with this ' + index.name)
        }
      }, this)
    }

    this._indices.forEach(function (index) {
      var pVal = key.get(index.name)
      if (typeof pVal !== 'undefined') {
        this.__byIndex(index, pVal, {
          key: key,
          identity: identity
        })
      }
    }, this)
  }, this)

  return this.size() > size
}

/**
 * remove an identity from the address book
 * @param  {Identity} identity
 */
AddressBook.prototype.remove = function (identity) {
  var size = this.size()
  identity.keys().forEach(function (key) {
    this._indices.forEach(function (index) {
      this[getMapName(index.name)].remove(key.get(index.name))
    }, this)
  }, this)

  return this.size() < size
}

function getMapName (index) {
  return '_by' + capFirst(index)
}

function getMethodName (index) {
  return 'by' + capFirst(index)
}

function capFirst (s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

module.exports = AddressBook
