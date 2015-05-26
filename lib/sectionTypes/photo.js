var typeforce = require('typeforce')
var extend = require('extend')

function Photo (props) {
  typeforce({
    type: 'String',
    url: 'String'
  }, props)

  this._props = props
}

Photo.prototype.toJSON = function () {
  return extend({}, this._props)
}

module.exports = Photo
