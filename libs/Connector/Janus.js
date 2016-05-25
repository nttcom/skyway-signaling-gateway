"use strict";

var log4js = require("log4js")
  , util = require("../util")
  , http = require("http")
  , converter = require("../Converter/Janus")
  , EventEmitter = require("events").EventEmitter

// todo: load configuration file
// var CONF = require('../conf/janus.json');
var CONF = {}; // just placeholder

var logger = log4js.getLogger("Connector/Janus")

// Connector/Janus.js

class JanusConnector extends EventEmitter{
  constructor(){
    super();

    this.serverAddr = CONF.serverAddr || "localhost";
    this.serverPort = CONF.serverPort || 8088;
    this.path       = CONF.path || "/janus";
    this.session_id = null;
    this.attach_id  = null;
    this.retries    = 0;
  }

  connect(callback) {
    var self = this;
    this.createSession(function(resp){
      var session_id = resp.id;
      logger.info("connection to server established (session_id = %s)", session_id);
      self.session_id = session_id;

      // start LongPolling so that process handle server sent event message
      self.startLongPolling();
    });
  }

  send(cgofMsg) {
    // send to janus gateway server

    // todo: check socket status (this.socket  !== null || this.socket.status???)
    try {
      var janusMsg = converter.to_janus(cgofMsg);
      var self = this;

      logger.debug("send - request message to Janus", janusMsg);


      if(janusMsg.janus === "attach" ){
        if(this.session_id === null) return;
        var path = this.path + "/" + this.session_id;
      } else {
        if(this.session_id === null) return;
        if(this.attach_id === null) return;
        var path = this.path + "/" + this.session_id + "/" + this.attach_id;
      }

      var req = http.request(
        {
          "hostname": this.serverAddr,
          "port": this.serverPort,
          "path": path,
          "method": "POST",
          "headers": { "content-type": "application/json" }
        },
        (res) => {
          var data = "";
          res.setEncoding('utf8');
          res.on('data', (chunk) => { data += chunk;});
          res.on('end', () => {
            try {
              var resp = JSON.parse(data);
              logger.debug("send - receive response data from janus", resp);

              // if request is attach, set this.attach_id
              if(janusMsg.janus === "attach") {
                if(resp.data && resp.data.id) {
                  logger.info("plugin attached (attach_id = %s)", resp.data.id);
                  this.attach_id = resp.data.id;
                } else {
                  throw "receive improper attach response";
                }
              }

              // convert janus message to CGOF then emit
              var cgofMsg = converter.to_cgof(resp);
              if(cgofMsg) {
                self.emit("message", cgofMsg);
              }
            } catch(err) {
              logger.error(err);
            }
          })
        }
      );

      req.on('error', function(e) {
        logger.error("[JANUS]", 'error happened on request: ' + e.message);
      });

      req.write(JSON.stringify(janusMsg));
      req.end();

    } catch(err) {
      logger.error(err);
    }
  }


  // belows are Janus specific methods

  createSession(callback){
    // send createSession request to Janus server
    // when received, message contains session_id. utlizing session_id setSocketHandler will be called to catch server sent event
    var transactionId = util.randomStringForJanus(12);
    var req = http.request(
        {
          "hostname": this.serverAddr,
          "port": this.serverPort,
          "path": this.path,
          "method": "POST",
          "headers": { "content-type": "application/json" }
        },
        function(res) {
          var data = "";
          res.setEncoding('utf8');
          res.on('data', function(chunk) { data += chunk;});
          res.on('end', function() {
            try {
              var resp = JSON.parse(data);
              if(resp.janus === "success" && resp.transaction === transactionId) {
                callback(resp.data);
              } else {
                logger.error("error while createSession janus = %s, transactionId = %s, res_transaction = %s", resp.janus, transactionId, resp.transaction);
              }
            } catch(err) {
              logger.error(err);
            }
          })
        }
    );

    req.on('error', function(e) {
      logger.error('error happened on request: ' + e.message);
    });


    var request = converter.fmtReqCreate(transactionId);
    req.write(JSON.stringify(request));
    req.end();
  }

  startLongPolling() {
    if(this.session_id === null) {
      logger.error("can't start LongPolling since session_id is null");
      return false;
    }

    logger.info("start long polling...");

    var self = this;
    var req = http.request(
        {
          "hostname": this.serverAddr,
          "port": this.serverPort,
          "path": this.path + "/" + this.session_id + "?rid=" + new Date().getTime() + "&maxev=1",
          "method": "GET"
        },
        function(res) {
          var data = "";
          res.setEncoding('utf8');
          res.on('data', function(chunk) { data += chunk;});
          res.on('end', function() {
            logger.debug("startLongPolling - receive message from Janus - %s", data);
            try {
              var janusMsg = JSON.parse(data);
              var cgofMsg = converter.to_cgof(janusMsg);
              self.emit("message", cgofMsg);
              self.startLongPolling(); // loop
            } catch(e) {
              logger.error(e);
            }
          })
        }
        );

    req.on('error', function(e) {
      logger.error("error happened for long polling : %s", e.message);
      self.retries++;
      if(self.retries > 3) {
        logger.error("Lost connection to Janus Gateway");
        return false;
      }
      self.startLongPolling();
    });

    req.write("");
    req.end();
  }
}

module.exports = JanusConnector;
