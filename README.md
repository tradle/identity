# Identity

lightweight identity with an arbitrary property set and an arbitrary collection of EC keys. Compliant with Openname spec.

_this module is used by [Tradle](https://github.com/tradle/about/wiki)_

## Usage

```js
var midentity = require('midentity')
var Identity = midentity.Identity
var AddressBook = midentity.AddressBook
var Keys = require('kiki').Keys
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

// Add keys manually
var keys = [
  Keys.EC.gen({
    purpose: 'sign'
  }),
  Keys.Bitcoin.gen({
    purpose: 'data',
    networkName: 'bitcoin',
    label: 'most excellent key'
  }),
  Keys.Bitcoin.gen({
    purpose: 'payment',
    networkName: 'testnet',
    label: 'most triumphant key'
  })
]

// Or add the default set of keys like so: 
var keys = defaultKeySet({
  networkName: 'testnet'
})

keys.forEach(ted.addKey, ted)
  
var addressBook = new AddressBook()
addressBook.addIndex({ name: 'label', unique: true })
addressBook.addIndex({ name: 'networkName', unique: false })
addressBook.add(ted)
var keyMatch = addressBook.byKey(ted.keys()[0])
var labelMatch = addressBook.byLabel('most triumphant key')
var networkMatch = addressBook.byNetwork('testnet')
```

### toJSON()

```js
var priv = ted.toJSON()
```
```json
{
  "_t": "tradle.Identity",
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
// export & recover
ted = Identity.fromJSON(ted.toJSON())
```
