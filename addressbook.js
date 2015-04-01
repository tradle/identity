
var utils = require('./utils');

function AddressBook() {
  this._contacts = [];
  this._byPurpose = {};
}

AddressBook.prototype.add = function(identity) {
  if (this._contacts.indexOf(identity) !== -1) return;

  var keys = identity.keys();
  for (var purpose in keys) {
    var family = this._byPurpose[purpose] = this._byPurpose[purpose] || {};
    for (var key in keys[purpose]) {
      utils.forEachKey(key, function(k) {
        if (k in family && family[k] !== identity) {
          throw new Error('already have an identity with key ' + key);
        }
      });

      family[key] = identity;
    }
  }

  this._contacts.push(identity);
}

AddressBook.prototype.remove = function(identity) {
  var found = [];
  var keys = identity.keys();
  for (var purpose in keys) {
    var family = this._byPurpose[purpose] = this._byPurpose[purpose] || {};
    for (var key in keys[purpose]) {
      if (key in family) {
        utils.someKey(key, function(k) {
          var idx = this._contacts.indexOf(family[key]);
          if (idx !== -1) {
            this._contacts.splice(idx, 1);
            return true;
          }
        });

        break;
      }
    }
  }
}

AddressBook.prototype._byKey = function(key, purpose) {
  var purposes;
  if (typeof purpose === 'undefined') {
    purposes = Object.keys(this._byPurpose);
  }
  else if (typeof purpose === 'string') {
    purposes = [purpose];
  }

  var keyStr = utils.pubKeyString(key);
  var identity;
  purposes.some(function(purpose) {
    var family = this._byPurpose[purpose];
    return identity = family && family[keyStr];
  }, this);
}

AddressBook.prototype.byKey = function(key, purpose) {
  return utils.findKey(key, function(k) {
    return this._byKey(key, purpose);
  }, this);
}

module.exports = AddressBook;
