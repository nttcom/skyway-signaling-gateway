/**
 * echo test sample
 *
 */

const net = require('net')
const log4js = require('log4js')

const logger = log4js.getLogger('echo-test')

const CONF = require('../conf/janus.json')
const port = CONF['external']['tcp_port']






let client = new net.Socket()

client.connect(port, '127.0.0.1')

client.on('data', (buff) => {
  let handle_id = buff.slice(0, 16).toString()
  let data = buff.slice(16).toString();

  logger.debug(`recv - ${handle_id}: ${data}`)

  let echomesg =`echo message => ${data}`

  let buff_id = new Buffer(handle_id)
  let buff_data = new Buffer(echomesg)

  let len = buff_id.length + buff_data.length

  client.write(Buffer.concat([buff_id, buff_data], len))
})
