
var Key = require('./key');
var inherits = require('util').inherits;
var EC = require('elliptic').ec;
var extend = require('extend');
var assert = require('assert');
var omit = require('object.omit');
var PUB_PROPS = ['curve', 'pub'];
var curves = {};

/**
 * elliptic curve key
 * @param {Object} props
 * @param {String} props.curve
 * @param {String|KeyPair} props.priv - optional, private key
 * @param {String|KeyPair} props.pub - optional, public key
 */
function ECKey(props) {
  Key.call(this, props);

  assert(typeof props.curve === 'string');
  this.ec = getCurve(props.curve);

  props.type = 'ec';
  var priv = props.priv;
  var pub = props.pub;
  var key;
  if (priv) {
    key = typeof priv === 'string' ? this.ec.keyFromPrivate(priv, 'hex') : priv;
    this.priv(key.getPrivate('hex'));
    pub = key.getPublic(true, 'hex');
  }
  else if (pub) {
    key = typeof pub === 'string' ? this.ec.keyFromPublic(pub, 'hex') : pub;
    pub = key.getPublic(true, 'hex');
  }
  else throw new Error('pub or priv is required');

  this.key = key;
  this.pub(pub);
}

inherits(ECKey, Key);

ECKey.prototype.toJSON = function(exportPrivateKey) {
  var json = Key.prototype.toJSON.call(this, exportPrivateKey);
  if (!exportPrivateKey) {
    delete json.priv;
  }

  return json;
}

ECKey.prototype.equals = function(key) {
  return PUB_PROPS.every(function(p) {
    return this.prop(p) === key.prop(p);
  }, this);
}

ECKey.prototype.validate = function() {
  return this.key.validate();
}

ECKey.prototype.sign = function(msg) {
  return this.key.sign(msg).toDER('hex');
}

ECKey.prototype.verify = function(msg, sig) {
  return this.key.verify(msg, sig);
}

ECKey.gen = function(curve) {
  assert(typeof curve === 'string');
  var ec = getCurve(curve);
  return new ECKey({
    curve: curve,
    priv: ec.genKeyPair()
  });
}

function getCurve(name) {
  return curves[name] = curves[name] || new EC(name);
}

module.exports = ECKey;
