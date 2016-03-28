"use strict";

var Backbone = require('backbone')
  , validation = require('backbone-validation')
  , _ = require('underscore')
  , logger = require('log4js').getLogger("Model/Skyway")

_.extend(Backbone.Model.prototype, validation.mixin);

var Skyway = Backbone.Model.extend({
  initialize() {
    this.bind("validated:invalid", (model, errors) => {
      // TODO : comment out below, (prepend annoying message while test)
      // if(errors) logger.error(errors);
    });
  },
  defaults: {
    type:    null,
    payload: null,
    src:     null,
    dst:     null
  },
  validation: {
    type: {
      required: true,
      oneOf: ["OFFER", "ANSWER", "CANDIDATE", "PING", "PONG", "X_JANUS", "X_SKYWAY"]
    },
    payload: { required: false, fn: 'isObject' },
    src: { required: false, minLength: 4 },
    dst: { required: false, minLength: 4 }
  },
   isObject(val, attr, computedState) {
     return _.isObject(val) ? undefined : attr + " is not Object";
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

module.exports = Skyway;
