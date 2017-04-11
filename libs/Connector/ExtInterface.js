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
   * @param {object} data      - data object
   * @param {string} data.type      - "data" or "control"
   * @param {string} data.handle_id - handle id in hex format (16 bytes)
   * @param {object} data.payload   - arbitrary data (Buffer instance)
   */
  send(data) {
    new Array(data)
      .filter(data => typeof(data) === 'object')
      .filter(data => data.type === 'data' || data.type === 'control')
      .filter(data => data.handle_id instanceof Buffer)
      .filter(data => data.handle_id.length === 8)
      .forEach(data => {
        let len = data.handle_id.length + data.payload.length
        let payload
        if(data.payload instanceof Buffer) {
          payload = data.payload;
        } else if(typeof(data.payload) === 'object') {
          payload = new Buffer(JSON.stringify(data.payload))
        } else {
          payload = new Buffer(data.payload)
        }
        let buff = Buffer.concat([data.handle_id, payload], len)

        this.clients.forEach( socket => {
          socket.write(buff)
        })
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
      .filter(buff => buff.length > 8) // drop data when it does not have handle_id
      .map(buff => {  // transform buffer object to json
        return {
          handle_id: buff.slice(0, 8),
          payload: buff.slice(8),
          is_control: buff.slice(8, 12).toString() === 'SSG:'
        }
      })

    const roomSource = source
      .filter(obj => obj.is_control)
      .filter(obj => obj.handle_id.equals(util.CONTROL_ID) )
      .map(obj => Object.assign({}, obj, {payload: obj.payload.toString()}))
      .filter(obj => obj.payload.indexOf('SSG:room/') === 0 )
      .map(obj => {
        const [command, roomName] = obj.payload.slice(4).split(",")
        const [target, method]    = command.split("/")
        return {
          handle_id: obj.handle_id,
          target,
          method,
          roomName
        }
      })
      .filter(obj => !!obj.roomName)

    const subscribeRoomSource = roomSource
      .subscribe( obj => {
        const data = {
          type: "control",
          handle_id: obj.handle_id,
          payload: {
            type: "request",
            target: obj.target,
            method: obj.method,
            body: {
              roomName: obj.roomName
            }
          }
        }
        this.emit('message', data);
      });

    const dataSource = source
      .filter(obj => !obj.is_control)

    const subscribeDataSource = dataSource
      .subscribe( obj => {
        const data = {
          type: "data",
          handle_id: obj.handle_id,
          payload: obj.payload
        }
        this.emit('message', data)
      })
  }
}

module.exports = ExtInterface


