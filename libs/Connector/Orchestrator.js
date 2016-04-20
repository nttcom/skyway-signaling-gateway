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
    subscriber.on("message", (channel, data) => {
      var parsed_data = JSON.parse(data);
      logger.debug("mesgHandler - ", this.channelname, "from", channel, "data = ", parsed_data);
      self.emit("message", parsed_data);
    });
  }

  send(mesg) {
    logger.debug("send - ", this.channelname, mesg);
    this.publisher.publish(this.channelname, JSON.stringify(mesg));
  }
}

module.exports = OrchestratorConnector;
