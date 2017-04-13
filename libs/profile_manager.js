/**
 * profile manager
 *
 */

const Rx = require('rx')
const EventEmitter = require('events').EventEmitter
const redis = require('redis')
const log4js = require('log4js')
const yaml = require('node-yaml')
const uuid = require('uuid/v4') // random
const logger = log4js.getLogger("ProfileManager")
const util = require('./miscs/util')

const CONFFILE = __dirname + "/../conf/profile.yaml"

class ProfileManager extends EventEmitter {
  constructor() {
    super();
    this.profile = {}
    this.sub = null
    this.pub = null
  }

  /**
   * start manager
   *
   */
  start(){
    this.loadConf()
      .then( () => this.setupRedis() )
  }

  /**
   * load configuration file
   *
   */
  loadConf(){
    return new Promise((resolve, reject) => {
      yaml.read(CONFFILE, (err, data) => {
        if(err) {
          logger.warn(err)
          reject()
        } else {
          if(data.hasOwnProperty('uuid')) {
            this.profile = Object.assign({}, this.profile, data)
            logger.info(JSON.stringify(this.profile))
            resolve()
          } else {
            data.uuid = uuid()
            yaml.write(CONFFILE, data, () => {
              this.profile = Object.assign({}, this.profile, data)
              logger.info(JSON.stringify(this.profile))
              resolve()
            })
          }
        }
      })
    })
  }



  /**
   * setup redis pub/sub
   *
   */
  setupRedis() {
    return new Promise( (resolve, reject) => {
      this.sub = redis.createClient()
      this.pub = redis.createClient()

      this.sub.subscribe(util.TOPICS.MANAGER_PROFILE.key)

      this.sub.on('subscribe', (channel) => {
        logger.info(`topic ${channel} subscribed`)
        this._setSubscriberHandler()
        resolve()
      })
    })
  }

  /**
   * setup redis subscriber handler
   *
   * @private
   */
  _setSubscriberHandler() {

  }



}

module.exports = new ProfileManager()
