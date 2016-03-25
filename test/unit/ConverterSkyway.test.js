/* test for Converter/Skyway.js */

var should = require('chai').should();

var SkywayConverter = require('../../libs/Converter/Skyway');
var data = require('./data/skyway.json');

describe('Converter/Skyway', function() {
  describe('to_cgof', function(){
    it("OFFER should be converted as forwarded mesg with sdp", function(){
      var skyway_mesg = data.to_cgof.offer.skyway
        , cgof_mesg = data.to_cgof.offer.cgof;

      var converted = SkywayConverter.to_cgof(skyway_mesg);
      converted.should.be.a('object');
      converted.should.eql(cgof_mesg);
    });
    it("ANSWER should be converted as forwarded mesg with sdp",function(){
      var skyway_mesg = data.to_cgof.answer.skyway
        , cgof_mesg = data.to_cgof.answer.cgof;

      var converted = SkywayConverter.to_cgof(skyway_mesg);
      converted.should.be.a('object');
      converted.should.eql(cgof_mesg);
    });
    it("CANDIDATE should be converted as forwarded mesg with candidate", function(){
      var skyway_mesg = data.to_cgof.candidate.skyway
        , cgof_mesg = data.to_cgof.candidate.cgof;

      var converted = SkywayConverter.to_cgof(skyway_mesg);
      converted.should.be.a('object');
      converted.should.eql(cgof_mesg);
    });
    it("X_JANUS should be converted as forwarded mesg", function(){
      var skyway_mesg = data.to_cgof.x_janus.skyway
        , cgof_mesg = data.to_cgof.x_janus.cgof;

      var converted = SkywayConverter.to_cgof(skyway_mesg);
      converted.should.be.a('object');
      converted.should.eql(cgof_mesg);
    });
    it("PING should be converted as sendback mesg with type equal X_SKYWAY", function(){
      var skyway_mesg = data.to_cgof.ping.skyway
        , cgof_mesg = data.to_cgof.ping.cgof;

      var converted = SkywayConverter.to_cgof(skyway_mesg);
      converted.should.be.a('object');
      converted.should.eql(cgof_mesg);
    });
    it("PONG should be operated as ERROR", function(){
      var skyway_mesg = data.to_cgof.pong.skyway
        , cgof_mesg = data.to_cgof.pong.cgof;

      var converted = SkywayConverter.to_cgof(skyway_mesg);
      converted.should.be.a('object');
      converted.should.eql(cgof_mesg);
    });
    it("unknown type should be operated as ERROR", function(){
      var skyway_mesg = data.to_cgof.unknown.skyway
        , cgof_mesg = data.to_cgof.unknown.cgof;

      var converted = SkywayConverter.to_cgof(skyway_mesg);
      converted.should.be.a('object');
      converted.should.eql(cgof_mesg);
    });
    it("error if type is undefined from skyway", function(){
      var skyway_mesg = data.to_cgof.type_is_undefined.skyway
        , cgof_mesg = data.to_cgof.type_is_undefined.cgof;

      var converted = SkywayConverter.to_cgof(skyway_mesg);
      converted.should.be.a('object');
      converted.should.eql(cgof_mesg);
    });
    it("error if type is not string from skyway", function(){
      var skyway_mesg = data.to_cgof.type_is_not_string.skyway
        , cgof_mesg = data.to_cgof.type_is_not_string.cgof;

      var converted = SkywayConverter.to_cgof(skyway_mesg);
      converted.should.be.a('object');
      converted.should.eql(cgof_mesg);
    });
    it("error if payload is undefined from skyway, except for PING", function(){
      var skyway_mesg = data.to_cgof.payload_is_undefined.skyway
        , cgof_mesg = data.to_cgof.payload_is_undefined.cgof;

      var converted = SkywayConverter.to_cgof(skyway_mesg);
      converted.should.be.a('object');
      converted.should.eql(cgof_mesg);
    });
    it("error if payload is not object from skyway, except for PING", function(){
      var skyway_mesg = data.to_cgof.payload_is_not_object.skyway
        , cgof_mesg = data.to_cgof.payload_is_not_object.cgof;

      var converted = SkywayConverter.to_cgof(skyway_mesg);
      converted.should.be.a('object');
      converted.should.eql(cgof_mesg);
    });
    it("error if payload.sdp is undefined when type equal OFFER", function(){
      var skyway_mesg = data.to_cgof.payload_sdp_is_undefined_when_offer.skyway
        , cgof_mesg = data.to_cgof.payload_sdp_is_undefined_when_offer.cgof;

      var converted = SkywayConverter.to_cgof(skyway_mesg);
      converted.should.be.a('object');
      converted.should.eql(cgof_mesg);
    });
    it("error if payload.sdp is not object when type equal OFFER", function(){
      var skyway_mesg = data.to_cgof.payload_sdp_is_not_object_when_offer.skyway
        , cgof_mesg = data.to_cgof.payload_sdp_is_not_object_when_offer.cgof;

      var converted = SkywayConverter.to_cgof(skyway_mesg);
      converted.should.be.a('object');
      converted.should.eql(cgof_mesg);
    });
    it("error if payload.sdp is undefined when type equal ANSWER", function(){
      var skyway_mesg = data.to_cgof.payload_sdp_is_undefined_when_answer.skyway
        , cgof_mesg = data.to_cgof.payload_sdp_is_undefined_when_answer.cgof;

      var converted = SkywayConverter.to_cgof(skyway_mesg);
      converted.should.be.a('object');
      converted.should.eql(cgof_mesg);
    });
    it("error if payload.sdp is not object when type equal ANSWER", function(){
      var skyway_mesg = data.to_cgof.payload_sdp_is_not_object_when_answer.skyway
        , cgof_mesg = data.to_cgof.payload_sdp_is_undefined_when_answer.cgof;

      var converted = SkywayConverter.to_cgof(skyway_mesg);
      converted.should.be.a('object');
      converted.should.eql(cgof_mesg);
    });
    it("error if payload.candidate is undefined when type equal CANDIDATE", function(){
      var skyway_mesg = data.to_cgof.payload_candidate_is_undefined_when_candidate.skyway
        , cgof_mesg = data.to_cgof.payload_candidate_is_undefined_when_candidate.cgof;

      var converted = SkywayConverter.to_cgof(skyway_mesg);
      converted.should.be.a('object');
      converted.should.eql(cgof_mesg);
    });
    it("error if payload.candidate is not object when type equal CANDIDATE",function(){
      var skyway_mesg = data.to_cgof.payload_candidate_is_not_object_when_candidate.skyway
        , cgof_mesg = data.to_cgof.payload_candidate_is_not_object_when_candidate.cgof;

      var converted = SkywayConverter.to_cgof(skyway_mesg);
      converted.should.be.a('object');
      converted.should.eql(cgof_mesg);
    });
    it("error if dest is undefined from skyway, except for PING", function(){
      var skyway_mesg = data.to_cgof.dest_is_undefined.skyway
        , cgof_mesg = data.to_cgof.dest_is_undefined.cgof;

      var converted = SkywayConverter.to_cgof(skyway_mesg);
      converted.should.be.a('object');
      converted.should.eql(cgof_mesg);
    });
    it("error if dest is not string from skyway, except for PING", function(){
      var skyway_mesg = data.to_cgof.dest_is_not_string.skyway
        , cgof_mesg = data.to_cgof.dest_is_not_string.cgof;

      var converted = SkywayConverter.to_cgof(skyway_mesg);
      converted.should.be.a('object');
      converted.should.eql(cgof_mesg);
    });
  });
});

