'use strict';

// --------------------------
// Gateway.js
//
// Signaling gateway module to interconnect several WebRTC signaling server.
// With this module, each WebRTC based product can interact each other.
// For instance, janus based system can be accessed from internet via Skyway.
//
// Supported features are:
// * attaching dedicated signaling server whitch indicated by server_name (skyway or janus)
// * convert signaling server message to Common Gateway Orchestration Format (CGOF) and post to orchestrator implemented with redis
// * convert CGOF to signaling server message and post to each server.

//////////////////////////////////////////////
// load each modules for signaling server
var JanusConnector = require("./Connector/Janus.js")
  , SkywayConnector = require("./Connector/Skyway.js")
  , OrchestratorConnector = require("./Connector/Orchestrator.js")
  , log4js = require("log4js")

var logger = log4js.getLogger("Gateway")

var SrvConnectors = {
  "janus": JanusConnector,
  "skyway": SkywayConnector
}

///////////////////////////
// class definition

class Gateway {
  constructor(server_name, dst_servers /* string or Array of strings */) {
    // todo verify server_name
    this.server_name = server_name;
    if(typeof(dst_servers) === "string") {
      this.dst_servers = [dst_servers];
    } else {
      // todo: this code assuming that dst_server must string or Array,
      this.dst_servers = dst_servers;
    }

    this.srv_connector = new SrvConnectors[server_name]();
    this.orc_connector = new OrchestratorConnector(server_name, this.dst_servers);
  }

  init(){
  }

  start() {
    logger.debug("start establishing connection to : ", this.server_name); // just test

    this.connectToSignalingServer();
    this.connectToOrchestrator();
  }

  connectToSignalingServer(){
    // connect to each signaling server and set the handler when message is received
    this.srv_connector.connect();
    this.srv_connector.on("message", (data) => {
      this.serverHandler(data);
    });
  }

  connectToOrchestrator(){
    // todo: connect to redis-server and set orchestratorHandler
    this.orc_connector.connect();
    this.orc_connector.on("message", (data) => {
      this.orchestratorHandler(data);
    });
  }



  serverHandler(data) {
    switch(data.action) {
    case "forward":
      this.postToOrchestrator(data);
      break;
    default:
      logger.error("unknown data ... discard it", data);
    }
  }

  orchestratorHandler(data) {
    switch(data.action) {
    case "forward":
      this.postToServer(data)
      break;
    default:
      logger.error("unknown data ... discard it", data);
    }
  }


  postToOrchestrator(mesg) {
    // add src and dest for gateway module
    this.orc_connector.send(mesg);
  }

  postToServer(mesg) {
    this.srv_connector.send(mesg);
  }
}

module.exports = Gateway;
