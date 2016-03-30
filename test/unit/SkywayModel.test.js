"use strict";

var expect = require('chai').expect
  , _ = require('underscore')
  , Skyway = require('../../libs/Model/Skyway');


describe('Model/Skyway', () => {
  let ok_data = {
    type:       "OFFER",
    payload:    {},
    src:        "1234",
    dst:        "5678"
  };

  describe('#setAll', () => {
    let skyway = new Skyway();

    /////////////////////////////////////////
    // success pattern
    //
    it("should return true if all properties are valid", () => {
      let tmp = _.clone(ok_data);

      expect( skyway.setAll(tmp) ).to.be.true;

      // check janus propery deeply
      ["OFFER", "ANSWER", "CANDIDATE", "X_JANUS", "X_SKYWAY"].forEach((val) => {
        tmp.type = val;
        // when type is OPEN, properties payload, src, dst has to be deleted
        expect( skyway.setAll(tmp) ).to.be.true;
      });

      expect( skyway.setAll({"type": "PING"}) ).to.be.true;
      expect( skyway.setAll({"type": "PONG"}) ).to.be.true;
      expect( skyway.setAll({"type": "OPEN"}) ).to.be.true;
    });
    /////////////////////////////////////////
    // fail pattern
    //

    // property: type
    it("should return false if type is not string", () => {
      let tmp = _.clone(ok_data);

      tmp.type = 0;
      expect( skyway.setAll(tmp) ).to.be.false;
    });
    it("should return false if type is string but it's not proper", () => {
      let tmp = _.clone(ok_data);

      tmp.type = "INVALID";
      expect( skyway.setAll(tmp) ).to.be.false;
    });

    // property: payload
    it("should return false if payload is not object", () => {
      let tmp = _.clone(ok_data);

      tmp.payload = 0;
      expect( skyway.setAll(tmp) ).to.be.false;
    });

    // property: src
    it("should return false if src is not string", () => {
      let tmp = _.clone(ok_data);

      tmp.src = 1234;
      expect( skyway.setAll(tmp) ).to.be.false;
    });
    it("should return false if src is string but short", () => {
      let tmp = _.clone(ok_data);

      tmp.src = "123";
      expect( skyway.setAll(tmp) ).to.be.false;
    });

    // property: dst
    it("should return false if dst is not string", () => {
      let tmp = _.clone(ok_data);

      tmp.dst = 1234;
      expect( skyway.setAll(tmp) ).to.be.false;
    });
    it("should return false though dst is string but short", () => {
      let tmp = _.clone(ok_data);

      tmp.dst = "123";
      expect( skyway.setAll(tmp) ).to.be.false;
    });
  });
  describe('#getAll', function(){
    it("sould return Object with type, message action and source properties", () => {
      let skyway = new Skyway();

      skyway.setAll(ok_data);
      expect(skyway.getAll()).to.deep.equal(ok_data);
    });
  });
});

