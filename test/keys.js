var test = require('tape')
var toKey = require('../lib/toKey')
var fixtures = require('./fixtures/sigs')
var MSG = fixtures.msg

// Object.keys(Keys)
//   .filter(function(type) {
//     return type !== 'Base'
//   })
;['DSA', 'Bitcoin', 'EC'].forEach(testKey)

function testKey (type) {
  var json = require('./fixtures/keys/' + type)
  var key
  test('parse', function (t) {
    key = toKey(json)
    t.equal(key.stringifyPriv(), json.priv)
    t.equal(key.stringifyPub(), json.value)
    t.equal(key.get('purpose'), json.purpose)
    t.equal(key.get('type'), json.type)
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

  test('convenience methods', function (t) {
    t.equal(key.stringifyPriv(key.parsePriv(json.priv)), json.priv)
    t.equal(key.stringifyPub(key.pubFromPriv()), json.value)
    t.equal(key.stringifyPub(key.parsePub(json.value)), json.value)
    t.equal(key.pubKeyString(), json.value)
    t.equal(key.fingerprint(), json.fingerprint)
    t.equal(key.fingerprintFromPub(key.pub()), json.fingerprint)
    t.equal(key.type(), json.type)
    t.end()
  })

  test('sign/verify', function (t) {
    var sig = key.sign(MSG)
    t.ok(key.verify(MSG, sig))
    if (key.hasDeterministicSig()) {
      t.equal(sig, fixtures[type])
    }

    t.end()
  })
}
