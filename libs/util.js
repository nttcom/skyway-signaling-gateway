// util.js

var util = {};

// create token
util.randomTokenForSkyway = function() {
  return Math.random().toString(36).substr(2);
}

// create randomId
util.randomIdForSkyway = function(){
  return Math.floor(Math.random() * 10000);
}

// create random id for (Janus)
util.randomStringForJanus = function(len) {
  charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var randomString = '';
  for (var i = 0; i < len; i++) {
    var randomPoz = Math.floor(Math.random() * charSet.length);
    randomString += charSet.substring(randomPoz,randomPoz+1);
  }
  return randomString;
}

module.exports = util;
