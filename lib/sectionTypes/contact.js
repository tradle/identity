var typeforce = require('typeforce')
var extend = require('extend')

function Contact (props) {
  typeforce({
    type: 'String',
    identifier: 'String'
  }, props)

  this._props = props
}

Contact.prototype.toJSON = function () {
  return extend({}, this._props)
}

module.exports = Contact
