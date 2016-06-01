// maanger.js
"use strict";

var EventEmitter = require('events').EventEmitter
  , log4js = require("log4js")
  , dgram = require('dgram')
  , Gateway = require('./libs/Gateway.js')
  , util = require("./libs/util")

var logger = log4js.getLogger("Manager")

// var skyway_gateway = new Gateway('skyway', ["janus"])
//   , janus_gateway = new Gateway('janus', ["skyway"])
//
//
// skyway_gateway.start();  // todo : server_name should be obtained from command-line argument
// janus_gateway.start();  // todo : server_name should be obtained from command-line argument



// todo: it should be configurable
const JANUS_PORT = 15000
  , JANUS_ADDR   = '127.0.0.1'
  , API_KEY      = "db07bbb6-4ee8-4eb7-b0c2-b8b2e5c69ef9"
  , ORIGIN       = "http://localhost"

class Manager extends EventEmitter {
  constructor(peerid) {
    super();

    this.jConnector = dgram.createSocket('udp4');
    this.peerid = peerid || "SSG_"+util.randomIdForSkyway();
    logger.info("connection established to Janus : %s (%d)", JANUS_ADDR, JANUS_PORT);

    this.dataSkyway = null;
    this.dataJanus = null;
    this.voiceSkyway = null;
    this.voiceJanus = null;
    this.streamSkyway = null;
    this.streamJanus = null;

    this.setListener();
    this.connect_data_ssg();
  }

  setListener() {
    this.jConnector.on("message", (mesg, remote) => {
      logger.info("Received message from %s (%d) : %s", remote.address, remote.port, mesg);
    });
  }

  connect_data_ssg() {
    this.dataSkyway = new Gateway({
      "name" : 'data-skyway',
      "dstnames" : ["data-janus"],
      "connector" : { "name": "skyway", "option": { "api_key" : API_KEY, "origin": ORIGIN, "peerid": this.peerid } }
    }),
    this.dataJanus = new Gateway({
      "name":'data-janus',
      "dstnames": ["data-skyway"],
      "connector": { "name": "janus" }
    });

    this.dataSkyway.start();  // todo : server_name should be obtained from command-line argument
    this.dataJanus.start();  // todo : server_name should be obtained from command-line argument

    this.dataSkyway.on("srv/open", (ev) => { logger.info("connection for dataSkyway established"); });
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
  manager.send_jConnector("hello " + Date.now() );
}, 1000);

setTimeout((ev) => {
  clearInterval(timer);
  manager.close();
}, 30000);
