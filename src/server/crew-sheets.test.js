var chai = require('chai'), expect = chai.expect;
var crewSheets = require('./crew-sheets');
var sheetMocks = require('./mocks/sheets.test');
var tables = require('./tables');

describe('crew sheets', function() {

  var FakeSheet = sheetMocks.MockSheet;

  before(function() {
    global.Logger = { log: function() {} };
  });

  describe('available rows', function() {

    it('should return available rows for singles crews', function() {
      var sheetValues = [
        ['Number', 'Surname', 'First name'],
        [101, 'Joe', 'Biggs'],
        [102, '', 'Williams'],
        [103, 'John', ''],
        [104, '', ''],
        [105, '', '']
      ];
      var sheet = new FakeSheet('Race1', sheetValues);
      var places = crewSheets.getAvailableRows(sheet, true, 1, 2);
      expect(places.length).to.equal(2);
      expect(places[0][0]).to.equal(104);
      expect(places[0][1]).to.equal(5);
      expect(places[0][2]).to.equal(1);
      expect(places[1][0]).to.equal(105);
      expect(places[1][1]).to.equal(6);
      expect(places[1][2]).to.equal(1);
    });

    it('should return available rows in non-adjacent locations', function() {
      var sheetValues = [
        ['Number', 'Surname', 'First name'],
        [101, 'Joe', 'Biggs'],
        [102, '', ''],
        [103, 'John', ''],
        [104, '', '']
      ];
      var sheet = new FakeSheet('Race1', sheetValues);
      var places = crewSheets.getAvailableRows(sheet, true, 1, 2);
      expect(places.length).to.equal(2);
      expect(places[0][0]).to.equal(102);
      expect(places[0][1]).to.equal(3);
      expect(places[0][2]).to.equal(1);
      expect(places[1][0]).to.equal(104);
      expect(places[1][1]).to.equal(5);
      expect(places[1][2]).to.equal(1);
    });

    it('should return available rows for doubles crews', function() {
      var sheetValues = [
        ['Number', 'Surname', 'First name'],
        [101, 'Joe', 'Biggs'],
        ['', 'Bill', 'Williams'],
        [102, 'John', ''],
        ['', 'Bella', ''],
        [103, '', ''],
        ['', '', ''],
        [104, '', '']
      ];
      var sheet = new FakeSheet('Race1', sheetValues);
      var places = crewSheets.getAvailableRows(sheet, true, 1, 2);
      expect(places.length).to.equal(2);
      expect(places[0][0]).to.equal(103);
      expect(places[0][1]).to.equal(6);
      expect(places[0][2]).to.equal(2);
      expect(places[1][0]).to.equal(104);
      expect(places[1][1]).to.equal(8);
      expect(places[1][2]).to.equal(1);
    });

    it('should return no rows for an empty sheet', function() {
      var sheetValues = [['']];
      var sheet = new FakeSheet('Race1', sheetValues);
      var places = crewSheets.getAvailableRows(sheet, true, 1, 2);
      expect(places.length).to.equal(0);
    });

    it('should return row 1 if available when no headers present', function() {
      var sheetValues = [
        [101, '', ''],
        [102, '', '']
      ];
      var sheet = new FakeSheet('Race1', sheetValues);
      var places = crewSheets.getAvailableRows(sheet, false, 1, 2);
      expect(places.length).to.equal(2);
      expect(places[0][0]).to.equal(101);
      expect(places[1][0]).to.equal(102);
    });

  });

  describe('group rows', function() {
    it('should group rows by property name', function() {
      var sheetValues = [
        ['Number', 'Surname', 'First name'],
        [101, 'Joe', 'Biggs'],
        ['', 'Bill', 'Williams'],
        [102, 'John', ''],
        ['', 'Bella', ''],
        ['', 'Harry', '']
      ];
      var sheet = new FakeSheet('Race1', sheetValues);
      var groupedRows = crewSheets.groupRows(tables.getRows(sheet), 'Number');
      expect(groupedRows.length).to.equal(2);
      expect(groupedRows[0].length).to.equal(2);
      expect(groupedRows[1].length).to.equal(3);
    });
  });

});