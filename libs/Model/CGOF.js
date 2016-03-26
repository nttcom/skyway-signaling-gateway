"use strict";

var Backbone = require('backbone')
  , validation = require('backbone-validation')
  , _ = require('underscore')
  , logger = require('log4js').getLogger()

_.extend(Backbone.Model.prototype, validation.mixin);

var CGOF = Backbone.Model.extend({
  initialize() {
    this.bind("validated:invalid", (model, errors) => {
      // TODO : comment out below, (prepend annoying message while test)
      // if(errors) logger.error("Model/CGOF - ", errors);
    });
  },
  defaults: {
    type: null,
    message: null,
    action: null,
    source: null
  },
  validation: {
    type: {
      required: true,
      oneOf: ["OFFER", "ANSWER", "CANDIDATE", "X_JANUS", "X_SKYWAY", "PING", "PONG"]
    },
    message: {
      required: true
    },
    action: {
      required: true,
      oneOf: ["forward", "discard", "sendback"]
    },
    source: {
      required: true,
      oneOf: ["SKYWAY", "JANUS"]
    }
  },
  // check validation before set attributes
  //
  setAll(obj) {
    this.set(this.defaults);
    this.set(obj);

    var err = this.isValid(true)
    if(this.isValid(true)) {
      // when data is valid simply return true;
      return true;
    } else {
      // when validation error occures, set data as default then return false
      this.set(this.defaults);
      return false;
    }
  },
  getAll(){
    return this.attributes;
  }
});

module.exports = CGOF;
