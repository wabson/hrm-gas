var tables = require('./tables');

var ENTRY_SETS_SHEET_NAME = 'Entry Sets';
var ENTRY_SETS_COLUMNS =
  ['ID', 'Label', 'Name', 'Club', 'Email', 'Phone', 'Team Leader?', 'Entered', 'Due', 'Paid', 'Added'];
var MAX_AUTO_ID = 999;

function generateId(ss) {
  return getNextId(getOrCreateEntrySetsSheet(ss));
}

function getNextId(entrySetsSheet) {
  /* jshint sub:true */
  var rows = tables.getRows(entrySetsSheet);
  var setIds = rows.map(function(entry) { return entry['ID']; });
  var indexId = 1;
  while(setIds.indexOf(indexId) > -1 && indexId < MAX_AUTO_ID) {
    indexId ++;
  }
  return indexId;
}

function getOrCreateEntrySetsSheet(ss) {
  var entrySetsSheet = ss.getSheetByName(ENTRY_SETS_SHEET_NAME);
  if (entrySetsSheet === null) {
    entrySetsSheet = ss.insertSheet(ENTRY_SETS_SHEET_NAME, ss.getNumSheets());
    entrySetsSheet.getRange(1, 1, 1, ENTRY_SETS_COLUMNS.length).setValues([ENTRY_SETS_COLUMNS]);
  }
  return entrySetsSheet;
}

function addEntrySets(ss, entrySets) {
  /* jshint sub:true */
  var added = new Date();
  var entrySetsSheet = getOrCreateEntrySetsSheet(ss);
  if (entrySetsSheet.getLastRow() === 1 && entrySetsSheet.getLastColumn() === 1) {
    entrySetsSheet.getRange(1, 1, 1, ENTRY_SETS_COLUMNS.length).setValues([ ENTRY_SETS_COLUMNS ]);
  }
  entrySets.forEach(function(entrySet) {
    if (!entrySet.hasOwnProperty('ID')) {
      entrySet['ID'] = getNextId(entrySetsSheet);
    }
    if (!entrySet.hasOwnProperty('Added')) {
      entrySet['Added'] = added;
    }
  });
  tables.setRangeValues(entrySetsSheet, entrySets, entrySetsSheet.getLastRow() + 1);
}

exports.addEntrySets = addEntrySets;
exports.generateId = generateId;