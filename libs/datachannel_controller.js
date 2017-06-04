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
   */
  start() {
    this.setHandler();
  }

  /**
   * set plugin and external interface Handlers
   *
   */
  setHandler() {
    this._setPluginHandler();
    this._setExtHandler();
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

    const subscribeData = source
      .filter(msg => msg.handle_id instanceof Buffer && msg.handle_id.length === 8 && msg.payload)
      .subscribe( msg => { extInterface.send(msg.handle_id, msg.payload) } )
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
    const source = Rx.Observable.fromEvent(extInterface, 'message')
      .filter(msg => typeof(msg) === 'object')

    const subscribeDataSource = source
      .filter(msg => msg.handle_id instanceof Buffer && msg.handle_id.length === 8 && msg.payload)
      .subscribe(msg => { pluginConn.send(msg.handle_id, msg.payload) });
  }
}

module.exports = new DatachannelController()
