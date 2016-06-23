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
    this.dataSkyway.setHook( "OFFER", this.connect_dataJanus.bind(this));

    this.dataSkyway.start().then(() => {
      logger.info("connection for dataSkyway established");
    }).catch((err) => {
      logger.warn(err);
    })
  }

  connect_dataJanus() {
    return new Promise((resolv, error) => {
      if(!this.dataJanus) {
        this.dataJanus = new Gateway({
          "name":'data-janus',
          "dstnames": ["data-skyway"],
          "connector": { "name": "janus" }
        });
      }
      // todo: destory previous session
      this.dataJanus.start().then(() => {
        logger.info("dataJanus started");
        this.dataAttach(resolv, error);
      }).catch((err) => {
        logger.warn(err);
        error(err);
      });
    });
  }


  dataAttach(resolv, error) {
    let transaction = util.randomStringForJanus(12);
    this.dataSkyway.inject( {"type": "X_JANUS", "payload": {"janus": "attach", "plugin": "janus.plugin.skywayiot", "transaction": transaction}})
      .then((data) => {
        logger.info("dataSkyway attached janus.plugin.skywayiot");
        transaction = util.randomStringForJanus(12);
        return this.dataSkyway.inject({"type": "X_JANUS", "payload": {"janus": "message", "body": {"audio": false, "video": false}, "transaction": transaction}});
      }).then((data) => {
        logger.info("dataSkyway message sent janus.plugin.skywayiot");
        resolv(data);
      }).catch((err) => {
        logger.warn(err);
        error(err);
      });
  }

  connect_voice_ssg() {
    // fixme: it does not cover all patterns.
    if(!this.voiceSkyway && !this.voiceJanus) {
      this.voiceSkyway = new Gateway({
        "name" : 'voice-skyway',
        "dstnames" : ["voice-janus"],
        "connector" : { "name": "skyway", "option": { "api_key" : API_KEY, "origin": ORIGIN, "peerid": "AUDIO_" + this.peerid } }
      })
      this.voiceSkyway.start().then(() => {
        logger.info("connection for voiceSkyway established");
        this.voiceJanus = new Gateway({
          "name":'voice-janus',
          "dstnames": ["voice-skyway"],
          "connector": { "name": "janus" }
        });
        return this.voiceJanus.start();
      }).then((data) => {
        logger.info("connection for voiceJanus established");
        this.voiceAttach();
      });
    } else {
      this.voiceJanus.start().then((data) => {
        logger.info("connection for voiceSkyway and voiceJanus already established");
        this.voiceAttach();
      });
    }
  }

  voiceAttach() {
    const transaction = util.randomStringForJanus(12);
    logger.info("try to attach janus.plugin.skywayiot by voiceSkyway %s", transaction);

    this.voiceSkyway.inject({"type": "X_JANUS", "payload": {"janus": "attach", "plugin": "janus.plugin.skywayiot", "transaction": transaction}})
      .then((data) => {
        logger.info("voiceSkyway attached janus.plugin.skywayiot");
        const transaction = util.randomStringForJanus(12);
        return this.voiceSkyway.inject({"type": "X_JANUS", "payload": {"janus": "message", "body": {"audio": true, "video": false}, "transaction": transaction}});
      }).then((data) => {
        logger.info("voiceSkyway message sent janus.plugin.skywayiot");
        this.send_jConnector("SSG:voice/started");
      }).catch((err) => {
        logger.warn(err);
      });
  }



  connect_stream_ssg(brPeerid) {
    if(!this.streamSkyway && !this.streamJanus) {
      this.streamSkyway = new Gateway({
        "name" : 'stream-skyway',
        "dstnames" : ["stream-janus"],
        "connector" : { "name": "skyway", "option": { "api_key" : API_KEY, "origin": ORIGIN, "peerid": "STREAM_" + this.peerid } }
      })
      this.streamSkyway.start()
        .then(() => {
          this.streamSkyway.setBrPeerid(brPeerid);

          this.streamJanus = new Gateway({
            "name":'stream-janus',
            "dstnames": ["stream-skyway"],
            "connector": { "name": "janus" }
          });
          return this.streamJanus.start();
        }).then(() => {
          logger.info("connection for streamSkyway established");
          this.streamAttach();
        });
    } else {
      this.streamSkyway.setBrPeerid(brPeerid);

      this.streamJanus.start().then(() => {
        logger.info("connection for streamSkyway established");
        this.streamAttach();
      });
    }
  }

  streamAttach() {
    let transaction = util.randomStringForJanus(12);
    this.streamSkyway.inject({"type": "X_JANUS", "payload": {"janus": "attach", "plugin": "janus.plugin.streaming", "transaction": transaction}})
      .then((data) => {
        logger.info("dataSkyway attached janus.plugin.skywayiot");
        let transaction = util.randomStringForJanus(12);
        return this.streamSkyway.inject({"type": "X_JANUS", "payload": {"janus": "message", "body": {"request": "watch", "id": 1}, "transaction": transaction}});
      }).then((data) => {
        logger.info("dataSkyway message sent janus.plugin.skywayiot");
        this.send_jConnector("SSG:stream/started");
      });
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


