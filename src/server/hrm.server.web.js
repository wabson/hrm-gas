/* jshint
 sub: true,
 eqeqeq: false,
 quotmark: false,
 maxdepth: false,
 maxstatements: false,
 maxlen: false
 */

var dateformat = require('./dateformat');
var hrm = require('./hrm.server.main');
var racing = require('./racing');
var publishing = require('./publishing');
var rankings = require('./rankings');
var tables = require('./tables');

var rankingProps = ["Surname", "First name", "Club", "Class", "BCU Number", "Expiry", "Division"];

/**
 * Print results summary
 *
 * @param {object} e Event information
 */
exports.saveResultsHTMLForSpreadsheet = function saveResultsHTMLForSpreadsheet(ssKey) {
  var ss = SpreadsheetApp.openById(ssKey);
  var htmlFile = publishing.saveResultsHTML(ss);
  return {fileId: htmlFile.getId()};
};

/**
 * Save entries summary
 *
 * @param {String} ssKey Spreadsheet key
 */
exports.saveEntriesHTMLForSpreadsheet = function saveEntriesHTMLForSpreadsheet(ssKey) {
  var ss = SpreadsheetApp.openById(ssKey);
  var htmlFile = publishing.saveEntriesHTML(ss);
  return {fileId: htmlFile.getId()};
};

function checkFinishDuplicates_(ss) {
  var sheet = ss.getSheetByName('Finishes');
  if (sheet === null) {
    throw 'Finishes sheet not found';
  }
  var data = tables.getRows(sheet, true), timesByBoatNum = {}, strangeTimes = [], times, number, bn, time;
  for (var i=0; i<data.length; i++) {
    number = data[i]['number'];
    bn = '' + data[i]['boat num'];
    time = dateformat.formatTime(data[i]['time']);
    if (bn !== '') {
      times = timesByBoatNum[bn] || [];
      times.push({
        number: number,
        time: time
      });
      timesByBoatNum[bn] = times;
      if (!/\d{3}/.test(bn) || !/^\d{1,2}:\d{2}:\d{2}|rtd|dns|dsq$/.test(time)) {
        strangeTimes.push({
          number: number,
          boatNumber: bn,
          time: time
        });
      }
    }
  }
  var duplicateBns = [];
  for (var num in timesByBoatNum) {
    if (timesByBoatNum.hasOwnProperty(num) && timesByBoatNum[num].length > 1) {
      duplicateBns.push({
        boatNumber: num,
        times: timesByBoatNum[num]
      });
    }
  }
  return {
    duplicates: duplicateBns,
    strangeTimes: strangeTimes
  };
}

function checkFinishDuplicatesForSpreadsheet(ssKey) {
  var ss = SpreadsheetApp.openById(ssKey);
  if (ss !== null) {
    return checkFinishDuplicates_(ss);
  } else {
    throw 'Could not find spreadsheet with key ' + ssKey;
  }
}

exports.checkFinishDuplicatesForSpreadsheet = checkFinishDuplicatesForSpreadsheet;

/**
 * List HRM files
 *
 * @param {object} e Event information
 */
exports.listFiles = function listFiles(e) {
  var type = "HRM";
  for(var k in e.parameter) {
    if ("type" == k) {
      type = e.parameter[k];
    }
  }
  var template = HtmlService.createTemplateFromFile('files.view'), title = "My Files";
  template.title = title;
  template.files = DriveApp.searchFiles(
    "properties has { key='hrmType' and value='HRM' and visibility='PUBLIC' }");
  var output = template.evaluate();
  output.setSandboxMode(HtmlService.SandboxMode.IFRAME);
  output.setTitle(title);
  return output;
};

/**
 * Print results summary
 *
 * @param {object} e Event information
 */
exports.printResults = function printResults(e) {
  var key = null, scroll = false, showNotes = false;
  for(var k in e.parameter) {
    if (e.parameter.hasOwnProperty(k)) {
      if ("key" === k) {
        key = e.parameter[k];
      }
      if ("scroll" === k) {
        scroll = e.parameter[k];
      }
      if ("showNotes" === k) {
        showNotes = e.parameter[k];
      }
    }
  }
  if (!key) {
    throw "You must specify a document";
  }
  var template = HtmlService.createTemplateFromFile('results.view');
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
};

function spreadsheetHasEditPermission_(ss) {
  try {
    var editors = ss.getEditors();
  } catch (e) {
    return false;
  }
  return true;
}

function getRaceSheetNamesHTML(ssKey) {
  return racing.getRaceSheetNames(SpreadsheetApp.openById(ssKey));
}

exports.getRaceSheetNamesHTML = getRaceSheetNamesHTML;

function findSpreadsheetRankings(ssKey, val) {
  var results = rankings.searchRankings(SpreadsheetApp.openById(ssKey), val);
  return results.map(function(row) {
    // return Object.keys(row).map(function(k) {
    //   return row[k] instanceof Date ? row[k].getTime() : row[k];
    // });
    return rankingProps.map(function(k) {
      return row[k] instanceof Date ? Utilities.formatDate(row[k], "GMT", "yyyy-MM-dd") : row[k];
    });
  });
}

exports.findSpreadsheetRankings = findSpreadsheetRankings;

function onHTMLAddEntryClick(ssKey, list1, list2, selectedClass) {
  var items = [];
  var item1 = {}, item2 = {};
  rankingProps.forEach(function(prop, index) {
    if (list1) {
      item1[prop] = list1[index];
    }
    if (list2) {
      item2[prop] = list2[index];
    }
  });
  if (list1) {
    items.push(item1);
  }
  if (list2) {
    items.push(item2);
  }
  return hrm.addEntry(items, rankingProps, selectedClass, SpreadsheetApp.openById(ssKey));
}

exports.onHTMLAddEntryClick = onHTMLAddEntryClick;

function checkEntryDuplicateWarningsHTML(ssKey) {
  return hrm.checkEntryDuplicateWarnings(SpreadsheetApp.openById(ssKey));
}

exports.checkEntryDuplicateWarningsHTML = checkEntryDuplicateWarningsHTML;

/**
 * Get the URL for the Google Apps Script running as a WebApp.
 */
exports.getScriptUrl = function getScriptUrl(params) {
  var url = ScriptApp.getService().getUrl();
  if (params) {
    var initialSep = url.indexOf('?') == -1 ? '?' : '&', pairs = [];
    for (var k in params) {
      if (params.hasOwnProperty(k)) {
        pairs.push(k + '=' + params[k]);
      }
    }
    url += initialSep + pairs.join('&');
  }
  return url;
};

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
        results: racing.getRaceResultsFromSpreadsheet(tables.getRows(raceSheet))
      }
    ]
  };
}

exports.getRaceResults = getRaceResults;

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
  return publishing.getResultsFromSpreadsheet(ss);
}

exports.getRaceResultsSummary = getRaceResultsSummary;

exports.calculatePointsFromWeb = function calculatePointsFromWeb(ss) {
  if (typeof ss == 'string') {
    ss = SpreadsheetApp.openById(ss);
  }
  return hrm.calculatePoints(null, ss);
};

function getRaceEntriesSummary(key) {
  if (!key) {
    throw "You must specify a document";
  }
  var ss = SpreadsheetApp.openById(key);
  return racing.getRaceEntriesFromSpreadsheet(ss);
}

exports.getRaceEntriesSummary = getRaceEntriesSummary;

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
        results: racing.getRaceEntriesFromSheet(raceSheet)
      }
    ]
  };
}

exports.getRaceEntries = getRaceEntries;

function getRaceStarters(key) {
  if (!key) {
    throw "You must specify a document";
  }
  var ss = SpreadsheetApp.openById(key);
  return racing.getRaceStartersFromSpreadsheet(ss);
}

exports.getLastUpdated = function getLastUpdated(key) {
  var file = DriveApp.getFileById(key);
  if (file) {
    return file.getLastUpdated().toString();
  } else {
    return null;
  }
};