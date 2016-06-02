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
    this.send_jConnector("SSG:HELLO");
    this.jConnector.on("message", (mesg, remote) => {
      logger.info("Received message from %s (%d) : %s", remote.address, remote.port, mesg);

      switch(mesg.toString()) {
      case "SSG:stream/start":
        var brPeerid = this.dataSkyway.getBrPeerid();
        logger.info("brPeerid for dataSkyway is : %s", brPeerid);
        this.connect_stream_ssg(brPeerid);
        break;
      case "SSG:stream/stop":
        this.disconnect_stream_ssg();
        break;
      case "SSG:voice/start":
        var brPeerid = this.dataSkyway.getBrPeerid();
        logger.info("brPeerid for dataSkyway is : %s", brPeerid);
        this.connect_voice_ssg(brPeerid);

        break;
      case "SSG:voice/stop":
        break;
      default:
        // todo: send external tcp interface
        logger.info("not control packet for SSG: %s", mesg);
        break;
      }
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

    this.dataSkyway.on("srv/open", (ev) => {
      logger.info("connection for dataSkyway established");
      this.dataAttach();
    });
  }

  dataAttach() {
    let transaction = util.randomStringForJanus(12);
    this.dataSkyway.inject({"type": "X_JANUS", "payload": {"janus": "attach", "plugin": "janus.plugin.skywayiot", "transaction": transaction}});
    logger.info("dataSkyway attached janus.plugin.skywayiot");
    setTimeout((ev) => {
      let transaction = util.randomStringForJanus(12);
      this.dataSkyway.inject({"type": "X_JANUS", "payload": {"janus": "message", "body": {"audio": false, "video": false}, "transaction": transaction}});
      logger.info("dataSkyway message sent janus.plugin.skywayiot");
    }, 500);
  }

  connect_voice_ssg() {
    this.voiceSkyway = new Gateway({
      "name" : 'voice-skyway',
      "dstnames" : ["voice-janus"],
      "connector" : { "name": "skyway", "option": { "api_key" : API_KEY, "origin": ORIGIN, "peerid": "AUDIO_" + this.peerid } }
    }),
    this.voiceJanus = new Gateway({
      "name":'voice-janus',
      "dstnames": ["voice-skyway"],
      "connector": { "name": "janus" }
    });

    this.voiceSkyway.start();  // todo : server_name should be obtained from command-line argument
    this.voiceJanus.start();  // todo : server_name should be obtained from command-line argument

    this.voiceSkyway.on("srv/open", (ev) => {
      logger.info("connection for voiceSkyway established");
      this.voiceAttach();
    });
  }

  voiceAttach() {
    let transaction = util.randomStringForJanus(12);
    this.voiceSkyway.inject({"type": "X_JANUS", "payload": {"janus": "attach", "plugin": "janus.plugin.skywayiot", "transaction": transaction}});
    logger.info("voiceSkyway attached janus.plugin.skywayiot");
    setTimeout((ev) => {
      let transaction = util.randomStringForJanus(12);
      this.voiceSkyway.inject({"type": "X_JANUS", "payload": {"janus": "message", "body": {"audio": true, "video": false}, "transaction": transaction}});
      logger.info("voiceSkyway message sent janus.plugin.skywayiot");
      this.send_jConnector("SSG:voice/started");
    }, 500);
  }



  connect_stream_ssg(brPeerid) {
    this.streamSkyway = new Gateway({
      "name" : 'stream-skyway',
      "dstnames" : ["stream-janus"],
      "connector" : { "name": "skyway", "option": { "api_key" : API_KEY, "origin": ORIGIN, "peerid": "STREAM_" + this.peerid } }
    }),
    this.streamJanus = new Gateway({
      "name":'stream-janus',
      "dstnames": ["stream-skyway"],
      "connector": { "name": "janus" }
    });

    this.streamSkyway.setBrPeerid(brPeerid);

    this.streamSkyway.start();  // todo : server_name should be obtained from command-line argument
    this.streamJanus.start();  // todo : server_name should be obtained from command-line argument

    this.streamSkyway.on("srv/open", (ev) => {
      logger.info("connection for streamSkyway established");
      this.streamAttach();
    });
  }

  streamAttach() {
    let transaction = util.randomStringForJanus(12);
    this.streamSkyway.inject({"type": "X_JANUS", "payload": {"janus": "attach", "plugin": "janus.plugin.streaming", "transaction": transaction}});
    logger.info("dataSkyway attached janus.plugin.skywayiot");
    setTimeout((ev) => {
      let transaction = util.randomStringForJanus(12);
      this.streamSkyway.inject({"type": "X_JANUS", "payload": {"janus": "message", "body": {"request": "watch", "id": 1}, "transaction": transaction}});
      logger.info("dataSkyway message sent janus.plugin.skywayiot");

      this.send_jConnector("SSG:stream/started");
    }, 500);
  }

  disconnect_stream_ssg() {
    let transaction = util.randomStringForJanus(12);
    this.streamSkyway.inject({"type": "X_JANUS", "payload": {"janus": "message", "body": {"request": "stop"}, "transaction": transaction}});
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
}, 10000);


