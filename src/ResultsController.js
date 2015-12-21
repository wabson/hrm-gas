var rankingsSheetName = "Rankings";
var ENTRIES_HTML_FILENAME_TMPL = "%s Entries";
var ENTRIES_SS_FILENAME_TMPL = "%s Printable Entries";
var RESULTS_HTML_FILENAME_TMPL = "%s Results";
var RESULTS_SS_FILENAME_TMPL = "%s Printable Results";

/**
 * Respond to a browser request
 *
 * @param {object} e Event information
 */
function doGet(e) {
  var key = e.parameter.key, action = e.parameter.show || "links";
  if (key) {
    switch (action) {
      case "results":
        return printResults(e);
      case "entries":
        return printResults(e);
      case "starters":
        return printResults(e);
      case "links":
        return printResults(e);
      default:
        throw "Unsupported action " + action;
    }
  } else {
    return listFiles(e);
  }
}

/**
 * Print results summary
 *
 * @param {object} e Event information
 */
function saveResultsHTML(scriptProps) {
  var template = HtmlService.createTemplateFromFile('ResultsStatic');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var title = ss.getName();
  template.showNotes = false;
  template.title = title;
  var data = getResultsFromSpreadsheet(ss);
  for (var k in data) {
    template[k] = data[k];
    template.isHaslerFinal = scriptProps.haslerRegion == "HF";
  }
  var outputHtml = template.evaluate().getContent();
  var htmlFile = scriptProps.publishedResultsId ? DriveApp.getFileById(scriptProps.publishedResultsId) : DriveApp.createFile(Utilities.formatString(RESULTS_HTML_FILENAME_TMPL, title), outputHtml, MimeType.HTML);
  if (scriptProps.publishedResultsId) {
    htmlFile.setContent(outputHtml);
  }
  htmlFile.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
  showLinkDialog('Publish HTML',
    "<p>Race results published to Google Drive:</p>",
    "https://googledrive.com/host/" + htmlFile.getId()
  );
  return {fileId: htmlFile.getId()};
}

/**
 * Print entries summary
 */
function saveEntriesHTML(scriptProps) {
  var template = HtmlService.createTemplateFromFile('EntriesStatic');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var title = ss.getName();
  template.title = title;
  var data = getRaceEntriesFromSpreadsheet(ss, scriptProps.raceDate);
  for (var k in data) {
    template[k] = data[k];
  }
  var outputHtml = template.evaluate().getContent();
  var htmlFile = scriptProps.publishedEntriesId ? DriveApp.getFileById(scriptProps.publishedEntriesId) : DriveApp.createFile(Utilities.formatString(ENTRIES_HTML_FILENAME_TMPL, title), outputHtml, MimeType.HTML);
  if (scriptProps.publishedEntriesId) {
    htmlFile.setContent(outputHtml);
  }
  htmlFile.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
  showLinkDialog('Publish HTML',
    "<p>Race entries published to Google Drive:</p>",
    "https://googledrive.com/host/" + htmlFile.getId()
  );
  return {fileId: htmlFile.getId()};
}

/**
 * List HRM files
 *
 * @param {object} e Event information
 */
function listFiles(e) {
  var type = "HRM";
  for(var k in e.parameter) {
    if ("type" == k) {
      type = e.parameter[k];
    }
  }
  var template = HtmlService.createTemplateFromFile('Files'), title = "My Files";
  template.title = title;
  template.files = DriveApp.searchFiles(
     "properties has { key='hrmType' and value='HRM' and visibility='PUBLIC' }");
  var output = template.evaluate();
  output.setSandboxMode(HtmlService.SandboxMode.IFRAME);
  output.setTitle(title);
  return output;
}

/**
 * Print results summary
 *
 * @param {object} e Event information
 */
function printResults(e) {
  var key = null, scroll = false, showNotes = false;
  for(var k in e.parameter) {
    if ("key" == k) {
      key = e.parameter[k];
    }
    if ("scroll" == k) {
      scroll = e.parameter[k];
    }
    if ("showNotes" == k) {
      showNotes = e.parameter[k];
    }
  }
  if (!key) {
    throw "You must specify a document";
  }
  var template = HtmlService.createTemplateFromFile('Results');
  var ss = SpreadsheetApp.openById(key);
  var title = ss.getName();
  template.show = e.parameter.show || 'links';
  template.key = key;
  template.race = e.parameter.race || '';
  template.title = title;
  template.hasEditPermission = spreadsheetHasEditPermission_(ss);
  template.scroll = scroll;
  template.checkInterval = 30; // Interval in seconds between update checks
  template.defaultScrollPeriod = 40; // Time to complete a complete scroll when enabled, if the code cannot override this
  template.showNotes = showNotes;
  var output = template.evaluate();
  Logger.log(template.getCode());
  output.setSandboxMode(HtmlService.SandboxMode.IFRAME);
  output.setTitle(title);
  return output;
}

function spreadsheetHasEditPermission_(ss) {
  try {
    var editors = ss.getEditors();
  } catch (e) {
    return false;
  }
  return true;
}

function getRaceSheetNamesHTML(ssKey) {
  return getRaceSheetNames(SpreadsheetApp.openById(ssKey));
}

function findSpreadsheetRankings(ssKey, val) {
  var rankings = findRankings(val, SpreadsheetApp.openById(ssKey));
  return rankings.map(function(row) {
    return Object.keys(row).map(function(k) {
      return row[k] instanceof Date ? row[k].toDateString() : row[k];
    });
  });
}

function onHTMLAddEntryClick(ssKey, items1, items2, selectedClass) {
  return addEntry(items1, items2, selectedClass, SpreadsheetApp.openById(ssKey));
}

function checkEntryDuplicateWarningsHTML(ssKey) {
  return checkEntryDuplicateWarnings(SpreadsheetApp.openById(ssKey));
}

/**
 * Get the URL for the Google Apps Script running as a WebApp.
 */
function getScriptUrl() {
 var url = ScriptApp.getService().getUrl();
 return url;
}

/**
 * Get results of a specific race for display
 *
 * @function getRaceResults
 */
function getRaceResults(key, raceName) {
  if (!key) {
    throw "You must specify a document";
  }
  var ss = SpreadsheetApp.openById(key);
  var raceSheet = ss.getSheetByName(raceName);
  if (!raceSheet) {
    throw "The specified race was not found";
  }
  return {
    races: [
      {
        name: raceName,
        results: _getRaceResultsFromSpreadsheet(raceSheet)
      }
    ]
  };
}

/**
 * Get results summary for display
 *
 * @function getRaceResultsSummary
 */
function getRaceResultsSummary(key, options) {
  if (!key) {
    throw "You must specify a document";
  }
  var ss = SpreadsheetApp.openById(key);
  return getResultsFromSpreadsheet(ss);
}

/**
 * Get results for display
 *
 * @function getResultsFromSpreadsheet
 */
function getResultsFromSpreadsheet(ss) {
  var data = {},
      classes = [],
      sheets = getRaceSheets(ss);

  for (var i=0; i<sheets.length; i++) {
    classes.push({name: sheets[i].getName(), results: _getRaceResultsFromSpreadsheet(sheets[i]) });
  }
  var pdSheet = ss.getSheetByName("PandD"), pdTimes = null, coursePdTimes = [], lastCourse = "", thisCourse = "";
  if (pdSheet && pdSheet.getLastRow() > 1) {
    pdTimes = [];
    Logger.log("Reading PD times");
    var pdValues = pdSheet.getRange(2, 12, pdSheet.getLastRow()-1, 2).getValues();
    for (var k=0; k<pdValues.length; k++) {
      if (pdValues[k][0] && pdValues[k][1] && pdValues[k][1] instanceof Date) {
        Logger.log("Found time " + pdValues[k][0]);
        thisCourse = pdValues[k][0].split(/K\d/)[0];
        if (lastCourse != thisCourse) {
          coursePdTimes = []; // Reset the list of times
          pdTimes.push({title: thisCourse, times: coursePdTimes});
        }
        var d = pdValues[k][1];
        coursePdTimes.push({
          name: pdValues[k][0].split(/K\d/)[1],
          time: formatTime(d) + "." + formatTimePart(Math.floor(d.getUTCMilliseconds()/10))
        });
        lastCourse = thisCourse;
      }
    }
  }
  var clubsSheet = ss.getSheetByName("Clubs"), clubPoints = [], lightningPoints = [];
  if (clubsSheet && clubsSheet.getLastRow() > 1) {
    Logger.log("Reading club points");
    var clubRows = clubsSheet.getRange(2, 8, clubsSheet.getLastRow()-1, 4).getValues();
    for (var l=0; l<clubRows.length; l++) {
      if (clubRows[l][0]) {
        clubPoints.push({
          name: clubRows[l][0],
          code: clubRows[l][1],
          totalPoints: clubRows[l][2],
          haslerPoints: clubRows[l][3]
        });
      }
    }
    Logger.log("Reading lightning points");
    var lightningRows = clubsSheet.getRange(2, 13, clubsSheet.getLastRow()-1, 3).getValues();
    for (var m=0; m<lightningRows.length; m++) {
      if (lightningRows[m][0]) {
        lightningPoints.push({
          name: lightningRows[m][0],
          code: lightningRows[m][1],
          totalPoints: lightningRows[m][2]
        });
      }
    }
  }
  data.pdTimes = pdTimes;
  data.clubPoints = clubPoints;
  data.lightningPoints = lightningPoints;
  data.races = classes;
  data.lastUpdated = getLastUpdated(ss.getId());
  data.allowPd = pdSheet !== null;
  Logger.log("Return " + classes.length + " races");
  return data;
}

function _getRaceResultsFromSpreadsheet(sheet) {
  var results = [], lastbn = 0, rows = getTableRows(sheet);
  for (var j=0; j<rows.length; j++) {
    var row = rows[j];
    if (parseInt(row['Number']) && row['Surname'] === "") {
      break;
    }
    var bn = row['Number'],
        name = "" + row['First name'] + " " + row['Surname'],
        club = "" + row['Club'],
        raceClass = "" + row['Class'],
        div = "" + row['Div'],
        time = formatTime(row['Elapsed']),
        startTime = formatTime(row['Start']),
        finishTime = formatTime(row['Finish']),
        points = row['Points'],
        pd = row['P/D'],
        notes = row['Notes'];
    if (name.trim() !== "") {
      if (bn) {
        //if (time) {
        results.push({num: bn, posn: row['Posn'], names: [name], clubs: [club], classes: [raceClass], divs: [div], time: time, startTime: startTime, finishTime: finishTime, points: [points], pd: [pd], notes: [notes] });
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
}

function getRaceEntriesSummary(key) {
  if (!key) {
    throw "You must specify a document";
  }
  var ss = SpreadsheetApp.openById(key);
  return getRaceEntriesFromSpreadsheet(ss);
}

function getRaceEntries(key, raceName) {
  if (!key) {
    throw "You must specify a document";
  }
  var ss = SpreadsheetApp.openById(key);
  var raceSheet = ss.getSheetByName(raceName);
  if (!raceSheet) {
    throw "The specified race " + raceName + " was not found";
  }
  return {
    races: [
      {
        name: raceName,
        results: _getRaceEntriesFromSheet(raceSheet)
      }
    ]
  };
}

function getRaceStarters(key) {
  if (!key) {
    throw "You must specify a document";
  }
  var ss = SpreadsheetApp.openById(key);
  return getRaceStartersFromSpreadsheet(ss);
}

function getRaceStartersFromSpreadsheet(ss) {
  var entries = getRaceEntriesFromSpreadsheet(ss);
  for (var i = 0; i < entries.races.length; i++) {
    entries.races[i].results = entries.races[i].results.filter(function(val, index, arr) { return val.startTime.toLowerCase() != 'dns'; });
  }
  return entries;
}

function getRaceEntriesFromSpreadsheet(ss, raceDateStr) {
  var data = {}, classes = [],
    sheets = getRaceSheets(ss);

  for (var i=0; i<sheets.length; i++) {
    classes.push({name: sheets[i].getName(), results: _getRaceEntriesFromSheet(sheets[i], raceDateStr) });
  }
  data.races = classes;
  data.lastUpdated = getLastUpdated(ss.getId());
  return data;
}

function _getRaceEntriesFromSheet(sheet, raceDateStr) {
  var results = [], rows = getTableRows(sheet);
  var raceDate = raceDateStr ? parseDate(raceDateStr) : new Date();
  for (var j=0; j<rows.length; j++) {
    var row = rows[j];
    if (parseInt(row['Number']) && row['Surname'] === "") {
      break;
    }
    var name = "" + row['First name'] + " " + row['Surname'],
      num = "" + row['Number'],
      bcuNum = "" + row['BCU Number'],
      expiry = "" + formatDate(row['Expiry']),
      expired = row['Expiry'] < raceDate,
      club = "" + row['Club'],
      raceClass = "" + row['Class'],
      div = "" + row['Div'],
      paid = "" + row['Paid'],
      startTime = "" + row['Start'];
    if (name.trim() !== "") {
      if (row['Number']) {
        results.push({ num: num, names: [name], bcuNum: [bcuNum], expiry: [expiry], expired: expired, clubs: [club], classes: [raceClass], divs: [div], paid: [paid], startTime: startTime });
      } else {
        var last = results.pop();
        last.names.push(name);
        last.bcuNum.push(bcuNum);
        last.expiry.push(expiry);
        last.expired = last.expired || expired;
        last.clubs.push(club);
        last.classes.push(raceClass);
        last.divs.push(div);
        last.paid.push(paid);
        results.push(last);
      }
    }
  }
  return results;
}

function getLastEntryRow(sheet) {
    // Find the latest row with a number but without a name in the sheet
    var range = sheet.getRange(2, 1, sheet.getLastRow()-1, 2), values = range.getValues();
    for (var i=0; i<values.length; i++) {
      if (parseInt(values[i][0]) && values[i][1] === "") {
        return i;
      }
    }
  return 1;
}

/**
 * Format the given finish time, which may be a Date object or a string, e.g. 'dns'
 *
 * @param {Date|string} Input value to format
 * @return {string} row value to display for the elapsed time
 */
function formatTime(val) {
  if (val) {
    if (typeof val == "string") {
      return val.toLowerCase();
    } else {
      return "" + val.getHours() + ":" + formatTimePart(val.getMinutes()) + ":" + formatTimePart(val.getSeconds());
    }
  } else {
    return "";
  }
}

/**
 * Format the given date value, which may be a Date object or a string, e.g. 'dns'
 *
 * @param {Date|string} Input value to format
 * @return {string} row value to display for the given date
 */
function formatDate(val) {
  if (val) {
    if (typeof val == "string") {
      return val.toLowerCase();
    } else {
      return formatTimePart(val.getDate()) + "/" + formatTimePart(val.getMonth() + 1) + "/" + formatTimePart(val.getYear());
    }
  } else {
    return "";
  }
}

/**
 * Format a time part as two-digits, padding with a leading zero if the input value is less than ten.
 *
 * @param {int} p Time part, e.g. number of hours
 * @return {string} Formatted time part, with leading zero added if necessary
 */
function formatTimePart(p) {
  return (p < 10 ? "0" : "") + p;
}

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

function getLastUpdated(key) {
  var file = DriveApp.getFileById(key);
  if (file) {
    return file.getLastUpdated().toString();
  } else {
    return null;
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}