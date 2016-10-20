const janusStore = require('./libs/redux-libs/store')
const Skyway = require('./libs/Connector/Skyway')
const PluginConnector = require('./libs/Connector/Plugin')
const ExtInterface = require('./libs/Connector/ExtInterface')

const Controller = require('./libs/controller')

const webserver = require('./libs/webserver')

// ignore self signed tls connection
process.env.NODE_TLS_REJECT_UNAUTHORIZED="0"


let controller = new Controller('SSG_komasshu', janusStore, Skyway)
let pluginConn = new PluginConnector()
let extInterface = new ExtInterface()


pluginConn.on('message', (handle_id, binMesg) => {
  // just echo

  if(binMesg.toString().indexOf("SSG:stream/start") === 0) {
    // start streaming
    let src = binMesg.toString().split(",")[1];
    controller.startStreaming(handle_id, src)
  } else if(binMesg.toString() === "SSG:stream/stop") {
    // stop streaming
    controller.stopStreaming(handle_id)
  } else {
    // relay to ExtInterface
    extInterface.send(handle_id, binMesg)
  }
})

extInterface.on('message', (handle_id, binMesg) => {
  // relay to pluginConnector
  pluginConn.send(handle_id, binMesg)
})

webserver.start()
