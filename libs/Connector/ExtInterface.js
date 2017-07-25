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
const fetch = require('node-fetch')
const log4js = require('log4js')
const util = require('../miscs/util')

const logger = log4js.getLogger('ExtInterface')

const yaml = require('node-yaml')
const CONF = yaml.readSync('../../conf/janus.yaml')
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
  }

  /**
   * start tcp server for 3rd party apps.
   *
   */
  start() {
    return new Promise((resolv, reject) => {
      util.loadAppYaml()
        .then( app_conf => {
          this.ports = app_conf.ports
          net.createServer( socket => {
            logger.info("new 3rd party app connected")
              this.clients.push(socket)

              // remove socket object from clients when tcp terminated
              socket.on('end', () => {
                logger.info("socket for the 3rd party app closed. we'll remove this socket object")
                  this.clients.splice(this.clients.indexOf(socket), 1)
                  logger.debug(this.clients.length)
              })

            this._setExtDataObserver(socket)
          }).listen(port, () => {
            resolv()
          }).on('error', err => reject(err))
        })
        .catch(err => reject(err))
    })
  }

  /**
   * send message to 3rd party process
   * it will be forwarded to every single 3rd party app.
   *
   * @param {buffer} handle_id - handle id in hex format (16 bytes)
   * @param {object} data   - arbitrary data (Buffer instance)
   */
  send(handle_id, data) {
    let payload
    if(data instanceof Buffer) {
      payload = data
    } else if(typeof(data) === 'object') {
      payload = new Buffer(JSON.stringify(data))
    } else {
      payload = new Buffer(data)
    }
    let buff = Buffer.concat([handle_id, payload])

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
      .filter(buff => buff.length > 8) // drop data when it does not have handle_id
      .map(buff => {  // transform buffer object to json
        const data = {
          handle_id: buff.slice(0, 8),
          payload: buff.slice(8),
          is_control: buff.slice(8, 12).toString() === 'SSG:'
        }
        return data
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
        fetch(`http://localhost:${this.ports.SIGNALING_CONTROLLER}/room/${obj.roomName}?method=${obj.method}`)
          .then(res => res.text())
          .then(mesg => {
            const data = {
              "type": "response",
              "target": obj.target,
              "method": obj.method,
              "statuss": 200
            }
            this.send(util.CONTROL_ID, data)
          })
          .catch(logger.warn)
      });

    const dataSource = source
      .filter(obj => !obj.is_control)

    const subscribeDataSource = dataSource
      .subscribe( obj => {
        const data = {
          handle_id: obj.handle_id,
          payload: obj.payload
        }
        this.emit('message', data)
      })
  }
}

module.exports = ExtInterface


