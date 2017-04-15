/**
 * skywayiot plugin Connector to handle data channel message
 *
 */
const EventEmitter = require("events").EventEmitter
const dgram  = require('dgram')
const log4js = require('log4js')
const Int64  = require('node-int64')
const Rx     = require('rx')

const CONF   = require('../../conf/janus.json')

const logger = log4js.getLogger('PluginConnector')

/**
 * Skyway IoT plugin connector for Janus Gateway.
 * It will handle data channel message.
 *
 */
class PluginConnector extends EventEmitter {
  /**
   * constructor
   *
   */
  constructor(){
    super()

    this.receiver_port = CONF['data_receiver']['port']
    this.sender_dest = CONF['endpoint_addr']
    this.sender_port = CONF['data_sender']['port']

    logger.debug(`sender ${this.sender_dest}:${this.sender_port}, receiver port ${this.receiver_port}`)

    this.sender = dgram.createSocket('udp4')
    this.receiver = dgram.createSocket('udp4')

    this.start();
  }

  /**
   * start udp server
   *
   */
  start() {
    this.receiver.bind({address: "0.0.0.0", port: this.receiver_port}, () => {
      logger.info(`succeeded to bind port ${this.receiver_port}`);
      this.setRecieveHandler();
    })
  }

  /**
   * set udp message handler
   */
  setRecieveHandler() {
    // pre normalization
    const messageSource = Rx.Observable.fromEvent( this.receiver, 'message')
      .filter( buff => buff.length > 9 )
      .filter( buff => buff instanceof Buffer )
      .map( buff => {
        return {
          handle_id: buff.slice(0, 8),
          payload: buff.slice(8)
        }
      })

    //////////////////////////////////////////////////////
    // for data source

    // take out data message
    const dataSource = messageSource
      .filter( obj => obj.payload.slice(0, 4).toString() !== "SSG:")

    // normalize data source, then emit 'message' event to controller
    const subscribeDataSource = dataSource
      .subscribe( obj => {
        const data = {
          type: 'data',
          handle_id: obj.handle_id,
          payload: obj.payload
        }
        this.emit('message', data)
      })

    //////////////////////////////////////////////////////
    // for control source

    // take out control message and normalize
    const controlSource = messageSource
      .filter( obj => obj.payload.slice(0, 4).toString() === "SSG:")
      .map( obj => {
        return {
          handle_id: obj.handle_id,
          message: obj.payload.toString()
        }
      })

    // take out stream control message
    const controlStreamSource = controlSource
      .filter(obj => obj.message.indexOf("SSG:stream/") === 0)

    // take out stream/start control message
    const controlStreamStartSource = controlStreamSource
      .filter(obj => obj.message.indexOf("SSG:stream/start") === 0)

    // take out stream/stop control message
    const controlStreamStopSource = controlStreamSource
      .filter(obj => obj.message === "SSG:stream/stop")

    // create internal messsage format to controller for strea/start, then emit 'message' event
    const subscribeControlStreamStart = controlStreamStartSource
      .subscribe(obj => {
        const arr = obj.message.split(",")

        if(arr.length === 2 && arr[1].length > 0) {
          const data = {
            type: 'control',
            handle_id: obj.handle_id,
            payload: {
              type: 'request',
              target: 'stream',
              method: 'start',
              body: {
                handle_id: obj.handle_id,
                src: arr[1]
              }
            }
          }
          this.emit('message', data);
        } else {
          logger.warn("cannot find source peerid in stream/start")
        }
      })

    // create internal messsage format to controller for strea/stop, then emit 'message' event
    const subscribeControlStreamStop = controlStreamStopSource
      .subscribe(obj => {
        const data = {
          type: 'control',
          handle_id: obj.handle_id,
          payload: {
            type: 'request',
            target: 'stream',
            method: 'stop',
            body: {
              handle_id: obj.handle_id
            }
          }
        }
        this.emit('message', data);
      })

    const controlProfileGet = controlStreamSource
      .filter(obj => obj.message === "SSG:profile/get")
      .subscribe( () => {
        const data = {
          type: 'control',
          handle_id: obj.handle_id,
          payload: {
            type: 'request',
            target: 'profile',
            method: 'get',
            body: {
              handle_id: obj.handle_id
            }
          }
        }
        this.emit('message', data)
      })

    // error handling
    this.receiver.on('error', err => this.emit("error", err));
  }

  /**
   * send message via udp
   *
   *
   * @param {object} msg
   * @param {string} msg.type - "data"
   * @param {string} msg.handle_id - handle_id (16bytes)
   * @param {object} msg.payload - Binary
   */
  send( msg) {
    new Array(msg)
      .filter(msg => msg.type === 'data')
      .filter(msg => msg.handle_id instanceof Buffer)
      .filter(msg => msg.handle_id.length === 8)
      .filter(msg => msg.payload instanceof Buffer)
      .forEach(msg => {
        this.sender.send([msg.handle_id, msg.payload], this.sender_port, this.sender_dest)
      })
  }
}

module.exports = PluginConnector
