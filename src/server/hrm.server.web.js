/* jshint
 sub: true,
 eqeqeq: false,
 quotmark: false,
 maxdepth: false,
 maxstatements: false,
 maxlen: false
 */

var publishing = require('./publishing');
var results = require('./racing');
var tables = require('./tables');
var twilio = require('./twilio');

/**
 * Print results summary
 *
 * @param {object} e Event information
 */
exports.saveResultsHTMLForSpreadsheet = function saveResultsHTMLForSpreadsheet(ssKey) {
  var htmlFile = publishing.saveResultsHTML(ss);
  return {fileId: htmlFile.getId()};
};

/**
 * Save entries summary
 *
 * @param {String} ssKey Spreadsheet key
 */
exports.saveEntriesHTMLForSpreadsheet = function saveEntriesHTMLForSpreadsheet(ssKey) {
  var htmlFile = publishing.saveEntriesHTML(ss);
  return {fileId: htmlFile.getId()};
};

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
  var template = HtmlService.createTemplateFromFile('Files'), title = "My Files";
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
};

function spreadsheetHasEditPermission_(ss) {
  try {
    var editors = ss.getEditors();
  } catch (e) {
    return false;
  }
  return true;
}

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

exports.sendResultsSms = function sendResultsSms() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  var results = results.getRaceResultsFromSpreadsheet(sheet);
  var entrySetsSheet = ss.getSheetByName('Entry Sets');
  if (entrySetsSheet === null) {
    throw 'Could not find Entry Sets sheet';
  }
  var entrySets = tables.getRows(entrySetsSheet);
  var numStarters = results.filter(function(result) {
    return result.time !== 'dns';
  }).length;
  results.forEach(function(result) {
    if (!result.setId) {
      return;
    }
    if (!result.posn) {
      return;
    }
    var matchingEntrySets = entrySets.filter(function(entrySet) {
      return entrySet['ID'] == result.setId;
    });
    if (matchingEntrySets.length !== 1) {
      Logger.log('Could not find entry set ' + result.setId);
      return;
    }
    var phoneNumber = matchingEntrySets[0]['Phone'];
    if (phoneNumber) {
      var phoneLookup = twilio.lookupNationalPhoneNumber(phoneNumber);
      if (phoneLookup.getResponseCode() == 200) {
        var phoneData = JSON.parse(phoneLookup);
        var intlNumber = phoneData['phone_number'];
        if (intlNumber && intlNumber.indexOf('+447') === 0) {
          var messageBody = ss.getName() + ': Boat ' + result.num + ' ' + result.names.join(', ') + ' finished in ' + result.time + ' in posn ' + result.posn + ' of ' + numStarters + ' in ' + sheet.getName();
          Logger.log('sending SMS to ' + intlNumber + ': "' + messageBody + '" (' + messageBody.length + ' characters)');
          twilio.sendSms(intlNumber, messageBody);
        }
      }
    } else {
      Logger.log('Ignoring empty phone number for boat ' + result.num);
    }
  });
};

exports.getLastUpdated = function getLastUpdated(key) {
  var file = DriveApp.getFileById(key);
  if (file) {
    return file.getLastUpdated().toString();
  } else {
    return null;
  }
};