/**
 * skywayiot plugin Connector to handle data channel message
 *
 */
const EventEmitter = require("events").EventEmitter
const dgram  = require('dgram')
const log4js = require('log4js')
const Int64  = require('node-int64')
const Rx     = require('rx')
const fetch  = require('node-fetch')

const CONF   = require('../../conf/janus.json')

const logger = log4js.getLogger('PluginConnector')
const util = require('../miscs/util')

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

    util.loadAppYaml().then(app_conf => {
      this.ports = app_conf.ports
      this.start();
    })
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
    const dataSource = messageSource
      .filter( obj => obj.payload.slice(0, 4).toString() !== "SSG:")
      .subscribe( obj => {
        const data = {
          handle_id: obj.handle_id,
          payload: obj.payload
        }
        this.emit('message', data)
      })

    //////////////////////////////////////////////////////
    // for control source
    const controlSource = messageSource
      .filter( obj => obj.payload.slice(0, 4).toString() === "SSG:")
      .map( obj => {
        return {
          handle_id: obj.handle_id,
          message: obj.payload.slice(4).toString()
        }
      })
      .subscribe(obj => {
        const strHandleId = obj.handle_id.toString("hex")
        const t_m = obj.message.split("/")

        const target = t_m[0]
        let method, src, port, url

        if(target === "stream" && t_m[1].match(/^start,.+$/)) {
          var m_s = t_m[1].split(",")
          method = m_s[0]
          src    = m_s[1]
          url = `http://localhost:${this.ports.SIGNALING_CONTROLLER}/stream/${strHandleId}?method=start&src=${src}`
        } else if(target === "stream" && t_m[1] === "stop") {
          method = t_m[1]
          port   = this.ports.SIGNALING_CONTROLLER
          url = `http://localhost:${this.ports.SIGNALING_CONTROLLER}/stream/${strHandleId}?method=stop`
        } else if(target === "profile" && t_m[1] === "get") {
          method = t_m[1]
          port   = this.ports.PROFILE_MANAGER
          url = `http://localhost:${this.ports.PROFILE_MANAGER}/profile/?handle_id=${strHandleId}`
        } else {
          return
        }
        fetch(url)
          .then(res => res.text())
          .then(mesg => {
            const _ret = {
              "type": "response",
              "target": target,
              "method": method,
              "status": 200
            }
            let ret;
            if(target === "profile") ret = Object.assign({}, _ret, {body: JSON.parse(mesg)})
            else ret = _ret

            this.send(obj.handle_id, "SSG:"+JSON.stringify(ret))
          })
      })
    // error handling
    this.receiver.on('error', err => this.emit("error", err));
  }

  /**
   * send message via udp
   *
   *
   * @param {Buffer} handle_id - handle_id (8bytes)
   * @param {Buffer|object|string|number} data
   */
  send(handle_id, data) {
    if(handle_id instanceof Buffer && handle_id.length === 8) {
      let payload

      if(data instanceof Buffer) payload = data
      else if(typeof(data) === 'object') payload = new Buffer(JSON.stringify(data))
      else payload = new Buffer(data)

      this.sender.send([handle_id, payload], this.sender_port, this.sender_dest)
    }
  }
}

module.exports = PluginConnector
