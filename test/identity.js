var Identity = require('../lib/identity')
var test = require('tape')
var tedPublic = require('./fixtures/ted-pub')
var tedPrivate = require('./fixtures/ted-priv')
var ryanPublic = require('./fixtures/ryan-pub')
var Types = require('../lib/sectionTypes')
var Keys = require('../lib/keys')
var AddressBook = require('../lib/addressbook')

test('export/load identity', function (t) {
  var ted = Identity.fromJSON(tedPublic)
  var ted2 = Identity.fromJSON(tedPublic)
  var photo = ted.photos()[0]
  t.ok(photo instanceof Types.Photo)
  t.equal(photo._props.type, 'headshot')

  var bill = Identity.fromJSON(tedPublic).name('Bill')
  var tedWKeys = Identity.fromJSON(tedPrivate)
  var signed = tedWKeys.exportSigned()
  // export a valid json
  t.ok(signed, 'export signed identity')
  t.ok(Identity.fromJSON(signed), 'validate exported identity')
  t.throws(ted.exportSigned.bind(ted), /missing private key/)
  t.equal(ted.hash(), ted2.hash())
  t.ok(ted.equals(ted2))
  t.notEqual(ted.hash(), bill.hash())
  t.notOk(ted.equals(bill))
  t.end()
})

test('sign with various keys', function (t) {
  var msg = 'sup dude?'
  var ted = Identity.fromJSON(tedPublic)
  var tedWKeys = Identity.fromJSON(tedPrivate)

  tedWKeys.signingKeys().forEach(function (key) {
    var sig = key.sign(msg)
    var pub = ted.keys({ pub: key.pubKeyString() })[0]
    t.ok(pub.verify(msg, sig))
  })
  // var btcPubKey = utils.find(tedPublic.pubkeys, function(k) {
  //   return k.type === 'bitcoin' && k
  // })

  // var sig = tedWKeys.sign(msg, btcPubKey.value)
  // t.ok(toKey(btcPubKey).verify(msg, sig))

  // t.equal(sig, '3045022022465a0ced56b9036a227849fc35a0e03964e18d2a68c3d3bda18039019c84a3022100a96132cce68e46a0a85c2910a5dcb4320b657eb48b6c3de3a50a80d51cc42a38')
  t.throws(function () {
    tedWKeys.sign(msg, 'not a key')
  })

  t.throws(function () {
    tedWKeys.sign(msg, new Keys.Bitcoin({
      networkName: 'testnet',
      pub: Keys.Bitcoin.gen('testnet').pub()
    }))
  }, /key not found/)

  ted.keys().forEach(function (key) {
    t.isNot(tedWKeys.getPrivateKey(key), null, 'has private key')
  })

  t.end()
})

test('address book', function (t) {
  var teds = new AddressBook()
  var ted = Identity.fromJSON(tedPublic)
  teds.add(ted)

  var futureTed = Identity.fromJSON(tedPublic)
  t.throws(function () {
    teds.add(futureTed)
  }, /identity with this/)

  ted.keys().forEach(function (key) {
    t.isNot(teds.byPub(key), null, 'found contact by pubkey')
  })

  ted.keys().forEach(function (key) {
    t.isNot(teds.byFingerprint(key), null, 'found contact by key fingerprint')
  })

  teds.addIndex({ name: 'label', unique: true })
  teds.addIndex({ name: 'networkName', unique: false })
  var labelMatch = teds.byLabel('most triumphant key')
  var networkMatch = teds.byNetworkName('testnet')
  t.isNot(labelMatch, null, 'found contact by label')
  t.isNot(networkMatch, null, 'found contact by networkName')

  t.ok(teds.remove(ted))
  t.end()
})

test('revocation', function (t) {
  var key = Keys.Bitcoin.gen()
  var cert = key.generateRevocation(Keys.Base.REVOCATION_REASONS.keyCompromise)
  var valid = key.validateRevocation(cert)
  t.equal(valid.result, true)

  t.throws(function () {
    key.generateRevocation(11)
  }, /Invalid revocation reason/)

  key.addRevocation(1)
  key.addRevocation(2)
  t.equal(key.toJSON().revocations.length, 2)

  t.end()
})

test('openname compliant', function (t) {
  var ryan = Identity.fromJSON(ryanPublic)
  t.ok(ryan)
  t.end()
})
