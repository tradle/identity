var test = require('tape')
var crypto = require('crypto')
var toKey = require('../lib/toKey')
var MSG = crypto.randomBytes(32).toString()

// Object.keys(Keys)
//   .filter(function(type) {
//     return type !== 'Base'
//   })
;['DSA', 'Bitcoin']
  .forEach(testKey)

function testKey (type) {
  var json = require('./fixtures/keys/' + type)
  var key
  test('parse', function (t) {
    key = toKey(json)
    t.equal(key.stringifyPriv(), json.priv)
    t.equal(key.stringifyPub(), json.value)
    t.end()
  })

  test('export', function (t) {
    // pub JSON is priv JSON minus 'priv' property
    var pub = key.toJSON()
    t.notOk('priv' in pub)
    var priv = key.toJSON(true)
    t.deepEqual(priv, json)
    pub.priv = priv.priv
    t.deepEqual(priv, json)
    t.end()
  })

  test('sign/verify', function (t) {
    var sig = key.sign(MSG)
    t.ok(key.verify(MSG, sig))
    t.end()
  })
}
