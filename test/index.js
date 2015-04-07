
var Identity = require('../lib/identity');
var test = require('tape');
var tedPublic = require('./fixtures/ted-pub');
var tedPrivate = require('./fixtures/ted-priv');
var utils = require('../lib/utils');
var Keys = require('../lib/keys');
var toKey = Keys.toKey;
var AddressBook = require('../lib/addressbook');

// makeTeds();

test('export/load identity', function(t) {
  t.plan(3);

  var ted = Identity.fromJSON(tedPublic);
  var tedWKeys = Identity.fromJSON(tedPrivate);
  var signed = tedWKeys.exportSigned();
  // export a valid json
  t.ok(signed, 'export signed identity');
  t.ok(Identity.fromJSON(signed), 'validate exported identity');
  t.throws(ted.exportSigned.bind(ted), /missing private key/);
});

test('sign with various keys', function(t) {
  var msg = 'sup dude?';
  var ted = Identity.fromJSON(tedPublic);
  var tedWKeys = Identity.fromJSON(tedPrivate);

  var btcPubKey = tedPublic._keys.bitcoin[0];
  var sig = tedWKeys.sign(msg, btcPubKey);
  t.ok(utils.verify(msg, Keys.toKey(btcPubKey), sig));

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

  ted.forEachKey(function(key) {
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

  ted.forEachKey(function(key) {
    t.isNot(teds.byPub(key), null, 'found contact by key');
  });

  t.ok(teds.remove(ted));
  t.end();
});

function makeTeds() {
  var dude = new Identity({
    firstName: 'Ted',
    middleName: 'Theodore',
    lastName: 'Logan'
  });

  dude.addKey(Keys.EC.gen('secp256k1'));
  dude.addKey('bitcoin', Keys.Bitcoin.gen('testnet'));
  dude.addKey('litecoin', Keys.Bitcoin.gen('testnet'));

  var pub = dude.exportSigned();
  var priv = dude.toJSON(true);
  console.log(utils.stringify(pub, null, 2));
  console.log(utils.stringify(priv, null, 2));
}

// function firstProp(obj) {
//   for (var p in obj) {
//     if (obj.hasOwnProperty(p)) return p;
//   }
// }
