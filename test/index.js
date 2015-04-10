
var fs = require('fs');
var Identity = require('../lib/identity');
var test = require('tape');
var tedPublic = require('./fixtures/ted-pub');
var tedPrivate = require('./fixtures/ted-priv');
var ryanPublic = require('./fixtures/ryan-pub');
var tu = require('tradle-utils');
var utils = require('../lib/utils');
var stringify = tu.stringify;
var prettify = tu.prettify;
var Types = require('../lib/sectionTypes');
var Keys = require('../lib/keys');
var toKey = require('../lib/toKey');
var AddressBook = require('../lib/addressbook');

// makeTeds();
// if (true) return;

test('export/load identity', function(t) {
  var ted = Identity.fromJSON(tedPublic);
  var photo = ted.photos()[0];
  t.ok(photo instanceof Types.Photo);
  t.equal(photo._props.type, 'headshot');

  var tedWKeys = Identity.fromJSON(tedPrivate);
  var signed = tedWKeys.exportSigned();
  // export a valid json
  t.ok(signed, 'export signed identity');
  t.ok(Identity.fromJSON(signed), 'validate exported identity');
  t.throws(ted.exportSigned.bind(ted), /missing private key/);
  t.end();
});

test('sign with various keys', function(t) {
  var msg = 'sup dude?';
  var ted = Identity.fromJSON(tedPublic);
  var tedWKeys = Identity.fromJSON(tedPrivate);

  var btcPubKey = utils.find(tedPublic.pubkeys, function(k) { return k.prop('type') === 'bitcoin' && k });
  var sig = tedWKeys.sign(msg, btcPubKey);
  t.ok(toKey(btcPubKey).verify(msg, sig));

  // t.equal(sig, '3045022022465a0ced56b9036a227849fc35a0e03964e18d2a68c3d3bda18039019c84a3022100a96132cce68e46a0a85c2910a5dcb4320b657eb48b6c3de3a50a80d51cc42a38');
  t.throws(function() {
    tedWKeys.sign(msg, 'not a key')
  });

  t.throws(function() {
    tedWKeys.sign(msg, new Keys.Bitcoin({
      networkName: 'testnet',
      pub: Keys.Bitcoin.gen('testnet').pub()
    }));
  }, /key not found/);

  ted.keys().forEach(function(key) {
    t.isNot(tedWKeys.getPrivateKey(key), null, 'has private key');
  });

  t.end();
});

test('address book', function(t) {
  var teds = new AddressBook();
  var ted = Identity.fromJSON(tedPublic);
  teds.add(ted);

  var futureTed = Identity.fromJSON(tedPublic);
  t.throws(function() {
    teds.add(futureTed);
  }, /identity with this/);

  ted.keys().forEach(function(key) {
    t.isNot(teds.byPub(key), null, 'found contact by pubkey');
  });

  ted.keys().forEach(function(key) {
    t.isNot(teds.byFingerprint(key), null, 'found contact by key fingerprint');
  });

  t.ok(teds.remove(ted));
  t.end();
});

test('openname compliant', function(t) {
  var ryan = Identity.fromJSON(ryanPublic);
  t.ok(ryan);
  t.end();
});

function makeTeds() {
  var ted = new Identity()
    .name({
      firstName: 'Ted',
      middleName: 'Theodore',
      lastName: 'Logan',
      formatted: 'Ted Theodore Logan'
    })
    .location({
      country: 'USA',
      region: 'California',
      city: 'San Dimas',
      street: '666 Wyld Stallyns Dr',
      postalCode: 666,
      formatted: '666 Wyld Stallyns Dr, San Dimas, California'
    })
    .summary('Bill\'s best friend')
    .addPhoto({
      type: 'headshot',
      url: 'http://scrapetv.com/News/News%20Pages/Entertainment/images-9/keanu-reeves-bill-and-ted.jpg'
    })
    .addWebsite({
      url: 'wyldstallyns.com'
    })
    .addContact({
      type: 'skype',
      identifier: 'somebodyelse'
    })
    .addKey(Keys.EC.gen())
    .addKey(Keys.Bitcoin.gen({
      networkName: 'bitcoin',
      label: 'blah'
    }))
    .addKey(Keys.Bitcoin.gen({
      networkName: 'testnet',
      label: 'yo!'
    }));

  var pub = ted.exportSigned();
  var priv = ted.toJSON(true);
  fs.writeFile('./test/fixtures/ted-pub.json', prettify(pub));
  fs.writeFile('./test/fixtures/ted-priv.json', prettify(priv));
}
