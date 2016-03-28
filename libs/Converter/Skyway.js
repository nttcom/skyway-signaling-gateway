"use strict";

// Converter/Skyway.js
var util = require("../util")
  , logger = require('log4js').getLogger("Converter/Skyway")
  , CGOF = require("../Model/CGOF")
  , Janus = require("../Model/Janus")

var SkywayConverter = {
  // convert mesg format from SkyWay to CGOF.
  "to_cgof": function(skywayMesg) {
    var cgof = new CGOF();

    var _cgof_attrs = {
      "src"    : "skyway",
      "mesg"   : null,
      "action" : null
    };

    switch(skywayMesg.type) {
    case "OFFER":
    case "ANSWER":
      _cgof_attrs.type   = skywayMesg.type;
      _cgof_attrs.action = "forward";
      _cgof_attrs.mesg   = skywayMesg.payload.sdp;
      break;
    case "CANDIDATE":
      _cgof_attrs.type   = skywayMesg.type;
      _cgof_attrs.action = "forward";
      _cgof_attrs.mesg   = skywayMesg.payload.candidate;
      break;
    case "X_JANUS":
      _cgof_attrs.type   = skywayMesg.type;
      _cgof_attrs.action = "forward";
      _cgof_attrs.mesg   = skywayMesg.payload;
      break;
    case "PING":
      _cgof_attrs.type   = "X_SKYWAY";
      _cgof_attrs.action = "sendback";
      _cgof_attrs.mesg   = {"type": "PONG"};
      break;
    case "PONG":
      _cgof_attrs.type   = "ERROR";
      _cgof_attrs.action = "discard";
      _cgof_attrs.mesg   = "receive PONG from skyway server";
      break;
    default:
      _cgof_attrs.type   = "ERROR";
      _cgof_attrs.action = "discard";
      _cgof_attrs.mesg   = "receive unknown type " + skywayMesg.type + " from skyway server";
      break;
    }

    if(cgof.setAll(_cgof_attrs)) {
      // if attributes are valid
      return cgof;
    } else {
      logger.error("to_cgof: validation error");
      return false;
    }
  },

  // convert mesg format from CGOF to SKYWAY.
  "to_skyway": function(cgofMesg, gwPeerid, brPeerid) {
    var skyway = new SkyWay();

    var _skyway_attrs = {
      "type"    : null,
      "payload" : null,
      "src"     : gwPeerid,
      "dst"     : brPeerid,
    }

    switch(cgofMesg.type) {
    case "OFFER":
    case "ANSWER":
      _skyway-Attrs.type    = cgofMesg.type;
      _skyway-Attrs.payload = { "sdp" : cgof.mesg };
      break;
    case "CANDIDATE":
      _skyway-Attrs.type    = cgofMesg.type;
      _skyway-Attrs.payload = { "candidate" : cgof.mesg };
      break;
    case "X_JANUS":
      _skyway-Attrs.type    = cgofMesg.type;
      _skyway-Attrs.payload = cgof.mesg;
      break;
    default:
      _skyway-Attrs.type    = "ERROR";
      _skyway-Attrs.payload = "";
    }

    if(cgof.setAll(_cgof_attrs)) {
      // if attributes are valid
      return cgof;
    } else {
      logger.error("to_skyway: validation error");
      return false;
    }
  }
}

module.exports = SkywayConverter;
