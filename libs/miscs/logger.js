const Logger = {
  ALL: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,

  getLogger(prefix){
    return new Log(prefix);
  }
}

class Log {
  constructor(prefix) {
    this.prefix = prefix;
    this.level = this.ALL
  }

  setLevel(level) {
    this.level = level
  }

  createMessage(level, mesg) {
    return `[${level}] ${Date.now()} ${this.prefix} - ${mesg}`
  }

  debug(mesg) {
    if(this.level <= Logger.DEBUG) console.debug(this.createMessage('DEBUG', mesg))
  }
  info(mesg) {
    if(this.level <= Logger.INFO) console.info(this.createMessage('INFO', mesg))
  }
  warn(mesg) {
    if(this.level <= Logger.WARN) console.warn(this.createMessage('WARN', mesg))
  }
  error(mesg) {
    if(this.level <= Logger.ERROR) console.error(this.createMessage('ERROR', mesg))
  }
  trace(mesg) {
    console.trace(this.createMessage('TRACE', mesg))
  }
}

module.exports = Logger
