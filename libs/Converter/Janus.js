"use strict";

var util = require("../util");

// Connverter/Janus.js

var JanusConverter = {
  "fmtReqCreate" : function(transaction_id) {
    return {
      "janus": "create",
      "transaction": transaction_id
    }
  },

  // convert message from JANUS to CGOF
  "to_cgof" : function(janusMesg) {
    var cgofMesg = {
      "type"  : null,
      "mesg"  : null,
      "action": null,
      "src"   : "JANUS"
    };

    // case offer or answer
    if(janusMesg.janus === "event" && janusMesg.jsep) {
      switch(janusMesg.jsep.type) {
      case "offer":
        cgofMesg.type = "OFFER";
      case "answer":
        cgofMesg.type = "ANSWER";
        cgofMesg.mesg = janusMesg;
        break;
      default:
        logger.error("janus is event but jsep.type is neither offer or answer");
        return false;
      }
      cgof.action = "forward";

      return cgofMesg;
    }

    // case ice candidate
    if(janusMesg.janus === "trickle") {
      if(!janusMesg.candidate) {
        logger.error("got tricle janus message, but candidate is empty");
        return false;
      }

      cgofMesg.type = "CANDIDATE";
      cgofMesg.mesg = janusMesg.candidate;
      cgofMesg.action = "forward";

      return cgofMesg;
    }

    // case extension mesg
    cgofMesg.type = "X_JANUS";
    cgofMesg.mesg = janusMesg;
    cgofMesg.action = "forward";

    return cgofMesg;
  },

  // convert message from CGOF to JANUS
  "to_janus" : function(cgofMesg) {
    var janusMesg = {}

    // convert to janus format
    //
    // case offer & answer
    if(cgofMesg.type === "OFFER" || cgofMesg.type === "ANSWER") {
      janusMesg.janus = "message";
      janusMesg.body.request = "start";
      janusMesg.jsep = cgofMesg.mesg;
      janusMesg.transaction = util.randomStringForJanus(12);
      return janusMesg;
    }

    // case candidate
    if(cgofMesg.type === "CANDIDATE") {
      janusMesg.janus = "tricle";
      janusMesg.candidate = cgofMesg.mesg;
      janusMesg.transaction = util.randomStringForJanus(12);
      return janusMesg;
    }

    // case X_JANUS
    if(cgofMesg.type === "X_JANUS") {
      janusMesg = cgofMesg.mesg;
      return janusMesg;
    }

    // error
    logger.error("confMesg.type does not match any permitted type", cgofMesg.type);
    return false;
  }
}

module.exports = JanusConverter;
