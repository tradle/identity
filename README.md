# Identity

lightweight identity with an arbitrary property set and an arbitrary collection of EC keys. Compliant with Openname spec.

_this module is used by [Tradle](https://github.com/tradle/about/wiki)_

## Usage

```js
var midentity = require('midentity');
var Identity = midentity.Identity;
var AddressBook = midentity.AddressBook
var Keys = midentity.Keys;
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
  .addKey(Keys.EC.gen({
    purpose: 'sign'
  }))
  .addKey(Keys.Bitcoin.gen({
    purpose: 'data',
    networkName: 'bitcoin',
    label: 'most excellent key'
  }))
  .addKey(Keys.Bitcoin.gen({
    purpose: 'payment',
    networkName: 'testnet',
    label: 'most triumphant key'
  }));
  
var addressBook = new AddressBook();
addressBook.addIndex({ name: 'label', unique: true });
addressBook.addIndex({ name: 'networkName', unique: false });
addressBook.add(ted);
var keyMatch = addressBook.byKey(ted.keys()[0]);
var labelMatch = addressBook.byLabel('most triumphant key');
var networkMatch = addressBook.byNetwork('testnet');
```

### exportSigned

```js
// export identity with proof of ownership of all its keys
var pub = ted.exportSigned();
```
```json
{
  "contact": [
    {
      "identifier": "somebodyelse",
      "type": "skype"
    }
  ],
  "location": {
    "city": "San Dimas",
    "country": "USA",
    "formatted": "666 Wyld Stallyns Dr, San Dimas, California",
    "postalCode": 666,
    "region": "California",
    "street": "666 Wyld Stallyns Dr"
  },
  "name": {
    "firstName": "Ted",
    "formatted": "Ted Theodore Logan",
    "lastName": "Logan",
    "middleName": "Theodore"
  },
  "photos": [
    {
      "type": "headshot",
      "url": "http://scrapetv.com/News/News%20Pages/Entertainment/images-9/keanu-reeves-bill-and-ted.jpg"
    }
  ],
  "pubkeys": [
    {
      "_sig": "30450221009428fbbf2a95bb5473d829bf9afa7323610dd2b230a7d944dc951bd5f403ca600220064f4e941288714fb2d40a386979574d7630de03f2339b2b10b8fe6b09c47a0d",
      "curve": "secp256k1",
      "fingerprint": "f96c58d3b1ba077d342956cebe29e0a3a2e308b08e6e04615bbfa29ba24666c3",
      "type": "ec",
      "value": "024484b39afb8f4c177b53e05ae14d4294f4b971e69fcb7cca239d2436230d0b6c"
    },
    {
      "_sig": "3044022022de3aa10c3068389fbbeba652668e36084ffc1c4dde98be6aa415f5076edddc022003c33110b8756e566bacbb5f0b4a0369322caf0e48cf6e22037a127edccabe6b",
      "fingerprint": "1M5ZYub5SJ7qHxhcGmApu1yXtPw132NnLq",
      "label": "blah",
      "networkName": "bitcoin",
      "type": "bitcoin",
      "value": "029ccebc79422477be278cd27efa396d619484680f230d7502f7bc3ff567e78db8"
    },
    {
      "_sig": "3045022100f4f8a57bf9d5529d4960cb9a46ac0d434f74fbdaaa903a79e926828590c7f1dc02206100813eab6b086cf67aad24ff980acbaa79e4483397355b3e1785c44b031ae1",
      "fingerprint": "mfZ8zdJ7Nu4TJah3fE9FNkvjpVvfHZiZy2",
      "label": "yo!",
      "networkName": "testnet",
      "type": "bitcoin",
      "value": "02bbce019ff2392e6e39e7728a27394a29856bce59f7db645ca846d896914571eb"
    }
  ],
  "summary": "Bill's best friend",
  "v": "0.3",
  "websites": [
    {
      "url": "wyldstallyns.com"
    }
  ]
}
```

### toJSON(exportPrivateKeys)

```js
// export identity with private keys
var priv = ted.toJSON(true);
```
```json
{
  "contact": [
    {
      "identifier": "somebodyelse",
      "type": "skype"
    }
  ],
  "location": {
    "city": "San Dimas",
    "country": "USA",
    "formatted": "666 Wyld Stallyns Dr, San Dimas, California",
    "postalCode": 666,
    "region": "California",
    "street": "666 Wyld Stallyns Dr"
  },
  "name": {
    "firstName": "Ted",
    "formatted": "Ted Theodore Logan",
    "lastName": "Logan",
    "middleName": "Theodore"
  },
  "photos": [
    {
      "type": "headshot",
      "url": "http://scrapetv.com/News/News%20Pages/Entertainment/images-9/keanu-reeves-bill-and-ted.jpg"
    }
  ],
  "pubkeys": [
    {
      "curve": "secp256k1",
      "fingerprint": "f96c58d3b1ba077d342956cebe29e0a3a2e308b08e6e04615bbfa29ba24666c3",
      "priv": "0f7448f5e2988ccbe16c238433b06005a529f074942d691af04b537851f27497",
      "type": "ec",
      "value": "024484b39afb8f4c177b53e05ae14d4294f4b971e69fcb7cca239d2436230d0b6c"
    },
    {
      "fingerprint": "1M5ZYub5SJ7qHxhcGmApu1yXtPw132NnLq",
      "label": "blah",
      "networkName": "bitcoin",
      "priv": "L5KGsDzVDy1mqdRcSp76UvexieTfqmSfcnUmaoHscZWAAWbVLySj",
      "type": "bitcoin",
      "value": "029ccebc79422477be278cd27efa396d619484680f230d7502f7bc3ff567e78db8"
    },
    {
      "fingerprint": "mfZ8zdJ7Nu4TJah3fE9FNkvjpVvfHZiZy2",
      "label": "yo!",
      "networkName": "testnet",
      "priv": "cPZdnDZ2dmV9Yk97siHjcUiybxBBKZb1NZLdXURFZ14DMtS9KRjq",
      "type": "bitcoin",
      "value": "02bbce019ff2392e6e39e7728a27394a29856bce59f7db645ca846d896914571eb"
    }
  ],
  "summary": "Bill's best friend",
  "v": "0.3",
  "websites": [
    {
      "url": "wyldstallyns.com"
    }
  ]
}
```

### fromJSON(exportedIdentity)

```js
var pubJSON = ted.exportSigned(); 
var pubTed = Identity.fromJSON(pubJSON);
// pubTed will not be able to sign anything as ted, only verify ted's signatures

var privJSON = ted.toJSON(true);
var privTed = Identity.fromJSON(privJSON);
// privTed is a clone of the original ted, from private keys to guitar skills
```
