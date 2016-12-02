/* streaming_process.js */

const { spawn } = require('child_process')

const _ = require('underscore')
const log4js = require('log4js')
const logger = log4js.getLogger('streaming_process')


const JANUS_CONF = require('../../conf/janus.json');
const STREAMING_PROCESS = JANUS_CONF['streaming_process']

class StreamingProcess {
  /**
   * constructor
   *
   */
  constructor(loglevel = "WARN") {
    this.streaming_process = STREAMING_PROCESS.split(" ")[0]
    this.args = STREAMING_PROCESS.split(" ").slice(1)
    this.childProcess = null

    logger.setLevel(loglevel)

    logger.info(`module StreamingProcess started. Path of the process: ${this.streaming_process}`)
  }

  /**
   * start
   *
   */
  _start() {
    if(this.childProcess) {
      return false;
    }
    this.childProcess = spawn(this.streaming_process, this.args)

    this.childProcess.stdout.on('data', (data) => {
      logger.debug(data.toString());
    });

    this.childProcess.stderr.on('data', (data) => {
      logger.warn(data.toString());
    });
    this.childProcess.on('error', (err) => {
      logger.warn(err);
      this.childProcess = null
    });

    return true;
  }

  /**
   * stop
   *
   */
  _stop() {
    return new Promise( (resolv, reject) => {
      try {
        if(this.childProcess) {
          this.childProcess.on('exit', () => {
            logger.info("process exit")
            resolv(true)
            this.childProcess = null
          });

          this.childProcess.kill();
        } else {
          resolv(false);
        }
      } catch(err) {
        logger.warn(err)
        reject(err)
      }
    });
  }

  /**
   * check if streaming client exist
   *
   * @param {objcet} connections
   * @return {boolean} true if streaming client exists
   */
  _check_if_streaming_client_exist(connections) {
    for(var id in connections) {
      var connection = connections[id]
      if( connection.plugin === "streaming" ) return true
    }
    return false;
  }


  /**
   * Attempt to start streaming process.
   *
   * This method check streaming process aleready started at first.
   * When there is no process, it will start streaming process
   *
   */
  attempt_to_start() {
    logger.debug("attempt_to_start");
    // check streaming process already exist

    return this._start()
  }

  /**
   * Stop streaming process if there is no streaming client.
   *
   * This method check streaming process availability.
   * When there is no clients, it will stop streaming process.
   *
   * @params {object} connections - Object set of connection object {'123': coneection, '234': connection, ... }
   * @return {boolean} Promise - true means streaming has stopped
   */
  stop_if_no_streaming( connections ) {
    // check there are any client which using streaming plugin
    return new Promise( (resolv, reject) => {
      try {
        if( !this._check_if_streaming_client_exist(connections) ) {
          resolv(false);
        } else {
          this._stop().then( ret => {
            resolv(true)
          }).catch(err => {
            logger.warn(err)
            reject(err)
          })
        }
      } catch(err) {
        logger.warn(err)
        reject(err)
      }
    })
  }
}

const streaming_process = new StreamingProcess()

// when process exit, we'll stop running process.
process.on('exit', () => {
  // streaming_process._stop()
})

module.exports = streaming_process
