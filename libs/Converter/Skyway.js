"use strict";

// Converter/Skyway.js

class SkywayConverter {
  constructor(){
  }

  to_cgof(skywayMesg) {
    var cgofMesg = {
      "mesg" : null,
      "action" : null
    };
    // convert into CGOF format
    //
    switch(skyway_mesg.type) {
    case "OFFER":
    case "ANSWER":
      cgof_mesg.action = "forward";
      break;
    case "CANDIDATE":
      cgof_mesg.action = "forward";
      break;
    case "X_JANUS":
      cgof_mesg.action = "forward";
      break;
    case "PING":
      cgof_mesg.mesg = JSON.stringify({"type": "pong"});
      cgof_mesg.action = "sendback";
      break;
    case "PONG":
    default:
      cgof_mesg.action = "discard";
      break;
    }

    return cgof_mesg;
  }

  to_skyway(cgof_mesg) {
    var skyway_mesg = {}

    // convert to janus format
    //
    return skyway_mesg;
  }
}

module.exports = SkywayConverter;
