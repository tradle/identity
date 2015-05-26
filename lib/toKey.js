var types = require('./keys')
var Key = require('./keys/key')

module.exports = function toKey (key) {
  if (key instanceof Key) return key

  for (var p in types) {
    var KeyCl = types[p]
    if (KeyCl.type === key.type) {
      return new KeyCl(key)
    }
  }

  throw new Error('unrecognized key type: ' + key.type)
}
