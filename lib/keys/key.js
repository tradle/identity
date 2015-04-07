
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

Key.prototype.priv = function(val) {
  var args = [].slice.call(arguments);
  args.unshift('priv');
  return this.prop.apply(this, args);
}

Key.prototype.pub = function(val) {
  var args = [].slice.call(arguments);
  args.unshift('pub');
  return this.prop.apply(this, args);
}

Key.prototype.prop = function(prop, val) {
  if (arguments.length === 1) return this._props[prop];
  else this._props[prop] = val;
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
