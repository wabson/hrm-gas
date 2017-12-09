var chai = require('chai'), expect = chai.expect, sinon = require('sinon');
chai.use(require('chai-datetime'));

describe('rankings', function() {

  before(function() {
    global.UrlFetchApp = { fetch: function() {} };
    global.Logger = { log: function() {} };
  });

  var fetchStub;

  before(function() {
    fetchStub = sinon.stub(UrlFetchApp, 'fetch');
  });

  after(function() {
    fetchStub.restore();
  });

  it('should parse abbreviated dates', function() {
    var rankings = require('./rankings');
    fetchStub.callsFake(function() {
      return { getContentText: function() { return '<html><body><p>UPDATED 6 FEB 2017</p></body></html>'; } };
    });
    expect(rankings.getRankingsWebsiteLastUpdated()).to.equalDate(new Date(2017, 1, 6));
  });

  it('should parse long dates', function() {
    var rankings = require('./rankings');
    fetchStub.callsFake(function() {
      return { getContentText: function() { return '<html><body><p>UPDATED 17 MARCH 2015</p></body></html>'; } };
    });
    expect(rankings.getRankingsWebsiteLastUpdated()).to.equalDate(new Date(2015, 2, 17));
  });

  it('should return null if no date provided', function() {
    var rankings = require('./rankings');
    fetchStub.callsFake(function() {
      return { getContentText: function() { return '<html><body><p></p></body></html>'; } };
    });
    expect(rankings.getRankingsWebsiteLastUpdated()).to.equal(null);
  });

});