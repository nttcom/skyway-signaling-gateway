"use strict";

var util = require("../util")
  , log4js = require("log4js")
  , WebSocket = require("ws")
  , converter = require("../Converter/Skyway.js")
  , EventEmitter = require("events").EventEmitter



var CONF = require('../../conf/skyway.json');

var logger = log4js.getLogger("Connector/Skyway");

// Connector/Skyway.js

class SkywayConnector extends EventEmitter {
  constructor(params){
    super();
    // configure static parameter
    this.scheme     = CONF.scheme     || "wss://";
    this.serverAddr = CONF.serverAddr || "skyway.io";
    this.serverPort = CONF.serverPort || 443;
    this.path       = CONF.path       || "/";
    this.apikey    =  params.option && params.option.api_key  || CONF.apikey || "********-****-****-****-************";
    this.origin     = params.option && params.option.origin   || CONF.origin || "http://example.com";

    // configure random parameters
    this.myPeerid    = params.option && params.option.peerid  || "SSG_"+util.randomIdForSkyway();
    this.token   = util.randomTokenForSkyway();
    this.brPeerid = null;

    this.hook = {};
    this.stack = [];
    this.stack_candidate = [];
    this.is_wait = false;

    // setup url for SkyWay server
    this.serverUrl = [
      this.scheme,
      this.serverAddr,
      ":",
      this.serverPort,
      this.path,
      "peerjs?key=" + this.apikey,
      "&id=" + this.myPeerid,
      "&token=" + this.token
    ].join("");
  }

  connect(Stub, callback){
    // start websocket connection with Skyway SV
    this.socket = !Stub ?  new WebSocket(this.serverUrl, {"origin": this.origin}) : new Stub(callback);

    logger.info("start establishing connection to server");

    this.setSocketHandler();
  }

  setBrPeerid(peerid) {
    this.brPeerid = peerid;
  }

  setHook(type, func) {
    this.hook[type] = func;
  }

  send(cgofMsg) {
    // send message to Skyway server

    // todo: check socket status (this.socket  !== null || this.socket.status???)
    try {
      // todo: fi this.brPeerid is null throw error
      var skywayMsg = converter.to_skyway(cgofMsg, this.myPeerid, this.brPeerid);

      if(skywayMsg.type === "X_JANUS") {
        // logger.debug("send - discard to send : " + strMsg);
      } else {
        var strMsg = JSON.stringify(skywayMsg);
        // logger.debug("send - message to SkyWay server : " + strMsg);

        this.socket.send(strMsg);
      }
    } catch(err) {
      logger.error(err);
    }
  }

  sendback(cgofMsg) {
    try {
      var strMsg = JSON.stringify(cgofMsg.message);
      this.socket.send(strMsg);
    } catch(err) {
      logger.error(err);
    }
  }

  setSocketHandler(){
    // connection established
    this.socket.on("open", () => {
      this.emit("open");
      logger.info("connection established");
    });

    // unfortunately, error happened
    this.socket.on("error", (err) => {
      this.emit("error", err);
      logger.error(err);
    });

    // connection closed
    this.socket.on("close", () => {
      this.emit("close");
      logger.info("connection closed");
    });

    // when message received, it will be handled in messageHandler.
    this.socket.on("message", (strMsg)  => {
      this.emit("internal-message", JSON.parse(strMsg));

      try {
        let mesg = JSON.parse(strMsg);
        if(Object.keys(this.hook).length > 0) {
          if(this.is_wait) {
            this.stack.push(strMsg);
            return;
          } else if (mesg.type === "CANDIDATE") {
            this.stack_candidate.push(strMsg);
            return;
          }
        }

        if(this.hook[mesg.type]) {
          logger.debug("hook found!!");
          this.is_wait = true;
          this.stack.push(strMsg);
          this.hook[mesg.type]();
          setTimeout((ev) => {
            this.stack.forEach((msg) => { this.messageHandlerFromServer(msg); });
            this.stack_candidate.forEach((msg) => { this.messageHandlerFromServer(msg); });
            this.stack.length = 0;
            this.stack_candidate.length = 0;
            this.is_wait = false;
          }, 1500);
        } else {
          this.messageHandlerFromServer(strMsg);
        }
      } catch(err) {
        logger.warn(err);
      }
    });
  }

  messageHandlerFromServer(mesg) {
    try {
      logger.debug("messageHandlerFromServer -  : %s", mesg);

      if(typeof(mesg) === "string") {
        var skywayMsg = JSON.parse(mesg);
      } else {
        var skywayMsg = mesg;
      }

      if(!!skywayMsg.src) {
        this.brPeerid = skywayMsg.src;
      }

      var cgofMsg = converter.to_cgof(skywayMsg);

      switch(cgofMsg.action){
      case "forward":
        this.emit("message", cgofMsg);
        break;
      case "sendback":
        this.sendback(cgofMsg);
      case "discard":
      default:
        break;

      }
    } catch(err) {
      logger.error(err);
    }
  }
}

module.exports = SkywayConnector;