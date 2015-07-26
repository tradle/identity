var fs = require('fs')
var path = require('path')
// var Keys = require('kiki').toKey
var Identity = require('../../lib/identity')
var prettify = require('tradle-utils').prettify
var defaultKeySet = require('../../lib/defaultKeySet')

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

  defaultKeySet({
    networkName: 'testnet'
  }).forEach(ted.addKey, ted)

  var pub = ted.toJSON()
  fs.writeFile(path.join(__dirname, '../fixtures/ted-pub.json'), prettify(pub))
}
