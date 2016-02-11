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
    this.serverAddr = CONF.serverAddr || "localhost";
    this.serverPort = CONF.serverPort || 8088;
    this.path       = CONF.path || "/janus";
    this.session_id = null;
    this.stream_id  = null;
    this.retries    = 0;
  }

  connect(callback) {
    var self = this;
    this.createSession(function(resp){
      var session_id = resp.id;
      logger.info("server connection established (%s)", session_id);
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

      if(janusMsg.janus === "attach" ){
        if(this.session_id === null) return;
        var path = this.path + "/" + this.session_id;
      } else {
        if(this.session_id === null) return;
        if(this.stream_id === null) return;
        var path = this.path + "/" + this.session_id + "/" + this.stream_id;
      }

      var req = http.request(
          {
            "hostname": this.serverAddr,
            "port": this.serverPort,
            "path": path,
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
                if(resp.janus === "success" && resp.transaction === transaction_id && resp.session_id === self.session_id && (self.stream_id ? resp.sender === self.stream_id : true)) {
                  var cgofMsg = converter.to_cgof(resp);
                  self.emit("message", {"data": cgofMsg});
                } else if(resp.janus === "ack" && resp.transaction === transaction && resp.session_id === self.session_id ) {
                  var cgofMsg = converter.to_cgof(resp);
                  self.emit("message", {"data": cgofMsg});
                } else {
                  logger.error("error while sendMessage janus = " + resp.janus + ", req_transaction = " + transaction + ", res_transaction = " + resp.transaction);
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
    var transactionId = util.randomStringForJanus();
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
                logger.error("error while createSession janus = %s, req_transaction = %s, res_transaction = %s", resp.janus, transaction, resp.transaction);
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

    logger.debug("start long polling...");

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
            logger.debug("receive message from LongPolling cycle - %s", data);
            try {
              var janusMsg = JSON.parse(data);
              var cgofMsg = converter.to_cgof(janusMsg);
              self.emit("message", {"data": cgofMsg});
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
      self.eventHandler();
    });

    req.write("");
    req.end();
  }
}

module.exports = JanusConnector;
