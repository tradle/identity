var fs = require('fs')
var path = require('path')
// var Keys = require('kiki').toKey
var Identity = require('../../lib/identity')
var prettify = require('@tradle/utils').prettify
var defaultKeySet = require('../../lib/defaultKeySet')

makeBill()
makeTed()
makeRufus()

function makeTed () {
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

  var tedKeys = defaultKeySet({
    networkName: 'testnet'
  }).map(function (k) { return k.exportPrivate() })

  tedKeys.forEach(ted.addKey, ted)
  fs.writeFile(path.join(__dirname, '../fixtures/ted-pub.json'), prettify(ted.toJSON()))
  fs.writeFile(path.join(__dirname, '../fixtures/ted-priv.json'), prettify(tedKeys))
}

function makeBill () {
  var bill = new Identity()
    .name({
      firstName: 'Bill',
      middleName: 'S',
      lastName: 'Preston',
      formatted: 'Bill S. Preston'
    })
    .location({
      country: 'USA',
      region: 'California',
      city: 'San Dimas',
      street: '666 Wyld Stallyns Dr',
      postalCode: 666,
      formatted: '666 Wyld Stallyns Dr, San Dimas, California'
    })
    .summary("Ted's best friend")
    .addPhoto({
      type: 'headshot',
      url: 'http://www.celebritynooz.com/images2/alexwinter-then.jpg'
    })
    .addWebsite({
      url: 'wyldstallyns.com'
    })
    .addContact({
      type: 'skype',
      identifier: 'somebody'
    })

  var billKeys = defaultKeySet({
    networkName: 'testnet'
  }).map(function (k) { return k.exportPrivate() })

  billKeys.forEach(bill.addKey, bill)
  fs.writeFile(path.join(__dirname, '../fixtures/bill-pub.json'), prettify(bill.toJSON()))
  fs.writeFile(path.join(__dirname, '../fixtures/bill-priv.json'), prettify(billKeys))
}

function makeRufus () {
  var rufus = new Identity()
    .name({
      firstName: 'Rufus',
      formatted: 'Rufus'
    })
    .location({
      formatted: 'the future'
    })
    .summary('rock star')
    .addPhoto({
      type: 'headshot',
      url: 'http://i2.wp.com/www.nowverybad.com/wp-content/uploads/bill_and_teds_excellent_adventure_still2.jpg'
    })
    .addWebsite({
      url: 'wyldstallyns.com'
    })
    .addContact({
      type: 'skype',
      identifier: 'rufus'
    })

  var rufusKeys = defaultKeySet({
    networkName: 'testnet'
  }).map(function (k) { return k.exportPrivate() })

  rufusKeys.forEach(rufus.addKey, rufus)
  fs.writeFile(path.join(__dirname, '../fixtures/rufus-pub.json'), prettify(rufus.toJSON()))
  fs.writeFile(path.join(__dirname, '../fixtures/rufus-priv.json'), prettify(rufusKeys))
}
