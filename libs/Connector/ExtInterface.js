/**
 * external datachannel interface for 3rd party app.
 * currently, tcp interface only supported.
 *
 * format :=   <16bytes of handle_id><payload>
 *
 */
const net = require('net')
const EventEmitter = require('events').EventEmitter
const log4js = require('log4js')

const logger = log4js.getLogger('ExtInterface')

const CONF = require('../../conf/janus.json')
const port = CONF['external']['tcp_port']

class ExtInterface extends EventEmitter {
  constructor() {
    super();

    this.clients = [];
    this.start()
  }

  start() {
    net.createServer( socket => {
      this.clients.push(socket)

      socket.on('data', buff => {
        let handle_id = buff.slice(0, 16).toString()
        let binMesg = buff.slice(16)

        this.emit('message', handle_id, binMesg)
      })

      // remove socket object from clients when tcp terminated
      socket.on('end', () => this.clients.splice(this.clients.indexOf(socket), 1))
    }).listen(port)
  }

  send(id /* hex string */, binMesg) {
    let handle_id = new Buffer(id)
    let len = handle_id.length + binMesg.length

    let buff = Buffer.concat([handle_id, binMesg], len)
    this.clients.forEach( socket => {
      socket.write(buff)
    })
  }
}

module.exports = ExtInterface
