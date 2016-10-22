/**
 * skywayiot plugin Connector
 *
 */
const EventEmitter = require("events").EventEmitter
const dgram = require('dgram')
const log4js = require('log4js')
const Int64 = require('node-int64')

const logger = log4js.getLogger('PluginConnector')

const CONF = require('../../conf/janus.json')

class PluginConnector extends EventEmitter {
  constructor(){
    super()

    this.receiver_port = CONF['data_receiver']['port']
    this.sender_dest = CONF['endpoint_addr']
    this.sender_port = CONF['data_sender']['port']

    logger.debug(`sender ${this.sender_dest}:${this.sender_port}, receiver port ${this.receiver_port}`)

    this.sender = dgram.createSocket('udp4')
    this.receiver = dgram.createSocket('udp4')

    this.bindReceiver();
  }

  bindReceiver() {
    this.receiver.bind({address: "0.0.0.0", port: this.receiver_port}, () => {
      console.log(`succeeded to bind port ${this.receiver_port}`);
      this.setRecieveHandler();
    })
  }

  setRecieveHandler() {
    this.receiver.on('error', err => this.emit("error", err));
    this.receiver.on('message', (buff, rinfo) => {
      // 1st 8 bytes are sender id(uint64)
      let handle_id = buff.slice(0, 8).toString('hex');
      let binMesg = buff.slice(8)

      this.emit('message', handle_id, binMesg)
    });

  }

  send(id /* hex string */, mesg) {
    let handle_id = new Buffer(id, 'hex')

    this.sender.send([handle_id, mesg], this.sender_port, this.sender_dest)
  }
}

module.exports = PluginConnector
