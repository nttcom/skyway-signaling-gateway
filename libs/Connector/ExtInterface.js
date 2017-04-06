/**
 * external datachannel interface for 3rd party app.
 * currently, tcp interface only supported.
 *
 * format :=   <16bytes of handle_id><payload>
 *
 */
const net = require('net')
const Rx  = require('rx')
const EventEmitter = require('events').EventEmitter
const log4js = require('log4js')
const util = require('../miscs/util')

const logger = log4js.getLogger('ExtInterface')

const CONF = require('../../conf/janus.json')
const port = CONF['external']['tcp_port']


/**
 * External TCP interface for 3rd party application
 *
 */
class ExtInterface extends EventEmitter {
  /**
   * constuctor
   *
   */
  constructor() {
    super();

    // collection for socket from 3rd party app
    this.clients = [];

    // start server process
    this.start()
  }

  /**
   * start tcp server for 3rd party apps.
   *
   */
  start() {
    net.createServer( socket => {
      logger.info("new 3rd party app connected")
      this.clients.push(socket)

      // remove socket object from clients when tcp terminated
      socket.on('end', () => {
        logger.info("socket for the 3rd party app closed. we'll remove this socket object")
        this.clients.splice(this.clients.indexOf(socket), 1)
      })

      this._setExtDataObserver(socket)
    }).listen(port)
  }

  /**
   * send message to 3rd party process
   * it will be forwarded to every single 3rd party app.
   *
   * @param {string} id - handle id in string format
   * @param {object} binMesg - arbitorary message buffer object
   */
  send(id /* hex string */, binMesg) {
    let handle_id = new Buffer(id)
    let len = handle_id.length + binMesg.length

    let buff = Buffer.concat([handle_id, binMesg], len)

    this.clients.forEach( socket => {
      socket.write(buff)
    })
  }

  /**
   * set data observer for 3rd party app
   *
   * @param {object} socket - tcp socket
   * @private
   */
  _setExtDataObserver(socket) {
    const source = Rx.Observable.fromEvent(socket, 'data')

    // generic data
    source
      .filter(buff => buff.length > 16) // drop that does not have handle_id
      .map(buff => {  // serialize to json
        return {
          handle_id: buff.slice(0, 16).toString(),
          binMesg: buff.slice(16)
        }
      })
      .forEach( obj => { // switch procedure depends on handle_id
        switch(obj.handle_id) {
        case util.CONTROL_ID:
          try {
            const data = JSON.parse( obj.binMesg.toString() )

            this.emit('control', data);
          } catch(e) {
            logger.warn(e);
          }
          break;
        case util.BROADCAST_ID:
          this.emit('broadcast', obj.binMesg);
          break;
        default:
          this.emit('message', obj.handle_id, obj.binMesg);
        }
      })
  }
}

module.exports = ExtInterface
