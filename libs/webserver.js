const express = require('express')
const app = express()
const log4js = require('log4js')
const https = require('https')
const fs = require('fs')

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
    this.setRouting();
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
