var chai = require('chai'), expect = chai.expect;
var renditions = require('./renditions');
var sheetMocks = require('./mocks/sheets.test');
var tables = require('./tables');

var FakeSheet = sheetMocks.MockSheet, FakeSS = sheetMocks.MockSS;

describe('renditions', function() {

  var sheet1, sheet2, sheet3, sheet4;
  var sourceSS, destSS, emptySheet = new FakeSheet('Empty', [['']]);

  beforeEach(function() {
    sourceSS = new FakeSS();
    destSS = new FakeSS();
    sheet1 = new FakeSheet('Sheet1', [['Number', 'Club', 'Column2'], [1, 'Value1', 'Value2']]);
    sheet2 = new FakeSheet('Sheet2', [['Number', 'Name', 'Club'], [1, 'Joe', 'A'], [2, 'Bob', 'B']]);
    sheet3 = new FakeSheet('Sheet2', [['Number', 'Name', 'Club'], [1, 'Joe', 'A'], [2, 'Bob', '']]);
    sheet4 = new FakeSheet('Sheet2', [['Number', 'Name', 'Club'], [1, 'Joe', 'A'], [2, '', ''], [3, '', '']]);
  });

  describe('copy race sheets', function() {

    beforeEach(function() {
      sourceSS.sheets = [ sheet1 ];
      destSS.sheets = [ emptySheet ];
    });

    it('should copy rows from the source to the target spreadsheet', function() {

      renditions.createRaceSheets(sourceSS, destSS, ['Number', 'Column1', 'Column2'], null, false);
      expect(destSS.sheets.length).to.equal(1);
      expect(destSS.sheets[0].name).to.equal('Sheet1');
      expect(destSS.sheets[0].data.length).to.equal(2);
      expect(destSS.sheets[0].data[0].length).to.equal(3);
    });

    it('should copy only specified columns', function() {

      renditions.createRaceSheets(sourceSS, destSS, ['Number', 'Column2'], null, false);
      expect(destSS.sheets[0].data[0].length).to.equal(2);
      expect(destSS.sheets[0].data[0][0]).to.equal('Number');
      expect(destSS.sheets[0].data[0][1]).to.equal('Column2');
    });

    it('should add columns which do not exist with no value', function() {

      renditions.createRaceSheets(sourceSS, destSS, ['Number', 'Column2', 'DoesNotExist'], null, false);
      expect(destSS.sheets[0].data[0].length).to.equal(3);
      expect(destSS.sheets[0].data[0][0]).to.equal('Number');
      expect(destSS.sheets[0].data[0][1]).to.equal('Column2');
      expect(destSS.sheets[0].data[0][2]).to.equal('DoesNotExist');
      expect(destSS.sheets[0].data[1][0]).to.equal(1);
      expect(destSS.sheets[0].data[1][1]).to.equal('Value2');
      expect(destSS.sheets[0].data[1][2]).to.equal(undefined);
    });

    it('should trancate empty rows', function() {

      sourceSS.sheets = [ sheet4 ];
      renditions.createRaceSheets(sourceSS, destSS, ['Number', 'Column1', 'Column2'], null, true);
      expect(destSS.sheets[0].data.length).to.equal(2);
    });

  });

  describe('create grouped sheets', function() {

    beforeEach(function() {
      sourceSS.sheets = [ sheet2 ];
      destSS.sheets = [ emptySheet ];
    });

    it ('should create grouped sheets', function() {

      renditions.createGroupSheets(sourceSS, destSS, 'Club', ['Number', 'Name'], null);
      expect(destSS.sheets.length).to.equal(2);
      expect(destSS.sheets[0].name).to.equal('A');
      expect(destSS.sheets[1].name).to.equal('B');
    });

    it ('should ignore empty group column values', function() {

      sourceSS.sheets = [ sheet3 ];
      renditions.createGroupSheets(sourceSS, destSS, 'Club', ['Number', 'Name'], null);
      expect(destSS.sheets.length).to.equal(1);
      expect(destSS.sheets[0].name).to.equal('A');
    });

  });

});