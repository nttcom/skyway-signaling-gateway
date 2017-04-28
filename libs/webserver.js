const express = require('express')
const app = express()
const log4js = require('log4js')
const https = require('https')
const fs = require('fs')
const fetch = require('node-fetch')
const util = require('./miscs/util')

const logger = log4js.getLogger('webserver')
const skyway_conf = require('../conf/skyway.json')

app.use(express.static(__dirname+'/../public'));

const httpsServer = https.createServer({
  key:  fs.readFileSync(__dirname+'/../keys/server.key'),
  cert:  fs.readFileSync(__dirname+'/../keys/server.crt')
}, app)

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
    util.loadAppYaml()
      .then(app_conf => {
        this.ports = app_conf.ports
        this.setRouting();
      })
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
   * @param {integer} port - port number (default: 3000)
   */
  start(port = 3000) {
    httpsServer.listen(port, () => logger.info(`HTTPS server listening on port ${port}`))
  }
}

const webserver = new WebServer()

module.exports = webserver
