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
const express = require('express')
const app    = express()

const mqttConnector = require('./Mqtt')

const yaml   = require('node-yaml')
const CONF   = yaml.readSync('../../conf/janus.yaml')

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
    this.timestamps = {} // {${peerid}: timestamp}

    // logger.debug(`sender ${this.sender_dest}:${this.sender_port}, receiver port ${this.receiver_port}`)

    this.sender = dgram.createSocket('udp4')
    this.receiver = dgram.createSocket('udp4')

  }

  /**
   * start udp server
   *
   */
  start() {
    return new Promise((resolv, reject) => {
      util.loadAppYaml().then(app_conf => {
        this.ports = app_conf.ports
        return this.startRESTServer()
      }).then(() => {
        this.receiver.bind({address: "0.0.0.0", port: this.receiver_port}, () => {
          logger.info(`succeeded to bind port ${this.receiver_port}`);
          this.setRecieveHandler();
          return Promise.resolve()
        }).on('error', err => reject(err))
      }).then(() => mqttConnector.start())
      .then(() => {
        this._setMqttHandler()
        resolv()
      })
      .catch(err => reject(err))

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
        const mqttObj = JSON.parse(data.payload.toString())
        mqttConnector.publish( mqttObj )
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

    const keepaliveSubscriber = messageSource
      .filter(obj => obj.payload.slice(0, 13).toString() === 'SSG:keepalive')
      .map(obj => obj.payload.toString().split(",")[1])
      .subscribe(src => {
        if(!!src) { this.timestamps[src] = Date.now() }
      })

    const keepaliveTimer = Rx.Observable.interval(10000)
      .subscribe( () => {
        for(var id in this.timestamps) if(this.timestamps.hasOwnProperty(id)) {
          var ts = this.timestamps[id]
          var diff = Date.now() - ts
          logger.debug(`${id}: timestamp ${ts}, diff ${diff}/${util.KEEPALIVE_TIMEOUT}`)
          if( diff > util.KEEPALIVE_TIMEOUT ) {
            fetch(`http://localhost:${this.ports.SIGNALING_CONTROLLER}/connection/${id}`, {method: 'DELETE'})
              .then(res => res.text())
              .then(mesg => {
                delete this.timestamps[id]
                if(mesg === 'ok') logger.info(`connection for ${id} removed`)
                else logger.warn(`connection remove for ${id} failed`)
              })
          }
        }
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

  _setMqttHandler() {
    mqttConnector.on('message', ({topic, payload}) => {
      this.send(util.BROADCAST_ID, {topic, payload})
    })
  }

  /**
   * start REST server
   *
   */
  startRESTServer() {
    return new Promise((resolv, reject) => {
      app.get('/timestamps', (req, res) => {
        res.json(this.timestamps)
      })

      app.listen(this.ports.PLUGIN_CONNECTOR, () => {
        logger.info("start REST server on port : ", this.ports.PLUGIN_CONNECTOR)
        resolv()
      }).on('error', err => reject(err))
    })
  }
}

module.exports = PluginConnector
