var chai = require('chai'), expect = chai.expect, sinon = require('sinon');
chai.use(require('chai-datetime'));

var tables = require('./tables');
var sheetMocks = require('./mocks/sheets.test');

var FakeSS = sheetMocks.MockSS, FakeSheet = sheetMocks.MockSheet;

describe('tables', function() {

  var sourceSS, destSS, sheet1, sheet2, racesSheet, tmplSheet1;

  var values1 = [['Column1', 'Column2'], ['Value1', 'Value2']];
  var values2 = [['Column1', 'Column2', 'Column3', 'Column4', 'Column5'], ['Value1', 'Value2', 'Value3', 'Value4', 'Value5']];
  var valuesExternal = [['Column567', 'Column085'], ['Value320', 'Value419']];
  var formulaValues = [['', ''], ['', '=B1']];

  before(function () {
    global.Logger = {
      log: function (arg) {
        // console.log(arg);
      }
    };
    global.SpreadsheetApp = {
      openById: function (arg) {
        var ss = new FakeSS();
        ss.sheets = [ new FakeSheet('Sheet1', values1) ];
        return ss;
      }
    };
  });

  beforeEach(function () {
    sheet1 = new FakeSheet('Sheet1', JSON.parse(JSON.stringify(values1)));
    sheet2 = new FakeSheet('Sheet2', JSON.parse(JSON.stringify(values2)));
    sourceSS = new FakeSS();
    destSS = new FakeSS();
  });

  it('should copy new values a column', function () {
    tables.setRangeValues(sheet1, [{ 'Column1': 'Value34' }], 2);
    expect(sheet1.data.length).to.equal(2);
    expect(sheet1.data[1].length).to.equal(2);
    expect(sheet1.data[1][0]).to.equal('Value34');
  });

  it('should copy new values into a multi-column ranges', function () {
    tables.setRangeValues(sheet2, [
      { 'Column2': 'Value12', 'Column3': 'Value13', 'Column5': 'Value15' }
      ], 2);
    expect(sheet2.data.length).to.equal(2);
    expect(sheet2.data[1].length).to.equal(5);
    expect(sheet2.data[1][0]).to.equal('Value1');
    expect(sheet2.data[1][1]).to.equal('Value12');
    expect(sheet2.data[1][2]).to.equal('Value13');
    expect(sheet2.data[1][3]).to.equal('Value4');
    expect(sheet2.data[1][4]).to.equal('Value15');
  });

  it('should do nothing when setting an empty set of values', function () {
    tables.setRangeValues(sheet1, [], 2);
    expect(sheet1.data.length).to.equal(2);
  });

  it('should get row values', function() {

    var values = tables.getRows(sheet1);
    expect(values.length).to.equal(1);
    expect(values[0]['Column1']).to.equal('Value1');
    expect(values[0]['Column2']).to.equal('Value2');

  });

  it('should convert keys to lowercase when requested', function() {

    var values = tables.getRows(sheet1, true);
    expect(values.length).to.equal(1);
    expect(values[0]['column1']).to.equal('Value1');
    expect(values[0]['column2']).to.equal('Value2');

  });

  it('should skip getting calculated values when requested', function() {

    sheet1.formulas = formulaValues;
    var values = tables.getRows(sheet1, false, true);
    expect(values.length).to.equal(1);
    expect(values[0]['Column1']).to.equal('Value1');
    expect(values[0]['Column2']).to.equal('');

  });

});