const PluginConnector = require('./Connector/Plugin')
const ExtInterface = require('./Connector/ExtInterface')
const Rx = require('rx')
const EventEmitter = require('events').EventEmitter
const log4js = require('log4js')
const logger = log4js.getLogger("DatachannelController")
const util = require('./miscs/util')

// PluginConnector
//   handle data channel message via SkyWay IoT Plugin (interface is UDP)
let pluginConn = new PluginConnector()
// ExtInterface
//   TCP server for providing 3rd party application bindings (data channel message is relayed)
let extInterface = new ExtInterface()



class DatachannelController extends EventEmitter {
  /**
   * constructor
   */
  constructor(){
    super();
  }

  /**
   * start initialize then set Handler
   *
   * @param {SignalingController} signalingController
   */
  start(signalingController) {
    this.signaling_controller = signalingController
    this.setHandler();
  }

  /**
   * set plugin and external interface Handlers
   *
   */
  setHandler() {
    this._setPluginHandler();
    this._setExtHandler();
    this._setSignalingHandler();
  }

  /**
   * send data to External Interface
   *
   * @param {string} data
   */
  sendToExt(data) {
    if(typeof(data) !== 'object' || data.length === 0) return;

    try {
      const binMesg = new Buffer(JSON.parse(data))
      extInterface.send(util.CONTROL_ID, binMesg)
    } catch(e) {
      logger.warn(e)
    }
  }

  /**
   * Handler for plugin Connector (Data channel message from client).
   * When SSG:stream/start received, media streaming will begin
   * When SSG:stream/stop received, media streaming will stop
   * Otherwise, just relay to ExtInterface (TCP server for 3rd party process)
   *
   * @method
   * @listens PluginConnector:message
   * @param {object} obj
   * @param {string} obj.handle_id - Handle id for this binary data
   * @param {Buffer} obj.binMesg - binary message from data channel
   * @private
   *
   */
  _setPluginHandler() {
    const source = Rx.Observable.fromEvent(pluginConn, 'message')
      .filter( obj => {
        return (typeof(obj.handle_id) === 'string' && obj.handle_id.length === 16 && obj.binMesg instanceof Buffer)
      })
      .map( obj => {
        const prefix11 = Buffer.from(obj.binMesg).slice(0,11).toString()
        return Object.assign({}, obj, {prefix11})
      })


    // handle SSG:stream control data
    const subscribe_SSG_stream = source
      .filter(obj => obj.prefix11 === 'SSG:stream/')
      .forEach(obj => {
        console.log(obj)
        const strMesg = obj.binMesg.toString();

        if(strMesg.indexOf("SSG:stream/start") === 0) {
          let arr = strMesg.split(",")
          if(arr.length === 2 && arr[1].length > 0) {
            let src = arr[1];
            this.signaling_controller.startStreaming(obj.handle_id, src)

            logger.info(`receive SSG:stream/start from ${src}. handle_id = ${obj.handle_id}`)
          } else {
            logger.warn("no src found in SSG:stream/start. we'll ignore this message")
          }
        } else if(strMesg === "SSG:stream/stop") {
          logger.info(`receive SSG:stream/stop. handle_id = ${obj.handle_id}`)
          this.signaling_controller.stopStreaming(obj.handle_id)
        } else {
          logger.warn(`unknown stream control message. ${strMesg}`)
        }
      });

    // handle generic data
    const subscribe_generic = source
      .filter(obj => obj.prefix11.indexOf('SSG:') !== 0)
      .forEach(obj => {
        extInterface.send(obj.handle_id, obj.binMesg)
      })
  }

  /**
   * Handlers for External TCP interface for 3rd party process. When message received from ExtInterface,
   * it will be relayed to Plugin Connector then transfered to client via data channel.
   *
   * @method
   * @listens ExtInterface:message
   * @param {string} handle_id - Handle id for this binary data
   * @param {binary} binMesg - binary message from 3rd party process
   * @private
   */
  _setExtHandler(){
    extInterface.on('message', (handle_id, binMesg) => {
      // relay to pluginConnector
      pluginConn.send(handle_id, binMesg)
    })

    extInterface.on('broadcast', binMesg => {
      pluginConn.send(util.BROADCAST_ID, binMesg)
    });

    extInterface.on('control', jsonObj => {
      switch(jsonObj.method) {
      case util.MESSAGE_TYPES.CLIENT.ROOM_JOIN.key:
        this.signaling_controller.sendRoomJoin(jsonObj.name)
        break;
      case util.MESSAGE_TYPES.CLIENT.ROOM_LEAVE:
        this.signaling_controller.sendRoomLeave(jsonObj.name)
        break;
      default:
        break;
      }
    });

  }

  /**
   * handler for SignalingController
   *
   * @method
   * @listens SignalingController:control
   * @param {object} data - json object
   * @private
   */
  _setSignalingHandler() {
    this.signaling_controller.on('control', data => {
      this.sendToExt(data)
    })
  }
}



module.exports = new DatachannelController()
