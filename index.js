var extend = require('extend')
var kiki = require('kiki')

// TODO: remove kiki (after migration)
module.exports = extend({
  Sections: require('./lib/sectionTypes'),
  Identity: require('./lib/identity'),
  AddressBook: require('./lib/addressbook'),
  defaultKeySet: require('./lib/defaultKeySet')
}, kiki)
