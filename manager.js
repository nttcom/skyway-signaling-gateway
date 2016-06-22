// maanger.js
"use strict";

var EventEmitter = require('events').EventEmitter
  , log4js = require("log4js")
  , dgram = require('dgram')
  , Gateway = require('./libs/Gateway')
  , util = require("./libs/util")
  , intTcp = require("./libs/Interface/Tcp")

var logger = log4js.getLogger("Manager")

// todo: it should be configurable
const JANUS_PORT = 15000  // udp
  , JANUS_ADDR   = '127.0.0.1'
  , TCP_PORT     = 15000 // tcp
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
    this.connect_dataSkyway();
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
        logger.debug("not matched : %s", mesg);
        if(mesg.indexOf("SSG:") !== 0) {
          logger.info("not control packet for SSG: %s", mesg);

          this.emit("jConnector/message", mesg);
        }
        break;
      }
    });
  }

  connect_dataSkyway() {
    this.dataSkyway = new Gateway({
      "name" : 'data-skyway',
      "dstnames" : ["data-janus"],
      "connector" : { "name": "skyway", "option": { "api_key" : API_KEY, "origin": ORIGIN, "peerid": this.peerid } }
    }),
    this.dataSkyway.setHook( "OFFER", () => {
      this.connect_dataJanus();
    } );
    this.dataSkyway.start().then(() => {
      logger.info("connection for dataSkyway established");
    }).catch((err) => {
      logger.warn(err);
    })
  }

  connect_dataJanus() {
    if(!this.dataJanus) {
      logger.debug("*******************************************************");
      logger.debug("** create dataJanus *");
      logger.debug(this.dataJanus);
      logger.debug("*******************************************************");
      this.dataJanus = new Gateway({
        "name":'data-janus',
        "dstnames": ["data-skyway"],
        "connector": { "name": "janus" }
      });
    }
    // todo: destory previous session
    this.dataJanus.start().then(() => {
      logger.info("dataJanus started");
      this.dataAttach();
    }).catch((err) => {
      logger.warn(err);
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
    if(!this.voiceSkyway) {
      this.voiceSkyway = new Gateway({
        "name" : 'voice-skyway',
        "dstnames" : ["voice-janus"],
        "connector" : { "name": "skyway", "option": { "api_key" : API_KEY, "origin": ORIGIN, "peerid": "AUDIO_" + this.peerid } }
      })
      this.voiceSkyway.start();  // todo : server_name should be obtained from command-line argument
    }
    if(!this.voiceJanus) {
      this.voiceJanus = new Gateway({
        "name":'voice-janus',
        "dstnames": ["voice-skyway"],
        "connector": { "name": "janus" }
      });
    }
    // todo: destory former session

    this.voiceJanus.start();  // todo : server_name should be obtained from command-line argument

    // todo: execute after some event
    setTimeout( (ev) => {
      logger.info("connection for voiceSkyway established");
      this.voiceAttach();
    }, 500);
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
    if(!this.streamSkyway) {
      this.streamSkyway = new Gateway({
        "name" : 'stream-skyway',
        "dstnames" : ["stream-janus"],
        "connector" : { "name": "skyway", "option": { "api_key" : API_KEY, "origin": ORIGIN, "peerid": "STREAM_" + this.peerid } }
      })
      this.streamSkyway.start();  // todo : server_name should be obtained from command-line argument
    };
    if(!this.streamJanus) {
      this.streamJanus = new Gateway({
        "name":'stream-janus',
        "dstnames": ["stream-skyway"],
        "connector": { "name": "janus" }
      });
    }

    this.streamSkyway.setBrPeerid(brPeerid);

    // todo: destory former session
    this.streamJanus.start();  // todo : server_name should be obtained from command-line argument

    // todo: execute after some event
    setTimeout( (ev) => {
      logger.info("connection for streamSkyway established");
      this.streamAttach();
    }, 500);
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

///////////////////////////////////////////////
// main

let manager = new Manager();
let int_tcp = new intTcp(manager, TCP_PORT);

// test code to send arbitral message via datachannel from SSG to client.
let timer = setInterval((ev) => {
  manager.send_jConnector("hello " + Date.now() );
}, 10000);


