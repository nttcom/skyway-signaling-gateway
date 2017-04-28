/**
 * echo test sample
 *
 */

const net = require('net')
const util = require('../libs/miscs/util')
const log4js = require('log4js')
const os   = require('os')
const fs   = require('fs')
const Rx   = require('rx')

const logger = log4js.getLogger('join-leave')

const CONF = require('../conf/janus.json')
const port = CONF['external']['tcp_port']
const TEMP_FILE = '/sys/class/thermal/thermal_zone0/temp';


const MESG = {
  "JOIN": new Buffer("SSG:room/join,testroom"),
  "LEAVE": new Buffer("SSG:room/leave,testroom")
}



let client = new net.Socket()

client.connect(port, '127.0.0.1')

client.on('connect', () => {
  logger.info("connected to ssg");

  const joindata = Buffer.concat([util.CONTROL_ID, MESG.JOIN])
  const leavedata = Buffer.concat([util.CONTROL_ID, MESG.LEAVE])

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

  logger.debug(`recv - ${handle_id.toString("hex")}: ${data}`)
  const mesg_uni = JSON.stringify({"topic": "presence", "payload": "unicast echo"})
  const mesg_broad = JSON.stringify({"topic": "presence", "payload": "broadcast echo"})
  const echo_uni   = Buffer.concat([handle_id, new Buffer(mesg_uni)])
  client.write(echo_uni)
})

const keepaliveTimer = Rx.Observable.interval(1000)
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

