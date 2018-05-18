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

  describe('get information', function() {

    it('should return the correct updated date', function() {
      expect(rankings.getRankingsSheetLastUpdated(rankingsSS)).to.equalDate(new Date(2018, 0, 14));
    });

    it('should return the correct updated date when date is formatted as a number', function() {
      var newColumns = [].concat(rankingsValues[0]);
      newColumns[7] = 39448;
      rankingsSheet.data[0] = newColumns;
      expect(rankings.getRankingsSheetLastUpdated(rankingsSS)).to.equalDate(new Date(2008, 0, 1));
    });

    it('should return a null updated date when no date is present in the rankings', function() {
      var newColumns = [].concat(rankingsValues[0]);
      newColumns.pop();
      rankingsSheet.data[0] = newColumns;
      expect(rankings.getRankingsSheetLastUpdated(rankingsSS)).to.equal(null);
    });

    it('should return a null updated date if rankings sheet is empty', function() {
      rankingsSheet.clear();
      expect(rankings.getRankingsSheetLastUpdated(rankingsSS)).to.equal(null);
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

    it('should load rankings limited by club', function() {
      rankings.loadRankingsFromTemplate(rankingsSS, 'ELM');
      expect(rankings.getNumRankings(rankingsCopySheet)).to.equal(1);
    });

    it('should deal with no update date being present in the source sheet', function() {
      var newColumns = [].concat(rankingsValues[0]);
      newColumns.pop();
      rankingsSheet.data[0] = newColumns;
      rankings.loadRankingsFromTemplate(rankingsSS);
      expect(rankings.getRankingsSheetLastUpdated(rankingsSS)).to.equal(null);
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