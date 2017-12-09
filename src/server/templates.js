var tables = require('./tables');

var RACES_SHEET_NAME = 'Races';
var RACES_COL_NAME = 'Name';
var RACES_COL_TEMPLATE = 'TemplateSheet';
var RACES_COL_HIDDEN = 'Hidden';
var RACES_COL_CREW_SIZE = 'CrewSize';
var RACES_COL_NUM_RANGE = 'NumRange';

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

exports.createFromTemplate = function createFromTemplate(templateSS, ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  var rows = tables.getRows(templateSS.getSheetByName(RACES_SHEET_NAME)), row;
  // Name, TemplateSheet, Hidden, StartOrder, CrewSize, NumRange
  for (var i = 0; i<rows.length; i++) {
    row = rows[i];
    var srcSheet = row[RACES_COL_TEMPLATE] ? templateSS.getSheetByName(row[RACES_COL_TEMPLATE]) : null, srcRange = srcSheet ? srcSheet.getRange(1, 1, srcSheet.getLastRow(), srcSheet.getLastColumn()) : null;
    //var dstSheet = ss.insertSheet(row[RACES_COL_NAME], i), dstRange = dstSheet.getRange(1, 1, srcSheet.getLastRow(), srcSheet.getLastColumn());
    var dstSheet = srcSheet ? srcSheet.copyTo(ss).setName(row[RACES_COL_NAME]) : ss.insertSheet(row[RACES_COL_NAME], i);
    if (row[RACES_COL_HIDDEN] === 1) {
      dstSheet.hideSheet();
    }
    if (srcRange) {
      var dstRange = dstSheet.getRange(1, 1, srcSheet.getLastRow(), srcSheet.getLastColumn());
      var formulas = srcRange.getFormulas().map(function(rowFormulas) {
          return rowFormulas.map(function (formula) {
            return formula ? formula.replace(row[RACES_COL_TEMPLATE], row[RACES_COL_NAME]) : formula;
          });
      });
      dstRange.setFormulas(formulas);
      // Re-set headers after setting formulas
      dstSheet.getRange(1, 1, 1, srcSheet.getLastColumn()).setValues(srcSheet.getRange(1, 1, 1, srcSheet.getLastColumn()).getValues());
    }
    if (row[RACES_COL_NUM_RANGE]) {
      var numRange = _createNumberValues(row[RACES_COL_NUM_RANGE], row[RACES_COL_CREW_SIZE]);
      Logger.log(numRange);
      dstSheet.getRange(2, 1, numRange.length, 1).setValues(numRange);
      Logger.log(numRange);
    }
  }
};