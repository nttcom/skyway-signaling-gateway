/* test for Converter/Skyway.js */

var should = require('chai').should();

var SkywayConverter = require('../../libs/Converter/Skyway');

describe('Converter/Skyway', function() {
  describe('to_cgof', function(){
    it("PONG should be returned when type = PING", function(){
      var skyway_mesg = {
        "type": "PING"
      };
      SkywayConverter.to_cgof

