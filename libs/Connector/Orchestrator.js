"use strict";

// Connector/SkyWay.js

class OrchestratorConnector {
  constructor(){
    // this.redis = redis.hoge()
  }

  connect(callback){
    // connect to orchestrator (redis-server)
    // this.redis.on("hoge", (mesg) -> {
    //   callback(mesg);
    // }
  }

  send(mesg) {
    // this.redis.publish(mesg);
  }
}

module.exports = OrchestratorConnector;
