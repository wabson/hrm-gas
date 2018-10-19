var chai = require('chai'), expect = chai.expect;
var sheetsImport = require('./import');
var sheetMocks = require('./mocks/sheets.test');
var tables = require('./tables');

describe('import', function() {
  var FakeSheet = sheetMocks.MockSheet;
  var srcSheetValues, srcSheetValuesWithPaid, emptySheetValues, emptySheetValuesWithPaid, k2SheetValues,
    emptySheetK2Values;

  beforeEach(function() {

    srcSheetValues = [
      ['Number', 'Surname', 'First name'],
      [101, 'Guy', 'Hughes'],
      [102, 'Hugh', 'Jones'],
      [103, 'Becky', 'Field']
    ];
    srcSheetValuesWithPaid = [
      ['Number', 'Surname', 'First name', 'Paid'],
      [101, 'Guy', 'Hughes', 4],
      [102, 'Hugh', 'Jones', 3],
      [103, 'Becky', 'Field', 7]
    ];
    emptySheetValues = [
      ['Number', 'Surname', 'First name'],
      [101, '', ''],
      [102, '', ''],
      [103, '', '']
    ];
    emptySheetValuesWithPaid = [
      ['Number', 'Surname', 'First name', 'Paid'],
      [101, '', '', ''],
      [102, '', '', ''],
      [103, '', '', '']
    ];
    k2SheetValues = [
      ['Number', 'Surname', 'First name'],
      [101, 'Joe', 'Biggs'],
      ['', 'Nicole', 'Biggs'],
      [103, 'Joe', 'Biggs'],
      ['', 'Nicole', 'Biggs']
    ];
    emptySheetK2Values = [
      ['Number', 'Surname', 'First name'],
      [101, '', ''],
      ['', '', ''],
      [102, '', ''],
      ['', '', '']
    ];

  });

  it('should import singles crews into an empty sheet', function() {
    var srcSheet = new FakeSheet('src', srcSheetValues);
    var dstSheet = new FakeSheet('dst', emptySheetValues);
    var importResult = sheetsImport.importSheet(tables.getRows(srcSheet), dstSheet, true);
    expect(importResult.numCrews).to.equal(3);
    expect(importResult.crews.length).to.equal(3);
  });

  it('should import doubles crews into an empty sheet', function() {
    var srcSheet = new FakeSheet('src', k2SheetValues);
    var dstSheet = new FakeSheet('dst', emptySheetK2Values);
    var importResult = sheetsImport.importSheet(tables.getRows(srcSheet), dstSheet, true);
    expect(importResult.numCrews).to.equal(2);
    expect(importResult.crews.length).to.equal(2);
  });

  it('should throw an exception if we try to import doubles crews into a singles sheet', function() {
    var srcSheet = new FakeSheet('src', k2SheetValues);
    var dstSheet = new FakeSheet('dst', emptySheetValues);
    expect(function() {
      sheetsImport.importSheet(tables.getRows(srcSheet), dstSheet, true);
    }).to.throw('');
  });

  it('should return correct information about the imported crews', function() {
    var srcSheet = new FakeSheet('src', k2SheetValues);
    var dstSheet = new FakeSheet('dst', emptySheetK2Values);
    var importResult = sheetsImport.importSheet(tables.getRows(srcSheet), dstSheet, true);
    expect(importResult.numCrews).to.equal(2);
    expect(importResult.crews.length).to.equal(2);
  });

  it('should return correct information when no crews are imported', function() {
    var srcSheet = new FakeSheet('src', emptySheetK2Values);
    var dstSheet = new FakeSheet('dst', emptySheetK2Values);
    var importResult = sheetsImport.importSheet([], dstSheet, true);
    expect(importResult.numCrews).to.equal(0);
    expect(importResult.totalPaid).to.equal(0);
    expect(importResult.crews.length).to.equal(0);
  });

  it('should not import numbers from the source sheet', function() {
    var srcSheet = new FakeSheet('src', k2SheetValues);
    var dstSheet = new FakeSheet('dst', emptySheetK2Values);
    var importResult = sheetsImport.importSheet(tables.getRows(srcSheet), dstSheet, true);
    expect(dstSheet.getDataRange().getValues()[1][0]).to.equal(101);
    expect(dstSheet.getDataRange().getValues()[3][0]).to.equal(102);
  });

  it('should import paid values from the source sheet when configured to', function() {
    var srcSheet = new FakeSheet('src', srcSheetValuesWithPaid);
    var dstSheet = new FakeSheet('dst', emptySheetValuesWithPaid);
    var importResult = sheetsImport.importSheet(tables.getRows(srcSheet), dstSheet, true);
    expect(importResult.totalPaid).to.equal(14);
    expect(dstSheet.getDataRange().getValues()[1][3]).to.equal(4);
    expect(dstSheet.getDataRange().getValues()[2][3]).to.equal(3);
    expect(dstSheet.getDataRange().getValues()[3][3]).to.equal(7);
  });

  it('should NOT import paid values from the source sheet when configured NOT to', function() {
    var srcSheet = new FakeSheet('src', srcSheetValuesWithPaid);
    var dstSheet = new FakeSheet('dst', emptySheetValuesWithPaid);
    var importResult = sheetsImport.importSheet(tables.getRows(srcSheet), dstSheet, false);
    expect(importResult.totalPaid).to.equal(0);
    expect(dstSheet.getDataRange().getValues()[1][3]).to.equal('');
    expect(dstSheet.getDataRange().getValues()[2][3]).to.equal('');
    expect(dstSheet.getDataRange().getValues()[3][3]).to.equal('');
  });
});