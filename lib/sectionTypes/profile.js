var typeforce = require('typeforce')
var extend = require('extend')

function Profile (props) {
  typeforce({
    type: 'String',
    username: 'String',
    proofUrl: 'String'
  }, props)

  this._props = props
}

Profile.prototype.toJSON = function () {
  return extend({}, this._props)
}

module.exports = Profile
