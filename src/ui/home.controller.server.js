/* jshint sub: true, quotmark: false, maxstatements: false */

function checkFinishDuplicates_(ss) {
  var sheet = ss.getSheetByName('Finishes');
  if (sheet === null) {
    throw 'Finishes sheet not found';
  }
  var data = getTableRows(sheet, true), timesByBoatNum = {}, strangeTimes = [], times, number, bn, time;
  for (var i=0; i<data.length; i++) {
    number = data[i]['number'];
    bn = '' + data[i]['boat num'];
    time = formatTime(data[i]['time']);
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