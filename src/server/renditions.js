var crewSheets = require('./crew-sheets');
var drive = require('./drive');
var racing = require('./racing');
var tables = require('./tables');

var SHEET_FONT_FAMILY = 'Courier';
var RENDITION_SOURCE_PROP_NAME = 'renditionSourceId';
var RENDITION_TYPE_PROP_NAME = 'renditionType';

function removeAllSheets(ss) {
  ss.insertSheet('Temp' + Math.floor(Date.now() / 1000), 0);
  var oldSheets = ss.getSheets();
  for (var i = 1; i < oldSheets.length; i++) {
    ss.deleteSheet(oldSheets[i]);
  }
}

function copyVisibleRacingSheets(sourceSS, destSS) {
  var srcSheets = racing.getRaceSheets(sourceSS);
  for (var i=0; i<srcSheets.length; i++) {
    if (srcSheets[i].isSheetHidden()) {
      continue;
    }
    destSS.insertSheet(srcSheets[i].getName());
  }
}

function entryHasContent(entryRows) {
  return !entryRows.every(function(row) {
    return Object.keys(row).every(function(propName) {
      return propName === 'Number' || row[propName] === '' || row[propName] === false || row[propName] === null;
    });
  });
}

function getSheetRenditions(ss, type) {
  var propValues = {};
  propValues[RENDITION_SOURCE_PROP_NAME] = ss.getId();
  if (type !== undefined && type !== null && type !== '') {
    propValues[RENDITION_TYPE_PROP_NAME] = type;
  }
  return drive.searchByCustomProperty(propValues);
}

function getRenditionByName(ss, renditionType) {
  var renditionId = drive.getPublicProperty(ss.getId(), renditionType + 'Id', null).value, renditionSS = null;
  if (renditionId !== null) {
    renditionSS = SpreadsheetApp.openById(renditionId);
  }
  return renditionSS;
}

function createRendition(ss, renditionType, spreadsheetName) {
  var newss = SpreadsheetApp.create(spreadsheetName);
  drive.savePublicProperty(ss.getId(), renditionType + 'Id', newss.getId());
  drive.savePublicProperty(newss.getId(), RENDITION_SOURCE_PROP_NAME, ss.getId());
  drive.savePublicProperty(newss.getId(), RENDITION_TYPE_PROP_NAME, renditionType);
  return newss;
}

function getOrCreateRendition(ss, renditionType, spreadsheetName) {
  var newss = getRenditionByName(ss, renditionType);
  if (newss === null) {
    newss = createRendition(ss, renditionType, spreadsheetName);
  }
  return newss;
}

function formatEntrySheet(sheet) {
  // TODO Copy number formats, fonts, BG colours from source ranges
  sheet.getDataRange().setFontFamily(SHEET_FONT_FAMILY);
  sheet.getRange(1, 1, 1, sheet.getLastColumn())
    .setBorder(true, true, true, true, true, true)
    .setFontWeight('bold').setBackground('#ccffff'); // 1st row
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow()-1, 1).setBorder(null, null, null, true, null, null)
      .setFontWeight('bold')
      .setBackground('#ffff99'); // border right of 1st col, yellow BG
  }
}

function copyFrozenRows(srcSheet, dstSheet) {
  dstSheet.setFrozenRows(srcSheet.getFrozenRows());
}

function copyColumnWidths(srcSheet, dstSheet, columnNames) {
  var srcHeaders = tables.getHeaders(srcSheet), srcPos, destPos;
  columnNames.forEach(function(columnName, index) {
    srcPos = srcHeaders.indexOf(columnName) + 1;
    destPos = index + 1;
    if (srcPos > 0) {
      dstSheet.setColumnWidth(destPos, srcSheet.getColumnWidth(srcPos));
    }
  });
  dstSheet.setFrozenRows(srcSheet.getFrozenRows());
}

function copyRenditionSheetValues(entries, destSheet, columnNames, sortColumn, truncateEmpty) {
  // set column headings
  destSheet.getRange(1, 1, 1, columnNames.length).setValues([columnNames]);
  // get rows
  if (truncateEmpty === true) {
    entries = entries.filter(entryHasContent);
  }
  var sortByFirstElementPropertyIntegerValue =
    function(a,b) {return (parseInt(a[0][sortColumn])||999) - (parseInt(b[0][sortColumn])||999);};
  // Sort entries
  if (sortColumn !== null) {
    entries.sort(sortByFirstElementPropertyIntegerValue); // Sort by position, ascending then blanks (non-finishers)
  }
  var sortedRows = entries.reduce(function(accumulator, currentValue) {
    return accumulator.concat(currentValue);
  }, []);
  tables.setRangeValues(destSheet, sortedRows, 2);
}

function copyRacingSheetsIntoRendition(ss, destSS, columnNames, sortColumn, truncateEmpty) {

  var srcSheet, destSheet, srcRows;
  removeAllSheets(destSS);
  copyVisibleRacingSheets(ss, destSS);
  // Finally remove the first sheet (we need this as we're not allowed to delete all sheets up-front)
  destSS.deleteSheet(destSS.getSheets()[0]);
  var destSheets = destSS.getSheets();
  for (var i = 0; i < destSheets.length; i++) {
    destSheet = destSheets[i];
    srcSheet = ss.getSheetByName(destSheet.getName());
    if (srcSheet === null) {
      throw 'Source sheet ' + destSheet.getName() + ' not found';
    }
    srcRows = tables.getRows(srcSheet);
    copyRenditionSheetValues(crewSheets.groupRows(srcRows, 'Number'), destSheet, columnNames, sortColumn,
      truncateEmpty);
    formatEntrySheet(destSheet);
    copyColumnWidths(srcSheet, destSheet, columnNames);
    copyFrozenRows(srcSheet, destSheet);
  }
  return destSS;
}

function createGroupSheetsInRendition(ss, destSS, groupColumnName, columnNames, sortColumn) {
  var destSheet;
  removeAllSheets(destSS);
  var allCrews = getAllRaceCrews(ss);
  // TODO If Set column used, look up labels for sets
  var crewsByClub = groupCrewsByColumnValue(allCrews, groupColumnName);
  for (var clubName in crewsByClub) {
    if (crewsByClub.hasOwnProperty(clubName)) {
      destSheet = destSS.insertSheet(clubName);
      copyRenditionSheetValues(crewsByClub[clubName], destSheet, columnNames, sortColumn, false);
      formatEntrySheet(destSheet);
      destSheet.setFrozenRows(1);
    }
  }
  // Finally remove the first sheet (we need this as we're not allowed to delete all sheets up-front)
  destSS.deleteSheet(destSS.getSheets()[0]);
  return destSS;
}

function getAllRaceCrews(sourceSS) {
  var allCrews = [], srcRows;
  var srcSheets = racing.getRaceSheets(sourceSS);
  for (var i=0; i<srcSheets.length; i++) {
    if (srcSheets[i].isSheetHidden()) {
      continue;
    }
    srcRows = tables.getRows(srcSheets[i]);
    allCrews = allCrews.concat(crewSheets.groupRows(srcRows, 'Number'));
  }
  return allCrews;
}

function groupCrewsByColumnValue(crewList, columnName) {
  var crew, groupedCrews = {}, crewGroup;
  var columnValues;
  for (var i=0; i<crewList.length; i++) {
    crew = crewList[i];
    columnValues = crew.map(function(crewMember) {
      return crewMember[columnName];
    })
      .filter(function(columnValue, index, columnValues) { // unique non-empty values only
        return columnValue && columnValues.indexOf(columnValue) === index;
      });
    columnValues.forEach(function(columnValue) {
      crewGroup = groupedCrews[columnValue] || [];
      crewGroup.push(crew);
      groupedCrews[columnValue] = crewGroup;
    });
  }
  return groupedCrews;
}

module.exports = {
  getOrCreate: getOrCreateRendition,
  create: createRendition,
  list: getSheetRenditions,
  createGroupSheets: createGroupSheetsInRendition,
  createRaceSheets: copyRacingSheetsIntoRendition
};