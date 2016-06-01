// maanger.js
"use strict";

var EventEmitter = require('events').EventEmitter
  , log4js = require("log4js")
  , dgram = require('dgram')

var logger = log4js.getLogger("Manager")

// todo: it should be configurable
const JANUS_PORT = 15000
  , JANUS_ADDR = '127.0.0.1';

class Manager extends EventEmitter {
  constructor() {
    super();

    this.jConnector = dgram.createSocket('udp4');
    logger.info("connection established to Janus : %s (%d)", JANUS_ADDR, JANUS_PORT);
  }

  send_jConnector(mesg) {
    let buffer = new Buffer(mesg);
    this.jConnector.send(buffer, 0, buffer.length, JANUS_PORT, JANUS_ADDR, (err, bytes) => {
      if(err) {
        logger.error(err);
      }
    });
  }

  close() {
    logger.info("close connection to janus");
    this.jConnector.close();
  }
}

let manager = new Manager();

let timer = setInterval((ev) => {
  manager.send_jConnector("hello");
}, 1000);

setTimeout((ev) => {
  clearInterval(timer);
  manager.close();
}, 5000);
