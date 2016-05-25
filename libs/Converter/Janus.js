"use strict";

var util = require("../util")
  , logger = require('log4js').getLogger("Converter/Janus")
  , CGOF = require('../Model/CGOF')
  , Janus = require('../Model/Janus')
  , _ = require('underscore')

// Connverter/Janus.js

var JanusConverter = {
  // create request {"janus": "create"} message format
  // This message is needed to establish connection
  // to Janus Gateway when Signaling gateway executed
  "fmtReqCreate" : function(transaction_id) {
    return {
      "janus": "create",
      "transaction": transaction_id
    }
  },

  // convert message from JANUS to CGOF
  "to_cgof" : function(janusMesg) {
    var cgof = new CGOF();

    var _cgof_attrs = {
      "type"  : null,
      "message"  : null,
      "action": null,
      "source"   : "JANUS"
    };

    // case offer or answer
    if(janusMesg.janus === "event" && janusMesg.jsep) {
      switch(janusMesg.jsep.type) {
      case "offer":
        _cgof_attrs.type = "OFFER";
        _cgof_attrs.message = {};
        _cgof_attrs.message.sdp = janusMesg.jsep.sdp;
        break;
      case "answer":
        _cgof_attrs.type = "ANSWER";
        _cgof_attrs.message = {};
        _cgof_attrs.message.sdp = janusMesg.jsep.sdp;
        break;
      default:
        logger.error("janus is event but jsep.type is neither offer or answer");
        return false;
      }
      _cgof_attrs.action = "forward";

    } else if(janusMesg.janus === "trickle") {
      // case ice candidate
      if(!janusMesg.candidate) {
        logger.error("got tricle janus message, but candidate is empty");
        return false;
      }

      _cgof_attrs.type = "CANDIDATE";
      _cgof_attrs.message = janusMesg.candidate;
      _cgof_attrs.action = "forward";
    } else if(janusMesg.janus === "keepalive") {
      _cgof_attrs.type = "X_JANUS";
      _cgof_attrs.message = janusMesg;
      _cgof_attrs.action = "forward";
    } else {
      // case extension mesg
      _cgof_attrs.type = "X_JANUS";
      _cgof_attrs.message = janusMesg;
      _cgof_attrs.action = "forward";
    }

    if(cgof.setAll(_cgof_attrs)) {
        // if valid
        return cgof.attributes;
    } else {
      // if invalid
      logger.error("to_cgof: validation error");
      return false;
    }
  },

  // convert message from CGOF to JANUS
  "to_janus" : function(cgofMesg) {
    var janus = new Janus();

    var _janus_attrs = {}

    // convert to janus format
    //
    if(cgofMesg.type === "OFFER" || cgofMesg.type === "ANSWER") {
      // case offer & answer
      _janus_attrs.janus = "message";
      _janus_attrs.body = {};
      _janus_attrs.body.request = "start";
      _janus_attrs.jsep = _.clone(cgofMesg.message);
      _janus_attrs.jsep.type = cgofMesg.type.toLowerCase();
      _janus_attrs.transaction = util.randomStringForJanus(12);
    } else if(cgofMesg.type === "CANDIDATE") {
      // case candidate
      _janus_attrs.janus = "trickle";
      _janus_attrs.candidate = cgofMesg.message.candidate;
      _janus_attrs.transaction = util.randomStringForJanus(12);
    } else if(cgofMesg.type === "X_JANUS") {
      // case X_JANUS
      _janus_attrs = cgofMesg.message;
    }

    if(janus.setAll(_janus_attrs)) {
        // if valid
        return janus.attributes;
    } else {
      // if invalid
      logger.error("to_janus: validation error");
      return false;
    }
  }
}

module.exports = JanusConverter;
