const mqtt = require('mqtt')
const yaml = require('node-yaml')
const path = require('path')
const log4js = require('log4js')
const EventEmitter = require('events').EventEmitter

const conf = yaml.readSync( path.join( process.env.HOME, "/.ssg/mqtt.yaml" ))

const MQTT_URL = process.env.MQTT_URL || conf.url
const MQTT_TOPIC = process.env.MQTT_TOPIC || conf.topic

const logger = log4js.getLogger('MQTT Connector')

class MqttConnector extends EventEmitter {
  constructor() {
    super()

    this.client = null
  }

  start() {
    return new Promise((resolve, reject) => {
      if(MQTT_TOPIC) {
        this.client = mqtt.connect(MQTT_URL)

        this.client.on('connect', () => {
          logger.info(`connected to mqtt broaker ${MQTT_URL}`)

          this.client.subscribe(MQTT_TOPIC)
          logger.info(`subscribed to topic : ${MQTT_TOPIC}`)

          this._setEventHandler()

          resolve()
        })

        this.client.on('error', err => {
          reject(err)
        })
      } else {
        // do nothing
        resolve()
      }
    })
  }

  publish({topic, payload}){
    if(this.client) this.client.publish(topic, JSON.stringify(payload))
  }

  _setEventHandler() {
    this.client.on('message', (topic, message) => {
      this.emit('message', {topic, payload: JSON.parse(message.toString())})
    })
  }
}

module.exports = new MqttConnector()
