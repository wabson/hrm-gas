var tables = require('./tables');
var templates = require('./templates');

var RANKINGS_SHEET_NAME = 'Rankings';
var NUMBER_FORMAT_DATE = 'dd/MM/yyyy';
var RACES_COL_TEMPLATE = 'TemplateSheet';

var listTrim = function(input) {
  var output = input.slice();
  while (output.length > 0 && (output[output.length - 1] === '' || output[output.length - 1] === null)) {
    output.pop();
  }
  return output;
};

function getRankingsTemplateSheetLastUpdated(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  var rankingsTemplateSheet = templates.getTemplateSheetByName(ss, RANKINGS_SHEET_NAME);
  try {
    if (rankingsTemplateSheet !== null) {
      var rankingsSheet = templates.openSheet(ss, rankingsTemplateSheet[RACES_COL_TEMPLATE]);
      if (rankingsSheet) {
        return getRankingsLastUpdated_(rankingsSheet);
      }
    }
  } catch (e) {
    // Races sheet may not be present
  }
  return null;
}

function getRankingsSheetLastUpdated(spreadsheet) {
  var rankingsSheet = spreadsheet.getSheetByName(RANKINGS_SHEET_NAME);
  return rankingsSheet ? getRankingsLastUpdated_(rankingsSheet) : null;
}

function loadRankingsFromTemplate(ss, clubName) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  var rankingsSheet = templates.getTemplateSheetByName(ss, RANKINGS_SHEET_NAME);
  try {
    if (rankingsSheet !== null) {
      loadRankingsSheet(templates.openSheet(ss, rankingsSheet[RACES_COL_TEMPLATE]), ss, clubName);
    } else {
      Logger.log('No rankings sheet was found in the index');
    }
  } catch (e) {
    Logger.log(e);
    // Races sheet may not be present
  }
}

function loadRankingsSheet(sourceSheet, ss, clubName) {
  // Locate Rankings sheet or create it if it doesn't already exist
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(RANKINGS_SHEET_NAME) || ss.insertSheet(RANKINGS_SHEET_NAME, ss.getSheets().length),
    sourceRange = sourceSheet.getDataRange(), sourceWidth = sourceRange.getWidth(),
    sourceHeight = sourceRange.getHeight(), sourceHeaderRange = sourceSheet.getRange(1, 1, 1, sourceWidth);

  if (sourceHeight > 0)
  {
    var sourceRow1 = sourceHeaderRange.getValues()[0],
      headerRange = sheet.getRange(1, 1, 1, sourceWidth), headers = tables.getHeaders(sheet);

    if (!(headers && headers.length > 0)) {
      // Copy header names from the source sheet
      headers = tables.getHeaders(sourceSheet);
      headerRange.setValues(sourceHeaderRange.getValues());
      // Set header row format
      headerRange.setBackgrounds(sourceHeaderRange.getBackgrounds());
      headerRange.setHorizontalAlignments(sourceHeaderRange.getHorizontalAlignments());
    }

    var lastUpdated = setRankingsLastUpdated_(sheet, headers, sourceRow1);
    if (lastUpdated) {
      var numberFormats = sourceHeaderRange.getNumberFormats();
      // Override date number format as it does not seem to get applied correctly
      numberFormats[0][sourceWidth - 1] = NUMBER_FORMAT_DATE;
      headerRange.setNumberFormats(numberFormats);
    }

    var srcRows = tables.getRows(sourceSheet);
    Logger.log(Utilities.formatString("Found %d total rankings", srcRows.length));
    if (clubName) {
      Logger.log(Utilities.formatString("Filtering by club name '%s'", clubName));
      srcRows = srcRows.filter(function (val) {
        return val["Club"] == clubName;
      });
    }
    tables.appendRows(sheet, srcRows);
    // Set expiration date formats (column F)
    var expiryColPos = headers.indexOf("Expiry");
    if (expiryColPos > -1) {
      sheet.getRange(2, expiryColPos + 1, sourceHeight - 1, 1).setNumberFormat(NUMBER_FORMAT_DATE);
    }
  }
}

function cellValueIsDate_(value) {
  return value instanceof Date || typeof value == 'number';
}

function cellDateValue_(value) {
  if (value instanceof Date) {
    return value;
  } else if (typeof value == 'number') {
    var dateVal = new Date(1899, 11, 30, 0, 0, 0);
    dateVal.setDate(dateVal.getDate() + value);
    return dateVal;
  }
  throw 'Not a valid date type';
}

function getRankingsLastUpdated_(rankingsSheet) {
  var lastRow = rankingsSheet.getLastRow(), lastColumn = rankingsSheet.getLastColumn();
  if (lastRow > 0 && lastColumn > 0) {
    var rowValues = listTrim(rankingsSheet.getRange(1, 1, 1, lastColumn).getValues()[0]),
      lastValue = rowValues[rowValues.length-1];
    Logger.log('Found candidate last updated value ' + lastValue);
    if (cellValueIsDate_(lastValue)) {
      return cellDateValue_(lastValue);
    }
  }
  return null;
}

function getNumRankings_(rankingsSheet) {
  return Math.max(rankingsSheet.getLastRow() - 1, 0);
}

function setRankingsLastUpdated_(rankingsSheet, headers, sourceRowValues) {
  if (sourceRowValues.length > 0) {
    var lastValue = sourceRowValues[sourceRowValues.length-1], headerRow = headers.slice();
    if (cellValueIsDate_(lastValue)) {
      headerRow.push(lastValue);
      rankingsSheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);
      return lastValue;
    }
  }
  return null;
}

function clearRankingsIfSheetExists_(ss) {
  var sheet = (ss || SpreadsheetApp.getActiveSpreadsheet()).getSheetByName(RANKINGS_SHEET_NAME);
  if (sheet !== null) {
    sheet.clear();
  }
}

/**
 * Search for rows matching a specific search term and return matching rows
 *
 * @param sheet {Sheet} The sheet to search within
 * @param columns {array<object{name, regexp}>}
 * @param useOr {Boolean} True if only one column in a row must match the term for a match, otherwise all columns must match
 * @return {Object[]} Set of matching rows
 * @private
 */
function searchSheetData_(sheet, columns, useOr) {
  var rows = tables.getRows(sheet, false);
  return tables.lookupInTable(rows, columns, useOr);
}

/**
 * Search for rankings matching a specific term
 *
 * @param spreadsheet {Spreadsheet} Spreadsheet in which to locate the rankings sheet
 * @param term {String} Search term to look for via start-of-item or regexp (if supplied in columns array)
 * @private
 */
function searchRankings(spreadsheet, term) {
  var sheet = spreadsheet.getSheetByName('Rankings');
  return searchSheetData_(sheet, [
    { name: 'First name', type: 'regexp', value: new RegExp('^' + term, 'i') },
    { name: 'Surname', type: 'regexp', value: new RegExp('^' + term, 'i') },
    { name: 'BCU Number', type: 'regexp', value: new RegExp('^\\s*[A-Z]*\\/?(' + term + ')\\/?[A-Z]*\\s*$', 'i') }
  ], true);
}

exports.getRankingsTemplateSheetLastUpdated = getRankingsTemplateSheetLastUpdated;
exports.loadRankingsFromTemplate = loadRankingsFromTemplate;
exports.getRankingsSheetLastUpdated = getRankingsSheetLastUpdated;
exports.getNumRankings = getNumRankings_;
exports.clearRankingsIfSheetExists = clearRankingsIfSheetExists_;
exports.searchRankings = searchRankings;