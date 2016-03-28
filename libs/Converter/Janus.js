"use strict";

var util = require("../util")
  , logger = require('log4js').getLogger("Converter/Janus")
  , CGOF = require('../Model/CGOF')
  , Janus = require('../Model/Janus')

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
      "mesg"  : null,
      "action": null,
      "src"   : "JANUS"
    };

    // case offer or answer
    if(janusMesg.janus === "event" && janusMesg.jsep) {
      switch(janusMesg.jsep.type) {
      case "offer":
        _cgof_attrs.type = "OFFER";
      case "answer":
        _cgof_attrs.type = "ANSWER";
        _cgof_attrs.mesg = janusMesg;
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
      _cgof_attrs.mesg = janusMesg.candidate;
      _cgof_attrs.action = "forward";
    } else {
      // case extension mesg
      _cgof_attrs.type = "X_JANUS";
      _cgof_attrs.mesg = janusMesg;
      _cgof_attrs.action = "forward";
    }

    if(cgof.setAll(_cgof_attrs)) {
        // if valid
        return cgof;
    } else {
      // if invalid
      logger.error("to_cgof: validation error");
      return false;
    }
  },

  // convert message from CGOF to JANUS
  "to_janus" : function(cgofMesg) {
    var janus = require('Janus');

    var _janus_attrs = {}

    // convert to janus format
    //
    if(cgofMesg.type === "OFFER" || cgofMesg.type === "ANSWER") {
      // case offer & answer
      _janus_attrs.janus = "message";
      _janus_attrs.body.request = "start";
      _janus_attrs.jsep = cgofMesg.mesg;
      _janus_attrs.transaction = util.randomStringForJanus(12);
    } else if(cgofMesg.type === "CANDIDATE") {
      // case candidate
      _janus_attrs.janus = "tricle";
      _janus_attrs.candidate = cgofMesg.mesg;
      _janus_attrs.transaction = util.randomStringForJanus(12);
    } if(cgofMesg.type === "X_JANUS") {
      // case X_JANUS
      _janus_attrs = cgofMesg.mesg;
    }

    if(janus.setAll(_janus_attrs)) {
        // if valid
        return janus;
    } else {
      // if invalid
      logger.error("to_janus: validation error");
      return false;
    }
  }
}

module.exports = JanusConverter;
