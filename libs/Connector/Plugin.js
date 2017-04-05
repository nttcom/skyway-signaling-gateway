/**
 * skywayiot plugin Connector to handle data channel message
 *
 */
const EventEmitter = require("events").EventEmitter
const dgram = require('dgram')
const log4js = require('log4js')
const Int64 = require('node-int64')

const logger = log4js.getLogger('PluginConnector')

const CONF = require('../../conf/janus.json')

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
    this.receiver.on('error', err => this.emit("error", err));
    this.receiver.on('message', (buff, rinfo) => {
      // 1st 8 bytes are sender id(uint64)
      let handle_id = buff.slice(0, 8).toString('hex');
      let binMesg = buff.slice(8)

      this.emit('message', handle_id, binMesg)
    });

  }

  /**
   * send message via udp
   *
   * @param {string} id - handle_id in string format
   * @param {mesg} mesg - arbitorary mesg
   */
  send(id /* hex string */, mesg) {
    let handle_id = new Buffer(id, 'hex')

    this.sender.send([handle_id, mesg], this.sender_port, this.sender_dest)
  }
}

module.exports = PluginConnector
