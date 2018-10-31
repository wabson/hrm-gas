var formats = require('./dateformat');
var tables = require('./tables');

var EXTRA_SHEETS_HASLER = ['Starts', 'Finishes', 'Rankings', 'Clubs', 'Results', 'PandD', 'Summary'];
var EXTRA_SHEETS_NON_HASLER = ['Starts', 'Finishes', 'Rankings', 'Clubs', 'Results', 'Summary'];
var EXTRA_SHEETS_NATIONALS = ['Starts', 'Finishes', 'Rankings', 'Clubs', 'Divisional Results', 'Singles Results', 'Doubles Results', 'Summary'];

exports.getRaceResultsFromSpreadsheet = function getRaceResultsFromSpreadsheet(sheetRows) {
  var results = [], lastbn = 0;
  for (var j=0; j<sheetRows.length; j++) {
    var row = sheetRows[j];
    if (parseInt(row['Number']) && row['Surname'] === "") {
      break;
    }
    var bn = row['Number'],
      name = "" + row['First name'] + " " + row['Surname'],
      club = "" + row['Club'],
      raceClass = "" + row['Class'],
      div = "" + row['Div'],
      time = formats.formatTime(row['Elapsed']),
      timePenalty = formats.formatTimeAbs(row['Time+/-']),
      startTime = formats.formatTime(row['Start']),
      finishTime = formats.formatTime(row['Finish']),
      points = row['Points'],
      pd = row['P/D'],
      notes = row['Notes'],
      setId = +(row['Set'] || 0);
    if (name.trim() !== "") {
      if (bn) {
        //if (time) {
        results.push({num: bn, posn: row['Posn'], names: [name], clubs: [club], classes: [raceClass], divs: [div], time: time, timePenalty: timePenalty, startTime: startTime, finishTime: finishTime, points: [points], pd: [pd], notes: [notes], setId: setId });
        //}
      } else if (results.length > 0) {
        var last = results.pop();
        if (lastbn !== 0 && lastbn == last.num) { // Check it is the same boat as we may have skipped some if missing a time
          last.names.push(name);
          last.clubs.push(club);
          last.classes.push(raceClass);
          last.divs.push(div);
          last.points.push(points);
          last.pd.push(pd);
          last.notes.push(notes);
        }
        results.push(last);
      }
    }
    lastbn = bn;
  }
  results.sort(sortResults);
  return results;
};

function getRaceStartersFromSpreadsheet(ss) {
  var entries = getRaceEntriesFromSpreadsheet(ss);
  for (var i = 0; i < entries.races.length; i++) {
    entries.races[i].results = entries.races[i].results.filter(function(val, index, arr) { return val.startTime.toLowerCase() != 'dns'; });
  }
  return entries;
}

exports.getRaceStartersFromSpreadsheet = getRaceStartersFromSpreadsheet;

exports.getRaceEntriesFromSpreadsheet = function getRaceEntriesFromSpreadsheet(ss, raceDateStr) {
  var data = {}, classes = [],
    sheets = getRaceSheets(ss);

  for (var i=0; i<sheets.length; i++) {
    classes.push({name: sheets[i].getName(), results: getRaceEntriesFromSheet(sheets[i], raceDateStr) });
  }
  data.races = classes;
  data.lastUpdated = getLastUpdated(ss.getId());
  return data;
};

function getRaceEntriesFromSheet(sheet, raceDateStr) {
  var results = [], rows = tables.getRows(sheet);
  var raceDate = raceDateStr ? formats.parseDate(raceDateStr) : new Date();
  for (var j=0; j<rows.length; j++) {
    var row = rows[j];
    if (parseInt(row['Number']) && row['Surname'] === "") {
      break;
    }
    var name = "" + row['First name'] + " " + row['Surname'],
      num = "" + row['Number'],
      bcuNum = "" + row['BCU Number'],
      expiry = "" + formats.formatDate(row['Expiry']),
      expired = row['Expiry'] === '' || row['Expiry'] < raceDate,
      club = "" + row['Club'],
      raceClass = "" + row['Class'],
      div = "" + row['Div'],
      due = "" + row['Due'],
      paid = "" + row['Paid'],
      startTime = "" + row['Start'];
    if (name.trim() !== "") {
      if (row['Number']) {
        results.push({ num: num, names: [name], bcuNum: [bcuNum], expiry: [expiry], expired: [expired], clubs: [club], classes: [raceClass], divs: [div], paid: [paid], due: [due], startTime: startTime });
      } else {
        var last = results.pop();
        last.names.push(name);
        last.bcuNum.push(bcuNum);
        last.expiry.push(expiry);
        last.expired.push(expired);
        last.clubs.push(club);
        last.classes.push(raceClass);
        last.divs.push(div);
        last.paid.push(paid);
        last.due.push(due);
        results.push(last);
      }
    }
  }
  return results;
}

exports.getRaceEntriesFromSheet = getRaceEntriesFromSheet;

/**
 * Comparison function to sort the result objects by time taken
 *
 * @param {object} r1 First item
 * @param {object} r2 Second item
 * @return {int} -1, 1 or zero depending on comparison result
 */
function sortResults(r1, r2) {
  var t1 = r1.time, t2 = r2.time;
  if (typeof t1.getTime == "function") {
    t1 = t1.getTime();
  }
  if (typeof t2.getTime == "function") {
    t2 = t2.getTime();
  }
  if (typeof t1 == "number" && typeof t2 == "number" ||
    typeof t1 == "string" && typeof t2 == "string")
  {
    if (t1 < t2) {
      return -1;
    } else if (t1 > t2) {
      return 1;
    } else {
      return 0;
    }
  }
  else if (typeof t1 == "number" && typeof t2 == "string")
  {
    return -1;
  }
  else if (typeof t1 == "string" && typeof t2 == "number")
  {
    return 1;
  }
}

/**
 * Look at the tabs of the workbook and return the named races as an array of Strings
 */
function getRaceSheets(spreadsheet) {
  var namesFromIndex = getRaceSheetNamesFromIndex(spreadsheet);
  if (namesFromIndex !== null) {
    return namesFromIndex.map(function(sheetName) {
      return spreadsheet.getSheetByName(sheetName);
    });
  }
  var sheets = (spreadsheet || SpreadsheetApp.getActiveSpreadsheet()).getSheets(), raceSheets = [], sheet, sheetName;
  for (var i=0; i<sheets.length; i++) {
    sheet = sheets[i];
    sheetName = sheet.getName();
    if (EXTRA_SHEETS_HASLER.indexOf(sheetName) > -1 || EXTRA_SHEETS_NATIONALS.indexOf(sheetName) > -1 || EXTRA_SHEETS_NON_HASLER.indexOf(sheetName) > -1 ) {
      break;
    }
    raceSheets.push(sheet);
  }
  return raceSheets;
}

function getRaceSheetNamesFromIndex(ss) {
  var racesSheet = ss.getSheetByName('Index');
  if (racesSheet !== null) {
    return tables.getRows(racesSheet).filter(function(row) {
      return row['Type'] === 'Table';
    }).map(function(row) {
      return row['Name'];
    });
  } else {
    return null;
  }
}

/**
 * Look at the tabs of the workbook and return the named races as an array of Strings
 */
function getRaceSheetNames(spreadsheet, includeHidden) {
  includeHidden = typeof includeHidden != "undefined" ? includeHidden : false;
  var sheets = getRaceSheets(spreadsheet), sheetNames = [];
  for (var i=0; i<sheets.length; i++) {
    if (includeHidden === true || !sheets[i].isSheetHidden()) {
      sheetNames.push(sheets[i].getName());
    }
  }
  return sheetNames;
}

/**
 * Look at the sheets in the workbook and return the named races as an array of Strings (values will be without the 'Div' prefix)
 */
function getRaceNames(spreadsheet) {
  var sheetNames = getRaceSheetNames(spreadsheet), raceNames = [];
  for (var i=0; i<sheetNames.length; i++) {
    raceNames.push(sheetNames[i].replace("Div", ""));
  }
  return raceNames;
}

exports.getRaceSheets = getRaceSheets;
exports.getRaceSheetNames = getRaceSheetNames;
exports.getRaceNames = getRaceNames;