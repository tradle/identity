var typeforce = require('typeforce')
var extend = require('extend')

function Connection (props) {
  typeforce({
    type: 'String',
    username: 'String'
  }, props)

  this._props = props
}

Connection.prototype.toJSON = function () {
  return extend({}, this._props)
}

module.exports = Connection
