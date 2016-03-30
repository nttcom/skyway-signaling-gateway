"use strict";

var expect = require('chai').expect
  , _ = require('underscore')
  , CGOF = require('../../libs/Model/CGOF');
// var data = require('./data/janus.json');


describe('Model/CGOF', () => {
  let ok_data = {type: "OFFER", message: {}, source: "SKYWAY", action: "forward"};

  describe('#setAll', () => {
    let cgof = new CGOF();

    /////////////////////////////////////////
    // success pattern
    //
    it("should return true if all properties are valid", () => {
      let tmp = _.clone(ok_data);
      expect(cgof.setAll(tmp)).to.be.true;

      // check type property deeply
      ["ANSWER", "CANDIDATE", "X_JANUS", "X_SKYWAY", "PING", "PONG", "ERROR"].forEach((_type) => {
        tmp.type = _type;
        expect(cgof.setAll(tmp)).to.be.true;
      });

      // won't check message proprty deeply, since required is only validation

      // check source proprty deeply
      tmp.source = "JANUS";
      expect(cgof.setAll(tmp)).to.be.true;

      // check action property deeply
      ["forward", "discard", "sendback"].forEach((_action) => {
        tmp.action = _action;
        expect(cgof.setAll(tmp)).to.be.true;
      });
    });

    ////////////////////////////////////////////////
    // fail pattern

    // check type
    it("should return false if type property is invalid", () => {
      let tmp = _.clone(ok_data);

      // if type is null
      tmp.type = null;
      expect(cgof.setAll(tmp)).to.be.false;

      // if type is invalid string
      tmp.type = "INVALID";
      expect(cgof.setAll(tmp)).to.be.false;
    });

    // check message
    it("should return false if message property is invalid", () => {
      let tmp = _.clone(ok_data);

      // if message is null
      tmp.message = null;
      expect(cgof.setAll(tmp)).to.be.false;
    });


    // check source
    it("should return false if source property is invalid", () => {
      let tmp = _.clone(ok_data);

      // if source is null
      tmp.source = null;
      expect(cgof.setAll(tmp)).to.be.false;

      // if type is invalid string
      tmp.source = "INVALID";
      expect(cgof.setAll(tmp)).to.be.false;
    });

    // check action
    it("should return false if action property is invalid", () => {
      let tmp = _.clone(ok_data);

      // if action is null
      tmp.action = null;
      expect(cgof.setAll(tmp)).to.be.false;

      // if type is invalid string
      tmp.action = "INVALID";
      expect(cgof.setAll(tmp)).to.be.false;
    });
  });

  describe('#getAll', function(){
    it("sould return Object with type, message action and source properties", () => {
      let cgof = new CGOF();

      cgof.setAll(ok_data);
      expect(cgof.getAll()).to.deep.equal(ok_data);
    });
  });
});

