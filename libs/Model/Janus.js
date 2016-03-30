"use strict";

var Backbone = require('backbone')
  , validation = require('backbone-validation')
  , _ = require('underscore')
  , logger = require('log4js').getLogger("Model/Janus")

_.extend(Backbone.Model.prototype, validation.mixin);

var Janus = Backbone.Model.extend({
  initialize() {
    this.bind("validated:invalid", (model, errors) => {
    // TODO : comment out below, (prevent annoying message while test)
    // if(errors) logger.error(errors);
    });
  },
  defaults: {
    janus:       null
    // transaction: null,
    // data:        null,
    // session_id:  null,
    // sender:      null,
    // plugindata:  null,
    // jsep:        null,
    // reason:      null,
    // body:        null,
    // candidate:   null
  },
  validation: {
    janus: {
      required: true,
      oneOf: ["create", "success", "keepalive", "event", "webrtcup", "hangup", "attach", "success", "message", "ack", "trickle"],
    },
    transaction: { required: false, length: 12 },
    data:        { required: false, fn: 'isObject' },
    session_id:  { required: false, min: 0 },
    sender:      { required: false, min: 0 },
    plugindata:  { required: false, fn: 'isObject' },
    jsep:        { required: false, fn: 'isObject' },
    reason:      { required: false, minLength: 1 },
    body:        { required: false, fn: 'isObject' },
    candidate:   { required: false, fn: 'isObject' }
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

module.exports = Janus;
