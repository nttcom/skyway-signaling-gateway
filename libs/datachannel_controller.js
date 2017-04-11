const PluginConnector = require('./Connector/Plugin')
const ExtInterface = require('./Connector/ExtInterface')
const Rx = require('rx')
const EventEmitter = require('events').EventEmitter
const redis = require('redis')
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
    this.setupRedis();
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
   * setup redis pub/sub
   *
   */
  setupRedis() {

    this.sub = redis.createClient()
    this.pub = redis.createClient()
    this.sub.subscribe(util.TOPICS.CONTROLLER_DATACHANNEL.key)

    this.sub.on('subscribe', (channel) => {
      logger.info(`topic ${channel} subscribed`)
      this._setSubscriberHandler()
    })
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

    const subscribeData = source.filter(msg => msg.type === "data")
      .subscribe( msg => { extInterface.send(msg) } )

    const subscribeControl = source.filter(msg => msg.type === "control")
      .subscribe( msg => { this.pub.publish( util.TOPICS.CONTROLLER_SIGNALING.key, JSON.stringify(msg) ) })
      //.subscribe( msg => { this.pub.publish( util.TOPICS.CONTROLLER_SIGNALING.key, msg ) })
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
      .filter(msg => msg.type === 'data')
      .subscribe(msg => { pluginConn.send(msg) });

    const subscribeControlSource = source
      .filter(msg => msg.type === 'control')
      .subscribe( msg => {
        try {
          const msg_ = JSON.stringify(msg)
          this.pub.publish( util.TOPICS.CONTROLLER_SIGNALING.key, msg_ )
        } catch(e) {
        }
      })
  }

  /**
   * handler for Subscriber
   *
   * @method
   * @listens SignalingController:control
   * @param {object} data - json object
   * @private
   */
  _setSubscriberHandler() {
    this.sub.on('message', (channel, mesg) => {
      logger.debug("message from redis", channel, mesg)
      try {
        const _mesg = JSON.parse(mesg);

        if(_mesg.type === 'response' && _mesg.target === 'room') {
          const data = {
            type: "control",
            handle_id: util.CONTROL_ID,
            payload: _mesg
          }

          extInterface.send(data)
        }
      } catch(e) {
        logger.warn(e);
      }
    })
  }
}

module.exports = new DatachannelController()
