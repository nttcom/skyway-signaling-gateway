"use strict";

var redis = require("redis")
  , EventEmitter = require("events").EventEmitter
  , logger = require("log4js").getLogger("Connector/Orchestrator");

// Connector/SkyWay.js

class OrchestratorConnector extends EventEmitter {
  constructor(pubChannel, subChannels){
    super();

    this.channelname = pubChannel;
    this.subChannels = subChannels;

    this.publisher = redis.createClient();
    this.subscribers = [];

    this.connect();
  }

  connect(){
    this.subChannels.forEach((channel) => {
      logger.info("subscribing channel: ", channel);
      var subscriber = redis.createClient();
      subscriber.subscribe(channel);
      this.mesgHandler(subscriber);
    });
  }

  mesgHandler(subscriber){
    var self = this;
    subscriber.on("message", function(channel, data) {
      var data_ = JSON.parse(data);
      logger.debug("mesgHandler - ", channel, data_);
      self.emit("message", {"frome": channel, "data": data_});
    });
  }

  send(mesg) {
    logger.debug("send - ", this.channelname, mesg);
    this.publisher.publish(this.channelname, JSON.stringify(mesg));
  }
}

module.exports = OrchestratorConnector;
