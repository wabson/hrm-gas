/* jshint
  sub: true,
  curly: false,
  eqeqeq: false,
  quotmark: false,
  maxdepth: false,
  maxstatements: false,
  maxlen: false
  */

/*
 * Hasler Race Management Spreadsheet functions
 *
 * Author: Will Abson
 *
 */

var crewSheets = require('./crew-sheets');
var dateformat = require('./dateformat');
var drive = require('./drive');
var tables = require('./tables');
var racing = require('./racing');
var rankings = require('./rankings');
var templates = require('./templates');

var CLASSES_DEFS = [['SMK', 'Senior Male Kayak'],['VMK', 'Veteran Male Kayak'],['JMK', 'Junior Male Kayak'],['SFK', 'Senior Female Kayak'],['VFK', 'Veteran Female Kayak'],['JFK', 'Junior Female Kayak'],['SMC', 'Senior Male Canoe'],['VMC', 'Veteran Male Canoe'],['JMC', 'Junior Male Canoe'],['SFC', 'Senior Female Canoe'],['VFC', 'Veteran Female Canoe'],['JFC', 'Junior Female Canoe']];

exports.CLASSES_DEFS = CLASSES_DEFS;

var DIVS_ALL = ["1","2","3","4","5","6","7","8","9","10","U12M","U12F","U10M","U10F"];

exports.DIVS_ALL = DIVS_ALL;

function getMetaInfoCellRange_(ss, sheetName, range) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  var clubsSheet = ss.getSheetByName(sheetName);
  if (clubsSheet) {
    return clubsSheet.getRange(range[0], range[1], range[2], range[3]);
  } else {
    return null;
  }
}

function getRaceInfoCellRange_(ss) {
  return getMetaInfoCellRange_(ss, 'Clubs', [1, 19, 1, 2]);
}

function getRaceInfo_(sheet) {
  var range =  getRaceInfoCellRange_(sheet);
  if (range !== null) {
    var values = range.getValues();
    return {
      regionId: values[0][0],
      raceName: values[0][1]
    };
  } else {
    return {};
  }
}

function setRaceInfo_(info, sheet) {
  getRaceInfoCellRange_(sheet).setValues([[info.regionId || '', info.raceName || '']]);
}

exports.getRaceInfo = getRaceInfo_;
exports.setRaceInfo = setRaceInfo_;

function getEntryFeesInfoCellRange_(ss) {
  return getMetaInfoCellRange_(ss, 'Entry Fees', [2, 2, 5, 2]);
}

function getEntryFeesInfo_(ss) {
  var range =  getEntryFeesInfoCellRange_(ss);
  if (range !== null) {
    var values = range.getValues();
    return {
      entryJunior: values[0][0],
      entrySenior: values[1][0],
      entryVeteran: values[2][0],
      entryDiv10: values[3][0],
      entryLightning: values[4][0],
      entryJuniorLate: values[0][1],
      entrySeniorLate: values[1][1],
      entryVeteranLate: values[2][1],
      entryDiv10Late: values[3][1],
      entryLightningLate: values[4][1]
    };
  } else {
    return {};
  }
}

function setEntryFeesInfo_(info, ss) {
  getEntryFeesInfoCellRange_(ss).setValues([
    [info.entryJunior || '', info.entryJuniorLate || ''],
    [info.entrySenior || '', info.entrySeniorLate || ''],
    [info.entryVeteran || '', info.entryVeteranLate || ''],
    [info.entryDiv10 || '', info.entryDiv10Late || ''],
    [info.entryLightning || '', info.entryLightningLate || '']
  ]);
}

exports.getEntryFeesInfo = getEntryFeesInfo_;
exports.setEntryFeesInfo = setEntryFeesInfo_;

function getRaceDateCellRange_(ss) {
  return getMetaInfoCellRange_(ss, 'Entry Fees', [1, 5, 1, 1]);
}

function getRaceDateInfo_(ss) {
  var range =  getRaceDateCellRange_(ss);
  if (range !== null) {
    var values = range.getValues();
    return { raceDate: values[0][0] };
  } else {
    return {};
  }
}

function setRaceDateInfo_(info, ss) {
  getRaceDateCellRange_(ss).setValues([[info.raceDate || '']]);
}

exports.getRaceDateInfo = getRaceDateInfo_;
exports.setRaceDateInfo = setRaceDateInfo_;

function addEntry(items, headers, selectedClass, spreadsheet, isLate) {
  if (!selectedClass) {
    selectedClass = 'Auto';
  }
  if (items.length > 0) {
    var sheetName = ('Auto' === selectedClass) ? getTabName_(items || [], spreadsheet) : selectedClass;
    if (sheetName === null) {
      throw 'Could not find a suitable race';
    }
    addIsLateToEntry_(items, isLate);
    headers.push('Late?');
    var result = addEntryToSheet_(items, headers, sheetName, spreadsheet);
    result.sheetName = sheetName;
    return result;
  } else {
    throw("Nobody was selected");
  }
}

exports.addEntry = addEntry;

function addIsLateToEntry_(members, isLate) {
  var member;
  for (var i = 0; i<members.length; i++) {
    member = members[i];
    member['Late?'] = isLate === true;
  }
}

/**
 * Convert ranking data row to an entry row by translating property names
 */
function rankingToEntryData_(ranking) {
  var entry = {};
  for (var k in ranking) {
    if (ranking.hasOwnProperty(k)) {
      entry[rankingToEntryHeader_(k)] = ranking[k];
    }
  }
  return entry;
}

/**
 * Convert ranking data headers to an entry row headers
 */
function rankingToEntryHeaders_(rankingHeaders) {
  return rankingHeaders.map(function(header) {
    return rankingToEntryHeader_(header);
  });
}

function rankingToEntryHeader_(header) {
  return header.toLowerCase() === "division" ? header.substr(0, 3) : header;
}

function addRowsToSheet_(rows, headers, sheet, rowPosition) {
  // Check that sheet exists!
  if (!sheet) {
    throw("Could not find sheet " + sheetName);
  }
  if (rowPosition > 1) {
    var targetSheetHeaders = tables.getHeaders(sheet),
        headerIndexes = rankingToEntryHeaders_(headers).map(function(header) {
          return targetSheetHeaders.indexOf(header);
        }).filter(function(index) {
          return index >= 0;
        }), minIndex = Math.min.apply(null, headerIndexes), maxIndex = Math.max.apply(null, headerIndexes),
        applyHeaders = targetSheetHeaders.slice(minIndex, maxIndex + 1), convertedRow;

    var rowValues = rows.map(function(row) {
      convertedRow = rankingToEntryData_(row);
      return applyHeaders.map(function (header) {
        var value = convertedRow.hasOwnProperty(header) ? convertedRow[header] : '';
        return value.toUpperCase ? value.toUpperCase() : value;
      });
    });
    var rowRange = sheet.getRange(rowPosition, minIndex + 1, rowValues.length, applyHeaders.length);
    rowRange.setValues(rowValues);
  } else {
    throw 'Cannot add to first row';
  }
}

exports.addRowsToSheet = addRowsToSheet_;

function addEntryToSheet_(rows, headers, sheetName, spreadsheet) {
  var ss = spreadsheet || SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(sheetName);
  // Check that sheet exists!
  if (!sheet) {
    throw("Could not find sheet " + sheetName);
  }
  var nextRows = crewSheets.getAvailableRows(sheet, true, 1, 2),
      nextBoatNum = (nextRows.length > 0) ? nextRows[0][0] : 0,
      nextRowPos = (nextRows.length > 0) ? nextRows[0][1] : 0,
      nextRowSize = (nextRows.length > 0) ? nextRows[0][2] : 0;
  if (nextRowPos > 0) {
    if (nextRowSize !== rows.length) {
      throw("Could not add entry of size " + rows.length + " in row " + nextRowPos + " (" + nextRowSize + " rows available)");
    }
    addRowsToSheet_(rows, headers, sheet, nextRowPos);
  }
  return { boatNumber: nextBoatNum, rowNumber: nextRowPos };
}

/**
 * Calculate the correct combined division given up to two sets of crew details, then return the sheet name that corresponds to that division
 *
 * @param {object} crew1 Object representing the first crew member
 * @param {object} crew2 Object representing the second crew member, may be null for K1
 * @param {object} ss Spreadsheet object to pass to getRaceName(), optional
 * @return {string} Name of the sheet where the entry should be placed for this crew
 */
function getTabName_(crews, ss) {
  var tname = getRaceName_(crews, ss);
  // Lightning tabs are unusual as they contain a space
  var lightningMatch = /^(U?\d{2}) ?([MF])$/.exec(tname);
  if (lightningMatch) {
    tname = lightningMatch[1] + ' ' + lightningMatch[2];
  }
  return tname;
}

/**
 * Calculate the correct combined division given up to two sets of crew details, then return the name of that division
 *
 * @param {object} crew1 Object representing the first crew member
 * @param {object} crew2 Object representing the second crew member, may be null for K1
 * @param {object} ss Spreadsheet object to pass to getRaceName(), optional
 * @return {string} Name of the division
 */
function getRaceName_(crews, ss) {
  var div1 = crews[0]['Division'],
      div2 = null;
  if (crews.length > 1 && crews[1]) {
      div2 = crews[1]['Division'];
  } else {
    return parseInt(div1) ? ("Div" + parseInt(div1)) : div1;
  }
  var combined = combineDivs(div1, div2), // Will come back as '1' or 'U10M'
      combinedInt = parseInt(combined);
  if (combinedInt) {
    if (crews.length > 1) {
      // OLD IMPLEMENTATION
      // return "Div" + combinedInt + "_" + combinedInt
      // NEW IMPLEMENTATION
      // As of 2013 K2 races are now combined for Div1/2 and 3/4.
      // Therefore there is no Div1_1, Div2_2, Div3_3 or Div4_4, only Div1_2 and Div3_4
      var races = racing.getRaceNames(ss), re = /(\d)_(\d)/;
      for (var i=0; i<races.length; i++) {
        var match = races[i].match(re);
        if (match && parseInt(match[1]) <= combinedInt && parseInt(match[2]) >= combinedInt) {
          return "Div" + races[i];
        }
      }
    } else {
      return "Div" + combinedInt;
    }
  } else {
    return combined;
  }
  return null;
}

/**
 * Combine two divisions to get the overall division into which a K2 should be entered
 *
 * @param {string} div1 Division of the first crew member
 * @param {string} div2 Division of the second crew member, may be null for K1
 * @return {string} Name of the combined division
 */
function combineDivs(div1, div2) {
  if (div1 == div2 || div2 === null) {
    return div1;
  }
  if (!parseInt(div1) || !parseInt(div2)) {
    if (div1.indexOf("U10") === 0 && div2.indexOf("U10") === 0) {
      return "HodyU10";
    } else if (div1.indexOf("U12") === 0 && div2.indexOf("U10") === 0) {
      return "HodyU12";
    } else if (div1.indexOf("U10") === 0 && div2.indexOf("U12") === 0) {
      return "HodyU12";
    } else if (div1.indexOf("U12") === 0 && div2.indexOf("U12") === 0) {
      return "HodyU12";
    } else {
      throw "Cannot combine " + div1 + " and " + div2;
    }
  } else {
    var hdiv = Math.max(parseInt(div1), parseInt(div2)),
        ldiv = Math.min(parseInt(div1), parseInt(div2));
    var div = Math.floor((hdiv + ldiv) / 2);
    // Div 1-3 paddlers must race 12 mile course
    if (ldiv <= 3 && div > 3) {
      div = 3;
    }
    return div;
  }
}

function getClubRows(sheet) {
  sheet = sheet || SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Clubs");
  if (sheet !== null && sheet.getLastRow() > 0) {
    return sheet.getRange(1, 1, sheet.getLastRow(), 3).getValues();
  } else {
    return [];
  }
}

exports.getClubRows = getClubRows;

/**
 * Update the existing spreadsheet from a template
 */
function setupRaceFromTemplate(spreadsheet, template, options) {

  var tempSheet = spreadsheet.insertSheet('Temp' + Math.floor(Date.now() / 1000), 0),
    sheets = spreadsheet.getSheets(), templateSheets = template.getSheets();

  options = options || {};

  // Delete preexisting sheets
  for (var i = sheets.length - 1; i > 0; i--) {
    spreadsheet.deleteSheet(sheets[i]);
  }

  var templateId = template.getId();
  var compiledTemplateId = getCompiledTemplateId_(templateId);

  if (compiledTemplateId && compiledTemplateId.value) {
    var compiledTemplate = SpreadsheetApp.openById(compiledTemplateId.value), compiledSheets = compiledTemplate.getSheets();
    for (var k = 0; k < compiledSheets.length; k++) {
      compiledSheets[k].copyTo(spreadsheet).setName(compiledSheets[k].getName());
    }
    var templateRows = templates.getTemplateRows(spreadsheet);
    templates.refreshFormulasAndValidations(templateRows, spreadsheet);
  } else {
    if (template.getSheetByName('Index')) {
      templates.createFromTemplate(template, spreadsheet);
    } else {
      // Copy all template sheets into current
      for (var j = 0; j < templateSheets.length; j++) {
        templateSheets[j].copyTo(spreadsheet).setName(templateSheets[j].getName());
      }
    }
  }

  spreadsheet.deleteSheet(tempSheet);

  setRaceInfo_({
    regionId: options.raceRegion,
    raceName: options.raceName
  }, spreadsheet);

  var ssId = spreadsheet.getId(), sourceRaceType = getRaceType_(templateId);
  setRaceTemplate_(ssId, templateId);
  if (sourceRaceType) {
    setRaceType_(ssId, sourceRaceType.value);
  }
}

exports.setupRaceFromTemplate = setupRaceFromTemplate;

function setRaceTemplate_(spreadsheetId, templateId) {
  drive.savePublicProperty(spreadsheetId, 'hrmTemplate', templateId);
}

function setRaceType_(spreadsheetId, raceType) {
  drive.savePublicProperty(spreadsheetId, 'hrmType', raceType);
}

function getRaceType_(spreadsheetId) {
  return drive.getPublicProperty(spreadsheetId, 'hrmType', null);
}

function getCompiledTemplateId_(spreadsheetId) {
  return drive.getPublicProperty(spreadsheetId, 'compiledTemplate', null);
}