var rankingsSheetName = "Rankings";

/**
 * Respond to a browser request
 *
 * @param {object} e Event information
 */
function doGet(e) {
  var action = e.parameter.show || "results";
  switch (action) {
    case "results":
      return printResults(e);
    case "entries":
      return printResults(e);
    case "starters":
      return printResults(e);
    default:
      throw "Unsupported action " + action;
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
  var data = getRaceResultsFromSpreadsheet(ss);
  for (var k in data) {
    template[k] = data[k];
    template.isHaslerFinal = scriptProps.haslerRegion == "HF";
  }
  var outputHtml = template.evaluate().getContent();
  var htmlFile = scriptProps.publishedResultsId ? DriveApp.getFileById(scriptProps.publishedResultsId) : DriveApp.createFile(title, outputHtml, MimeType.HTML);
  if (scriptProps.publishedResultsId) {
    htmlFile.setContent(outputHtml);
  }
  htmlFile.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
  showLinkDialog('Publish HTML',
    "<p>Race results published to Google Drive:</p>",
    "https://googledrive.com/host/" + htmlFile.getId()
  );
  return {fileId: htmlFile.getId()}
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
  var htmlFile = scriptProps.publishedEntriesId ? DriveApp.getFileById(scriptProps.publishedEntriesId) : DriveApp.createFile(title, outputHtml, MimeType.HTML);
  if (scriptProps.publishedEntriesId) {
    htmlFile.setContent(outputHtml);
  }
  htmlFile.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
  showLinkDialog('Publish HTML',
    "<p>Race entries published to Google Drive:</p>",
    "https://googledrive.com/host/" + htmlFile.getId()
  );
  return {fileId: htmlFile.getId()}
}

/**
 * Print results summary
 *
 * @param {object} e Event information
 */
function printResults(e) {
  var key = null, refresh, scroll = false, showNotes = false;
  for(var k in e.parameter) {
    if ("key" == k) {
      key = e.parameter[k];
    }
    if ("refresh" == k) {
      refresh = e.parameter[k];
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
  template.show = e.parameter.show || "results";
  template.key = key;
  template.title = title;
  template.scroll = scroll;
  template.checkInterval = 30; // Interval in seconds between update checks
  template.defaultScrollPeriod = 40; // Time to complete a complete scroll when enabled, if the code cannot override this
  template.showNotes = showNotes;
  var output = template.evaluate();
  Logger.log(template.getCode());
  output.setSandboxMode(HtmlService.SandboxMode.NATIVE);
  output.setTitle(title);
  return output;
}

/**
 * Get results for display
 *
 * @function getRaceResults
 */
function getRaceResults(key) {
  if (!key) {
    throw "You must specify a document";
  }
  var ss = SpreadsheetApp.openById(key);
  return getRaceResultsFromSpreadsheet(ss);
}

/**
 * Get results for display
 *
 * @function getRaceResultsFromSpreadsheet
 */
function getRaceResultsFromSpreadsheet(ss) {
  var data = {},
      classes = [],
      sheets = getRaceSheets(ss);

  for (var i=0; i<sheets.length; i++) {
    var results = [], lastbn = 0, rows = getTableRows(sheets[i]);
    for (var j=0; j<rows.length; j++) {
      var row = rows[j];
      if (parseInt(row['Number']) && row['Surname'] == "") {
        break;
      }
      var bn = row['Number'],
          name = "" + row['First name'] + " " + row['Surname'],
          club = "" + row['Club'],
          class = "" + row['Class'],
          div = "" + row['Div'],
          time = formatTime(row['Elapsed']),
          points = row['Points'],
          pd = row['P/D'],
          notes = row['Notes'];
      if (name.trim() != "") {
        if (bn) {
          if (time) {
            results.push({num: bn, posn: row['Posn'], names: [name], clubs: [club], classes: [class], divs: [div], time: time, points: [points], pd: [pd], notes: [notes] });
          }
        } else if (results.length > 0) {
          var last = results.pop();
          if (lastbn != 0 && lastbn == last.num) { // Check it is the same boat as we may have skipped some if missing a time
            last.names.push(name);
            last.clubs.push(club);
            last.classes.push(class);
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
    classes.push({name: sheets[i].getName(), results: results.sort(sortResults) })
  }
  var pdSheet = ss.getSheetByName("PandD"), pdTimes = [], coursePdTimes = [], lastCourse = "", thisCourse = "";
  if (pdSheet && pdSheet.getLastRow() > 1) {
    Logger.log("Reading PD times");
    var pdValues = pdSheet.getRange(2, 12, pdSheet.getLastRow()-1, 2).getValues();
    for (var i=0; i<pdValues.length; i++) {
      if (pdValues[i][0] && pdValues[i][1] && pdValues[i][1] instanceof Date) {
        Logger.log("Found time " + pdValues[i][0]);
        thisCourse = pdValues[i][0].split(/K\d/)[0];
        if (lastCourse != thisCourse) {
          coursePdTimes = []; // Reset the list of times
          pdTimes.push({title: thisCourse, times: coursePdTimes});
        }
        var d = pdValues[i][1];
        coursePdTimes.push({
          name: pdValues[i][0].split(/K\d/)[1],
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
    for (var i=0; i<clubRows.length; i++) {
      if (clubRows[i][0]) {
        clubPoints.push({
          name: clubRows[i][0],
          code: clubRows[i][1],
          totalPoints: clubRows[i][2],
          haslerPoints: clubRows[i][3]
        });
      }
    }
    Logger.log("Reading lightning points");
    var lightningRows = clubsSheet.getRange(2, 13, clubsSheet.getLastRow()-1, 3).getValues();
    for (var i=0; i<lightningRows.length; i++) {
      if (lightningRows[i][0]) {
        lightningPoints.push({
          name: lightningRows[i][0],
          code: lightningRows[i][1],
          totalPoints: lightningRows[i][2]
        });
      }
    }
  }
  data.pdTimes = pdTimes;
  data.clubPoints = clubPoints;
  data.lightningPoints = lightningPoints;
  data.races = classes;
  data.lastUpdated = getLastUpdated(ss.getId());
  Logger.log("Return " + classes.length + " races");
  return data;
}

function getRaceEntries(key) {
  if (!key) {
    throw "You must specify a document";
  }
  var ss = SpreadsheetApp.openById(key);
  return getRaceEntriesFromSpreadsheet(ss);
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
    entries.races[i].results = entries.races[i].results.filter(function(val, index, arr) { return val.startTime.toLowerCase() != 'dns' });
  }
  return entries;
}

function getRaceEntriesFromSpreadsheet(ss, raceDateStr) {
  var data = {}, classes = [],
    sheets = getRaceSheets(ss);

  for (var i=0; i<sheets.length; i++) {
    var results = [], rows = getTableRows(sheets[i]);
    var raceDate = raceDateStr ? parseDate(raceDateStr) : new Date();
    for (var j=0; j<rows.length; j++) {
      var row = rows[j];
      if (parseInt(row['Number']) && row['Surname'] == "") {
        break;
      }
      var name = "" + row['First name'] + " " + row['Surname'],
        num = "" + row['Number'],
        bcuNum = "" + row['BCU Number'],
        expiry = "" + formatDate(row['Expiry']),
        expired = row['Expiry'] < raceDate,
        club = "" + row['Club'],
        class = "" + row['Class'],
        div = "" + row['Div'],
        paid = "" + row['Paid'],
        startTime = "" + row['Start'];
      if (name.trim() != "") {
        if (row['Number']) {
          results.push({ num: num, names: [name], bcuNum: [bcuNum], expiry: [expiry], expired: expired, clubs: [club], classes: [class], divs: [div], paid: [paid], startTime: startTime });
        } else {
          var last = results.pop();
          last.names.push(name);
          last.bcuNum.push(bcuNum);
          last.expiry.push(expiry);
          last.expired = last.expired || expired;
          last.clubs.push(club);
          last.classes.push(class);
          last.divs.push(div);
          last.paid.push(paid);
          results.push(last);
        }
      }
    }
    classes.push({name: sheets[i].getName(), results: results });
  }
  data.races = classes;
  data.lastUpdated = getLastUpdated(ss.getId());
  return data;
}

function getLastEntryRow(sheet) {
    // Find the latest row with a number but without a name in the sheet
    var range = sheet.getRange(2, 1, sheet.getLastRow()-1, 2), values = range.getValues();
    for (var i=0; i<values.length; i++) {
      if (parseInt(values[i][0]) && values[i][1] == "") {
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
  var file = DocsList.getFileById(key);
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