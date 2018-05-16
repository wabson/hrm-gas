var chai = require('chai'), expect = chai.expect, sinon = require('sinon');
chai.use(require('chai-datetime'));

var rankings = require('./rankings');

describe('rankings', function() {

  before(function() {
    global.UrlFetchApp = { fetch: function() {} };
    global.Logger = { log: function() {} };
    global.Utilities = { formatString: function() {} };
  });

  var fetchStub;

  before(function() {
    fetchStub = sinon.stub(UrlFetchApp, 'fetch');
  });

  after(function() {
    fetchStub.restore();
  });

  var sheetMocks = require('./mocks/sheets.test');
  var rankingsValues = [
    ['Surname', 'First name', 'Club', 'Class', 'BCU Number', 'Expiry', 'Division', new Date(2018, 0, 14)],
    ['ABSON', 'WILLIAM', 'RIC', 'SMK' , '123456', new Date(2018, 5, 1), 3],
    ['JONES', 'JOHN', 'ELM', 'SMC' , '7890', new Date(2018, 3, 27), 5]
  ];
  var FakeSS = sheetMocks.MockSS, FakeSheet = sheetMocks.MockSheet;
  var rankingsSheet, rankingsSS;

  beforeEach(function () {
    rankingsSS = new FakeSS();
    rankingsSheet = new FakeSheet('Rankings', rankingsValues);
    rankingsSS.sheets = [ rankingsSheet ];
  });

  // it('should parse abbreviated dates', function() {
  //   var rankings = require('./rankings');
  //   fetchStub.callsFake(function() {
  //     return { getContentText: function() { return '<html><body><p>UPDATED 6 FEB 2017</p></body></html>'; } };
  //   });
  //   expect(rankings.getRankingsLastUpdated()).to.equalDate(new Date(2017, 1, 6));
  // });
  //
  // it('should parse long dates', function() {
  //   var rankings = require('./rankings');
  //   fetchStub.callsFake(function() {
  //     return { getContentText: function() { return '<html><body><p>UPDATED 17 MARCH 2015</p></body></html>'; } };
  //   });
  //   expect(rankings.getRankingsLastUpdated()).to.equalDate(new Date(2015, 2, 17));
  // });
  //
  // it('should return null if no date provided', function() {
  //   var rankings = require('./rankings');
  //   fetchStub.callsFake(function() {
  //     return { getContentText: function() { return '<html><body><p></p></body></html>'; } };
  //   });
  //   expect(rankings.getRankingsLastUpdated()).to.equal(null);
  // });

  describe('get information', function() {

    it('should return the correct updated date', function() {
      expect(rankings.getRankingsSheetLastUpdated(rankingsSS)).to.equalDate(new Date(2018, 0, 14));
    });

    it('should return the correct number of rankings', function() {
      expect(rankings.getNumRankings(rankingsSheet)).to.equal(2);
    });

  });

  describe('load rankings', function() {

    var templateValues = [ ['Name', 'TemplateSheet', 'Hidden', 'Type', 'CrewSize', 'NumRange'], ['Rankings', 'RankingsSource', '', '' , '', ''] ];
    var templateSheet;
    var rankingsCopySheet;

    beforeEach(function () {
      rankingsSS = new FakeSS();
      templateSheet = new FakeSheet('Races', templateValues);
      rankingsSheet = new FakeSheet('RankingsSource', rankingsValues);
      rankingsCopySheet = new FakeSheet('Rankings', []);
      rankingsSS.sheets = [ templateSheet, rankingsSheet, rankingsCopySheet ];
    });

    it('should load rankings using the template index', function() {
      rankings.loadRankingsFromTemplate(rankingsSS);
      expect(rankings.getNumRankings(rankingsCopySheet)).to.equal(2);
    });

  });

  describe('clear rankings', function() {

    it('should clear all rankings', function() {
      rankings.clearRankingsIfSheetExists(rankingsSS);
      expect(rankingsSheet.getLastRow()).to.equal(1);
    });

  });

  describe('search', function() {

    var results;

    it('should return results based on first name', function() {
      results = rankings.searchRankings(rankingsSS, 'william');
      expect(results.length).to.equal(1);
    });

    it('should return results based on surname', function() {
      results = rankings.searchRankings(rankingsSS, 'abson');
      expect(results.length).to.equal(1);
    });

    it('should return results based on BCU number', function() {
      results = rankings.searchRankings(rankingsSS, '123456');
      expect(results.length).to.equal(1);
    });

  });

});