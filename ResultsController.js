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
      return printEntries(e)
    default:
      throw "Unsupported action " + action;
  }
}

/**
 * Print results summary
 *
 * @param {object} e Event information
 */
function printResults(e) {
  var key = null, refresh, scroll = false,
      showNotes = e.parameter.notes == "1";
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
  }
  if (!key) {
    throw "You must specify a document";
  }
  var template = HtmlService.createTemplateFromFile('Results');
  var ss = SpreadsheetApp.openById(key);
  var title = ss.getName();
  var classes = [];
  var sheets = ss.getSheets();
  for (var i=0; i<sheets.length; i++) {
    if ("Finishes" == sheets[i].getName()) {
      break;
    }
    var results = [];
    var range = sheets[i].getRange(2, 1, sheets[i].getLastRow()-1, 16), values = range.getValues();
    for (var j=0; j<values.length; j++) {
      var rowvalues = values[j];
      if (parseInt(rowvalues[0]) && rowvalues[1] == "") {
        break;
      }
      var name = "" + rowvalues[2] + " " + rowvalues[1],
          club = "" + rowvalues[4],
          class = "" + rowvalues[5],
          div = "" + rowvalues[6],
          time = rowvalues[11],
          points = rowvalues[14],
          pd = rowvalues[13],
          notes = rowvalues[15];
      if (name != "" && name != " ") {
        if (rowvalues[0]) {
          results.push({ posn: rowvalues[12], names: [name], clubs: [club], classes: [class], divs: [div], time: time, points: [points], pd: [pd], notes: [notes] });
        } else {
          var last = results.pop();
          last.names.push(name);
          last.clubs.push(club);
          last.classes.push(class);
          last.divs.push(div);
          last.points.push(points);
          last.pd.push(pd);
          last.notes.push(notes);
          results.push(last);
        }
      }
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
  template.pdTimes = pdTimes;
  template.clubPoints = clubPoints;
  template.lightningPoints = lightningPoints;
  template.key = key;
  template.title = title;
  template.classes = classes;
  template.refresh = refresh;
  template.scroll = scroll;
  template.showNotes = showNotes;
  var output = template.evaluate();
  output.setSandboxMode(HtmlService.SandboxMode.NATIVE);
  output.setTitle(title);
  return output;
}

/**
 * Print entries summary
 *
 * @param {object} e Event information
 */
function printEntries(e) {
  var key = null, refresh, scroll = false;
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
  }
  if (!key) {
    throw "You must specify a document";
  }
  var template = HtmlService.createTemplateFromFile('Entries');
  var ss = SpreadsheetApp.openById(key);
  var title = ss.getName();
  var classes = [];
  var sheets = ss.getSheets();
  for (var i=0; i<sheets.length; i++) {
    if ("Finishes" == sheets[i].getName()) {
      break;
    }
    var results = [];
    var range = sheets[i].getRange(2, 1, sheets[i].getLastRow()-1, 13), values = range.getValues();
    for (var j=0; j<values.length; j++) {
      var rowvalues = values[j];
      if (parseInt(rowvalues[0]) && rowvalues[1] == "") {
        break;
      }
      var name = "" + rowvalues[2] + " " + rowvalues[1],
          num = "" + rowvalues[0],
          club = "" + rowvalues[4],
          class = "" + rowvalues[5],
          div = "" + rowvalues[6],
          time = rowvalues[11];
      if (name != "" && name != " ") {
        if (rowvalues[0]) {
          results.push({ num: num, names: [name], clubs: [club], classes: [class], divs: [div] });
        } else {
          var last = results.pop();
          last.names.push(name);
          last.clubs.push(club);
          last.classes.push(class);
          last.divs.push(div);
          results.push(last);
        }
      }
    }
    classes.push({name: sheets[i].getName(), results: results })
  }
  template.key = key;
  template.title = title;
  template.classes = classes;
  template.refresh = refresh;
  template.scroll = scroll;
  return template.evaluate();
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
      return formatTimePart(val.getHours()) + ":" + formatTimePart(val.getMinutes()) + ":" + formatTimePart(val.getSeconds());
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