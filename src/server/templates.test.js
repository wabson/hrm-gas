var chai = require('chai'), expect = chai.expect, sinon = require('sinon');
chai.use(require('chai-datetime'));

var templates = require('./templates');
var sheetMocks = require('./mocks/sheets.test');

var FakeSS = sheetMocks.MockSS, FakeSheet = sheetMocks.MockSheet;

describe('templates', function() {

  var sourceSS, destSS, sheet1, sheet2, racesSheet, tmplSheet1;

  var values1 = [['Column1', 'Column2'], ['Value1', 'Value2']];
  var values2 = [['Column3', 'Column4'], ['Value3', 'Value4']];
  var values3 = [['Column5', 'Column6'], ['Value51', 'Value52']];
  var valuesExternal = [['Column567', 'Column085'], ['Value320', 'Value419']];
  var racesValues = [['Name', 'TemplateSheet', 'Hidden', 'CrewSize', 'NumRange', 'Type'], ['Race1', 'Tmpl1', '', '' , '', '']];
  var racesTableValues = [['Name', 'TemplateSheet', 'Hidden', 'CrewSize', 'NumRange', 'Type'], ['Race1', 'Tmpl1', '', '' , '', 'Table']];
  var racesExternalValues = [['Name', 'TemplateSheet', 'Hidden', 'CrewSize', 'NumRange'], ['Race77', 'MyOtherSS/Tmpl1', '', '' , '']];

  before(function () {
    global.Logger = {
      log: function (arg) {
        // console.log(arg);
      }
    };
    global.SpreadsheetApp = {
      openById: function (arg) {
        var ss = new FakeSS();
        ss.sheets = [ new FakeSheet('Tmpl1', valuesExternal) ];
        return ss;
      }
    };
  });

  beforeEach(function () {
    sheet1 = new FakeSheet('Sheet1', values1);
    sheet2 = new FakeSheet('Sheet2', values2);
    tmplSheet1 = new FakeSheet('Tmpl1', values3);
    racesSheet = new FakeSheet('Races', racesValues);
    sourceSS = new FakeSS();
    destSS = new FakeSS();
  });

  it('should copy existing sheets based on the template', function () {
    sourceSS.sheets = [sheet1, sheet2, tmplSheet1, racesSheet];
    templates.createFromTemplate(sourceSS, destSS);
    expect(destSS.sheets.length).to.equal(1);
    expect(destSS.sheets[0].name).to.equal('Race1');
    expect(destSS.sheets[0].data.length).to.equal(2);
    expect(destSS.sheets[0].data[0]).to.equal(values3[0]);
  });

  it('should throw an error when the sheet is not found', function () {
    sourceSS.sheets = [sheet1, sheet2, racesSheet];
    expect(function() { templates.createFromTemplate(sourceSS, destSS) }).to.throw();
  });

  it('should only the header row of sheets in Table mode', function () {
    sourceSS.sheets = [sheet1, sheet2, tmplSheet1, racesSheet];
    templates.createFromTemplate(sourceSS, destSS);
    expect(destSS.sheets.length).to.equal(1);
    expect(destSS.sheets[0].name).to.equal('Race1');
    expect(destSS.sheets[0].data.length).to.equal(2);
    expect(destSS.sheets[0].data[0]).to.equal(values3[0]);
    expect(destSS.sheets[0].data[1]).to.equal(values3[1]);
  });

  it('should copy from external sheets when an ID is also provided in the template sheet column', function () {
    racesSheet = new FakeSheet('Races', racesExternalValues);
    sourceSS.sheets = [sheet1, sheet2, tmplSheet1, racesSheet];
    templates.createFromTemplate(sourceSS, destSS);
    expect(destSS.sheets.length).to.equal(1);
    expect(destSS.sheets[0].name).to.equal('Race77');
    expect(destSS.sheets[0].data.length).to.equal(2);
    expect(destSS.sheets[0].data[0]).to.equal(valuesExternal[0]);
  });

  it('should create new empty sheets when no template sheet specified', function () {
    racesSheet.data[1] = ['Race1', '', '', '' , ''];
    sourceSS.sheets = [sheet1, sheet2, tmplSheet1, racesSheet];
    templates.createFromTemplate(sourceSS, destSS);
    expect(destSS.sheets.length).to.equal(1);
    expect(destSS.sheets[0].name).to.equal('Race1');
    expect(destSS.sheets[0].data.length).to.equal(0);
  });

  it('should populate race numbers in new sheets', function () {
    racesSheet.data[1] = ['Race1', 'Tmpl1', '', '' , '1:6,7:10', 'Table'];
    sourceSS.sheets = [sheet1, sheet2, tmplSheet1, racesSheet];
    templates.createFromTemplate(sourceSS, destSS);
    expect(destSS.sheets.length).to.equal(1);
    expect(destSS.sheets[0].name).to.equal('Race1');
    expect(destSS.sheets[0].data.length).to.equal(9);
    expect(destSS.sheets[0].data[1][0]).to.equal(1);
    expect(destSS.sheets[0].data[2][0]).to.equal(2);
    expect(destSS.sheets[0].data[3][0]).to.equal(3);
    expect(destSS.sheets[0].data[4][0]).to.equal(4);
    expect(destSS.sheets[0].data[5][0]).to.equal(5);
    expect(destSS.sheets[0].data[6][0]).to.equal(7);
    expect(destSS.sheets[0].data[7][0]).to.equal(8);
    expect(destSS.sheets[0].data[8][0]).to.equal(9);
  });

  it('should populate race numbers for crews with multiple members', function () {
    racesSheet.data[1] = ['Race1', 'Tmpl1', '', '2' , '1:4', 'Table'];
    sourceSS.sheets = [sheet1, sheet2, tmplSheet1, racesSheet];
    templates.createFromTemplate(sourceSS, destSS);
    expect(destSS.sheets.length).to.equal(1);
    expect(destSS.sheets[0].name).to.equal('Race1');
    expect(destSS.sheets[0].data.length).to.equal(7);
    expect(destSS.sheets[0].data[1][0]).to.equal(1);
    expect(destSS.sheets[0].data[2][0]).to.equal('');
    expect(destSS.sheets[0].data[3][0]).to.equal(2);
    expect(destSS.sheets[0].data[4][0]).to.equal('');
    expect(destSS.sheets[0].data[5][0]).to.equal(3);
    expect(destSS.sheets[0].data[6][0]).to.equal('');
  });

  it('should hide sheets when specified but default to displaying', function () {
    racesSheet.data[1] = ['Race1', '', '', '', ''];
    racesSheet.data[2] = ['Race1', '', 0, '', ''];
    racesSheet.data[3] = ['Race1', '', 1, '', ''];
    sourceSS.sheets = [racesSheet];
    templates.createFromTemplate(sourceSS, destSS);
    expect(destSS.sheets.length).to.equal(3);
    expect(destSS.sheets[0].hidden).to.equal(false);
    expect(destSS.sheets[1].hidden).to.equal(false);
    expect(destSS.sheets[2].hidden).to.equal(true);
  });

  it('should modify formulae from existing sheets based on the template for Table sheets', function () {
    var racesSheet1 = new FakeSheet('Races', racesTableValues);
    sourceSS.sheets = [sheet1, sheet2, tmplSheet1, racesSheet1];
    tmplSheet1.formulas = [['', ''], ['=VLOOKUP(A2, Tmpl1!A1:B2, 1)', '']];
    templates.createFromTemplate(sourceSS, destSS);
    expect(destSS.sheets.length).to.equal(1);
    expect(destSS.sheets[0].name).to.equal('Race1');
    expect(destSS.sheets[0].formulas.length).to.equal(2);
    expect(destSS.sheets[0].formulas[1][0]).to.equal('=VLOOKUP(A2, Race1!A1:B2, 1)');
  });

  it('should NOT modify formulae from existing sheets based on the template for non-Table sheets', function () {
    sourceSS.sheets = [sheet1, sheet2, tmplSheet1, racesSheet];
    tmplSheet1.formulas = [['', ''], ['=VLOOKUP(A2, Tmpl1!A1:B2, 1)', '']];
    templates.createFromTemplate(sourceSS, destSS);
    expect(destSS.sheets.length).to.equal(1);
    expect(destSS.sheets[0].name).to.equal('Race1');
    expect(destSS.sheets[0].formulas.length).to.equal(2);
    expect(destSS.sheets[0].formulas[1][0]).to.equal('=VLOOKUP(A2, Tmpl1!A1:B2, 1)');
  });

  it('should return information on the specified row from the template index', function() {
    sourceSS.sheets = [sheet1, sheet2, tmplSheet1, racesSheet];
    var templateItem = templates.getTemplateSheetByName(sourceSS, 'Race1');
    expect(templateItem['Name']).to.equal('Race1');
    expect(templateItem['TemplateSheet']).to.equal('Tmpl1');
  });

  it('should return null if the specified row does not exist in the template index', function() {
    sourceSS.sheets = [sheet1, sheet2, tmplSheet1, racesSheet];
    var templateItem = templates.getTemplateSheetByName(sourceSS, 'DoesNotExist');
    expect(templateItem).to.equal(null);
  });

  it('should throw an error if there is no index sheet', function () {
    sourceSS.sheets = [sheet1, sheet2];
    expect(function() { templates.getTemplateSheetByName(sourceSS, destSS) }).to.throw();
  });

});