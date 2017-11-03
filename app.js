#!/usr/bin/env node

const { do_setup, check_conf, reset_conf } = require('./libs/miscs/setup')
const _ = require('underscore')

const log4js = require('log4js')
log4js.level = process.env.LOG_LEVEL || 'debug'
const logger = log4js.getLogger('SSG')

// setup config when 'setup' is indicated
if( _.last(process.argv) === 'setup') {
  do_setup()
} else if( _.last(process.argv) === 'start') {
  if (!check_conf()) return

  const SignalingController = require('./libs/signaling_controller')
  const DatachannelController = require('./libs/datachannel_controller')
  const ProfileManager = require('./libs/profile_manager')
  const webserver = require('./libs/webserver')

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
} else if( _.last(process.argv) === 'reset') {
  reset_conf()
} else {
  console.info("Usage: ssg {setup|start|reset}")
}

