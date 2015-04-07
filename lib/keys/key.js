
var extend = require('extend');
var deepEqual = require('deep-equal');
var utils = require('../utils');
var stringify = utils.stringify;
var crypto = require('crypto');

function Key(props) {
  this._props = props;
}

Key.prototype.toJSON = function(exportPrivateKey) {
  return extend({}, this._props);
}

Key.prototype.priv = function() {
  return this.prop('priv');
}

Key.prototype.pub = function(val) {
  return this.prop('pub');
}

Key.prototype.prop = function(prop) {
  if (arguments.length > 1) throw new Error('props are immutable');
  return this._props[prop];
}

Key.prototype.equals = function(key) {
  return key && deepEqual(this.toJSON(), key.toJSON());
}

Key.prototype.sign = function(msg) {
  throw new Error('override this');
}

Key.prototype.verify = function(msg, sig) {
  throw new Error('override this');
}

Key.prototype.encrypt = function(msg) {
  throw new Error('override this');
}

Key.prototype.decrypt = function(msg) {
  throw new Error('override this');
}

Key.prototype.validate = function() {
  return {
    result: true,
    reason: null
  };
}

Key.prototype.toString = function() {
  return stringify(this.toJSON());
}

Key.prototype.hash = function() {
  return crypto
    .createHash('sha256')
    .update(this.pub())
    .digest('hex');
}

module.exports = Key;
