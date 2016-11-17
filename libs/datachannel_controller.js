const PluginConnector = require('./Connector/Plugin')
const ExtInterface = require('./Connector/ExtInterface')

// PluginConnector
//   handle data channel message via SkyWay IoT Plugin (interface is UDP)
let pluginConn = new PluginConnector()
// ExtInterface
//   TCP server for providing 3rd party application bindings (data channel message is relayed)
let extInterface = new ExtInterface()



const DatachannelController = {
  /**
   * start initialize then set Handler
   * 
   * @param {SignalingController} signalingController
   */
  start(signalingController) {
    this.signaling_controller = signalingController
    this.setHandler();
  },

  /**
   * set plugin and external interface Handlers
   * 
   */
  setHandler() {
    this._setPluginHandler();
    this._setExtHandler();
  },

  _setPluginHandler() {
    /**
    * Handler for plugin Connector (Data channel message from client).
    * When SSG:stream/start received, media streaming will begin
    * When SSG:stream/stop received, media streaming will stop
    * Otherwise, just relay to ExtInterface (TCP server for 3rd party process)
    *
    * @method
    * @listens PluginConnector:message
    * @param {string} handle_id - Handle id for this binary data
    * @param {binary} binMesg - binary message from data channel
    *
    */
    pluginConn.on('message', (handle_id, binMesg) => {
      if(binMesg.toString().indexOf("SSG:stream/start") === 0) {
        // when SSG:stream/start received, media streaming will begin

        let src = binMesg.toString().split(",")[1]; // obtain src peerid
        this.signaling_controller.startStreaming(handle_id, src)   // start media streaming
      } else if(binMesg.toString() === "SSG:stream/stop") {
        // when SSG:stream/stop received, media streaming will stop

        this.signaling_controller.stopStreaming(handle_id) // stop media streaming
      } else {
        // Otherwise, just realy binary message to external interface for 3rd party process.
        extInterface.send(handle_id, binMesg)
      }
    })
  },

  _setExtHandler(){
    /**
    * Handlers for External TCP interface for 3rd party process. When message received from ExtInterface,
    * it will be relayed to Plugin Connector then transfered to client via data channel.
    *
    * @method
    * @listens ExtInterface:message
    * param {string} handle_id - Handle id for this binary data
    * param {binary} binMesg - binary message from 3rd party process
    */
    extInterface.on('message', (handle_id, binMesg) => {
      // relay to pluginConnector
      pluginConn.send(handle_id, binMesg)
    })
  }
}



module.exports = DatachannelController
