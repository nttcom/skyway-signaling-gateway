"use strict";

var util = require("../util")
  , log4js = require("log4js")
  , WebSocket = require("ws")
  , converter = require("../Converter/Skyway.js")
  , EventEmitter = require("events").EventEmitter



// todo: load configuration file
// var CONF = require('../conf/skyway.json');
var CONF = {}; // just placeholder

var logger = log4js.getLogger("Connector/Skyway");

// Connector/Skyway.js

class SkywayConnector extends EventEmitter {
  constructor(){
    // configure static parameter
    this.scheme     = CONF.scheme     || "wss://";
    this.serverAddr = CONF.serverAddr || "skyway.io";
    this.serverPort = CONF.serverPort || 443;
    this.path       = CONF.path       || "/";
    this.apikey    = CONF.apikey    || "db07bbb6-4ee8-4eb7-b0c2-b8b2e5c69ef9";
    this.origin     = CONF.origin     || "http://localhost";

    // configure random parameters
    this.myPeerid    = util.randomIdForSkyway();
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

  connect(callback){
    // start websocket connection with Skyway SV
    this.socket = new WebSocket(this.serverUrl, {"origin": this.origin});

    logger.info("start establishing connection to server");

    this.setSocketHandler();
  }

  send(cgofMsg) {
    // send message to Skyway server

    // todo: check socket status (this.socket  !== null || this.socket.status???)
    try {
      var skywayMsg = converter.to_skyway(cgofMsg, this.myPeerid, this.brPeerid);
      var strMsg = JSON.stringify(jsonMsg);

      this.socket.send(strMsg);
    } catch(err) {
      logger.error(err);
    }
  }

  sendback(cgofMesg) {
    try {
      var strMsg = JSON.stringify(cgofMesg.mesg);
      this.socket.send(strMsg);
    } catch(err) {
      logger.error(err);
    }
  }

  setSocketHandler(){
    var self = this;

    // connection established
    this.socket.on("open", function(){
      logger.info("connection established");
    });

    // unfortunately, error happened
    this.socket.on("error", function(err){
      logger.error(err);
    });

    // connection closed
    this.socket.on("close", function(err){
      logger.info("connection closed");
    });

    // when message received, it will be handled in messageHandler.
    this.socket.on("message", function(strMsg) {
      logger.debug("message received from SkyWay server : " + strMsg);

      self.messageHandlerFromServer(strMsg);
    });
  }

  messageHandlerFromServer(strMsg) {
    try {
      var skywayMsg = JSON.parse(strMsg);
      if(skywayMsg.type === "OFFER") this.brPeerid = skywayMsg.src;

      var cgofMsg = converter.to_cgof(skywayMsg);
      if(cgofMsg.action === "forward"){
        this.emit("message", {"data": cgofMsg});
      } else if(cgofMsg.action === "sendback") {
        this.sendback(cgofMesg);
      } else if(cgofMsg.action === "discard") {
        logger.info("cgofMsg requests discard");
      } else {
        logger.error("unknown message");
      }
    } catch(err) {
      logger.error(err);
    }
  }
}

module.exports = SkywayConnector;
