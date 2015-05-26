var typeforce = require('typeforce')
var extend = require('extend')

function Statement (props) {
  typeforce({
    message: 'String',
    signature: 'String'
  }, props)

  this._props = props
}

Statement.prototype.toJSON = function () {
  return extend({}, this._props)
}

module.exports = Statement
