"use strict";

var expect = require('chai').expect
  , _ = require('underscore')
  , Janus = require('../../libs/Model/Janus');


describe('Model/Janus', () => {
  let ok_data = {
    janus:       "create",
    transaction: "012345678901",
    data:        {},
    session_id:  1234,
    sender:      1234,
    plugindata:  {},
    jsep:        {},
    reason:      "reason",
    body:        {},
    candidate:   {}
  };

  describe('#setAll', () => {
    let janus = new Janus();

    /////////////////////////////////////////
    // success pattern
    //
    it("should return true if all properties are valid", () => {
      let tmp = _.clone(ok_data);

      expect( janus.setAll(tmp) ).to.be.true;

      // check janus propery deeply
      ["create", "success", "keepalive", "event", "webrtcup", "hangup", "attach", "success", "message", "ack", "trickle"].forEach((val) => {
        tmp.janus = val;
        expect( janus.setAll(tmp) ).to.be.true;
      });

      expect( janus.setAll({"janus": "create"}) ).to.be.true;
    });
    /////////////////////////////////////////
    // fail pattern
    //

    // property: janus
    it("should return false if janus is not proper value of string", () => {
      let tmp = _.clone(ok_data);

      tmp.janus = "invalid";
      expect( janus.setAll(tmp) ).to.be.false;
    });

    it("should return false if janus is not string", () => {
      let tmp = _.clone(ok_data);

      tmp.janus = 0;
      expect( janus.setAll(tmp) ).to.be.false;
    });


    // property: transaction
    it("should return false if transaction is not string", () => {
      let tmp = _.clone(ok_data);

      tmp.transaction = 0;
      expect( janus.setAll(tmp) ).to.be.false;
    });
    it("should return false if transaction is string but length is not 12", () => {
      let tmp = _.clone(ok_data);

      ["12345678901", "1234567890123"].forEach((val) => {
        tmp.transaction = val;
        expect( janus.setAll(tmp) ).to.be.false;
      });
    });

    // property: data
    it("should return false if data is not object", () => {
      let tmp = _.clone(ok_data);

      tmp.data = 0;
      expect( janus.setAll(tmp) ).to.be.false;
    });

    // property: session_id
    it("should return false if session_id is not number", () => {
      let tmp = _.clone(ok_data);

      tmp.session_id = "s";
      expect( janus.setAll(tmp) ).to.be.false;
    });

    // property: sender
    it("should return false if sender is not number", () => {
      let tmp = _.clone(ok_data);

      tmp.sender = "s";
      expect( janus.setAll(tmp) ).to.be.false;
    });

    // property: plugindata
    it("should return false if plugindata is not object", () => {
      let tmp = _.clone(ok_data);

      tmp.plugindata = "s";
      expect( janus.setAll(tmp) ).to.be.false;
    });

    // property: jsep
    it("should return false if jsep is not object", () => {
      let tmp = _.clone(ok_data);

      tmp.jsep = "0";
      expect( janus.setAll(tmp) ).to.be.false;
    });

    // property: reason
    it("should return false if reason is not string", () => {
      let tmp = _.clone(ok_data);

      tmp.reason = 0;
      expect( janus.setAll(tmp) ).to.be.false;
    });

    // property: body
    it("should return false if body is not object", () => {
      let tmp = _.clone(ok_data);

      tmp.body = 0;
      expect( janus.setAll(tmp) ).to.be.false;
    });

    // property: candidate
    it("should return false if candidate is not object", () => {
      let tmp = _.clone(ok_data);

      tmp.candidate = 0;
      expect( janus.setAll(tmp) ).to.be.false;
    });
  });
  describe('#getAll', function(){
    it("sould return Object with type, message action and source properties", () => {
      let janus = new Janus();

      janus.setAll(ok_data);
      expect(janus.getAll()).to.deep.equal(ok_data);
    });
  });
});

