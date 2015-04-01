
var Identity = require('../');
var test = require('tape');
var tedPublic = require('./fixtures/ted-pub');
var tedPrivate = require('./fixtures/ted-priv');
var utils = require('../utils');
var AddressBook = require('../addressbook');

// test('export, load', function(t) {
//   // t.plan(2);

//   var msg = 'sup dude?';
//   var dude = new Identity({
//     firstName: 'Dude',
//     lastName: 'Dudovich'
//   });

//   var json = dude.toJSON(); // sign
//   var recovered = Identity.fromJSON(json);
//   var sig = dude.sign(msg);

//   // t.equal(dude.key.getPublic('hex'), recovered.key.getPublic('hex'), 'recovered public key');
//   // t.ok(dude.verify(msg, sig), 'verified own sig');
//   t.end();
// });

test('export/load identity', function(t) {
  t.plan(3);

  var ted = Identity.fromJSON(tedPublic);
  var tedWKeys = Identity.fromJSON(tedPrivate);
  var signed = tedWKeys.exportSigned();
  // export a valid json
  t.ok(signed);
  debugger;
  t.ok(Identity.fromJSON(signed));
  t.throws(ted.exportSigned.bind(ted), /missing private key/);
});

test('sign with various keys', function(t) {
  var msg = 'sup dude?';
  var ted = Identity.fromJSON(tedPublic);
  var tedWKeys = Identity.fromJSON(tedPrivate);

  var btcPubKey = firstProp(tedPublic._keys.bitcoin);
  var sig = tedWKeys.sign(msg, btcPubKey);
  t.ok(utils.verify(msg, btcPubKey, sig));

  // t.equal(sig, '3045022022465a0ced56b9036a227849fc35a0e03964e18d2a68c3d3bda18039019c84a3022100a96132cce68e46a0a85c2910a5dcb4320b657eb48b6c3de3a50a80d51cc42a38');
  t.throws(function() {
    tedWKeys.sign(msg, 'not a key')
  }, /key not found/)

  t.throws(function() {
    tedWKeys.sign(msg, utils.ec.genKeyPair().getPublic('hex'));
  }, /key not found/)

  for (var purpose in tedPublic._keys) {
    for (var key in tedPublic._keys[purpose]) {
      t.isNot(tedWKeys.getPrivateKey(key), null);
    }
  }

  t.end();
});

test('address book', function(t) {
  var teds = new AddressBook();
  var ted = Identity.fromJSON(tedPublic);
  teds.add(ted);

  var futureTed = Identity.fromJSON(tedPublic);
  t.throws(function() {
    teds.add(ted);
  }, /identity with this/);

  for (var purpose in tedPublic._keys) {
    for (var key in tedPublic._keys[purpose]) {
      t.isNot(teds.byKey(key), null);
    }
  }

  t.end();
});

function makeTeds() {
  var dude = new Identity({
    firstName: 'Ted',
    middleName: 'Theodore',
    lastName: 'Logan'
  });

  dude.addNewKey();
  dude.addNewKey();
  dude.addNewKey('bitcoin');
  dude.addNewKey('litecoin');

  var pub = dude.exportSigned();
  var priv = dude.toJSON(true);
  console.log(utils.stringify(pub, null, 2));
  console.log(utils.stringify(priv, null, 2));
}

function firstProp(obj) {
  for (var p in obj) {
    if (obj.hasOwnProperty(p)) return p;
  }
}
