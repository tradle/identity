var typeforce = require('typeforce')
var extend = require('extend')

function Website (props) {
  typeforce({
    url: 'String'
  }, props)

  this._props = props
}

Website.prototype.toJSON = function () {
  return extend({}, this._props)
}

module.exports = Website
