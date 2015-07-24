var Identity = require('../lib/identity')
var test = require('tape')
var tedPublic = require('./fixtures/ted-pub')
// var tedPrivate = require('./fixtures/ted-priv')
var ryanPublic = require('./fixtures/ryan-pub')
var Types = require('../lib/sectionTypes')
var AddressBook = require('../lib/addressbook')

test('export/load identity', function (t) {
  var ted = Identity.fromJSON(tedPublic)
  var ted2 = Identity.fromJSON(tedPublic)
  var photo = ted.photos()[0]
  t.ok(photo instanceof Types.Photo)
  t.equal(photo._props.type, 'headshot')

  var bill = Identity.fromJSON(tedPublic).name('Bill')
  t.ok(ted.equals(ted2))
  t.notOk(ted.equals(bill))
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

test('openname compliant', function (t) {
  var ryan = Identity.fromJSON(ryanPublic)
  t.ok(ryan)
  t.end()
})
