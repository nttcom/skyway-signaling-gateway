"use strict";

var redis = require("redis")
  , EventEmitter = require("event").EventEmitter
  , logger = require("log4js").getLogger("Connector/Orchestrator");

// Connector/SkyWay.js

class OrchestratorConnector extends EventEmitter {
  constructor(pubChannel, subChannels){
    this.channelname = pubChannel;

    this.publisher = redis.createClient();
    this.subscribers = [];
  }

  connect(){
    for(var channel in this.subChannels) {
      var subscrier = redis.createClient();
      subscriber.subscribe(channel);
      this.mesgHandler(subscriber);
    }
  }

  mesgHandler(subscriber){
    var self = this;
    subscriber.on("message", function(channel, data) {
      self.emit("message", {"frome": channel, "data": data});
    });
  }

  send(mesg) {
    this.publisher.publish(this.channelname, mesg);
  }
}

module.exports = OrchestratorConnector;
