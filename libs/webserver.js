const express = require('express')
const app = express()
const log4js = require('log4js')
const http = require('http')
const fs = require('fs')
const fetch = require('node-fetch')
const util = require('./miscs/util')

const logger = log4js.getLogger('webserver')

const yaml = require('node-yaml')
const skyway_conf = yaml.readSync('../conf/skyway.yaml')

app.use(express.static(__dirname+'/../public'));

const httpServer = http.createServer(app)

/**
 * WebServer class
 *
 */
class WebServer {
  /**
   * constructor
   *
   */
  constructor(){
  }

  /**
   * set routing
   *
   */
  setRouting() {
    // examples
    app.get('/examples', (req, res) => {
      res.render('examples/index.ejs', skyway_conf);
    });

    // room-test
    app.get('/examples/roomtest', (req, res) => {
      res.render('examples/room-test.ejs', skyway_conf);
    });

    // full size video
    app.get('/examples/fullsize', (req, res) => {
      res.render('examples/fullsize.ejs', skyway_conf);
    });

    // connections
    app.get('/connections', (req, res) => {
      fetch(`http://localhost:${this.ports.SIGNALING_CONTROLLER}/connections`)
        .then(_res => _res.json())
        .then(_obj => res.json(_obj))
    });

    // profile
    app.get('/profile', (req, res) => {
      fetch(`http://localhost:${this.ports.PROFILE_MANAGER}/profile`)
        .then(_res => _res.json())
        .then(_obj => res.json(_obj))
    });

    // timestamps on PluginConnector
    app.get('/plugin/timestamps', (req, res) => {
      fetch(`http://localhost:${this.ports.PLUGIN_CONNECTOR}/timestamps`)
        .then(_res => _res.json())
        .then(_obj => res.json(_obj))
    });



  }

  /**
   * start web server
   *
   */
  start() {
    return new Promise((resolv, reject) => {
      util.loadAppYaml()
        .then(app_conf => {
          this.ports = app_conf.ports
          this.setRouting();

          const port = this.ports.DASHBOARD || 3000

          httpServer.listen(port, () => {
            logger.info(`HTTP server listening on port ${port}`)
            resolv()
          }).on('error', err => reject(err))
        }).catch(err => reject(err))
    })
  }
}

const webserver = new WebServer()

module.exports = webserver
