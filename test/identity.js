var Identity = require('../lib/identity')
var test = require('tape')
var defaultKeySet = require('../lib/defaultKeySet')
var requiredKeys = require('../lib/requiredKeys')
var tedPublic = require('./fixtures/ted-pub')
// var ryanPublic = require('./fixtures/ryan-pub')
var Types = require('../lib/sectionTypes')
var AddressBook = require('../lib/addressbook')

test('create new identity', function (t) {
  var ted = new Identity()
    .name(tedPublic.name)
    .location(tedPublic.location)
    .summary(tedPublic.summary)

  tedPublic.websites.forEach(ted.addWebsite, ted)
  tedPublic.photos.forEach(ted.addPhoto, ted)
  tedPublic.contact.forEach(ted.addContact, ted)
  tedPublic.pubkeys.forEach(ted.addKey, ted)
  t.deepEqual(ted.toJSON(), tedPublic)
  t.end()
})

test('create new identity with default key set', function (t) {
  var dude = new Identity()

  defaultKeySet({
      networkName: 'testnet'
    })
    .forEach(dude.addKey, dude)

  var json = dude.toJSON()
  t.ok(Identity.validate(json).valid)
  json.pubkeys.pop()
  t.notOk(Identity.validate(json).valid)

  requiredKeys.forEach(function (k) {
    t.equal(dude.keys(k).length, 1)
  })

  t.end()
})

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

// test('openname compliant', function (t) {
//   var ryan = Identity.fromJSON(ryanPublic)
//   t.ok(ryan)
//   t.end()
// })
