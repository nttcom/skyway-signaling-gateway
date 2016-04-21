"use strict";

var SkywayConnector = require("../../libs/Connector/Skyway")
  , _ = require('underscore')
  , chai = require('chai')
  , expect = chai.expect
  , EventEmitter = require('events').EventEmitter
  , sinon = require('sinon')
  , assert = require('assert')

chai.use(require('sinon-chai'));

class Stub extends EventEmitter {
  constructor(callback) {
    super();
    this.callback = callback;
  }
  send(mesg) {
    this.callback(JSON.parse(mesg));
  }
}

describe("SkywayConnector", () => {
  describe("#event:message", () => {
    var senarios = [
      {
        skyway : {"type": "OPEN"},
        cgof : {"type": "X_SKYWAY", "message": {"type": "OPEN"}, "source": "SKYWAY", action: "discard"}
      },
      {
        skyway : {"type": "OFFER", "payload": {sdp:null}, "src": "source", "dst": "destination"},
        cgof : {"type": "OFFER", "message": {sdp:null}, "source": "SKYWAY", action: "forward"}
      },
      {
        skyway : {"type": "PING"},
        cgof : {"type": "X_SKYWAY", "message": {"type": "PONG"}, "source": "SKYWAY", action: "sendback"}
      }
    ];
    senarios.forEach((senario) => {
      var describe = [
        "if message from skyway is "
      , JSON.stringify(senario.skyway)
      , " it should be "
      , senario.cgof.action
      ].join("");

      it(describe, () => {
        var skyway_connector = new SkywayConnector()
          , spy = sinon.spy()
          , spy_socket = sinon.spy();

        skyway_connector.connect(Stub, spy_socket);  // fake Skyway

        skyway_connector.on("message", spy);
        skyway_connector.socket.emit("message", JSON.stringify(senario.skyway));

        switch(senario.skyway.type) {
        case "OPEN":
          expect(spy).not.called;
          break;
        case "OFFER":
          expect(spy).calledOnce;
          expect(spy).calledWith(senario.cgof);
          break;
        case "PING":
          expect(spy).not.called;
          expect(spy_socket).calledOnce;
          expect(spy_socket).calledWith(senario.cgof.message);
          break;
        }
      });
    });
  });
  describe("#send", () => {
    var skyway_connector = new SkywayConnector();
    var spy = sinon.spy();
    skyway_connector.connect(Stub, spy);  // fake WebSocket
    var connector_id = skyway_connector.myPeerid;

    // set src peer id into skyway_connector
    skyway_connector.socket.emit('message', JSON.stringify({"type": "X_JANUS", "payload": {"janus": "create"}, "src": "browser", "dst": connector_id}));

    var senarios = [
      {
        cgof : {"type": "ANSWER", "message": {}, "source": "JANUS", action: "forward"},
        skyway : {"type": "ANSWER", "payload": {sdp: {type: "answer"}, connectionId: "mc_0123456789abcdef", metadata: null, type: "media"}, "src": connector_id, "dst": "browser"}
      },
    ];

    it("proper cgof message should be forwarded", () => {
      skyway_connector.send(senarios[0].cgof);
      expect(spy).calledOnce;
      expect(spy).calledWith(senarios[0].skyway);
    });

  });
});

