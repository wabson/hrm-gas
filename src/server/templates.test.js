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
  var racesValues = [['Name', 'TemplateSheet', 'Hidden', 'CrewSize', 'NumRange'], ['Race1', 'Tmpl1', '', '' , '']];

  before(function () {
    global.Logger = {
      log: function (arg) {
        // console.log(arg);
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

  it('should create new empty sheets when no template sheet specified', function () {
    racesSheet.data[1] = ['Race1', '', '', '' , ''];
    sourceSS.sheets = [sheet1, sheet2, tmplSheet1, racesSheet];
    templates.createFromTemplate(sourceSS, destSS);
    expect(destSS.sheets.length).to.equal(1);
    expect(destSS.sheets[0].name).to.equal('Race1');
    expect(destSS.sheets[0].data.length).to.equal(0);
  });

  it('should populate race numbers in new sheets', function () {
    racesSheet.data[1] = ['Race1', '', '', '' , '1:6,7:10'];
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
    racesSheet.data[1] = ['Race1', '', '', '2' , '1:4'];
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

  it('should copy formulae from existing sheets based on the template', function () {
    sourceSS.sheets = [sheet1, sheet2, tmplSheet1, racesSheet];
    tmplSheet1.formulas = [['', ''], ['=VLOOKUP(A2, Tmpl1!A1:B2, 1)', '']];
    templates.createFromTemplate(sourceSS, destSS);
    expect(destSS.sheets.length).to.equal(1);
    expect(destSS.sheets[0].name).to.equal('Race1');
    expect(destSS.sheets[0].formulas.length).to.equal(2);
    expect(destSS.sheets[0].formulas[1][0]).to.equal('=VLOOKUP(A2, Race1!A1:B2, 1)');
  });

});