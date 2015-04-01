
var stableStringify = require('json-stable-stringify');
var omit = require('object.omit');
var extend = require('extend');
var EC = require('elliptic').ec;
var ec = new EC('secp256k1');
var ENC = 'hex';

function stringify(value, replacer, space) {
    if (typeof value === 'string') return value;

    var opts = {};
    if (typeof replacer === 'function') opts.replacer = replacer;
    if (typeof space === 'string' || typeof space === 'number') opts.space = space;

    return stableStringify(value, opts);
}

function split(obj) {
  var unsigned = {};
  var sigs = {};
  for (var p in obj) {
    var val = obj[p];
    // detect embedded key objects
    if (typeof val !== 'object') {
      unsigned[p] = val;
      continue;
    }

    if ('_sig' in val) {
      sigs[p] = {
        _sig: val._sig
      }

      unsigned[p] = omit(val, '_sig');
    }
    else {
      var sub = split(val);
      unsigned[p] = sub.unsigned;
      extend(sigs, sub.sigs);
    }
  }

  return {
    unsigned: unsigned,
    sigs: sigs
  }
}

function join(unsigned, sigs) {
  // var joined = {};

  // for (var p in sigs) {
  //   var val = sigs[p];
  //   if ('_sig' in val) {
  //     unsigned[p]._sig =
  //     unsigned[p] = omit(val, '_sig');
  //   }
  //   else {
  //     joined[p] = join(unsigned[p], val);
  //   }
  // }

  // return {
  //   unsigned: unsigned,
  //   sigs: sigs
  // }

  return extend(true, {}, unsigned, sigs);
}

function verifySigs(unsigned, sigTree) {
  var stringified = stringify(unsigned);

  for (var p in sigTree) {
    var branch = sigTree[p];
    if (typeof branch !== 'object') continue;

    if ('_sig' in branch) {
      key = ec.keyFromPublic(p, ENC);
      if (!key.verify(stringified, branch._sig)) {
        throw new Error('Failed to verify signature for public key ' + p);
      }
    }
    else {
      // recurse
      verifySigs(unsigned[p], branch);
    }
  }
}

function toPubKey(pub) {
  return typeof pub === 'string' ? ec.keyFromPublic(pub, ENC) : pub;
}

function toPrivKey(priv) {
  return typeof priv === 'string' ? ec.keyFromPrivate(priv, ENC) : priv;
}

function verify(data, pubKey, signature) {
  pubKey = utils.toPubKey(pubKey);

  return pubKey.verify(utils.stringify(data), signature);
}

function sign(data, key) {
  return toPrivKey(key)
    .sign(stringify(data))
    .toDER(ENC);
}

function size(obj) {
  var i = 0;
  for (var p in obj) {
    if (obj.hasOwnProperty(p)) i++;
  }

  return i;
}

function pubKeyToString(key) {
  // compact
  if (typeof key === 'string') return key;

  return key.getPublic(true, utils.ENCODING);
}

module.exports = {
  ec: ec,
  pubKeyString: pubKeyToString,
  stringify: stringify,
  splitDataAndSigs: split,
  joinDataAndSigs: join,
  verifySigs: verifySigs,
  toPrivKey: toPrivKey,
  toPubKey: toPubKey,
  size: size,
  sign: sign,
  verify: verify,
  ENCODING: ENC
}
