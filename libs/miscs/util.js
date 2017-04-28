const _    = require('underscore')
const Enum = require('enum')
const yaml = require('node-yaml')

const APP_YAML = __dirname + '/../../conf/app.yaml'

const clientMessages = new Enum([
    'SEND_OFFER',
    'SEND_ANSWER',
    'SEND_CANDIDATE',
    'SEND_LEAVE',
    'ROOM_JOIN',
    'ROOM_LEAVE',
    'ROOM_GET_LOGS',
    'ROOM_GET_USERS',
    'ROOM_SEND_DATA',
    'SFU_GET_OFFER',
    'SFU_ANSWER',
    'SFU_CANDIDATE',
    'PING'
]);

const serverMessages = new Enum([
    'OPEN',
    'ERROR',
    'OFFER',
    'CLOSE',
    'ANSWER',
    'CANDIDATE',
    'LEAVE',
    'ROOM_LOGS',
    'ROOM_USERS',
    'ROOM_DATA',
    'ROOM_USER_JOIN',
    'ROOM_USER_LEAVE',
    'SFU_OFFER'
]);

const util = {}

util.MESSAGE_TYPES = {
  CLIENT: clientMessages,
  SERVER: serverMessages
};

util.DISPATCHER_HOST = 'dispatcher.skyway.io';
util.DISPATCHER_PORT = 443;
util.DISPATCHER_SECURE = true;
util.DISPATCHER_TIMEOUT = 3000;

util.CONTROL_ID   = new Buffer('0000000000000000', "hex")
util.BROADCAST_ID = new Buffer('FFFFFFFFFFFFFFFF', "hex")

util.TOPICS = new Enum([
  'CONTROLLER_SIGNALING',
  'CONTROLLER_DATACHANNEL',
  'MANAGER_PROFILE'
]);

util.KEEPALIVE_TIMEOUT = 90000  // 90 seconds


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

util.createConnectionId = function( type = "media" /* "media" or "data" */) {
  const PREFIX = type==="media" ? "mc_" : "dc_"

  return PREFIX+util.randomStringForJanus(16)
}

util.createTransactionId = function() {
  return util.randomStringForJanus(12);
}

util.loadAppYaml = function() {
  return new Promise((resolv, reject) => {
    yaml.read(APP_YAML, (err, data) => {
      if(err) {
        logger.warn(err)
        reject()
      } else {
        if( data.hasOwnProperty('ports') ) resolv(data)
        else reject(new Error('app_yaml does not have ports property'))
      }
    })
  })
}

module.exports = util
