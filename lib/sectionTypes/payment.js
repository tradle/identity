var typeforce = require('typeforce')
var extend = require('extend')

function Payment (props) {
  typeforce({
    type: 'String',
    identifier: 'String'
  }, props)

  this._props = props
}

Payment.prototype.toJSON = function () {
  return extend({}, this._props)
}

module.exports = Payment
