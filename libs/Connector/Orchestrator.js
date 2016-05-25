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
  }

  connect(){
    this.subChannels.forEach((channel) => {
      var subscriber = redis.createClient();
      subscriber.subscribe(channel);
      logger.info("connect (", this.channelname, ") - subscribed to channel: ", channel);
      this.mesgHandler(subscriber);
    });
  }

  mesgHandler(subscriber){
    subscriber.on("message", (channel, data) => {
      var parsed_data = JSON.parse(data);
      this.emit("message", parsed_data);
    });
  }

  send(mesg) {
    this.publisher.publish(this.channelname, JSON.stringify(mesg));
  }
}

module.exports = OrchestratorConnector;
