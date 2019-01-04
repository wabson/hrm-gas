var racing = require('./racing');
var tables = require('./tables');
var twilio = require('./twilio');

var SMS_SHEET_NAME = 'SMS Log';
var SMS_COLUMNS = ['Number', 'To', 'Message', 'SID', 'Status', 'Created'];

var SMS_BLOCK_SHEET_NAME = 'SMS Blocks';

function getBlockedNumbers(ss) {
  var blocksSheet = ss.getSheetByName(SMS_BLOCK_SHEET_NAME);
  var blockedNumbers = [];
  if (blocksSheet) {
    blockedNumbers = tables.getRows(blocksSheet).map(function(row) {
      return row['Number'];
    });
  }
  return blockedNumbers;
}

exports.sendAllResultsSms = function sendAllResultsSms(ss, races, options) {
  var logEntries = [];
  if (races === undefined || races === null) {
    races = racing.getRaceSheets(ss);
  }
  for (var i=0; i<races.length; i++) {
    logEntries = logEntries.concat(exports.sendRaceResultsSms(ss, races[i], options));
  }
  return logEntries;
};

exports.sendRaceResultsSms = function sendRaceResultsSms(ss, sheetName, options) {
  var resultsName = options.raceShortName;
  var resultsUrl = options.resultsShortUrl;
  if (!resultsName || !resultsUrl) {
    throw 'Race short name and results URL must be supplied';
  }
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  var sheet = sheetName ? ss.getSheetByName(sheetName) : ss.getActiveSheet();
  var results = racing.getRaceResultsFromSpreadsheet(tables.getRows(sheet));
  var smsSheet = ss.getSheetByName(SMS_SHEET_NAME);
  if (smsSheet === null) {
    smsSheet = ss.insertSheet(SMS_SHEET_NAME);
    smsSheet.getRange(1, 1, 1, SMS_COLUMNS.length).setValues([ SMS_COLUMNS ]);
  }
  var entrySetsSheet = ss.getSheetByName('Entry Sets');
  if (entrySetsSheet === null) {
    throw 'Could not find Entry Sets sheet';
  }
  var entrySets = tables.getRows(entrySetsSheet);
  var numStarters = results.filter(function(result) {
    return result.time !== 'dns';
  }).length;
  var logEntries = [], blockedNumbers = getBlockedNumbers(ss);
  results.forEach(function(result) {
    if (!result.setId) {
      return;
    }
    if (!result.posn) {
      return;
    }
    var matchingEntrySets = entrySets.filter(function(entrySet) {
      return entrySet['ID'] === result.setId;
    });
    if (matchingEntrySets.length !== 1) {
      Logger.log('Could not find entry set ' + result.setId);
      return;
    }
    var phoneNumber = matchingEntrySets[0]['Phone'];
    if (!phoneNumber) {
      Logger.log(Utilities.formatString('Ignoring empty phone number for boat %s', result.num));
    } else if (blockedNumbers.indexOf(phoneNumber) > -1) {
      Logger.log(Utilities.formatString('Ignoring blocked number %s for boat %s', phoneNumber, result.num));
    } else {
      var phoneLookup = twilio.lookupNationalPhoneNumber(phoneNumber);
      if (phoneLookup.getResponseCode() === 200) {
        var phoneData = JSON.parse(phoneLookup);
        var intlNumber = phoneData['phone_number'];
        if (intlNumber && intlNumber.indexOf('+447') !== 0) {
          Logger.log(
            Utilities.formatString('Ignoring non-mobile/non-UK number %s for boat %s', phoneNumber, result.num)
          );
        } else if (blockedNumbers.indexOf(intlNumber) > -1) {
          Logger.log(Utilities.formatString('Ignoring blocked number %s for boat %s', phoneNumber, result.num));
        } else {
          var messageBody = Utilities.formatString(
            '%s: Boat %s %s finished in %s in posn %s of %s in %s. Full results: %s',
            resultsName, result.num, result.names.join(', '), result.time, result.posn, numStarters, sheet.getName(),
            resultsUrl);
          Logger.log(Utilities.formatString(
            'Sending SMS to %s for boat %s - length %d chars', intlNumber, result.num, messageBody.length
          ));
          var smsResult = twilio.sendSms(intlNumber, messageBody);
          logEntries.push({
            'Number': smsResult.from,
            'To': smsResult.to,
            'Message': smsResult.body,
            'SID': smsResult.sid,
            'Status': smsResult.status,
            'Created': smsResult.date_created
          });
        }
      }
    }
  });
  tables.appendRows(smsSheet, logEntries);
  return logEntries;
};