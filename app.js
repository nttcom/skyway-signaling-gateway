const SignalingController = require('./libs/signaling_controller')
const DatachannelController = require('./libs/datachannel_controller')
const ProfileManager = require('./libs/profile_manager')
const webserver = require('./libs/webserver')

const log4js = require('log4js')
log4js.level = process.env.LOG_LEVEL || 'debug'
const logger = log4js.getLogger('SSG')

// ignore error for self signed tls connection
process.env.NODE_TLS_REJECT_UNAUTHORIZED="0"

// Start each micro-servers
SignalingController.start()
  .then(() => ProfileManager.start())
  .then(() => DatachannelController.start())
  .then(() => webserver.start())
  .then(() => logger.info('SSG get started'))
  .catch(err => {
    logger.fatal(err)
    process.exit(1)
  })
