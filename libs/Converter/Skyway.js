"use strict";

// Converter/Skyway.js
var util = require("../util")
  , logger = require('log4js').getLogger("Converter/Skyway")
  , CGOF = require("../Model/CGOF")
  , Skyway = require("../Model/Skyway")
  , _ = require('underscore')

var SkywayConverter = {
  // convert mesg format from SkyWay to CGOF.
  "connectionId": null,  // fixme: connectionId should be determined by random function
  "to_cgof": function(skywayMesg) {
    var cgof = new CGOF();

    var _cgof_attrs = {
      "source"    : "SKYWAY",
      "message"   : null,
      "action" : null
    };

    // when messsage type is offer, store connectionId for answer
    if(skywayMesg.type === "OFFER") {
      logger.info("to_cgof - offer received from skyway, regist connectionId for answer ", skywayMesg.payload.connectionId);
      this.connectionId = skywayMesg.payload.connectionId;
    }

    switch(skywayMesg.type) {
    case "OFFER":
    case "ANSWER":
      _cgof_attrs.type    = skywayMesg.type;
      _cgof_attrs.action  = "forward";
      _cgof_attrs.message = {};
      _cgof_attrs.message.sdp = skywayMesg.payload.sdp.sdp;
      break;
    case "CANDIDATE":
      _cgof_attrs.type    = skywayMesg.type;
      _cgof_attrs.action  = "forward";
      _cgof_attrs.message = {};
      _cgof_attrs.message.candidate = skywayMesg.payload.candidate;
      break;
    case "X_JANUS":
      _cgof_attrs.type    = skywayMesg.type;
      _cgof_attrs.action  = "forward";
      _cgof_attrs.message = skywayMesg.payload;
      break;
    case "PING":
      _cgof_attrs.type    = "X_SKYWAY";
      _cgof_attrs.action  = "sendback";
      _cgof_attrs.message  = {"type": "PONG"};
      break;
    case "PONG":
      _cgof_attrs.type    = "ERROR";
      _cgof_attrs.action  = "discard";
      _cgof_attrs.message = "receive PONG from skyway server";
      break;
    case "OPEN":
      _cgof_attrs.type    = "X_SKYWAY";
      _cgof_attrs.action  = "discard";
      _cgof_attrs.message = {"type": "OPEN"};
      break;
    default:
      _cgof_attrs.type    = "ERROR";
      _cgof_attrs.action  = "discard";
      _cgof_attrs.message = "receive unknown type " + skywayMesg.type + " from skyway server";
      break;
    }

    if(cgof.setAll(_cgof_attrs)) {
      // if attributes are valid
      return cgof.attributes;
    } else {
      logger.error("to_cgof: validation error");
      return false;
    }
  },

  // convert mesg format from CGOF to SKYWAY.
  "to_skyway": function(cgofMesg, gwPeerid, brPeerid) {
    var skyway = new Skyway()

    var _skyway_attrs = {
      "type"    : null,
      "payload" : null,
      "src"     : gwPeerid,
      "dst"     : brPeerid,
    }

    switch(cgofMesg.type) {
    case "OFFER":
    case "ANSWER":
      _skyway_attrs.type    = cgofMesg.type;
      _skyway_attrs.payload = {};
      _skyway_attrs.payload.sdp = {"sdp": _.clone(cgofMesg.message.sdp), "type" : cgofMesg.type.toLowerCase()};
      if(cgofMesg.type === "ANSWER") {
        _skyway_attrs.payload.connectionId = this.connectionId;
        _skyway_attrs.payload.type = this.connectionId.indexOf("mc_") === 0 ? "media" : "data";
      } else {
        // case streaming
        _skyway_attrs.payload.connectionId = "mc_" + util.randomStringForJanus(16);
        _skyway_attrs.payload.type = "media";
      }
      _skyway_attrs.payload.metadata = null;  // fixme: type should be media or data based on sdp
      break;
    case "CANDIDATE":
      _skyway_attrs.type    = cgofMesg.type;
      _skyway_attrs.payload = { "candidate" : cgofMesg.message };
      break;
    case "X_JANUS":
      _skyway_attrs.type    = cgofMesg.type;
      _skyway_attrs.payload = cgofMesg.message;
      break;
    default:
      _skyway_attrs.type    = "ERROR";
      _skyway_attrs.payload = "";
    }

    if(skyway.setAll(_skyway_attrs)) {
      // if attributes are valid
      return skyway.attributes;
    } else {
      logger.error("to_skyway: validation error");
      return false;
    }
  }
}

module.exports = SkywayConverter;
