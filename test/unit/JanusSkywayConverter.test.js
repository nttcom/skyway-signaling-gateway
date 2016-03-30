"use strict";

var JanusConverter = require("../../libs/Converter/Janus")
  , expect = require('chai').expect
  , senarios = require('./senarios/JanusSkyway.json')
  , SkywayConverter = require('../../libs/Converter/Skyway')
  , JanusConverter = require('../../libs/Converter/Janus')
  , _ = require('underscore')


senarios.forEach( (item) => {
  describe(item.describe, () => {
    for(let key in item.senarios) {
      let senario = item.senarios[key];

      if(key === "browser2janus") {
        let skyway_to_cgof = SkywayConverter.to_cgof(senario[0])
          , sen_ = _.clone(senario[1])
          , to_janus = JanusConverter.to_janus(senario[1])

        it( "message from skyway should be converted proper CGOF format", () => {
          expect(skyway_to_cgof).to.deep.equal(senario[1]);
        });

        // for action = discard cases, there is no to_janus senario
        if(senario.length === 3) {
          it( "message from CGOF should be converted proper Janus format", () => {
            if(item.describe === "jsep:answer" || item.describe.indexOf("trickle") === 0 ) {
              // in this case, transaction is random value. For testing, set answer data.
              to_janus.transaction = senario[2].transaction;
            }
            expect(to_janus).to.deep.equal(senario[2]);
          });
        }
      } else if(key === "janus2browser") {
        let janus_to_cgof = JanusConverter.to_cgof(senario[0])
          , to_skyway = SkywayConverter.to_skyway(senario[1], "janus", "browser")


        it( "message from janus should be converted proper CGOF format", () => {
          expect(janus_to_cgof).to.deep.equal(senario[1]);
        });
        // for action = discard cases, there is no to_janus senario
        if(senario.length === 3) {
          it( "message from CGOF should be converted proper Skyway format", () => {
            expect(to_skyway).to.deep.equal(senario[2]);
          });
        }
      } else {
        console.warn("unknown type of key is detected ", key);
      }
    }
  });
});

