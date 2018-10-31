var chai = require('chai'), expect = chai.expect;
var entrySets = require('./entry-sets');
var sheetMocks = require('./mocks/sheets.test');

var FakeSS = sheetMocks.MockSS, FakeSheet = sheetMocks.MockSheet;
var ENTRY_SETS_COLUMNS =
  ['ID', 'Label', 'Name', 'Club', 'Email', 'Phone', 'Team Leader?', 'Entered', 'Due', 'Paid', 'Added'];

describe('entry sets', function() {

  var ss = new FakeSS(), sheet1 = new FakeSheet('Sheet1');
  var entrySetNew = {
    'ID': 22,
    'Label': 'Test set',
    'Name': 'Bob Jones',
    'Email': 'bob.jones@bob.com'
  };

  var entrySetsSheetValues = [
    ENTRY_SETS_COLUMNS,
    [ 1, 'Set 1',  'Bill Jones', 'RIC', 'bill.jones@ntl.com', 123345, false, new Date(), 0, new Date() ]
  ];
  var entrySetsSheet = new FakeSheet('Entry Sets', entrySetsSheetValues);

  describe('missing Entry Sets sheet', function() {

    beforeEach(function () {
      ss.sheets = [ sheet1 ];
      entrySets.addEntrySets(ss, [ entrySetNew ]);
    });

    it('should create new sheets if no Entry Sets sheet exists', function() {

      expect(ss.sheets.length).to.equal(2);
      expect(ss.sheets[1].getName()).to.equal('Entry Sets');

    });

    it('should create default column names in the sheet', function() {

      var sheetValues = ss.sheets[1].data;
      expect(sheetValues[0][0]).to.equal('ID');
      expect(sheetValues[0][1]).to.equal('Label');
      expect(sheetValues[0][2]).to.equal('Name');
      expect(sheetValues[0][3]).to.equal('Club');
      expect(sheetValues[0][4]).to.equal('Email');
      expect(sheetValues[0][5]).to.equal('Phone');
      expect(sheetValues[0][6]).to.equal('Team Leader?');

    });

  });

  describe('empty Entry Sets sheet', function() {

    var emptyEntrySetsSheet;

    beforeEach(function () {
      emptyEntrySetsSheet = new FakeSheet('Entry Sets', [['']]);
      ss.sheets = [ sheet1, emptyEntrySetsSheet ];
      entrySets.addEntrySets(ss, [ entrySetNew ]);
    });

    it('should create column headings if the Entry Sets sheet is empty', function() {

      var sheetValues = emptyEntrySetsSheet.data;
      expect(sheetValues.length).to.equal(2);
      expect(sheetValues[0].length).to.equal(11);

    });

  });

  describe('ID generation', function() {

    beforeEach(function () {
      ss.sheets = [ sheet1 ];
      entrySets.addEntrySets(ss, [ entrySetNew ]);
    });

    it('should generate new IDs', function() {

      ss.sheets = [ entrySetsSheet ];
      var nextId = entrySets.generateId(ss);
      expect(nextId).to.equal(2);

    });

    it('should generate new IDs in new sets', function() {

      ss.sheets = [ entrySetsSheet ];
      expect(entrySetsSheet.data.length).to.equal(2);
      entrySets.addEntrySets(ss, [{
        'Label': 'Test set'
      }]);
      expect(entrySetsSheet.data.length).to.equal(3);
      expect(entrySetsSheet.data[2][0]).to.equal(2);

    });

    it('should populate the values', function() {

      var sheetValues = ss.sheets[1].data;
      expect(sheetValues.length).to.equal(2);
      expect(sheetValues[1][0]).to.equal(22);
      expect(sheetValues[1][1]).to.equal('Test set');
      expect(sheetValues[1][2]).to.equal('Bob Jones');
      expect(sheetValues[1][4]).to.equal('bob.jones@bob.com');

    });

  });

});