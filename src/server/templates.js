var tables = require('./tables');

var RACES_SHEET_NAME = 'Races';
var RACES_COL_NAME = 'Name';
var RACES_COL_TEMPLATE = 'TemplateSheet';
var RACES_COL_HIDDEN = 'Hidden';
var RACES_COL_TYPE = 'Type';
var RACES_COL_CREW_SIZE = 'CrewSize';
var RACES_COL_NUM_RANGE = 'NumRange';
var RACES_COL_INDEX = 'Index';

var RACE_TYPE_TABLE = 'Table';

var _createNumberValues = function(rangesStr, crewSize) {
  crewSize = crewSize || 1;
  return rangesStr.split(',').reduce(function(values, rangeStr) {
    var rangeParts = rangeStr.split(':'), start = parseInt(rangeParts[0], 10), end = parseInt(rangeParts[1], 10);
    var series = Array.apply(null, Array((end - start) * crewSize));
    return values.concat(series.map(function(current, index) {
      var rowValues = new Array(1);
      rowValues[0] = (index % crewSize === 0) ? (start + index / crewSize) : '';
      return rowValues;
    }));
  }, []);
};

var _getTemplateSheets = function getTemplate(templateSS) {
  return tables.getRows(templateSS.getSheetByName(RACES_SHEET_NAME));
};

exports.getTemplateRows = _getTemplateSheets;

exports.getTemplateSheetByName = function getTemplateSheetByName(templateSS, sheetName) {
  var rows = _getTemplateSheets(templateSS), row;
  for (var i = 0; i<rows.length; i++) {
    row = rows[i];
    if (row[RACES_COL_NAME] === sheetName) {
      return row;
    }
  }
  return null;
};

exports.openSheet = function openReferencedSheet(templateSS, sheetName) {
  var sourceSS = templateSS, templateSheetName = sheetName;
  var slashPosn = templateSheetName.indexOf('/'), referencesExternalSheet = templateSheetName && slashPosn > 0 &&
    slashPosn < templateSheetName.length - 1;
  if (referencesExternalSheet) {
    sourceSS = SpreadsheetApp.openById(templateSheetName.substring(0, slashPosn));
    templateSheetName = templateSheetName.substring(slashPosn + 1);
  }
  return templateSheetName ? sourceSS.getSheetByName(templateSheetName) : null;
};

var createSheetsFromTemplate = function createSheetsFromTemplate(rows, templateSS, ss) {
  var row, templateSheetName, srcSheet;
  // Name, TemplateSheet, Hidden, StartOrder, CrewSize, NumRange
  for (var i = 0; i<rows.length; i++) {
    row = rows[i];
    templateSheetName = row[RACES_COL_TEMPLATE];
    srcSheet = exports.openSheet(templateSS, templateSheetName);
    if (templateSheetName && srcSheet === null) {
      throw 'Sheet ' + templateSheetName + ' not found';
    }
    var srcRange = srcSheet ? srcSheet.getRange(1, 1, srcSheet.getLastRow(), srcSheet.getLastColumn()) : null;
    var dstSheet = srcSheet ? srcSheet.copyTo(ss).setName(row[RACES_COL_NAME]) : ss.insertSheet(row[RACES_COL_NAME], i);
    if (row[RACES_COL_HIDDEN] === 1 || row[RACES_COL_HIDDEN] === true) {
      dstSheet.hideSheet();
    }
    if (srcRange && row[RACES_COL_TYPE] === RACE_TYPE_TABLE) {
      var dstRange = dstSheet.getRange(1, 1, srcSheet.getLastRow(), srcSheet.getLastColumn());
      var formulas = srcRange.getFormulas().map(function(rowFormulas) {
        return rowFormulas.map(function (formula) {
          return formula ? formula.replace(templateSheetName, row[RACES_COL_NAME]) : formula;
        });
      });
      if (formulas.length > 0) {
        dstRange.setFormulas(formulas);
      }
      // Re-set headers after setting formulas
      dstSheet.getRange(1, 1, 1, srcSheet.getLastColumn()).setValues(srcSheet.getRange(1, 1, 1, srcSheet.getLastColumn()).getValues());

      if (row[RACES_COL_NUM_RANGE]) {
        var numRange = _createNumberValues(row[RACES_COL_NUM_RANGE], row[RACES_COL_CREW_SIZE]);
        dstSheet.getRange(2, 1, numRange.length, 1).setValues(numRange);
      }
    }
  }
};

var orderSheetsBasedOnTemplate = function orderSheetsBasedOnTemplate(rows, templateSS, ss) {
  var row, currentSheet;
  // Name, TemplateSheet, Hidden, StartOrder, CrewSize, NumRange
  for (var i = 0; i<rows.length; i++) {
    row = rows[i];
    currentSheet = ss.getSheetByName(row[RACES_COL_NAME]);
    ss.setActiveSheet(currentSheet);
    if (row[RACES_COL_INDEX]) {
      ss.moveActiveSheet(row[RACES_COL_INDEX]);
    }
  }
  ss.setActiveSheet(ss.getSheets()[0]);
};

var updateSheetFormulasAndValidation = function updateSheetFormulasAndValidation(sheet) {
  var lastCol = sheet.getDataRange().getLastColumn(), lastRow = sheet.getDataRange().getLastRow();
  var range = sheet.getRange(1, 1, lastRow, lastCol);
  var formulas = range.getFormulas();
  var contents = range.getValues();
  var dataValidations = range.getDataValidations();
  var rangeWidth = range.getWidth(), rangeHeight = range.getHeight();
  for (var r = 0; r < rangeHeight; r++) {
    for (var c = 0; c < rangeWidth; c++) {
      if (formulas[r][c].length > 1) {
        contents[r][c] = formulas[r][c];
      }
    }
  }
  range.clearContent().clearDataValidations().setValues(contents).setDataValidations(dataValidations);
};

var updateAllSheetFormulas = function updateAllSheetFormulas(rows, ss) {
  var currentSheet;
  for (var i = 0; i<rows.length; i++) {
    currentSheet = ss.getSheetByName(rows[i][RACES_COL_NAME]);
    updateSheetFormulasAndValidation(currentSheet);
  }
};

exports.createFromTemplate = function createFromTemplate(templateSS, ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  var rows = _getTemplateSheets(templateSS);
  createSheetsFromTemplate(rows, templateSS, ss);
  updateAllSheetFormulas(rows, ss);
  orderSheetsBasedOnTemplate(rows, templateSS, ss);
};