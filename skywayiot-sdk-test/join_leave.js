/**
 * echo test sample
 *
 */

const net = require('net')
const util = require('../libs/miscs/util')
const log4js = require('log4js')
const fetch  = require('node-fetch')
const os   = require('os')
const fs   = require('fs')
const Rx   = require('rx')
const _    = require('underscore')

const logger = log4js.getLogger('join-leave')

const CONF = require('../conf/janus.json')
const port = CONF['external']['tcp_port']
const TEMP_FILE = '/sys/class/thermal/thermal_zone0/temp';


const MESG = {
  "JOIN": new Buffer("SSG:room/join,testroom"),
  "LEAVE": new Buffer("SSG:room/leave,testroom")
}



var client = new net.Socket()
var profile
var subscribes = []

function subscribe(topic) {
  subscribes.push(topic)
  subscribes = _.uniq(subscribes)
}

client.connect(port, '127.0.0.1')

client.on('connect', () => {
  logger.info("connected to ssg");

  fetch('http://localhost:3000/profile')
    .then( res => res.json() )
    .then( json => {
      profile = json
    })

  const joindata = Buffer.concat([util.CONTROL_ID, MESG.JOIN])
  const leavedata = Buffer.concat([util.CONTROL_ID, MESG.LEAVE])

  subscribe('presence')

  logger.info("send join")
  client.write(joindata)

  process.on('SIGINT', () => {
    logger.info("send leave")
    client.write(leavedata)
    process.exit()
  });
})

function send(topic, payload) {
  const str = JSON.stringify({topic, payload})
  const buf = Buffer.concat([util.BROADCAST_ID, new Buffer(str)])

  client.write(buf)
}

client.on('data', (buff) => {
  let handle_id = buff.slice(0, 8)
  let data = buff.slice(8).toString();
  let data_

  try {
    data_ = JSON.parse(data)
  } catch(e) {
    throw e
  }


  const topic = data_.topic
  const payload = data_.payload

  logger.debug(`recv - ${handle_id.toString("hex")}: ${data_.topic}`)

  subscribes.filter( t_ => t_ === topic )
    .forEach( t => {
      logger.debug(`topic: ${t}`)
      const echo = {"topic": t, "payload": "echo"}
      client.write(Buffer.concat([handle_id, new Buffer(JSON.stringify(echo))]))
    })

  if( profile && topic == profile.uuid ) {
    logger.debug(`uuid: ${topic}`)
    setTimeout(e => {
      client.write(Buffer.concat([handle_id, new Buffer(JSON.stringify({topic: topic, "payload": "hello " + Date.now()}))]))
    }, 100)
  }
})

const sendMetricTimer = Rx.Observable.interval(1000)
  .subscribe(() => {
    const freemem  = os.freemem();
    const totalmem = os.totalmem();
    const loadavg  = os.loadavg();

    const mem_usage = JSON.stringify({
      "free": freemem,
      "total": totalmem,
      "used": totalmem - freemem
    })

    const cpu_usage = JSON.stringify({
      "1min": loadavg[0],
      "5min": loadavg[1],
      "15min": loadavg[2]
    })

    // publish usage of memory and cpu
    send('memory', mem_usage );
    Rx.Observable.timer(100).subscribe(() => send('cpu', cpu_usage ))

    //       // publish system temperature
    fs.readFile(TEMP_FILE, (err, data) => {
      if(err) {
        logger.warn(err.toString());
      } else {
        const temperature = JSON.stringify({
          "cpu": parseInt(data) / 1000
        })
        Rx.Observable.timer(100).subscribe(() => send('temperature', temperature ))
      }
    });
  })

