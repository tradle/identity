'use strict'

var assert = require('assert')
var crypto = require('crypto')
var extend = require('extend')
var omit = require('object.omit')
var utils = require('./utils')
var stringify = require('tradle-utils').stringify
var CONSTANTS = require('tradle-constants')
var TYPE = CONSTANTS.TYPE
var SIG = CONSTANTS.SIG
var find = utils.find
var Key = require('./keys/key')
var toKey = require('./toKey')
// var DEFAULT_KEY_CATEGORY = 'identity'
var KEYS_KEY = 'pubkeys'
var Types = require('./sectionTypes')
var REQD_KEYS = ['update', 'sign', 'encrypt']
var FORMATTED_PROPS = {
  name: true,
  location: true
}

var PROP_TO_CL = {
  contact: Types.Contact,
  websites: Types.Website,
  photos: Types.Photo,
  payments: Types.Payment,
  profiles: Types.Profile,
  statements: Types.Statement,
  connections: Types.Connection
}

// https://github.com/openname/specifications/blob/master/profiles/profiles-v03.md
// var RESERVED_KEYS = [
//   'name', 'location', 'summary', 'websites', 'contact', 'photos',
//   'pubkeys', 'payments', 'profiles', 'connections', 'statements',
//   'auth', 'v'
// ]

function Identity () {
  this._props = {}
  this._keys = []
}

Identity.TYPE = CONSTANTS.TYPES.IDENTITY
Identity.VERSION = '0.3'

Identity.prototype.set = function (prop, val) {
  this._props[prop] = val
  return this
}

Identity.prototype.get = function (prop) {
  return this._props[prop]
}

Identity.prototype.summary = function (val) {
  if (typeof val === 'undefined') return this.get('summary')
  else this.set('summary', val)

  return this
}

Identity.prototype.signingKeys = function () {
  return this.keys({
    purpose: 'sign'
  })
}

Identity.prototype.encryptionKeys = function () {
  return this.keys({
    purpose: 'encrypt'
  })
}

Identity.prototype.updateKey = function () {
  return this.keys({
    purpose: 'update'
  })[0]
}

Identity.prototype.keys = function (filter) {
  if (!filter) return this._keys

  if (typeof filter === 'string') filter = { type: filter }

  var filterFn = filter
  if (typeof filter === 'object') {
    filterFn = function (key) {
      for (var p in filter) {
        if (key.get(p) !== filter[p]) return false
      }

      return true
    }
  }

  return this._keys.filter(filterFn)
}

Identity.prototype.addKey = function (key) {
  key = toKey(key)
  assert(key instanceof Key)

  var foundDuplicate = this._keys.some(function (dup) {
    return dup.equals(key)
  })

  if (foundDuplicate) throw new Error('duplicate key')

  this._keys.push(key)
  return this
}

Identity.prototype.exportKeys = function (exportPrivateKeys) {
  return this._keys.map(function (key) {
    return key.toJSON(exportPrivateKeys)
  })
}

Identity.prototype.validate = function () {
  var found = {}

  this.keys().forEach(function (key) {
    var p = key.purpose()
    if (found[p]) found[p]++
    else found[p] = 1
  })

  var reason
  REQD_KEYS.every(function (purpose) {
    var count = found[purpose]
    if (count < 1) {
      reason = 'missing required key: ' + purpose
    }
    // else if (count > 1) {
    //   reason = 'only one "' + purpose + '" key is allowed'
    // }
    else return true
  })

  if (reason) {
    return {
      result: false,
      reason: reason
    }
  }

  return {
    result: true
  }
}

/**
 * get the private key for a given public key
 * @param  {String|Key} key - public key
 * @return {KeyPair} the corresponding private key if this Identity has it, undefined otherwise
 */
Identity.prototype.getPrivateKey = function (key) {
  var pubKeyStr = typeof key === 'string' ? key : key.pubKeyString()
  return find(this._keys, function (k) {
    return k.pubKeyString() === pubKeyStr && k.priv() && k
  })
}

Identity.verify = function (data, key, signature) {
  return key.verify(stringify(data), signature)
}

Identity.prototype.sign = function (data, pubKey) {
  var key = this.getPrivateKey(pubKey)

  if (!key) throw new Error('key not found')

  return key.sign(data)
}

/**
 * export identity to json
 * @param  {Boolean} exportPrivateKeys - include private keys in exported json
 * @return {Object}
 */
Identity.prototype.toJSON = function (exportPrivateKeys) {
  var validity = this.validate()
  if (!validity.result) throw new Error(validity.reason)

  var props = {}

  for (var p in this._props) {
    var val = this._props[p]
    if (p in PROP_TO_CL) {
      if (val) {
        props[p] = this._props[p].map(function (i) { return i.toJSON() })
      }
    } else {
      if (typeof val === 'string' || Buffer.isBuffer(val)) {
        props[p] = val
      } else {
        props[p] = extend(true, {}, this._props[p])
      }
    }
  }

  props[KEYS_KEY] = this.exportKeys(exportPrivateKeys)
  props.v = Identity.VERSION
  props[TYPE] = Identity.TYPE
  return props
}

/**
 * Sign obj with all of this identity's keys
 * @param  {String|Object} obj [description]
 * @return {Object} keys and their respective signatures
 */
Identity.prototype.signWithAll = function (obj) {
  var str = stringify(obj)
  return this._keys.map(function (key) {
    if (!key.priv()) throw new Error('missing private key for ' + key.pub())

    var signed = extend({}, key.toJSON())
    signed[SIG] = key.sign(str)
    return signed
  })
}

/**
 * export identity, with signatures proving ownership of all keys
 * @return {Object}
 */
Identity.prototype.exportSigned = function () {
  var json = this.toJSON()
  var withSigs = {}
  withSigs[KEYS_KEY] = this.signWithAll(json)
  return extend(true, json, withSigs)
}

/**
 * export identity, with signatures proving ownership of all keys
 * @return {String} string form of identity, with determinstic property order in stringified json
 */
Identity.prototype.toString = function () {
  return stringify(this.toJSON())
}

Identity.prototype.hash = function () {
  return crypto.createHash('sha256')
    .update(this.toString())
    .digest()
    .toString('hex')
}

Identity.prototype.equals = function (identity) {
  return this === identity ||
    this.hash() === identity.hash()
}

/**
 * load an identity, verifying any signatures present
 * @return {Identity}
 */
Identity.fromJSON = function (json) {
  var ident = new Identity()
  if (Buffer.isBuffer(json) || typeof json === 'string') {
    json = JSON.parse(json)
  }

  var unsigned
  var keys = json[KEYS_KEY] || []
  var hasSigs
  var unsignedKeys = keys.map(function (key) {
    if (SIG in key) {
      hasSigs = true
      return omit(key, SIG)
    }
    else return key
  })

  if (hasSigs) {
    unsigned = omit(json, KEYS_KEY)
    unsigned[KEYS_KEY] = unsignedKeys
    var unsignedStr = stringify(unsigned)

    unsignedKeys.forEach(function (key, idx) {
      var sig = keys[idx][SIG]
      if (!sig) return

      key = toKey(key)

      if (!key.verify(unsignedStr, sig)) throw new Error('invalid signature')
    })

    json = unsigned
  }

  keys.forEach(function (key, idx) {
    try {
      ident.addKey(key)
    } catch (err) {
      if (/unrecognized key type/.test(err.message)) {
        console.warn("Don't have an implementation for key type: " + key.type)
      }
      else throw err
    }
  })

  for (var p in json) {
    if (p === KEYS_KEY) continue
    else if (p in FORMATTED_PROPS) {
      ident[p](json[p])
    } else if (p in PROP_TO_CL) {
      var Cl = PROP_TO_CL[p]
      ident.set(p, json[p].map(function (props, idx) {
        return props instanceof Cl ? props : new Cl(props)
      }))
    }
    else ident.set(p, json[p])
  }

  ident.validate()
  ident._json = extend(true, {}, json)
  return ident
}

/**
 * @return {Object} JSON that this identity was loaded from,
 * or null if it was created from scratch
 */
Identity.prototype.getOriginalJSON = function () {
  return this._json
}

/**
 * add methods to Identity prototype:
 *   name, location, etc.
 */
Object.keys(FORMATTED_PROPS).forEach(function (prop) {
  Identity.prototype[prop] = function (val) {
    if (typeof val !== 'undefined') {
      val = val.formatted ? val : { formatted: val }
      return this.set(prop, val)
    } else {
      val = this.get(prop)
      return val && val.formatted
    }
  }
})

/**
 * add methods to Identity prototype:
 *   photos(), addPhoto(), contacts(), addContact(), etc.
 */
Object.keys(PROP_TO_CL).forEach(function (prop) {
  var Cl = PROP_TO_CL[prop]
  Identity.prototype[prop] = function (val) {
    return this.get(prop)
  }

  var singular = /s$/.test(prop) ? prop.slice(0, prop.length - 1) : prop
  Identity.prototype['add' + utils.capFirst(singular)] = function (val) {
    if (!(val instanceof Cl)) val = new Cl(val)

    if (!this.get(prop)) this.set(prop, [])

    var col = this.get(prop)
    col.push(val)
    return this
  }
})

module.exports = Identity
