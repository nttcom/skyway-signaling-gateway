const mqtt = require('mqtt')
const EventEmitter = require('events').EventEmitter

const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost'
const MQTT_TOPIC = process.env.MQTT_TOPIC || null

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
          this.client.subscribe(MQTT_TOPIC)
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
