var expect = require('chai').expect
  , util = require('../../libs/util')

describe("unit", () => {
  describe("#randomTokenForSkyway", () => {
    it("should return string with above 4 length", () => {
      expect(util.randomTokenForSkyway()).to.be.a("string");
      expect(util.randomTokenForSkyway()).to.have.length.above(4);
    });
  })
  describe("#randomIdForSkyway", () => {
    it("should return string with above 4 length", () => {
      expect(util.randomIdForSkyway()).to.be.a("string");
      expect(util.randomIdForSkyway()).to.have.length.above(4);
    });
  })
  describe("#randomStringForJanus", () => {
    it("should return false if len is not number", () => {
      expect(util.randomStringForJanus("hoge")).to.be.false;
      expect(util.randomStringForJanus(null)).to.be.false;
    });
    it("should return false if len is less than 12", () => {
      expect(util.randomStringForJanus(11)).to.be.false;
      expect(util.randomStringForJanus(12)).to.be.a("string");
    });

    it("should return 32 length string when len is 32", () => {
      expect(util.randomStringForJanus(32)).to.be.a("string");
      expect(util.randomStringForJanus(32)).to.have.lengthOf(32);
    });
  });
});
