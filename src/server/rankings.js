var tables = require('./tables');

var rankingsSheetName = "Rankings";
var NUMBER_FORMAT_DATE = "dd/MM/yyyy";

/**
 * Rankings sheet column names
 */
var rankingsSheetColumnNames = ["Surname", "First name", "Club", "Class", "BCU Number", "Expiry", "Division"];

var ListUtils = {
  trim: function(input) {
    var output = input.slice();
    while (output.length > 0 && (output[output.length - 1] === '' || output[output.length - 1] === null)) {
      output.pop();
    }
    return output;
  }
};

function loadRankingsPage_() {
  var pageResp = UrlFetchApp.fetch('http://canoeracing.org.uk/marathon/index.php/latest-marathon-ranking-list/');
  return pageResp.getContentText().replace('&nbsp;', ' ');
}

function getMonthNumber_(monthName) {
  var monthsFull = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'],
    monthsAbbr = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
    match = monthsFull.indexOf(monthName.toLowerCase());
  if (match == -1) {
    match = monthsAbbr.indexOf(monthName.toLowerCase());
  }
  return match;
}

function getRankingsWebsiteLastUpdated_() {
  var pageSrc = loadRankingsPage_(),
    reMatch = /UPDATED?\s+(\d+)[\s\/-]+(\w+)[\s\/-]+(\d{4})/i.exec(pageSrc);
  if (reMatch) {
    Logger.log(reMatch[0]);
    var year = parseInt(reMatch[3]), month = getMonthNumber_(reMatch[2]), day = parseInt(reMatch[1]);
    if (month > -1) {
      return new Date(year, month, day, 0, 0, 0);
    }
  } else {
    Logger.log('No match');
  }
  return null;
}

/**
 * Load current Hasler Rankings from the latest Excel file on the marathon web site
 */
function loadRankingsXLS(ss) {
  var pageSrc = loadRankingsPage_(),
    reMatch = /<a href="([\w\/\-_:\.]+.xlsx?)"[\w_\s="]*>RankingList<\/a>/ig.exec(pageSrc);
  if (!reMatch) {
    throw("Ranking list URL not found");
  }
  var rankingListUrl = reMatch[1], fileName = rankingListUrl.substr(rankingListUrl.lastIndexOf("/") + 1), response = UrlFetchApp.fetch(rankingListUrl);
  if (response.getResponseCode() == 200) {
    var file = {
      title: fileName
    };
    var driveFile = Drive.Files.insert(file, response.getBlob(), {
      convert: true
    });
    loadRankingsSheet_(SpreadsheetApp.openById(driveFile.id), ss);
    DriveApp.removeFile(DriveApp.getFileById(driveFile.id));
  } else {
    throw "An error was encountered loading the rankings spreadsheet (code: " + response.getResponseCode() + ")";
  }
}

function loadRankingsSheet_(sourceSS, ss, clubName) {
  // Locate Rankings sheet or create it if it doesn't already exist
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(rankingsSheetName) || ss.insertSheet(rankingsSheetName, ss.getSheets().length),
    sourceSheet = sourceSS.getSheetByName(rankingsSheetName) || sourceSS.getActiveSheet(),
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
      numberFormats[0][sourceWidth-1] = NUMBER_FORMAT_DATE;
      headerRange.setNumberFormats(numberFormats);
    }

    var srcRows = tables.getRows(sourceSheet);
    Logger.log(Utilities.formatString("Found %d total rankings", srcRows.length));
    if (clubName) {
      Logger.log(Utilities.formatString("Filtering by club name '%s'", clubName));
      srcRows = srcRows.filter(function(val) { return val["Club"] == clubName; });
    }
    tables.appendRows(sheet, srcRows);
    // Set expiration date formats (column F)
    var expiryColPos = headers.indexOf("Expiry");
    if (expiryColPos > -1) {
      sheet.getRange(2, expiryColPos + 1, sourceHeight-1, 1).setNumberFormat(NUMBER_FORMAT_DATE);
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
    var rowValues = ListUtils.trim(rankingsSheet.getRange(1, 1, 1, lastColumn).getValues()[0]),
      lastValue = rowValues[rowValues.length-1];
    Logger.log(rowValues);
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

/**
 * Clear all Hasler rankings in the current spreadsheet
 */
function clearRankings_(ss, addColumns) {
  addColumns = (addColumns !== undefined) ? addColumns : true;
  // Locate Rankings sheet or create it if it doesn't already exist
  var sheet = (ss || SpreadsheetApp.getActiveSpreadsheet()).getSheetByName(rankingsSheetName);
  if (!sheet) {
    throw "Could not find Rankings sheet";
  }
  sheet.clear();
  if (addColumns === true) {
    sheet.appendRow(rankingsSheetColumnNames);
  }
}

function clearRankingsIfSheetExists_(ss, addColumns) {
  var sheet = ss || SpreadsheetApp.getActiveSpreadsheet().getSheetByName(rankingsSheetName);
  if (sheet !== null) {
    clearRankings_(ss, addColumns);
  }
}

exports.getRankingsWebsiteLastUpdated = getRankingsWebsiteLastUpdated_;
exports.loadRankingsXLS = loadRankingsXLS;
exports.getRankingsLastUpdated = getRankingsLastUpdated_;
exports.getNumRankings = getNumRankings_;
exports.clearRankingsIfSheetExists = clearRankingsIfSheetExists_;
exports.COLUMN_NAMES = rankingsSheetColumnNames;