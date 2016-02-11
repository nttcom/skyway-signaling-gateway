"use strict";

var util = require("../util")
  , log4js = require("log4js")
  , WebSocket = require("ws")



// todo: load configuration file
// var CONF = require('../conf/skyway.json');
var CONF = {}; // just placeholder

var logger = log4js.getLogger("Connector/Skyway");

// Connector/Skyway.js

class SkywayConnector {
  constructor(){
    // configure static parameter
    this.scheme     = CONF.scheme     || "wss://";
    this.serverAddr = CONF.serverAddr || "skyway.io";
    this.serverPort = CONF.serverPort || 443;
    this.path       = CONF.path       || "/";
    this.apikey    = CONF.apikey    || "db07bbb6-4ee8-4eb7-b0c2-b8b2e5c69ef9";
    this.origin     = CONF.origin     || "http://localhost";

    // configure random parameters
    this.myid    = util.randomIdForSkyway();
    this.token   = util.randomTokenForSkyway();
    this.peer_id = null;

    // setup url for SkyWay server
    this.serverUrl = [
      this.scheme,
      this.serverAddr,
      ":",
      this.serverPort,
      this.path,
      "peerjs?key=" + this.apikey,
      "&id=" + this.myid,
      "&token=" + this.token
    ].join("");
  }

  connect(callback){
    // start websocket connection with Skyway SV
    this.socket = new WebSocket(this.serverUrl, {"origin": this.origin});

    logger.info("start establishing connection to server");

    this.setSocketHandler();
  }

  send(jsonMsg) {
    // send message to Skyway server

    // todo: check socket status (this.socket  !== null || this.socket.status???)
    try {
      var strMsg = JSON.stringify(jsonMsg);

      // todo: convert message format from CGOF to skyway specific one.

      // todo: send to skyway server
      // this.socket.send(@@@);
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
      var jsonMsg = JSON.parse(strMsg);

      // todo : handle message
    } catch(err) {
      logger.error(err);
    }
  }
}

module.exports = SkywayConnector;
