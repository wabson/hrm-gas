var dateformat = require('./dateformat');
var results = require('./racing');
var tables = require('./tables');

exports.saveEntriesHTML = function saveEntriesHTML(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  var template = HtmlService.createTemplateFromFile('entries-static.view'), scriptProps, title, data;
  var publishedResultsId = null;
  try {
    publishedResultsId = Drive.Properties.get(ss.getId(), 'publishedResultsId', {
      visibility: 'PUBLIC'
    }).value;
  } catch (e) { }
  scriptProps = {
    publishedEntriesId: publishedResultsId
  };
  title = ss.getName();
  template.title = title;
  data = getRaceEntriesFromSpreadsheet(ss, scriptProps.raceDate);
  for (var k in data) {
    if (data.hasOwnProperty(k)) {
      template[k] = data[k];
    }
  }
  var outputHtml = template.evaluate().getContent();
  var htmlFile = scriptProps.publishedEntriesId ? DriveApp.getFileById(scriptProps.publishedEntriesId) : DriveApp.createFile(Utilities.formatString(ENTRIES_HTML_FILENAME_TMPL, title), outputHtml, MimeType.HTML);
  if (scriptProps.publishedEntriesId) {
    htmlFile.setContent(outputHtml);
  }
  try {
    Drive.Properties.insert({
      key: 'publishedEntriesId',
      value: htmlFile.getId(),
      visibility: 'PUBLIC'
    }, ss.getId());
    Logger.log("Set drive publishedEntriesId property to: " + htmlFile.getId());
  }
  catch (ex) {
    Logger.log('Caught exception ', ex);
  }
  htmlFile.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
  return htmlFile;
};

exports.saveResultsHTML = function saveResultsHTML(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  var template = HtmlService.createTemplateFromFile('results-static.view'), scriptProps, title, data, outputHtml;
  var publishedResultsId = null;
  try {
    publishedResultsId = Drive.Properties.get(ss.getId(), 'publishedResultsId', {
      visibility: 'PUBLIC'
    }).value;
  } catch (e) {
  }
  scriptProps = {
    publishedResultsId: publishedResultsId
  };
  title = ss.getName();
  template.showNotes = false;
  template.title = title;
  data = getResultsFromSpreadsheet(ss);
  for (var k in data) {
    if (data.hasOwnProperty(k)) {
      template[k] = data[k];
      template.isHaslerFinal = scriptProps.haslerRegion == "HF";
    }
  }
  outputHtml = template.evaluate().getContent();
  var htmlFile = scriptProps.publishedResultsId ? DriveApp.getFileById(scriptProps.publishedResultsId) : DriveApp.createFile(Utilities.formatString(RESULTS_HTML_FILENAME_TMPL, title), outputHtml, MimeType.HTML);
  if (scriptProps.publishedResultsId) {
    htmlFile.setContent(outputHtml);
  }
  try {
    Drive.Properties.insert({
      key: 'publishedResultsId',
      value: htmlFile.getId(),
      visibility: 'PUBLIC'
    }, ss.getId());
  }
  catch (ex) {
    Logger.log('Caught exception ', ex);
  }
  htmlFile.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);
  return htmlFile;
};

/**
 * Get results for display
 *
 * @function getResultsFromSpreadsheet
 */
function getResultsFromSpreadsheet(ss) {
  var data = {},
    classes = [],
    sheets = results.getRaceSheets(ss);

  for (var i=0; i<sheets.length; i++) {
    classes.push({
      name: sheets[i].getName(),
      results: results.getRaceResultsFromSpreadsheet(tables.getRows(sheets[i]))
    });
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
          time: dateformat.formatTime(d) + "." + dateformat.formatTimePart(Math.floor(d.getUTCMilliseconds()/10))
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