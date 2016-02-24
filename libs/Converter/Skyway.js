"use strict";

// Converter/Skyway.js

var SkywayConverter = {
  // convert mesg format from SkyWay to CGOF.
  "to_cgof": function(skywayMesg) {
    var cgofMesg = {
      "src"    : "skyway",
      "mesg"   : null,
      "action" : null
    };

    switch(skywayMesg.type) {
    case "OFFER":
    case "ANSWER":
      cgofMesg.type   = skywayMesg.type;
      cgofMesg.action = "forward";
      cgofMesg.mesg   = skywayMesg.payload.sdp;
      break;
    case "CANDIDATE":
      cgofMesg.type   = skywayMesg.type;
      cgofMesg.action = "forward";
      cgofMesg.mesg   = skywayMesg.payload.candidate;
      break;
    case "X_JANUS":
      cgofMesg.type   = skywayMesg.type;
      cgofMesg.action = "forward";
      cgofMesg.mesg   = skywayMesg.payload;
      break;
    case "PING":
      cgofMesg.type   = "X_SKYWAY";
      cgofMesg.action = "sendback";
      cgofMesg.mesg   = {"type": "PONG"};
      break;
    case "PONG":
      cgofMesg.type   = "ERROR";
      cgofMesg.action = "discard";
      cgofMesg.mesg   = "receive PONG from skyway server";
      break;
    default:
      cgofMesg.type   = "ERROR";
      cgofMesg.action = "discard";
      cgofMesg.mesg   = "receive unknown type " + skywayMesg.type + " from skyway server";
      break;
    }

    return cgofMesg;
  },

  // convert mesg format from CGOF to SKYWAY.
  "to_skyway": function(cgofMesg, gwPeerid, brPeerid) {
    var skywayMesg = {
      "type"    : null,
      "payload" : null,
      "src"     : gwPeerid,
      "dst"     : brPeerid,
    }

    switch(cgofMesg.type) {
    case "OFFER":
    case "ANSWER":
      skywayMesg.type    = cgofMesg.type;
      skywayMesg.payload = { "sdp" : cgof.mesg };
      break;
    case "CANDIDATE":
      skywayMesg.type    = cgofMesg.type;
      skywayMesg.payload = { "candidate" : cgof.mesg };
      break;
    case "X_JANUS":
      skywayMesg.type    = cgofMesg.type;
      skywayMesg.payload = cgof.mesg;
      break;
    default:
      skywayMesg.type    = "ERROR";
      skywayMesg.payload = "";
    }

    return skywayMesg;
  }
}

module.exports = SkywayConverter;
