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
  , EventEmitter = require('events').EventEmitter
  , log4js = require("log4js")

var logger = log4js.getLogger("Gateway")

var SrvConnectors = {
  "janus": JanusConnector,
  "skyway": SkywayConnector
}

///////////////////////////
// class definition

class Gateway extends EventEmitter {
  constructor(objParams /* {name: NAME, dstnames: [ DST_NAME ], connector : { "name": `skyway` or `janus`, "api_key": API_KEY } } */) {
    super();

    // todo verify server_name
    this.name = objParams.name;
    if(typeof(objParams.dstnames) === "string") {
      this.dstnames = [objParams.dstnames];
    } else {
      // todo: this code assuming that dst_server must string or Array,
      this.dstnames = objParams.dstnames;
    }
    this.source_name = objParams.connector.name.toUpperCase();
    this.srv_connector = new SrvConnectors[objParams.connector.name](objParams.connector);
    this.orc_connector = new OrchestratorConnector(this.name, this.dstnames);
    this.transactions = {};

    this.init();
  }

  init(){
    this.srv_connector.on("open", (ev) => { this.emit("srv/open") });
    this.srv_connector.on("error", (ev) => { /* ... */ });
    this.srv_connector.on("close", (ev) => { this.emit("srv/close") });
    this.srv_connector.on("message", (data) => {
      this.serverHandler(data);

      // if(data.source === this.source_name) return;
    });


    this.orc_connector.on("open", (ev) => { this.emit("osc/open") });
    this.orc_connector.on("error", (ev) => { /* ... */ });
    this.orc_connector.on("close", (ev) => { this.emit("osc/close") });
    this.orc_connector.on("message", (data) => {
      this.orchestratorHandler(data);

      const transaction = data.message && data.message.transaction;


      if(transaction && this.transactions[transaction]) {
        logger.debug("found transaction object for %s", transaction);

        // call resolv
        // todo: check message, then call error() if it includes error message
        this.transactions[transaction].resolv(data.message);

        // clear timeout
        clearTimeout(this.transactions[transaction].timer);

        // delete this transaction object
        delete this.transactions[transaction];
      } else {
        logger.warn("invalid message for %s", transaction);
      }

    });

    this.connectToOrchestrator();
  }

  setHook(type, func) {
    this.srv_connector.setHook(type, func);
  }

  // inject message in behalf of server
  //
  // when response received for specific transaction, Promise resole will execute
  inject(mesg) {
    // set Promise
    return new Promise((resolv, error) => {
      let transaction = mesg.payload.transaction;

      // set TIMEOUT timer (30sec)
      // when TIMEOUT observed, transaction object for it will be deleted.
      let timer = setTimeout((ev) => {
        logger.warn("timeout happen for %s", transaction);
        error(Error("timeout happen for " + transaction));
        delete this.transactions[transaction];
      }, 30000)

      this.transactions[transaction] = {"resolv": resolv, "error": error, "timer": timer};
      logger.debug("transaction object stored to %s", transaction);

      // inject message
      if( this.srv_connector.messageHandlerFromServer ) {
        logger.debug("try to send message ", mesg);
        this.srv_connector.messageHandlerFromServer(mesg);
      }


    });
  }


  setBrPeerid(peerid) {
    this.srv_connector.setBrPeerid(peerid);
  }

  getBrPeerid() {
    return this.srv_connector.brPeerid;
  }

  start() {
    logger.debug("start establishing connection to : ", this.name);

    return new Promise((resolve, reject) => {
      try {
        logger.debug("In promise, connectToSignalingServer()");
        this.connectToSignalingServer(resolve);
      } catch(err) {
        reject(Error(err));
      }
    });
  }

  connectToSignalingServer(callback){
    // connect to each signaling server and set the handler when message is received
    logger.debug("srv_connector.connect()");
    this.srv_connector.connect(callback);
  }

  connectToOrchestrator(){
    // todo: connect to redis-server and set orchestratorHandler
    this.orc_connector.connect();
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
    if(mesg.type === "ANSWER") logger.debug("postToOrchestrator - ", mesg);
    this.orc_connector.send(mesg);
  }

  postToServer(mesg) {
    if(mesg.type === "ANSWER")  logger.debug("postToServer - ", mesg);
    this.srv_connector.send(mesg);
  }
}

module.exports = Gateway;
