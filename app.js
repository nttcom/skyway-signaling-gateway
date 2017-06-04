const SignalingController = require('./libs/signaling_controller')
const DatachannelController = require('./libs/datachannel_controller')
const ProfileManager = require('./libs/profile_manager')
const webserver = require('./libs/webserver')

// ignore error for self signed tls connection
process.env.NODE_TLS_REJECT_UNAUTHORIZED="0"

// start ProfileManager
ProfileManager.start()

// SignalingController
//   handle signaling message mainly between Janus and SkyWay
SignalingController.start()


// handlers for plugin Connector.
// When SSG:stream/start or SSG:stream/stop received, call controller method for starting or stopping MediaStream
DatachannelController.start(SignalingController);


// start webserver for dashboard app
webserver.start()
