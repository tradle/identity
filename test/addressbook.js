
var test = require('tape')
var AddressBook = require('../lib/addressbook')
var Identity = require('../lib/identity')
var tedPublic = require('./fixtures/ted-pub')

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
