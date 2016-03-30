// util.js

var util = {}
  , _ = require('underscore')

// create token
util.randomTokenForSkyway = function() {
  return Math.random().toString(36).substr(2);
}

// create randomId
util.randomIdForSkyway = function(){
  return Math.random().toString(36).substr(2);
}

// create random id for (Janus)
util.randomStringForJanus = function(len) {
  if(_.isNumber(len) && len > 11) {
    var charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var randomString = '';
    for (var i = 0; i < len; i++) {
      var randomPoz = Math.floor(Math.random() * charSet.length);
      randomString += charSet.substring(randomPoz,randomPoz+1);
    }
    return randomString;
  } else {
    return false;
  }
}

module.exports = util;
