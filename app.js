const ssgStore = require('./libs/redux-libs/store')
const Skyway = require('./libs/Connector/Skyway')

const SignalingController = require('./libs/signaling_controller')
const DatachannelController = require('./libs/datachannel_controller')
const webserver = require('./libs/webserver')

// ignore error of self signed tls connection
process.env.NODE_TLS_REJECT_UNAUTHORIZED="0"


// SignalingController
//   handle signaling message mainly between Janus and SkyWay
let signalingController = new SignalingControllr(ssgStore, Skyway)


// handlers for plugin Connector.
// When SSG:stream/start or SSG:stream/stop received, call controller method for starting or stopping MediaStream
DatachannelController.start(signalingController);


// start webserver for dashboard app
webserver.start()
