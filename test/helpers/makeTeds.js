
var fs = require('fs')
var path = require('path')
var Keys = require('../../lib/keys')
var Identity = require('../../lib/identity')
var prettify = require('tradle-utils').prettify

makeTeds()

function makeTeds () {
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
    .summary("Bill's best friend")
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
      purpose: 'update'
    }))
    .addKey(Keys.EC.gen({
      purpose: 'sign'
    }))
    .addKey(Keys.DSA.gen({
      purpose: 'sign'
    }))
    .addKey(Keys.EC.gen({
      purpose: 'encrypt'
    }))
    .addKey(Keys.Bitcoin.gen({
      networkName: 'bitcoin',
      label: 'most triumphant key',
      purpose: 'payment'
    }))
    .addKey(Keys.Bitcoin.gen({
      networkName: 'testnet',
      label: 'most excellent key',
      purpose: 'payment'
    }))

  var pub = ted.exportSigned()
  var priv = ted.toJSON(true)
  fs.writeFile(path.join(__dirname, '../fixtures/ted-pub.json'), prettify(pub))
  fs.writeFile(path.join(__dirname, '../fixtures/ted-priv.json'), prettify(priv))
}
