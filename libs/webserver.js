const express = require('express')
const app = express()
const log4js = require('log4js')
const https = require('https')
const fs = require('fs')

const logger = log4js.getLogger('webserver')

logger.debug(__dirname+'/../public')
app.use(express.static(__dirname+'/../public'));

let httpsServer = https.createServer({
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

let webserver = new WebServer()

module.exports = webserver
