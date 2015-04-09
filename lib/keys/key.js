
var extend = require('extend');
var deepEqual = require('deep-equal');
var stringify = require('tradle-utils').stringify;
var crypto = require('crypto');

function Key(props) {
  this._props = props;

  var priv = props.priv;
  var pub = props.pub;
  if (priv) {
    if (typeof priv === 'string') {
      this._priv = this.parsePriv(priv);
    }
    else {
      this._priv = priv;
      props.priv = this.stringifyPriv(priv);
    }
  }

  if (pub) {
    if (typeof pub === 'string') {
      this._pub = this.parsePub(pub);
    }
    else {
      this._pub = pub;
    }
  }
  else {
    this._pub = this.pubFromPriv(this._priv);
  }

  if (typeof props.pub !== 'string') props.pub = this.stringifyPub(pub);
}

Key.prototype.toJSON = function(exportPrivateKey) {
  var props = {
    type: this.constructor.type
  };

  for (var p in this._props) {
    if (this._props.hasOwnProperty(p)) {
      var val = this._props[p];
      if (val != null) props[p] = val;
    }
  }

  if (!exportPrivateKey) delete props.priv;

  return props;
}

Key.prototype.priv = function() {
  return this._priv;
}

Key.prototype.pub = function(val) {
  return this._pub;
}

Key.prototype.prop = function(prop) {
  if (arguments.length > 1) throw new Error('props are immutable');
  return this._props[prop];
}

Key.prototype.equals = function(key) {
  return key && deepEqual(this.toJSON(), key.toJSON());
}

Key.prototype.sign = function(msg) {
  return this._priv.sign(msg);
}

Key.prototype.verify = function(msg, sig) {
  return this._pub.verify(msg, sig);
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

Key.prototype.parsePriv = function(str) {
  throw new Error('override this');
}

Key.prototype.parsePub = function(str) {
  throw new Error('override this');
}

Key.prototype.stringifyPriv = function(key) {
  throw new Error('override this');
}

Key.prototype.stringifyPub = function(key) {
  throw new Error('override this');
}

Key.prototype.pubFromPriv = function(key) {
  throw new Error('override this');
}

Key.prototype.fingerprintFromPub = function(pub) {
  throw new Error('override this');
}

Key.prototype.fingerprint = function() {
  throw new Error('override this');
}

module.exports = Key;
