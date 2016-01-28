"use strict";

// Converter/Skyway.js

class SkywayConverter {
  constructor(){
  }

  tocgof(skyway_mesg) {
    var cgof_mesg = {
      "mesg" : null,
      "nextaction" : null
    };
    // convert into CGOF format
    //
    switch(skyway_mesg.type) {
    case "OFFER":
    case "ANSWER":
      cgof_mesg.nextaction = "forward";
      break;
    case "CANDIDATE":
      cgof_mesg.nextaction = "forward";
      break;
    case "X_JANUS":
      cgof_mesg.nextaction = "forward";
      break;
    case "PING":
      cgof_mesg.mesg = JSON.stringify({"type": "pong"});
      cgof_mesg.nextaction = "sendback";
      break;
    case "PONG":
    default:
      cgof_mesg.nextaction = "discard";
      break;
    }

    return cgof_mesg;
  }

  toserver(cgof_mesg) {
    var skyway_mesg = {}

    // convert to janus format
    //
    return skyway_mesg;
  }
}

module.exports = SkywayConverter;
