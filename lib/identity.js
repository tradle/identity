'use strict'

var assert = require('assert')
var extend = require('extend')
var utils = require('./utils')
var stringify = require('@tradle/utils').stringify
var CONSTANTS = require('@tradle/constants')
var TYPE = CONSTANTS.TYPE
// var SIG = CONSTANTS.SIG
var kiki = require('@tradle/kiki')
var toKey = kiki.toKey
var Key = kiki.Key
// var DEFAULT_KEY_CATEGORY = 'identity'
var KEYS_KEY = 'pubkeys'
var Types = require('./sectionTypes')
var REQD_KEYS = require('./requiredKeys')
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

Identity.prototype.exportKeys = function () {
  return this._keys.map(function (key) {
    return key.exportPublic()
  })
}

Identity.hasRequiredKeys = function (json) {
  var pubkeys = json.pubkeys
  return REQD_KEYS.every(function (rkey) {
    return pubkeys.some(function (key) {
      for (var p in rkey) {
        if (key[p] !== rkey[p]) return false
      }

      return true
    })
  })
}

// stepping stone to getting scrapping this module
Identity.validate = function (json) {
  if (Identity.hasRequiredKeys(json)) {
    return {
      valid: true
    }
  } else {
    return {
      valid: false,
      reason: 'missing some required keys'
    }
  }
}

Identity.prototype.validate = function () {
  var result = {
    valid: false
  }

  var reason
  REQD_KEYS.every(function (keyProps) {
    if (!this.keys(keyProps).length) {
      reason = 'missing required key: ' + JSON.stringify(keyProps)
    } else {
      return true
    }
  }, this)

  if (reason) {
    result.reason = reason
  } else {
    result.valid = true
  }

  return result
}

Identity.verify = function (data, key, signature) {
  return key.verify(stringify(data), signature)
}

/**
 * export identity to json
 * @return {Object}
 */
Identity.prototype.toJSON = function () {
  var validity = this.validate()
  if (!validity.valid) throw new Error(validity.reason)

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

  props[KEYS_KEY] = this.exportKeys()
  props.v = Identity.VERSION
  props[TYPE] = Identity.TYPE
  return props
}

/**
 * @return {String} string form of identity, with determinstic property order in stringified json
 */
Identity.prototype.toString = function () {
  return stringify(this.toJSON())
}

Identity.prototype.equals = function (identity) {
  return this === identity ||
    this.toString() === identity.toString()
}

/**
 * @return {Identity}
 */
Identity.fromJSON = function (json) {
  var ident = new Identity()
  if (Buffer.isBuffer(json) || typeof json === 'string') {
    json = JSON.parse(json)
  }

  if (!('v' in json)) {
    throw new Error('property "v" (version) is required')
  }

  if (!(TYPE in json)) {
    throw new Error('property ' + TYPE + ' is required')
  }

  var keys = json[KEYS_KEY] || []

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

  var validity = ident.validate()
  if (!validity.valid) {
    throw new Error(validity.reason)
  }

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
