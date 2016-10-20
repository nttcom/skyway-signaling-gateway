const express = require('express')
const app = express()
const log4js = require('log4js')

const logger = log4js.getLogger('webserver')

logger.debug(__dirname+'/../public')
app.use(express.static(__dirname+'/../public'));

class WebServer {
  constructor(){
  }

  start(port = 3000) {
    app.listen(port, () => logger.info(`Web server listening on port ${port}`))
  }
}

let webserver = new WebServer()

module.exports = webserver
