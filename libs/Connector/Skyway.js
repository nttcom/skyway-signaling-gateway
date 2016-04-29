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
  constructor(){
    super();
    // configure static parameter
    this.scheme     = CONF.scheme     || "wss://";
    this.serverAddr = CONF.serverAddr || "skyway.io";
    this.serverPort = CONF.serverPort || 443;
    this.path       = CONF.path       || "/";
    this.apikey    = CONF.apikey    || "********-****-****-****-************";
    this.origin     = CONF.origin     || "http://example.com";

    // configure random parameters
    this.myPeerid    = "SSG_"+util.randomIdForSkyway();
    this.token   = util.randomTokenForSkyway();
    this.brPeerid = null;

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

  send(cgofMsg) {
    // send message to Skyway server

    // todo: check socket status (this.socket  !== null || this.socket.status???)
    try {
      // todo: fi this.brPeerid is null throw error
      var skywayMsg = converter.to_skyway(cgofMsg, this.myPeerid, this.brPeerid);
      var strMsg = JSON.stringify(skywayMsg);
      logger.debug("send - ", strMsg);

      this.socket.send(strMsg);
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
      logger.info("connection established");
    });

    // unfortunately, error happened
    this.socket.on("error", (err) => {
      logger.error(err);
    });

    // connection closed
    this.socket.on("close", () => {
      logger.info("connection closed");
    });

    // when message received, it will be handled in messageHandler.
    this.socket.on("message", (strMsg)  => {
      logger.debug("setSocketHandler - message received from SkyWay server : " + strMsg);

      this.messageHandlerFromServer(strMsg);
    });
  }

  messageHandlerFromServer(strMsg) {
    try {
      var skywayMsg = JSON.parse(strMsg);

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
