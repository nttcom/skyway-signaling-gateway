/**
 * profile manager
 *
 */

const Rx = require('rx')
const EventEmitter = require('events').EventEmitter
const log4js = require('log4js')
const yaml = require('node-yaml')
const uuid = require('uuid/v4') // random
const express = require('express')
const fetch = require('node-fetch')

const app = express()
const logger = log4js.getLogger("ProfileManager")
const util = require('./miscs/util')

const CONFFILE = __dirname + "/../conf/profile.yaml"

class ProfileManager extends EventEmitter {
  constructor() {
    super();
    this.profile = {}
    this.ssg_peerid = undefined
    this.sub = null
    this.pub = null
  }

  /**
   * start manager
   *
   */
  start(){
    return new Promise((resolv, reject) => {
      this.loadConf()
        .then( () => util.loadAppYaml() )
        .then( (app_conf) => {
          this.ports = app_conf.ports
          return this.setupRESTServer()
        })
        .then(() => resolv())
        .catch( err => reject(err) )
    })
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
            resolve()
          } else {
            data.uuid = uuid()
            yaml.write(CONFFILE, data, () => {
              this.profile = Object.assign({}, this.profile, data)
              resolve()
            })
          }
        }
      })
    })
  }

  /**
   * setup REST server
   *
   */
  setupRESTServer() {
    return new Promise((resolv, reject) => {
      app.get('/profile', (req, res) => {
        const handle_id = req.query.handle_id

        fetch(`http://localhost:${this.ports.SIGNALING_CONTROLLER}/ssg_peerid`)
          .then( res => res.text())
          .then( ssg_peerid => {
            const ret = Object.assign({}, this.profile, {ssg_peerid, handle_id})
            res.send(ret)
          })
          .catch(err => {
            logger.warn(err.toString())
            res.status(500).send(err.toString())
          })
      })

      app.listen(this.ports.PROFILE_MANAGER, () => {
        logger.info('start REST Server on port %d', this.ports.PROFILE_MANAGER)
        resolv()
      }).on('error', err => reject(err))
    })
  }
}

module.exports = new ProfileManager()
