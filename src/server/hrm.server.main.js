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
 * These are designed to be called from a Spreadsheet or from a webapp (TODO: provide doGet() function to implement this)
 */

var dateformat = require('./dateformat');
var publishing = require('./publishing');
var tables = require('./tables');
var racing = require('./racing');
var rankings = require('./rankings');
var templates = require('./templates');
var uiService = require('./ui-service');
var Configuration = require('./libs/lib.configuration');
var SheetsUtilitiesLibrary = require('./libs/lib.utils.sheets');

var STARTS_SHEET_COLUMNS = [[1, 1], ['Race', 'Time']];
var FINISHES_SHEET_COLUMNS = [[1, 2], ['Boat Num', 'Time', 'Notes', 'Time+/-']];

/**
 * Race sheet column names
 */
var raceSheetColumnNames = ["Number", "Surname", "First name", "BCU Number", "Expiry", "Club", "Class", "Div", "Due", "Paid", "Time+/-", "Start", "Finish", "Elapsed", "Posn", "Notes"];
var raceSheetColumnAlignments = ["left", "left", "left", "left", "center", "left", "left", "center", "right", "right", "right", "center", "center", "center", "center", "left"];

var raceSheetColumnWidths = [68, 127, 111, 111, 93, 47, 57, 39, 56, 56, 75, 111, 111, 111, 47, 71];
var printableResultColumnNames = ["Number", "Surname", "First name", "Club", "Class", "Div", "Elapsed", "Posn"];
var printableResultColumnNamesHasler = ["Number", "Surname", "First name", "Club", "Class", "Div", "Elapsed", "Posn", "P/D", "Points"];
var printableEntriesColumnNames = ["Number", "Surname", "First name", "BCU Number", "Expiry", "Club", "Class", "Div", "Due", "Paid"];

/**
 * ID assigned to this library
 */
var PROJECT_ID = "AKfycbzymqCQ6rUDYiNeG63i9vYeXaSE1YtiHDEgRHFQ0TdXaBSwkLs";

var NUMBER_FORMAT_DATE = "dd/MM/yyyy";
var NUMBER_FORMAT_TIME = "[h]:mm:ss";
var NUMBER_FORMAT_CURRENCY = "£0.00";
var NUMBER_FORMAT_INTEGER = "0";

var BCU_NUMBER_REGEXP = '^(\\d+(?:/[A-Z])?|(SCA|WCA) ?\\d+|INT|[A-Z]{3}\\/\\d+|ET [\\w,]+)$';
var BCU_NUMBER_FULL_REGEXP = '^(\\d+(?:/[A-Z])?|(SCA|WCA) ?\\d+|INT)$';
var VALIDATION_MSG_BCU = 'BCU Number must be in the correct format';

var CLASSES_DEFS = [['SMK', 'Senior Male Kayak'],['VMK', 'Veteran Male Kayak'],['JMK', 'Junior Male Kayak'],['SFK', 'Senior Female Kayak'],['VFK', 'Veteran Female Kayak'],['JFK', 'Junior Female Kayak'],['SMC', 'Senior Male Canoe'],['VMC', 'Veteran Male Canoe'],['JMC', 'Junior Male Canoe'],['SFC', 'Senior Female Canoe'],['VFC', 'Veteran Female Canoe'],['JFC', 'Junior Female Canoe']];
var CLASSES_ALL = ['SMK','VMK','JMK','SFK','VFK','JFK','SMC','VMC','JMC','SFC','VFC','JFC'];
var CLASSES_LIGHTNING = ['JMK','JFK'];

exports.CLASSES_DEFS = CLASSES_DEFS;
exports.CLASSES_ALL = CLASSES_ALL;

var DIVS_ALL = ["1","2","3","4","5","6","7","8","9","U12M","U12F","U10M","U10F"];
var DIVS_12_MILE = ["1","2","3","4","5","6","7","8","9"];
var DIVS_8_MILE = ["4","5","6","7","8","9"];
var DIVS_4_MILE = ["5","6","7","8","9","U12M","U12F","U10M","U10F"];
var DIVS_LIGHTNING = ["U12M","U12F","U10M","U10F"];

exports.DIVS_ALL = DIVS_ALL;

var LEVY_SENIOR = 2, LEVY_JUNIOR = 2;

var COLOR_YELLOW = "#ffff99"; // Key columns
var COLOR_BLUE = "#ccffff"; // Value columns

var SHEET_FONT_FAMILY = "Courier New";

var RACE_SHEETS_K4 = [['RaceA', [[101, 10]], 4], ['RaceB', [[201, 10]], 4], ['RaceC', [[301, 10]], 4], ['Rocket', [[1001, 10]], 4]];
var RACE_SHEETS_K2 = [['SMA', [[101, 20]], 2], ['SMB', [[201, 20]], 2], ['SMC', [[301, 20]], 2], ['JMU18', [[401, 20]], 2], ['JMU16', [[501, 20]], 2], ['C2', [[601, 20]], 2], ['SL', [[701, 20]], 2], ['JLU18', [[801, 20]], 2], ['JLU16', [[901, 20]], 2], ['Vet', [[1001, 20]], 2], ['Mix', [[2001, 20]], 2]];
var RACE_SHEETS_HASLER = [
    ['Div1', [[101, 50]], 1], ['Div2', [[201, 50]], 1], ['Div3', [[301, 50]], 1],
    ['Div4', [[401, 50]], 1], ['Div5', [[501, 50]], 1], ['Div6', [[601, 50]], 1],
    ['Div7', [[701, 50], [1701, 50]], 1], ['Div8', [[801, 50], [1801, 50]], 1], ['Div9', [[901, 50], [1901, 50]], 1],
    ['U12 M', [[1001, 50]], 1], ['U12 F', [[2001, 50]], 1], ['U10 M', [[3001, 50]], 1], ['U10 F', [[4001, 50]], 1],
    ['Div1_1', [[151, 49]], 2, true], ['Div2_2', [[251, 49]], 2, false], ['Div3_3', [[351, 49]], 2, true], ['Div4_4', [[451, 49]], 2, false],
    ['Div5_5', [[551, 49]], 2], ['Div6_6', [[651, 49]], 2],
    ['Div7_7', [[751, 49]], 2], ['Div8_8', [[851, 49]], 2], ['Div9_9', [[951, 49]], 2],
    ['U12 MiniK2', [[51, 25]], 2], ['U10 MiniK2', [[76, 25]], 2]
];
var RACE_SHEETS_ASS = [
    ['SMK1', [[101, 49]], 1], ['SLK1', [[201, 49]], 1], ['SMC1', [[301, 49]], 1], ['SLC1', [[401, 49]], 1],
    ['U23_SMK1', [[501, 49]], 1], ['U23_SLK1', [[601, 49]], 1], ['U23_SMC1', [[701, 49]], 1],
    ['JMK1', [[801, 49]], 1], ['JLK1', [[901, 49]], 1], ['JMC1', [[1001, 49]], 1], ['JLC1', [[2001, 49]], 1],
    ['SMK2', [[151, 49]], 2], ['SLK2', [[251, 49]], 2], ['SMC2', [[351, 49]], 2],
    ['JMK2', [[451, 49]], 2], ['JLK2', [[551, 49]], 2], ['JMC2', [[651, 49]], 2]
];
var RACE_SHEETS_NATIONALS = [
    ['U12 M', [[1000, 50]], 1], ['U12 F', [[1050, 50]], 1], ['U10 M', [[1, 50]], 1, 'M'], ['U10 F', [[50, 50]], 1, 'M'],
    ['SMK1', [[1, 40]], 1], ['SLK1', [[40, 30]], 1], ['SC1', [[70, 30]], 1],
    ['U23_SMK1', [[100, 40]], 1], ['U23_SLK1', [[140, 30]], 1],
    ['U18_JMK1', [[200, 40]], 1], ['U18_JLK1', [[470, 30]], 1], ['U18_JC1', [[880, 20]], 1],
    ['U16_JMK1', [[300, 100]], 1], ['U16_JLK1', [[250, 50]], 1],
    ['U14_JMK1', [[400, 70]], 1], ['U14_JLK1', [[550, 50]], 1],
    ['U12_JMK1', [[500, 26]], 1], ['U12_JLK1', [[526, 24]], 1],
    ['O34_VMK1', [[600, 50]], 1], ['O34_VLK1', [[650, 20]], 1],
    ['O39_VMK1', [[700, 50]], 1], ['O39_VLK1', [[750, 10]], 1],
    ['O44_VMK1', [[800, 60]], 1], ['O44_VLK1', [[860, 20]], 1],
    ['O49_VMK1', [[900, 60]], 1], ['O49_VLK1', [[960, 20]], 1],
    ['O54_VMK1', [[1, 50, 'V']], 1], ['O54_VLK1', [[170, 30]], 1],
    ['O59_VMK1', [[770, 30]], 1], ['O59_VLK1', [[670, 15]], 1],
    ['O64_VMK1', [[50, 50, 'V']], 1], ['O64_VLK1', [[685, 15]], 1],
    ['O69_VMK1', [[0, 0, 'V']], 1], ['O69_VLK1', [[0, 0]], 1],
    ['U12 MiniK2', [[860, 40, 'Y']], 2], ['U10 MiniK2', [[770, 30, 'Y']], 2],
    ['SMK2', [[1, 40, 'Y']], 2], ['SLK2', [[50, 20, 'Y']], 2], ['SC2', [[70, 30, 'Y']], 2],
    ['U23_SMK2', [[100, 50, 'Y']], 2], ['U23_SLK2', [[150, 50, 'Y']], 2],
    ['U18_JMK2', [[200, 50, 'Y']], 2], ['U18_JLK2', [[250, 20, 'Y']], 2],
    ['U16_JMK2', [[300, 50, 'Y']], 2], ['U16_JLK2', [[350, 50, 'Y']], 2],
    ['U14_JMK2', [[400, 50, 'Y']], 2], ['U14_JLK2', [[450, 50, 'Y']], 2],
    ['U12_JMK2', [[500, 50, 'Y']], 2], ['U12_JLK2', [[550, 50, 'Y']], 2],
    ['O34_VMK2', [[600, 50, 'Y']], 2], ['O34_VLK2', [[650, 50, 'Y']], 2],
    ['O44_VMK2', [[700, 50, 'Y']], 2], ['O44_VLK2', [[750, 20, 'Y']], 2],
    ['O54_VMK2', [[800, 50, 'Y']], 2], ['O54_VLK2', [[850, 10, 'Y']], 2],
    ['O59_VMK2', [[900, 20, 'Y']], 2], ['O59_VLK2', [[920, 20, 'Y']], 2],
    ['Mixed', [[940, 60, 'Y']], 2]
];
var EXTRA_SHEETS_HASLER = racing.EXTRA_SHEETS_HASLER;
var EXTRA_SHEETS_NON_HASLER = racing.EXTRA_SHEETS_NON_HASLER;
var EXTRA_SHEETS_NATIONALS = racing.EXTRA_SHEETS_NATIONALS;

var PROTECTED_SHEETS = ['Rankings'];

/**
 * Clear all entries in the specified sheet
 */
function clearEntriesSheet_(sheet) {
  if (!sheet) {
    throw "Could not find entries sheet " + sheetName;
  }
  if (sheet.getLastRow() > 2 && sheet.getLastColumn() > 2) {
    sheet.getRange(2, 2, sheet.getLastRow()-1, sheet.getLastColumn()-1).clear({contentsOnly: true, commentsOnly: true, formatOnly: true});
  }
}

function clearAllEntries() {
  var sheets = racing.getRaceSheets();
  for (var i=0; i<sheets.length; i++) {
    clearEntriesSheet_(sheets[i]);
    setRaceSheetFormatting_(sheets[i]);
  }
  setValidation();
  setFormulas();
}

/**
 * Display the dialog used to add Hasler entries from a spreadsheet stored in Google Docs
 *
 * @public
 */
exports.showAddLocalEntries = function showAddLocalEntries() {
  // Dialog height in pixels
  var dialogHeight = 130;

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create the UiInstance object myapp and set the title text
  var app = UiApp.createApplication().setTitle('Add Entries from Spreadsheet').setHeight(dialogHeight);

  // Create a vertical panel called mypanel and add it to myapp
  var mypanel = app.createVerticalPanel().setStyleAttribute("width", "100%");

  var lb = app.createListBox(false).setId('addLocalEntriesSpreadsheetId').setName('spreadsheetId');
  lb.setVisibleItemCount(1);

  // add items to ListBox
  var files = DriveApp.getFilesByType(MimeType.MICROSOFT_EXCEL), file;
  while (files.hasNext()) {
    file = files.next();
    lb.addItem(file.getName(), file.getId());
  }
  mypanel.add(lb);

  var addButton = app.createButton('Add Entries').setId("addLocalEntriesAddBn");
  var addHandler = app.createServerClickHandler('addLocalEntries').addCallbackElement(lb);
  addButton.addClickHandler(addHandler).addClickHandler(app.createClientHandler().forEventSource().setEnabled(false));
  mypanel.add(addButton);

  // Status text
  mypanel.add(app.createHTML("").setId("addLocalEntriesResult").setVisible(false).setSize("100%", "100px").setStyleAttribute("overflow", "scroll"));

  // For the close button, we create a server click handler closeHandler and pass closeHandler to the close button as a click handler.
  // The function close is called when the close button is clicked.
  var closeButton = app.createButton('Done').setId("addLocalEntriesCloseBn").setVisible(false);
  var closeHandler = app.createServerClickHandler('close');
  closeButton.addClickHandler(closeHandler).addClickHandler(app.createClientHandler().forEventSource().setEnabled(false));
  mypanel.add(closeButton);

  // Add my panel to myapp
  app.add(mypanel);

  ss.show(app);
};

/**
 * Display the dialog used to import entries from a CSV file stored in Google Docs
 *
 * @public
 */
exports.showImportEntries = function showImportEntries() {
  // Dialog height in pixels
  var dialogHeight = 130;

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create the UiInstance object myapp and set the title text
  var app = UiApp.createApplication().setTitle('Add Entries from CSV File').setHeight(dialogHeight);

  // Create a vertical panel called mypanel and add it to myapp
  var mypanel = app.createVerticalPanel().setStyleAttribute("width", "100%");
  //    upload = app.createFileUpload().setName('csvfile');

  var lb = app.createListBox(false).setId('importEntriesFileId').setName('spreadsheetId');
  lb.setVisibleItemCount(1);

  // add items to ListBox
  var files = DriveApp.getFilesByType(MimeType.CSV), file;
  while (files.hasNext()) {
    file = files.next();
    lb.addItem(file.getName(), file.getId());
  }
  mypanel.add(lb);
  //mypanel.add(upload);

  var addButton = app.createButton('Import Entries').setId("importEntriesAddBn");
  var addHandler = app.createServerClickHandler('importEntries').addCallbackElement(lb);
  addButton.addClickHandler(addHandler).addClickHandler(app.createClientHandler().forEventSource().setEnabled(false));
  mypanel.add(addButton);

  // Status text
  mypanel.add(app.createHTML("").setId("importEntriesResult").setVisible(false).setSize("100%", "100px").setStyleAttribute("overflow", "scroll"));

  // For the close button, we create a server click handler closeHandler and pass closeHandler to the close button as a click handler.
  // The function close is called when the close button is clicked.
  var closeButton = app.createButton('Done').setId("importEntriesCloseBn").setVisible(false);
  var closeHandler = app.createServerClickHandler('close');
  closeButton.addClickHandler(closeHandler).addClickHandler(app.createClientHandler().forEventSource().setEnabled(false));
  mypanel.add(closeButton);

  // Add my panel to myapp
  app.add(mypanel);

  ss.show(app);
};

/**
 * Handler for importing entries from a CSV file stored in Google Docs. This is intended to be called when the dialog's submit button is clicked.
 * TODO Support keeping boat numbers
 * TODO Ensure that the first member of each crew 'lines up' with a boat number in the destination sheet
 *
 * @param {object} eventInfo Event information
 * @return {AppInstance} Active application instance
 */
exports.importEntries = function importEntries(eventInfo) {
  var app = UiApp.getActiveApplication();
  var csvId = eventInfo.parameter.spreadsheetId;
  if (csvId)
  {
    var csv = DriveApp.getFileById(csvId),
        csvData = Utilities.parseCsv(csv.getBlob().getDataAsString().replace(/\r\n/g, " ")),
        rows, results = [], numCrewsByRace = {},
        startRow = 1, // Assume a header row exists
        newRows = {};

    for (var i=startRow; i<csvData.length; i++) {
      // "Date","First Name","Last Name","Club","Class","BCU Number","Marathon Ranking","First Name","Last Name","Club","Class","BCU Number","Marathon Ranking","Race Class"
      if (csvData[i].length == csvData[0].length) {
        var csvRow = arrayZip(csvData[0], csvData[i]);
        var raceClass = csvRow["Race Class"];
        if (raceClass !== null && raceClass !== "") {
          newRows[raceClass] = newRows[raceClass] || [];
          numCrewsByRace[raceClass] = numCrewsByRace[raceClass] || 0;
          newRows[raceClass].push({
            "Number": csvRow["#"] || 1,
            "Surname": csvRow["Last Name (1)"].toUpperCase(),
            "First name": csvRow["First Name (1)"].toUpperCase(),
            "BCU Number": csvRow["BCU Number (1)"].toUpperCase(),
            "Club": csvRow["Club (1)"],
            "Class": csvRow["Class (1)"],
            "Div": csvRow["Ranking (1)"],
            "Due": csvRow["Payment Amount"],
            "Paid": csvRow["Paid"]
          },{
            "Surname": csvRow["Last Name (2)"].toUpperCase(),
            "First name": csvRow["First Name (2)"].toUpperCase(),
            "BCU Number": csvRow["BCU Number (2)"].toUpperCase(),
            "Club": csvRow["Club (2)"],
            "Class": csvRow["Class (2)"],
            "Div": csvRow["Ranking (2)"]
          }); // Surname, First name, BCU Number, Club, Class, Div
          numCrewsByRace[raceClass] ++;
        } else {
          throw "Race class must be defined";
        }
      }
    }

    for (var raceName in newRows) {
      if (newRows.hasOwnProperty(raceName)) {
        rows = newRows[raceName];
        if (rows.length === 0) {
          Logger.log("No rows for sheet " + raceName);
          continue;
        } else {
          Logger.log("" + rows.length + " rows for sheet " + raceName);
        }
        var newResults = appendEntryRows(rows, raceName);
        results = results.concat(newResults);
      }
    }

    app.getElementById("importEntriesFileId").setVisible(false);
    app.getElementById("importEntriesAddBn").setVisible(false);
    app.getElementById("importEntriesResult").setHTML(results.join("<br />")).setVisible(true);
    app.getElementById("importEntriesCloseBn").setVisible(true);
  } else {
    throw "Could not locate source spreadsheet";
  }

  return app;
};

function addEntrySets(ssId, entrySets) {
  var ENTRY_SETS_SHEET_NAME = 'Entry Sets';
  var MEMBERSHIP_PROOF_SHEET_NAME = 'Memberships';
  var ENTRY_SETS_COLUMNS = ['ID', 'Name', 'Club', 'Email', 'Phone', 'Team Leader?', 'Entered', 'Due', 'Paid', 'Added'];
  var MEMBERSHIP_PROOF_COLUMNS = ['Surname', 'First name', 'Club', 'Class', 'BCU Number', 'Expiry', 'Member name'];
  // First make sure we have a sheet called Entry Sets
  var ss = SpreadsheetApp.openById(ssId);
  var added = new Date();
  var results = [];
  var membershipProofRows = [];
  if (ss) {
    var raceSheetNames = racing.getRaceSheetNames(ss);
    var entrySetsSheet = ss.getSheetByName(ENTRY_SETS_SHEET_NAME) || ss.insertSheet(ENTRY_SETS_SHEET_NAME);
    entrySetsSheet.getRange(1, 1, 1, ENTRY_SETS_COLUMNS.length).setValues([ENTRY_SETS_COLUMNS]);
    var membershipProofsSheet = ss.getSheetByName(MEMBERSHIP_PROOF_SHEET_NAME) || ss.insertSheet(MEMBERSHIP_PROOF_SHEET_NAME);
    membershipProofsSheet.getRange(1, 1, 1, MEMBERSHIP_PROOF_COLUMNS.length).setValues([MEMBERSHIP_PROOF_COLUMNS]);
    var entriesToAdd = {};
    var availablePlacesBySheet = {};
    var getAvailablePlaces = function(raceName) {
      availablePlacesBySheet[raceName] = availablePlacesBySheet[raceName] || getNextEntryRows(ss.getSheetByName(raceName));
      return availablePlacesBySheet[raceName];
    };
    var getTotalPaidForEntrySet = function(entrySet) {
      return entrySet.payments.reduce(function(total, payment) {
        return total + (payment.type = 'paypal' && payment.state == 'approved' ? parseFloat(payment.amount) : 0);
      }, 0);
    };
    var entrySetRows = entrySets.map(function(entrySet) {
      return {
        'ID': entrySet.id,
        'Name': entrySet.name,
        'Club': entrySet.club,
        'Email': entrySet.email,
        'Phone': entrySet.phone,
        'Team Leader?': entrySet.isTeamLeader ? 'Y' : '',
        'Entered': dateformat.parseDate(entrySet.enteredOn),
        'Due': parseFloat(entrySet.due) || '',
        'Paid': parseFloat(getTotalPaidForEntrySet(entrySet)) || '',
        'Added': added
      };
    });
    entrySets.forEach(function(entrySet) {
      var totalDue = 0;
      var totalPaid = getTotalPaidForEntrySet(entrySet);
      entrySet.entries.forEach(function(entries) {
        var raceClass = entries.raceClass;
        var entriesList = entries.list;
        // Add payment info
        entriesList.forEach(function(entryCrew) {
          entryCrew.forEach(function(crewMember) {
            var dueAmount = parseFloat(crewMember.due || 0);
            totalDue += dueAmount;
            if (totalPaid > 0) {
              crewMember.paid = dueAmount;
            }
            crewMember.setId = entrySet.id;
            if (crewMember.membershipProof) {
              if (crewMember.membershipProof.type == 'upload' && crewMember.membershipProof.uploads) {
                crewMember.membershipProof.uploads.forEach(function(upload) {
                  var parsedResult = upload.parsedResults[0];
                  membershipProofRows.push({
                    'Surname': crewMember.surname,
                    'First name': crewMember.firstName,
                    'Club': crewMember.club,
                    'Class': crewMember.className,
                    'BCU Number': parsedResult ? parsedResult.number : '',
                    'Expiry': parsedResult ? dateformat.parseDate(parsedResult.expiry) : '',
                    'Member name': parsedResult ? parsedResult.name : ''
                  });
                });
              } else if (crewMember.membershipProof.type == 'et') {
                crewMember.membershipNumber = 'ET ' + entrySet.race.code;
                crewMember.membershipExpiry = entrySet.race.raceDate;
              }
            }
          });
        });
        if (raceSheetNames.indexOf(raceClass) > -1) {
          entriesToAdd[raceClass] = (entriesToAdd[raceClass] || []).concat(entriesList);
          if (getAvailablePlaces(raceClass).length < entriesToAdd[raceClass].length) { // TODO check size of slots is correct as well
            throw 'Not enough places to import race class ' + raceClass + ' in entry set ' + entrySet.id +
              ' (needs ' + entriesToAdd[raceClass].length + ', found ' + getAvailablePlaces(raceClass).length + ')';
          }
        } else {
          throw 'Could not find race sheet for ' + raceClass;
        }
      });
      if (totalPaid > 0 && totalDue !== totalPaid) {
        throw 'Paid amount ' + totalPaid + ' does not match total due amount ' + totalDue;
      }
    });
    // Run through each race in the set of entries
    //  and check the race sheet exists
    //  if so then check the number of available spaces
    // and if more spaces are available then add
    for (var raceName in entriesToAdd) {
      if (entriesToAdd.hasOwnProperty(raceName)) {
        var addtoSheet = ss.getSheetByName(raceName);
        var availablePlaces = getAvailablePlaces(raceName);
        var entryRows = entriesToAdd[raceName].reduce(function(existing, entries) {
          return existing.concat(entries.map(function(entry) {
            return {
              'Surname': entry.surname,
              'First name': entry.firstName,
              'BCU Number': entry.membershipNumber,
              'Expiry': dateformat.parseDate(entry.membershipExpiry),
              'Club': entry.club,
              'Class': entry.className,
              'Div': entry.division,
              'Due': parseFloat(entry.due) || '',
              'Paid': entry.paid || '',
              'Set': entry.setId
            };
          }));
        }, []);
        tables.setValues(addtoSheet, entryRows, 'Surname', 'Paid', availablePlaces[0][1]);
      }
    }
    // TODO need to add 'Set ID' column to race sheets
    tables.setValues(membershipProofsSheet, membershipProofRows, null, null, membershipProofsSheet.getLastRow()+1);
    tables.setValues(entrySetsSheet, entrySetRows, null, null, entrySetsSheet.getLastRow()+1);
    return results;
  } else {
    throw 'Spreadsheet with ID ' + ssId + ' could not be found';
  }
}

exports.addEntrySets = addEntrySets;

function getRaceInfoCellRange_(sheet) {
  sheet = sheet || SpreadsheetApp.getActiveSpreadsheet();
  var clubsSheet = sheet.getSheetByName("Clubs");
  if (clubsSheet) {
    return clubsSheet.getRange(1, 19, 1, 2);
  } else {
    return null;
  }
}

function setRaceInfo_(info, sheet) {
  getRaceInfoCellRange_(sheet).setValues([[info.regionId || '', info.raceName || '']]);
}

exports.setRaceInfo = setRaceInfo_;

function getRaceInfo(sheet) {
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

exports.getRaceInfo = getRaceInfo;

function getRaceNameCellRange_(sheet) {
  sheet = sheet || SpreadsheetApp.getActiveSpreadsheet();
  var clubsSheet = sheet.getSheetByName("Clubs");
  if (clubsSheet) {
    return clubsSheet.getRange(1, 20);
  }
}

function getRegionCellRange_(sheet) {
  sheet = sheet || SpreadsheetApp.getActiveSpreadsheet();
  var clubsSheet = sheet.getSheetByName("Clubs");
  if (clubsSheet) {
    return clubsSheet.getRange(1, 19);
  }
}

function findMatchingRaceSheet(raceName, sheets) {
  var ass = SpreadsheetApp.getActiveSpreadsheet(), sheet = null;
  if (!sheets) { // First try simple match
    sheet = ass.getSheetByName(raceName);
  }
  if (sheet === null) {
    var k2re = /Div(\d)_(\d)/, nameMatch = raceName.match(k2re);
    if (nameMatch) { // K2 divisional race?
      sheets = sheets || ass.getSheets(); // Fall back to active SS sheets if no list provided
      for (var i=0; i<sheets.length; i++) {
        var match = sheets[i].getName().match(k2re);
        // Does the potential destination sheet 'include' the source sheet? e.g. Div3_4 includes Div3_3 and Div4_4, Div 4_6 (hypothetical) would include Div5_6
        if (match && parseInt(match[1]) <= parseInt(nameMatch[1]) && parseInt(match[2]) >= parseInt(nameMatch[2])) {
          sheet = sheets[i];
          break;
        }
      }
    }
    return sheet;
  }
  return sheet;
}

function appendEntryRows(rows, sheetName) {
  var dstsheet = findMatchingRaceSheet(sheetName), results = [], numCrews = 0, totalPaid = 0;
  if (dstsheet !== null) {
    // Find the latest row with a number but without a name in the sheet
    var dstSheetName = dstsheet.getName(), lastRow = dstsheet.getLastRow(), nextRow = getNextEntryRow(dstsheet);
    if (nextRow > 0) {
      Logger.log("Adding new rows at row " + nextRow);
      rows.forEach(function(row) {
        if (row["Surname"] || row["First name"]) {
          if (row["Number"]) {
            numCrews ++;
          }
          if (row["Paid"]) {
            totalPaid += +row["Paid"];
          }
        }
      });
      Logger.log("" + numCrews + " crews for sheet " + sheetName);
      if (numCrews === 0) {
        return;
      }
      if (lastRow-nextRow+1 >= rows.length) {
        tables.setValues(dstsheet, rows, "Surname", "Paid", nextRow); // TODO Allow numbers to be added
        results.push("Added " + numCrews + " crews to " + dstSheetName + (totalPaid > 0 ? (", Paid £" + totalPaid) : ""));
      } else {
        throw "Too many rows to import into " + dstSheetName + " (" + rows.length + " data rows, " + (lastRow-nextRow+1) + " in sheet)";
      }
    } else {
      throw("No space left in sheet " + dstSheetName);
    }
  } else {
    throw("Destination for sheet " + sheetName + " not found");
  }
  return results;
}

/**
 * Handler for adding entries from a spreadsheet stored in Google Docs. This is intended to be called when the dialog's submit button is clicked.
 * TODO Support keeping boat numbers
 * TODO Ensure that the first member of each crew 'lines up' with a boat number in the destination sheet
 *
 * @param {object} eventInfo Event information
 * @return {AppInstance} Active application instance
 */
exports.addLocalEntries = function addLocalEntries(eventInfo) {
  var app = UiApp.getActiveApplication();
  // Because the list box was named "spreadsheetId" and added as a callback element to the
  // button's click event, we have its value available in eventInfo.parameter.spreadsheetId.
  var ssId = eventInfo.parameter.spreadsheetId, srcRows;
  if (ssId)
  {
    var driveFile = DriveApp.getFileById(ssId);
    if (driveFile.getMimeType() === MimeType.MICROSOFT_EXCEL) {
      ssId = uploadAndConvertHRMFile(driveFile).id;
    }
    var ss = SpreadsheetApp.openById(ssId),
        sheets = racing.getRaceSheets(ss), sheet, sheetName, results = [], lastNonEmpty = 0;

    var iterFn = function(row, i) {
      if (row["Surname"] || row["First name"]) {
        lastNonEmpty = i;
      }
    };
    for (var i=0; i<sheets.length; i++) {
      sheet = sheets[i];
      sheetName = sheet.getName();
      srcRows = tables.getRows(sheet);
      srcRows.forEach(iterFn);
      srcRows = srcRows.slice(0, lastNonEmpty+1);
      var newResults = appendEntryRows(srcRows, sheetName);
      results = results.concat(newResults);
    }

    app.getElementById("addLocalEntriesSpreadsheetId").setVisible(false);
    app.getElementById("addLocalEntriesAddBn").setVisible(false);
    app.getElementById("addLocalEntriesResult").setHTML(results.join("<br />")).setVisible(true);
    app.getElementById("addLocalEntriesCloseBn").setVisible(true);
  } else {
    throw "Could not locate source spreadsheet";
  }

  return app;
};

function uploadAndConvertHRMFile(driveFile) {
  var newBlob = doHRMConversion(driveFile).getBlob();
  var sourceFileParents = driveFile.getParents();
  var file = {
    title: driveFile.getName().replace(/\.xlsx?$/, ''),
    parents: sourceFileParents.length === 1 ? sourceFileParents : [ DriveApp.getRootFolder() ]
  };
  file = Drive.Files.insert(file, newBlob, {
    convert: true
  });
  return file
}

function doHRMConversion(file) {
  var conversionUrl = 'https://hrmio.herokuapp.com/public/upload';
  return doMultipartPost(conversionUrl, file);
}

function doMultipartPost(url, file) {
  var boundary = "xxxxxxxxxx";
  var payload = Utilities.newBlob(
    "--"+boundary+"\r\n"
    + "Content-Disposition: form-data; name=\"file\"; filename=\""+file.getName()+"\"\r\n"
    + "Content-Type: " + file.getMimeType()+"\r\n\r\n").getBytes()
    .concat(file.getBlob().getBytes())
    .concat(Utilities.newBlob("\r\n--"+boundary+"--\r\n").getBytes());
  var options = {
    method : "post",
    contentType : "multipart/form-data; boundary=" + boundary,
    payload : payload
  };
  return UrlFetchApp.fetch(url, options);
}


/**
 * Return a new object generated by assigning the specified values to the set of object properties with the given keys.
 */
function arrayZip(keys, values)
{
  if (typeof keys.length != "number")
    throw "Keys must be an array";
  if (typeof values.length != "number")
    throw "Values must be an array";
  if (keys.length != values.length)
    throw "Keys and values arrays must be the same length";
  var obj = {};
  for (var i = 0; i < keys.length; i++) {
    obj[keys[i]] = values[i];
  }
  return obj;
}

function objUnzip(obj, keys, ignoreMissing, defaultValue) {
  var k, values = [];
  ignoreMissing = typeof ignoreMissing != "undefined" ? ignoreMissing : false;
  for (var i = 0; i < keys.length; i++) {
    k = keys[i];
    if (typeof obj[k] != "undefined") {
      values.push(obj[k]);
    } else {
      if (ignoreMissing !== true) {
        if (typeof defaultValue != "undefined") {
          values.push(defaultValue);
        } else {
          throw "Value for key " + k + " cannot be missing and a default value was not provided";
        }
      } else {
        // Do nothing since we should ignore the property
      }
    }
  }
  return values;
}

function addEntry(items, headers, selectedClass, spreadsheet, isLate) {
  if (!selectedClass) {
    selectedClass = 'Auto';
  }
  if (items.length > 0) {
    var sheetName = ('Auto' == selectedClass) ? getTabName_(items || [], spreadsheet) : selectedClass;
    if (sheetName === null) {
      throw 'Could not find a suitable race';
    }
    var crewsAddedDue = addDueAmountToEntry_(items, selectedClass, spreadsheet, isLate);
    if (crewsAddedDue) {
      headers.push('Due');
    }
    var result = addEntryToSheet_(items, headers, sheetName, spreadsheet);
    result.sheetName = sheetName;
    return result;
  } else {
    throw("Nobody was selected");
  }
}

exports.addEntry = addEntry;

function addDueAmountToEntry_(members, raceName, spreadsheet, isLate) {
  var sheetUtils = new SheetsUtilitiesLibrary({});
  spreadsheet = spreadsheet || sheetUtils.getCurrentActiveSpreadsheet();
  var driveProps = getDriveProperties(spreadsheet.getId()), member;
  isLate = isLate === true;
  var entrySenior = isLate ? driveProps.entrySeniorLate : driveProps.entrySenior;
  var entryJunior = isLate ? driveProps.entryJuniorLate : driveProps.entryJunior;
  var entryLightning = isLate ? driveProps.entryLightningLate : driveProps.entryLightning;
  if (entrySenior && entryJunior) {
    for (var i = 0; i<members.length; i++) {
      member = members[i];
      if (isLightningRaceName_(raceName)) {
        member['Due'] = entryLightning || null;
      }
      if (member['Class']) {
        member['Due'] = member['Class'].indexOf('J') > -1 ? entryJunior : entrySenior;
      }
    }
    return members;
  }
  return null;
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
  return header.toLowerCase() == "division" ? header.substr(0, 3) : header;
}

/**
 * Look through all the current entries and update BCU Number and Expiry with new data from the memberships sheet
 *
 * @public
 */
exports.updateEntriesFromMemberships = function updateEntriesFromMemberships() {
  var replaceExisting = true;
  var ss = SpreadsheetApp.getActiveSpreadsheet(), membershipsSheet = ss.getSheetByName('Memberships'), sheets = racing.getRaceSheets(ss);
  var membershipsData = tables.getRows(membershipsSheet), sheet;
  for (var i = 0; i < sheets.length; i++) {
    sheet = sheets[i];
    var raceData = tables.getRows(sheet);
    if (raceData.length > 0) {
      for (var j = 0; j < raceData.length; j++) {
        if (raceData[j]['Surname'] || raceData[j]['First name']) {
          var matches = tables.lookupInTable(membershipsData, [
            {name: 'Surname', value: raceData[j]['Surname']},
            {name: 'First name', value: raceData[j]['First name']},
            {name: 'Club', value: raceData[j]['Club']},
            {name: 'Class', value: raceData[j]['Class']}
          ]);
          if (matches.length == 1) {
            // Logger.log("Found match: " + matches[0]);
            var update = matches[0];
            for (var p in update) {
              if (update.hasOwnProperty(p) && (raceData[j][p] === '' || replaceExisting === true)) {
                Logger.log(raceData[j]['First name'] + ' ' + raceData[j]['Surname'] + ': Set ' + p + ': ' + update[p]);
                raceData[j][p] = update[p];
              }
            }
          }
        }
      }
      tables.setValues(sheet, raceData, 'BCU Number', 'Expiry', null, false);
    }
  }
};

/**
 * Look through all the current entries and update with any new data from the rankings sheet
 *
 * @public
 */
exports.updateEntriesFromRankings = function updateEntriesFromRankings(replaceExisting) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), rankingsSheet = ss.getSheetByName("Rankings"), sheets = racing.getRaceSheets(ss);
  var rankingData = tables.getRows(rankingsSheet, true), sheet;
  for (var i = 0; i < sheets.length; i++) {
    sheet = sheets[i];
    var raceData = tables.getRows(sheet, true);
    if (raceData.length > 0) {
      for (var j = 0; j < raceData.length; j++) {
        var bcuNum = raceData[j]['bcu number'], classAbbr = raceData[j]['class'], bcuMatch = /(\d+)/.exec(bcuNum);
        if (bcuMatch) {
          Logger.log("BCU Number: " + bcuMatch[1]);
          var matches = tables.lookupInTable(rankingData, [
            {name: 'bcu number', type: 'regexp', value: new RegExp('^' + bcuMatch[1] + '/?[A-Za-z]?$')},
            {name: 'class', value: classAbbr}
          ]);
          if (matches.length == 1) {
            Logger.log("Found match: " + matches[0]);
            var update = rankingToEntryData_(matches[0]);
            for (var p in update) {
              if (update.hasOwnProperty(p) && (raceData[j][p] === '' || replaceExisting === true)) {
                Logger.log("Set " + p + ": " + update[p]);
                raceData[j][p] = update[p];
              }
            }
          }
        }
      }
      //tables.setValues(sheet, raceData, "Surname", "Div");
      tables.setValues(sheet, raceData, "expiry", "expiry", null, true);
    }
  }
};

/**
 * Look through all the current entries and flag any where data is not consistent with the rankings sheet
 */
function checkEntriesFromRankings_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), rankingsSheet = ss.getSheetByName("Rankings"), sheets = racing.getRaceSheets(ss), warnings = [];
  var rankingData = tables.getRows(rankingsSheet), sheet;
  var buildIdentity = function(row) {
    return '' + row['Surname'] + ', ' + row['First name'] + ' (' + row['Club'] + ')';
  };
  for (var i = 0; i < sheets.length; i++) {
    sheet = sheets[i];
    var raceData = tables.getRows(sheet);
    if (raceData.length > 0) {
      for (var j = 0; j < raceData.length; j++) {
        if (raceData[j]['Surname'] || raceData[j]['First name']) {
          var columns = ['Div', 'BCU Number', 'Expiry'];
          var boatNum = raceData[j]['Number'] || raceData[j-1]['Number'], bcuNum = raceData[j]['BCU Number'];
          if (bcuNum) {
            var matches = tables.lookupInTable(rankingData, [
              {name: 'Surname', value: raceData[j]['Surname']},
              {name: 'First name', value: raceData[j]['First name']},
              {name: 'Club', value: raceData[j]['Club']},
              {name: 'Class', value: raceData[j]['Class']}]);
            if (matches.length === 0 && !(typeof bcuNum == 'string' && bcuNum.indexOf('ET ') === 0)) { // Try again based on BCU number
              matches = tables.lookupInTable(rankingData, [
                {name: 'BCU Number', value: raceData[j]['BCU Number']}
              ]);
              columns = ['Div', 'Club', 'Surname', 'First name', 'Class', 'Expiry'];
            }
            if (matches.length === 1) {
              Logger.log("Found match: " + matches[0]);
              var update = rankingToEntryData_(matches[0]);
              for (var p in update) {
                if (update.hasOwnProperty(p)) {
                  if (columns.indexOf(p) > -1 && raceData[j][p] != update[p] && ("" + raceData[j][p]).trim() != ("" + update[p]).trim()) {
                    warnings.push(boatNum + ' ' + buildIdentity(raceData[j]) + ': Expected ' + p + " '" + update[p] + "', found '" + raceData[j][p] + "'");
                  }
                }
              }
            } else if (matches.length === 0) {
              warnings.push(boatNum + ' ' + buildIdentity(raceData[j]) + ": not found!");
            } else {
              warnings.push(boatNum + ' ' + buildIdentity(raceData[j]) + ": found multiple matches");
            }
          } else {
            warnings.push(boatNum + ' ' + buildIdentity(raceData[j]) + ": No BCU Number");
          }
        }
      }
    }
  }
  uiService.showDialog('Check Entries', warnings.length > 0 ? '<p>' + warnings.join('<br/>') + '</p>' : '<p>No problems found</p>');
}

/**
 * Return a full list of the taken entry placeholders on the given sheet
 * TODO This can be replaced with getEntryRowData()
 *
 * @return {array} Array of three-element arrays with the first element of each member representing the boat number, the second the row number and the second the number of rows available in the entry
 */
function getEntryRows(sheet) {
  Logger.log("getEntryRows: Sheet " + sheet.getName());
  // Find the latest row with a number but without a name in the sheet
  var range = sheet.getRange(2, 1, sheet.getLastRow()-1, 4), values = range.getValues(), rows = [], currEntry = null;
  for (var i=0; i<values.length; i++) {
    if (values[i][0] && !((""+values[i][1]).trim() === "" && (""+values[i][2]).trim() === "" && (""+values[i][3]).trim() === "")) { // Number present and a name or BCU number
      Logger.log("getEntryRows: Add " + values[i][0]);
      if (currEntry !== null) {
        rows.push(currEntry);
      }
      currEntry = [values[i][0], i+2, 1];
    } else if ((""+values[i][0]).trim() === "") { // No number
      if (currEntry !== null) {
        currEntry[2] ++;
      }
    } else { // Number present but no details, this is not a completed entry
      if (currEntry !== null) {
        rows.push(currEntry);
      }
      currEntry = null;
    }
  }
  // There may still be an entry in the buffer
  if (currEntry !== null) {
    rows.push(currEntry);
  }
  return rows;
}

/**
 * Return a full list of the spreadsheet rows, grouped into entries
 *
 * @param {object} range Range object to retrieve data from
 * @param {Boolean} returnEmptyEntries Set to true if you want to return entries without any data in them i.e. just the numbers
 * @return {array} Array of objects, each object represents an entry and includes the raw values from the rows
 */
function getEntryRowData(range, returnEmptyEntries) {
  // Find the latest row with a number but without a name in the sheet
  var values = range.getValues(), rows = [], currEntry = null, headers, startRow = 0;
  if (range.getRow() === 1) { // has the header row been included?
    headers = values[0];
    startRow = 1;
  }
  for (var i=startRow; i<values.length; i++) {
    if (returnEmptyEntries || values[i][0] && !((""+values[i][1]).trim() === "" && (""+values[i][2]).trim() === "" && (""+values[i][3]).trim() === "")) { // Number present and a name or BCU number
      Logger.log("getEntryRowValues: Add " + values[i][0]);
      if (currEntry !== null) {
        rows.push(currEntry);
      }
      currEntry = {
        boatNumber: values[i][0],
        rowNumber: range.getRow() + i,
        values: [values[i]],
        rows: headers ? [arrayZip(headers, values[i])] : null,
        sheet: range.getSheet()
      };
    } else if ((""+values[i][0]).trim() === "") { // No number
      if (currEntry !== null) {
        currEntry.values.push(values[i]);
        if (headers) {
          currEntry.rows.push(arrayZip(headers, values[i]));
        }
      }
    } else { // Number present but no details, this is not a completed entry
      if (currEntry !== null) {
        rows.push(currEntry);
      }
      currEntry = null;
    }
  }
  // There may still be an entry in the buffer
  if (currEntry !== null) {
    rows.push(currEntry);
  }
  return rows;
}

/**
 * Return a full list of the remaining entry placeholders on the given sheet
 *
 * @return {array} Array of three-element arrays with the first element of each member representing the boat number, the second the row number and the second the number of rows available in the entry
 */
function getNextEntryRows(sheet) {
  // Find the latest row with a number but without a name in the sheet
  var range = sheet.getRange(2, 1, sheet.getLastRow()-1, 2), values = range.getValues(), rows = [], currEntry = null;
  for (var i=0; i<values.length; i++) {
    if (values[i][0] && values[i][1] === "") { // Number present but no name
      if (currEntry !== null) {
        rows.push(currEntry);
      }
      currEntry = [values[i][0], i+2, 1];
    } else if ((""+values[i][0]).trim() === "" && values[i][1] === "") { // No number, no name
      if (currEntry !== null) {
        currEntry[2] ++;
      }
    } else { // Name present but no number, entry is not valid
      currEntry = null;
    }
  }
  // There may still be an entry in the buffer
  if (currEntry !== null) {
    rows.push(currEntry);
  }
  return rows;
}

/**
 * Find the latest row with a number but without a name in the sheet
 *
 * @return {int} Row number, or zero if no matching row is found (i.e. all entry spots are taken already)
 */
function getNextEntryRow(sheet) {
  var range = sheet.getRange(2, 1, sheet.getLastRow()-1, 2), values = range.getValues();
  for (var i=0; i<values.length; i++) {
    if (values[i][0] && values[i][1] === "") {
      return i+2;
    }
  }
  return 0;
}

/**
 * Find the last row in the given sheet with a race number, regardless of whether the row contains an entry or not
 *
 * @return {int} Row number of the last row with a boat number, or zero if no race numbers are present in the first column
 */
function getLastEntryRowNumber(sheet) {
  Logger.log("Getting last entry row number in sheet " + sheet.getName());
  var range = sheet.getRange(2, 1, sheet.getLastRow()-1, 1), values = range.getValues(), lastBn = "_", lastN = 0;
  Logger.log("Found " + values.length + " rows");
  for (var i=0; i<values.length; i++) {
    if (values[i][0]) {
      Logger.log("Found boat number " + values[i][0]);
      lastN = range.getRow() + i; // Current row number
      // Bit of a hacky way to account for K2s, where we should leave an extra row at the bottom
      if (lastBn === "") {
        lastN ++;
      }
    }
    lastBn = values[i][0];
  }
  return lastN;
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
  var nextRows = getNextEntryRows(sheet),
      nextBoatNum = (nextRows.length > 0) ? nextRows[0][0] : 0,
      nextRowPos = (nextRows.length > 0) ? nextRows[0][1] : 0,
      nextRowSize = (nextRows.length > 0) ? nextRows[0][2] : 0;
  if (nextRowPos > 0) {
    if (nextRowSize != rows.length) {
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

/**
 * Return true if the current spreadsheet represents a race within the Hasler system, false otherwise
 */
function isHaslerRace(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName("PandD") !== null;
}

/**
 * Return the xRM race type as a string, all uppercase
 */
function getRaceType(ss) {
  ss = ss || SpreadsheetApp.getActiveSpreadsheet();
  var firstSheetName = ss.getSheets()[0].getName();
  if (firstSheetName == RACE_SHEETS_HASLER[0][0]) {
    return "HRM";
  } else if (firstSheetName == RACE_SHEETS_ASS[0][0]) {
    return "ARM";
  } else if (firstSheetName == RACE_SHEETS_NATIONALS[0][0]) {
    return "NRM";
  } else {
    return null;
  }
}

/**
 * Save entries in HTML format
 */
exports.saveEntriesHTML = function saveEntriesHTML(ss) {
  var htmlFile = publishing.saveEntriesHTML(ss);
  uiService.showLinkDialog('Publish HTML',
    "<p>Race entries published to Google Drive:</p>",
    "https://drive.google.com/file/d/" + htmlFile.getId() + "/view"
  );
  return {fileId: htmlFile.getId()};
};

/**
 * Save results in HTML format
 *
 * @public
 * @param {object} e Event information
 */
exports.saveResultsHTML = function saveResultsHTML(ss) {
  var htmlFile = publishing.saveResultsHTML(ss);
  uiService.showLinkDialog('Publish HTML',
    "<p>Race results published to Google Drive:</p>",
    "https://drive.google.com/file/d/" + htmlFile.getId() + "/view"
  );
  return {fileId: htmlFile.getId()};
};

/**
 * Display the URL for accessing results
 */
function showWebURL(type) {
  // Create the UiInstance object myapp and set the title text
  var ss = SpreadsheetApp.getActiveSpreadsheet(), capitalizedType = type.charAt(0).toUpperCase() + type.slice(1),
    url = "https://script.google.com/macros/exec?service=" + PROJECT_ID + "&key=" + ss.getId() + "&show=" + type;
  uiService.showLinkDialog('View ' + capitalizedType + ' Summary',
    "<p>Use this link to access the live " + type + ":</p>",
    url);
}

/**
 * Display the URL for accessing results
 *
 * @public
 */
exports.showResultsURL = function showResultsURL() {
  showWebURL("results");
};

/**
 * Display the URL for accessing results
 *
 * @public
 */
exports.showEntriesURL = function showEntriesURL() {
  showWebURL("entries");
};

function isLightningRaceName_(raceName) {
  return /U1[02] ?[MF]/i.exec(raceName) !== null || raceName.indexOf("Hody") === 0;
}

/**
 * Display the total sum owed in race levies (£2 per senior, £1 per junior)
 *
 * @public
 */
exports.showRaceLevies = function showRaceLevies(scriptProps) {
  var totalJnr = 0, totalSnr = 0, totalLightning = 0, totalReceived = 0, totalDue = 0;
  var sheets = racing.getRaceSheets(), sheet;
  for (var i=0; i<sheets.length; i++) {
    sheet = sheets[i];
    // Iterate through all paddlers' classes (column F)
    var values = tables.getRows(sheet);
    for (var j=0; j<values.length; j++) {
      var raceClass = (typeof values[j]['Class'] == "string" && values[j]['Class'] !== null ? values[j]['Class'] : "").toUpperCase().trim(),
          raceName = sheet.getName().replace(" ", ""),
          received = parseFloat(values[j]['Paid']) || 0.0,
          due = values[j]['Due'] ? parseFloat(values[j]['Due']) : 0.0;
      if (values[j]['Surname'] !== "" || values[j]['First name'] !== "" || values[j]['BCU Number'] !== "") { // Surname, lastname or BCU number filled out
        if (isLightningRaceName_(raceName)) {
          totalLightning ++;
        } else {
          if (raceClass.indexOf('J') > -1) {
            totalJnr ++;
          } else {
            totalSnr ++;
          }
        }
      }
      if (received > 0) {
        totalReceived += received;
      }
      if (due > 0) {
        totalDue += due;
      }
    }
  }

  var totalLevies = totalSnr * LEVY_SENIOR + totalJnr * LEVY_JUNIOR;
  var grandTotal = totalSnr + totalJnr + totalLightning;

  // Dialog height in pixels
  var dialogHeight = 245;

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create the UiInstance object myapp and set the title text
  var app = UiApp.createApplication().setTitle('Finance Summary').setHeight(dialogHeight),
      mypanel = app.createVerticalPanel().setStyleAttribute("width", "100%");

  mypanel.add(app.createHTML("<p>Total Received: £" + totalReceived + "</p>"));
  mypanel.add(app.createHTML("<p>Total Due: £" + totalDue + "</p>"));
  mypanel.add(app.createHTML("<p>Total Seniors: " + totalSnr + "<br />Total Juniors: " + totalJnr + "<br />Total Lightnings: " + totalLightning + "<br />Grand Total: " + grandTotal + "</p>"));
  if (scriptProps && scriptProps.entrySenior && scriptProps.entryJunior && scriptProps.entryLightning) {
    var totalPaid = parseFloat(scriptProps.entrySenior) * totalSnr + parseFloat(scriptProps.entryJunior) * totalJnr + parseFloat(scriptProps.entryLightning) * totalLightning;
    mypanel.add(app.createHTML("<p>Total Due (Calculated): £" + totalPaid + "</p>"));
  }
  mypanel.add(app.createHTML("<p>MRC Levies Due: £" + totalLevies + "</p>"));

  var closeButton = app.createButton('OK');
  var closeHandler = app.createServerClickHandler('close');
  closeButton.addClickHandler(closeHandler);
  mypanel.add(closeButton);

  app.add(mypanel);

  ss.show(app);
};

/**
 * Function to display a popup dialog with a prompt, plus OK and Cancel buttons
 */
function showPrompt(title, text, fnName, height) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create the UiInstance object myapp and set the title text
  var app = UiApp.createApplication().setTitle(title).setHeight(height);

  // Create a vertical panel called mypanel and add it to myapp
  var mypanel = app.createVerticalPanel().setStyleAttribute("width", "100%"),
      hpanel = app.createHorizontalPanel();

  mypanel.add(app.createHTML(text));

  var closeButton = app.createButton('Cancel');
  closeButton.addClickHandler(app.createServerClickHandler('close'));
  var okButton = app.createButton('OK');
  okButton.addClickHandler(app.createServerClickHandler(fnName)).addClickHandler(app.createClientHandler().forEventSource().setEnabled(false).forTargets(closeButton).setEnabled(false));
  hpanel.add(okButton);
  hpanel.add(closeButton);
  mypanel.add(hpanel);

  // Add my panel to myapp
  app.add(mypanel);

  ss.show(app);
}

/**
 * OK button handler, so that we avoid polluting clearAllEntries() with UiApp code
 */
exports.confirmClearEntries = function confirmClearEntries() {
  clearAllEntries();
  var app = UiApp.getActiveApplication();
  app.close();
  // The following line is REQUIRED for the widget to actually close.
  return app;
};

/**
 * Display the confirmation dialog used to clear all entries
 *
 * @public
 */
exports.showClearEntries = function showClearEntries() {
  showPrompt('Clear Entries', '<p>Are you sure you want to clear all existing entries/results?</p>', 'confirmClearEntries', 80);
};

function getSelectedEntryRows(sheet) {
  // getEntryRows() returns a list of 3-element arrays giving boat number, row number and crew size
  var allEntries = getEntryRows(sheet), range = SpreadsheetApp.getActiveRange(), selectedEntries = [], entryTop, entryBottom;
  Logger.log("Found " + allEntries.length + " entries in sheet");
  for (var i=0; i<allEntries.length; i++) {
    // If the entry overlaps the selected area in any way, then we'll add it
    // This means either the bottom of the entry falls within the selected range, or the top does, or both
    entryTop = allEntries[i][1];
    entryBottom = allEntries[i][1] + allEntries[i][2] - 1;
    if (entryTop >= range.getRow() && entryTop <= range.getLastRow() ||
      entryBottom >= range.getRow() && entryBottom <= range.getLastRow()) {
        Logger.log("Adding boat " + allEntries[i][0]);
        selectedEntries.push(allEntries[i]);
    }
  }
  return selectedEntries;
}

/**
 * Display the modify crews dialog
 *
 * @public
 */
exports.showModifyCrews = function showModifyCrews() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getActiveSheet();

  // Create the UiInstance object myapp and set the title text
  var app = UiApp.createApplication().setTitle('Modify Crews').setHeight(140);

  // Create a vertical panel called mypanel and add it to the app
  var mypanel = app.createVerticalPanel().setStyleAttribute("width", "100%").setSpacing(5).setVerticalAlignment(UiApp.VerticalAlignment.MIDDLE);

  // Selection list allowing us to pick another race to move the crew(s) to
  var mvpanel = app.createHorizontalPanel().setSpacing(5);
  mvpanel.add(app.createHTML("Move to "));
  // Drop-down to select Division
  var clb = app.createListBox(false).setId('className').setName('className');
  clb.setVisibleItemCount(1);
  clb.addItem("--Select--", "");
  var sheetNames = racing.getRaceSheetNames();
  for (var i=0; i<sheetNames.length; i++) {
    if (sheetNames[i] != sheet.getName()) {
      clb.addItem(sheetNames[i]);
    }
  }
  mvpanel.add(clb);
  mvpanel.add(app.createHTML("then"));
  var mlb = app.createListBox(false).setId('moveAction').setName('moveAction');
  mlb.addItem("renumber and remove old numbers", "remove");
  mlb.addItem("renumber and leave old numbers", "leave");
  mlb.addItem("keep current numbers", "keep");
  mvpanel.add(mlb);
  var mvbutton = app.createButton("Move").setStyleAttributes({"margin": "0px", "padding": "0px"});
  mvbutton.addClickHandler(app.createServerHandler("moveCrews").addCallbackElement(clb).addCallbackElement(mlb));
  mvpanel.add(mvbutton);
  mypanel.add(mvpanel);

  var delpanel = app.createHorizontalPanel().setSpacing(5);
  delpanel.add(app.createHTML("Delete crews then "));
  var dlb = app.createListBox(false).setId('delAction').setName('delAction');
  dlb.addItem("remove old numbers", "remove");
  dlb.addItem("leave old numbers", "leave");
  delpanel.add(dlb);
  var delbutton = app.createButton("Delete").setStyleAttributes({"margin": "0px", "padding": "0px"});
  delbutton.addClickHandler(app.createServerHandler("deleteCrews").addCallbackElement(dlb));
  delpanel.add(delbutton);
  mypanel.add(delpanel);

  // Status text
  mypanel.add(app.createHTML("").setId("modifyCrewsResult"));

  // Done button
  var closeButton = app.createButton('Done');
  var closeHandler = app.createServerClickHandler('close');
  closeButton.addClickHandler(closeHandler);
  mypanel.add(closeButton);

  // Add my panel to myapp
  app.add(mypanel);

  ss.show(app);
};

function moveEntryRows(srcRange, dstSheet) {
  var entries = getEntryRowData(srcRange),
      dstRows = getNextEntryRows(dstSheet);
  if (dstRows.length < entries.length) {
    throw "Destination sheet does not have sufficient room for entries (needs " + entries.length + ", found " + dstRows.length + ")";
  }
  // Implement a 1:1 mapping for source entry rows to destination rows
  // This means each destination row must be the same size as its corresponding source row, if it is not then an exception will be thrown
  Logger.log("Copying " + entries.length + " entries (" + srcRange.getA1Notation() + ") to " + dstSheet.getName());
  for (var i=0; i<entries.length; i++) {
    if (!entries[i].values) {
      throw "No values found in the entry";
    }
    if (entries[i].values.length === 0) {
      throw "Entry must have at least 1 row";
    }
    if (dstRows[i][2] != entries[i].values.length) {
      throw "Destination does not have correct number of rows for the entry";
    }
    if (!parseInt(entries[i].rowNumber)) {
      throw "No row number found in the entry";
    }
    Logger.log("Entry " + i + ": boatNumber=" + entries[i].boatNumber + ", rowNumber=" + entries[i].rowNumber + ", values=" + entries[i].values);
    var dstRange = dstSheet.getRange(dstRows[i][1], 2, dstRows[i][2], entries[i].values[0].length),
        entryRange = srcRange.getSheet().getRange(entries[i].rowNumber, 2, entries[i].values.length, entries[i].values[0].length);
    Logger.log("Copying " + entryRange.getSheet().getName() + "!" + entryRange.getA1Notation() + " to " + dstRange.getSheet().getName() + "!" + dstRange.getA1Notation());
    // Retrive the smaller range for this entry only and copy this to the destination
    dstRange.setValues(entryRange.getValues());
    entryRange.clearContent();
  }
}

/**
 * Move crews button click handler
 *
 * @param {object} eventInfo Event information
 * @return {AppInstance} Active application instance
 */
exports.moveCrews = function moveCrews(eventInfo) {
  var app = UiApp.getActiveApplication();
  var action = eventInfo.parameter.moveAction,
      dstSheetName = eventInfo.parameter.className,
      dstSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(dstSheetName),
      sheet = SpreadsheetApp.getActiveSheet();
  if (!dstSheetName) {
    throw "You must select a race";
  }
  if (dstSheet === null) {
    throw "Could not find sheet " + dstSheetName;
  }
  var selectedEntries = getSelectedEntryRows(sheet);
  if (selectedEntries.length > 0) {
    // Assume that the entries are in a continuous range, for now
    Logger.log("selectedEntries: " + selectedEntries);
    var firstRow = parseInt(selectedEntries[0][1]),
        lastEntry = selectedEntries[selectedEntries.length-1],
        lastRow = parseInt(lastEntry[1]) + parseInt(lastEntry[2]) - 1,
        numRows = lastRow - firstRow + 1;

    Logger.log("firstRow: " + firstRow + ", lastRow: " + lastRow + ", numRows: " + numRows);

    var srcRange = sheet.getRange(firstRow, 1, numRows, sheet.getLastColumn());
    if (action == "remove") { // Re-number and remove the old boat numbers in the current sheet. Generally numbers should not be re-used if they have already been allocated to others.
      moveEntryRows(srcRange, dstSheet);
      sheet.deleteRows(firstRow, numRows);
    } else if (action == "leave") { // Re-number and leave the old boat numbers (empty) in the current sheet
      moveEntryRows(srcRange, dstSheet);
    } else if (action == "keep") { // Keep numbers in the new sheet, must be removed from this one
      Logger.log("Moving entries with numbers intact");
      var lastRowNum = getLastEntryRowNumber(dstSheet);
      Logger.log("Last row number is " + lastRowNum);
      srcRange.moveTo(dstSheet.getRange(lastRowNum+1, 1, srcRange.getNumRows(), srcRange.getNumColumns()));
      sheet.deleteRows(firstRow, numRows);
    } else {
      throw "Unsupported action " + action;
    }
    app.getElementById("modifyCrewsResult").setText("Moved " + selectedEntries.length + " crews to " + dstSheetName);
  } else {
    throw "No entries were selected";
  }
  return app;
};

/**
 * Delete crews button click handler
 *
 * @param {object} eventInfo Event information
 * @return {AppInstance} Active application instance
 */
exports.deleteCrews = function deleteCrews(eventInfo) {
  var app = UiApp.getActiveApplication();
  var action = eventInfo.parameter.delAction,
      sheet = SpreadsheetApp.getActiveSheet();
  var selectedEntries = getSelectedEntryRows(sheet);
  if (selectedEntries.length > 0) {
    // Assume that the entries are in a continuous range, for now
    Logger.log("selectedEntries: " + selectedEntries);
    var firstRow = parseInt(selectedEntries[0][1]),
        lastEntry = selectedEntries[selectedEntries.length-1],
        lastRow = parseInt(lastEntry[1]) + parseInt(lastEntry[2]) - 1,
        numRows = lastRow - firstRow + 1;

    Logger.log("firstRow: " + firstRow + ", lastRow: " + lastRow + ", numRows: " + numRows);

    if (action == "remove") {
      sheet.deleteRows(firstRow, numRows);
    } else if (action == "leave") {
      sheet.getRange(firstRow, 2, numRows, sheet.getLastColumn() - 1).clearContent();
    } else {
      throw "Unsupported action " + action;
    }
    app.getElementById("modifyCrewsResult").setText("Deleted " + selectedEntries.length + " crews");
  } else {
    throw "No entries were selected";
  }
  return app;
};

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

  var tempSheet = spreadsheet.insertSheet(0, 'Temp' + Date.now()),
    sheets = spreadsheet.getSheets(), templateSheets = template.getSheets();

  options = options || {};

  // Delete preexisting sheets
  for (var i = sheets.length - 1; i > 0; i--) {
    spreadsheet.deleteSheet(sheets[i]);
  }

  if (template.getSheetByName('Races')) {
    templates.createFromTemplate(template, spreadsheet);
  } else {
    // Copy all template sheets into current
    for (var j = 0; j < templateSheets.length; j++) {
      templateSheets[j].copyTo(spreadsheet).setName(templateSheets[j].getName());
    }
  }

  spreadsheet.deleteSheet(tempSheet);

  setRaceInfo_({
    regionId: options.raceRegion,
    raceName: options.raceName
  }, spreadsheet);

  var sourceRaceType = getRaceType_(template.getId());
  if (sourceRaceType) {
    Logger.log('Setting race type ' + sourceRaceType.value);
    setRaceType_(spreadsheet.getId(), sourceRaceType.value);
  }
}

exports.setupRaceFromTemplate = setupRaceFromTemplate;

function setDriveProperty_(spreadsheetId, name, value) {
  return publishing.savePublicProperty(spreadsheetId, name, value);
}

function setDriveProperties(spreadsheetId, values) {
  for (var p in values) {
    if (values.hasOwnProperty(p)) {
      setDriveProperty_(spreadsheetId, p, values[p]);
    }
  }
}

exports.setDriveProperties = setDriveProperties;

function getDriveProperty_(spreadsheetId, name) {
  try {
    return Drive.Properties.get(spreadsheetId, name, {
      visibility: 'PUBLIC'
    });
  } catch(e) {
    return null;
  }
}

function getDriveProperties(spreadsheetId) {
  var driveResp = Drive.Properties.list(spreadsheetId), propertyMap = {};
  driveResp.items.forEach(function(p) {
    propertyMap[p.key] = p.value;
  });
  return propertyMap;
}

exports.getDriveProperties = getDriveProperties;

function setRaceType_(spreadsheetId, raceType) {
  setDriveProperty_(spreadsheetId, 'hrmType', raceType);
}

function getRaceType_(spreadsheetId) {
  return getDriveProperty_(spreadsheetId, 'hrmType');
}

function getPrintableExportUrl(ssId) {
  var url = 'https://docs.google.com/spreadsheets/d/SS_ID/export?'.replace('SS_ID', ssId);
  var urlExt = 'format=pdf'        // export as pdf / csv / xls / xlsx
    + '&size=a4'                           // paper size legal / letter / A4
    + '&portrait=false'                    // orientation, false for landscape
    + '&fitw=true'           // fit to page width, false for actual size
    + '&sheetnames=true&printtitle=true'   // show optional headers and footers
    + '&pagenumbers=true&gridlines=true'   // show page numbers and gridlines
    + '&fzr=true'                          // repeat row headers (frozen rows) on each page
    + '&attachment=false';
    //+ '&gid=';                             // specific sheet gid to use (otherwise includes all sheets)
  return url + urlExt;
}

/**
 * @public
 * @param ss
 */
exports.createPrintableEntries = function createPrintableEntries(ss) {
  ss = ss || {};
  var pss = createPrintableSpreadsheet(null, printableEntriesColumnNames, null, false, false, 'Printable Entries', 'printableEntriesId');
  uiService.showLinkDialog("Print Entries", "Click to open the printable entry sheets (opens in new tab)", getPrintableExportUrl(pss.getId()), "Printable Entries", "_blank");
  return pss;
};

/**
 * @public
 * @param ss
 */
exports.createPrintableResults = function createPrintableResults(ss) {
  ss = ss || {};
  // 'autoResizeColumn' is not available yet in the new version of Google Sheets
  var columnNames = isHaslerRace() ? printableResultColumnNamesHasler : printableResultColumnNames,
    pss = createPrintableSpreadsheet(null, columnNames, 'Posn', true, false, 'Printable Results', 'printableResultsId');
  uiService.showLinkDialog("Print Results", "Click to open the printable result sheets", getPrintableExportUrl(pss.getId()), "Printable Results", "_blank");
  return pss;
};

function createPrintableSpreadsheet(name, columnNames, sortColumn, truncateEmpty, autoResize, sheetType, sheetIdPropName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var driveProps = getDriveProperties(ss.getId());
  name = name || ss.getName() + " (" + sheetType + ")";
  autoResize = typeof autoResize !== "undefined" ? autoResize : false;
  var newss = driveProps && driveProps[sheetIdPropName] ? SpreadsheetApp.openById(driveProps[sheetIdPropName]) : SpreadsheetApp.create(name),
    srcSheets = racing.getRaceSheets(ss);
  if (driveProps && driveProps[sheetIdPropName]) {
    newss.insertSheet("Temp" + Math.floor(Date.now() / 1000), 0);
    // Delete preexisting sheets
    var oldSheets = newss.getSheets();
    for (var i = 1; i < oldSheets.length; i++) {
      newss.deleteSheet(oldSheets[i]);
    }
  } else {
    publishing.savePublicProperty(ss.getId(), sheetIdPropName, newss.getId());
  }
  var sortFn = function(a,b) {return (parseInt(a.rows[0][sortColumn])||999) - (parseInt(b.rows[0][sortColumn])||999);};
  var entriesReduce = function(previous, a) {
    previous.push(objUnzip(a.rows[0], columnNames, false, ''));
    if (a.rows.length > 1) {
      previous.push(objUnzip(a.rows[1], columnNames, false, ''));
    }
    return previous;
  };
  // Copy existing sheets
  for (var j = 0; j < srcSheets.length; j++) {
    if (srcSheets[j].isSheetHidden()) {
      continue;
    }
    var lastRow = truncateEmpty ? getNextEntryRow(srcSheets[j]) - 1 : srcSheets[j].getLastRow();
    if (lastRow > 1) {
      var newSheet = newss.insertSheet(srcSheets[j].getName()),
          srcRange = srcSheets[j].getRange(1, 1, lastRow, srcSheets[j].getLastColumn()), values = [columnNames],
          entries = getEntryRowData(srcRange, !truncateEmpty);
      // Sort entries
      if (sortColumn !== null) {
        entries.sort(sortFn); // Sort by position, ascending then blanks (non-finishers)
      }
      // Add entries into the table
      var dataValues = entries.reduce(entriesReduce, []);
      values = values.concat(dataValues);
      var targetRange = newSheet.getRange(1, 1, values.length, values[0].length);
      targetRange.setValues(values);
      targetRange.setFontFamily(SHEET_FONT_FAMILY);
      newSheet.getRange(1, 1, 1, values[0].length).setBorder(true, true, true, true, true, true).setFontWeight("bold").setBackground("#ccffff"); // 1st row
      newSheet.getRange(2, 1, values.length-1, 1).setBorder(null, null, null, true, null, null).setFontWeight("bold").setBackground("#ffff99"); // border right of 1st col, yellow BG
      if (columnNames.indexOf("Elapsed") > -1) {
        newSheet.getRange(1, columnNames.indexOf("Elapsed") + 1, values.length, 1).setNumberFormat(NUMBER_FORMAT_TIME);
      }
      if (columnNames.indexOf("Paid") > -1) {
        newSheet.getRange(1, columnNames.indexOf("Paid") + 1, values.length, 1).setNumberFormat(NUMBER_FORMAT_CURRENCY);
      }
      if (columnNames.indexOf("Due") > -1) {
        newSheet.getRange(1, columnNames.indexOf("Due") + 1, values.length, 1).setNumberFormat(NUMBER_FORMAT_CURRENCY);
      }
      if (columnNames.indexOf("Expiry") > -1) {
        newSheet.getRange(1, columnNames.indexOf("Expiry") + 1, values.length, 1).setNumberFormat(NUMBER_FORMAT_DATE);
      }
      if (autoResize === true) {
        autoResizeColumns(newSheet);
      }
      setSheetValidation_(newSheet, newss, driveProps);
    }
  }
  // Finally remove the first sheet (we need this as we're not allowed to delete all sheets up-front)
  newss.deleteSheet(newss.getSheets()[0]);
  return newss;
}

/**
 * @public
 * @param scriptProps
 */
exports.createClubEntries = function createClubEntries(scriptProps) {
  var ss = createClubSpreadsheet_(null, ["Number", "Surname", "First name", "BCU Number", "Expiry", "Club", "Class", "Div", "Due", "Paid"], scriptProps);
  uiService.showLinkDialog("Club Entries", "Click here to access the entries", "https://docs.google.com/spreadsheet/ccc?key=" + ss.getId(), "Club Entries", "_blank");
  return ss;
};

function createClubSpreadsheet_(name, columnNames, scriptProps) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var driveProps = getDriveProperties(ss.getId());
  var truncateEmpty = true;
  name = name || ss.getName() + " (Clubs)";
  var newss = driveProps && driveProps.clubEntriesSheetId ? SpreadsheetApp.openById(driveProps.clubEntriesSheetId) : SpreadsheetApp.create(name), srcSheets = racing.getRaceSheets(ss), clubValues = {}, currClub, currDue, currPaid, currClubValues;
  if (driveProps && driveProps.clubEntriesSheetId) {
    newss.insertSheet("Temp" + Math.floor(Date.now() / 1000), 0);
    // Delete preexisting sheets
    var oldSheets = newss.getSheets();
    for (var i = 1; i < oldSheets.length; i++) {
      newss.deleteSheet(oldSheets[i]);
    }
  } else {
    publishing.savePublicProperty(ss.getId(), 'clubEntriesSheetId', newss.getId());
  }
  var clubCounts = {}, clubDue = {}, clubPaid = {}, lastRaceNum, raceName, paddlerType,
    fees = { seniors: driveProps.entrySenior, juniors: driveProps.entryJunior, lightnings: driveProps.entryLightning };
  var rowIter = function(b) {
    currClub = b['Club'];
    currDue = b['Due'];
    currPaid = b['Paid'] || 0;
    if (currClub) {
      currClubValues = clubValues[currClub] || [columnNames];
      // Make sure race number is repeated for second K2 partner if both not from same club
      b['Number'] = b['Number'] || lastRaceNum;
      b['Race'] = raceName;
      currClubValues.push(objUnzip(b, columnNames, false, ''));
      clubValues[currClub] = currClubValues;
      lastRaceNum = b['Number'];

      // Keep a count of all paddlers entered
      clubCounts[currClub] = clubCounts[currClub] || { seniors: 0, juniors: 0, lightnings: 0 };
      clubDue[currClub] = clubDue[currClub] || { seniors: 0, juniors: 0, lightnings: 0 };
      clubPaid[currClub] = clubPaid[currClub] || { seniors: 0, juniors: 0, lightnings: 0 };
      if (isLightningRaceName_(b['Race'])) {
        paddlerType = 'lightnings';
      } else {
        if (b['Class']) {
          if (b['Class'].indexOf('J') > -1) {
            paddlerType = 'juniors';
          } else {
            paddlerType = 'seniors';
          }
        }
      }
      if (currDue === undefined) {
        currDue = fees[paddlerType];
      }
      clubCounts[currClub][paddlerType] ++;
      clubDue[currClub][paddlerType] += +currDue;
      clubPaid[currClub][paddlerType] += +currPaid;
    }
  };
  var entriesIter = function(a) {
    a.rows.forEach(rowIter);
  };
  // Copy existing sheets
  for (var j = 0; j < srcSheets.length; j++) {
    Logger.log("Processing entry sheet %s", srcSheets[j].getName());
    if (srcSheets[j].isSheetHidden()) {
      Logger.log("Skipping %s due to hidden sheet", srcSheets[j].getName());
      continue;
    }
    var lastRow = truncateEmpty ? getNextEntryRow(srcSheets[j]) - 1 : srcSheets[j].getLastRow();
    Logger.log("Looking at %s rows in sheet", lastRow);
    if (lastRow > 1) {
      raceName = srcSheets[j].getName();
      var srcRange = srcSheets[j].getRange(1, 1, lastRow, srcSheets[j].getLastColumn()),
          entries = getEntryRowData(srcRange, true);
      Logger.log("Found %s entries in sheet", entries.length);
      entries.forEach(entriesIter);
    }
  }
  var summaryRows = [];
  summaryRows.push([ 'Club', 'Seniors', 'Juniors', 'Total Divisional', 'Lightnings', 'Total', 'Due', 'Paid' ]);
  var summarySheet = newss.insertSheet('Summary');
  var clubCodes = Object.keys(clubValues).sort(), c;
  for (var k=0; k<clubCodes.length; k++) {
    c = clubCodes[k];
    if (clubValues.hasOwnProperty(c)) {
      var newSheet = newss.insertSheet(c), values = clubValues[c], targetRange = newSheet.getRange(1, 1, values.length, values[0].length);
      targetRange.setValues(values);
      targetRange.setFontFamily(SHEET_FONT_FAMILY);
      newSheet.getRange(1, 1, 1, values[0].length).setBorder(true, true, true, true, true, true).setFontWeight("bold").setBackground("#ccffff"); // 1st row
      newSheet.getRange(2, 1, values.length-1, 1).setBorder(null, null, null, true, null, null).setFontWeight("bold").setBackground("#ffff99"); // border right of 1st col, yellow BG
      if (columnNames.indexOf("Elapsed") > -1) {
        newSheet.getRange(1, columnNames.indexOf("Elapsed") + 1, values.length, 1).setNumberFormat(NUMBER_FORMAT_TIME);
      }
      if (columnNames.indexOf("Due") > -1) {
        newSheet.getRange(1, columnNames.indexOf("Due") + 1, values.length, 1).setNumberFormat(NUMBER_FORMAT_CURRENCY);
      }
      if (columnNames.indexOf("Paid") > -1) {
        newSheet.getRange(1, columnNames.indexOf("Paid") + 1, values.length, 1).setNumberFormat(NUMBER_FORMAT_CURRENCY);
      }
      if (columnNames.indexOf("Expiry") > -1) {
        newSheet.getRange(1, columnNames.indexOf("Expiry") + 1, values.length, 1).setNumberFormat(NUMBER_FORMAT_DATE);
      }
      setSheetValidation_(newSheet, newss, driveProps);

      var extraValues = [], totalDue = clubDue[c].seniors + clubDue[c].juniors + clubDue[c].lightnings,
        totalPaid = clubPaid[c].seniors + clubPaid[c].juniors + clubPaid[c].lightnings,
        totalDivisional = clubCounts[c].seniors + clubCounts[c].juniors,
        totalPaddlers = totalDivisional + clubCounts[c].lightnings;
      extraValues.push(['', '', '', '']);
      extraValues.push(['Seniors', clubCounts[c].seniors, clubDue[c].seniors, clubPaid[c].seniors]);
      extraValues.push(['Juniors', clubCounts[c].juniors, clubDue[c].juniors, clubPaid[c].juniors]);
      extraValues.push(['Lightnings', clubCounts[c].lightnings, clubDue[c].lightnings, clubPaid[c].lightnings]);
      extraValues.push(['', '', totalDue, totalPaid]);
      newSheet.getRange(values.length + 1, values[0].length - extraValues[0].length + 1, extraValues.length, extraValues[0].length).setValues(extraValues).setFontFamily(SHEET_FONT_FAMILY);
      newSheet.getRange(values.length + 1, values[0].length - 1, extraValues.length, 2).setNumberFormat(NUMBER_FORMAT_CURRENCY);

      newSheet.setFrozenRows(1);

      summaryRows.push([c, clubCounts[c].seniors, clubCounts[c].juniors, totalDivisional, clubDue[c].lightnings, totalPaddlers, totalDue, totalPaid]);
    }
  }
  summarySheet.getRange(1, 1, summaryRows.length, summaryRows[0].length).setValues(summaryRows).setFontFamily(SHEET_FONT_FAMILY);
  summarySheet.getRange(1, 1, 1, summaryRows[0].length).setBorder(true, true, true, true, true, true).setFontWeight("bold").setBackground("#ccffff");
  // Finally remove the first sheet (we need this as we're not allowed to delete all sheets up-front)
  newss.deleteSheet(newss.getSheets()[0]);
  return newss;
}

/**
 * Look through all the current entries and flag duplicates
 */
function checkEntryDuplicateWarnings(spreadsheet) {
  var ss = spreadsheet || SpreadsheetApp.getActiveSpreadsheet(),
    sheets = racing.getRaceSheets(ss), sheet, boatNumsByPaddler = {}, warnings = [];
  for (var i = 0; i < sheets.length; i++) {
    sheet = sheets[i];
    var raceData = tables.getRows(sheet);
    if (raceData.length > 0) {
      for (var j = 0; j < raceData.length; j++) {
        var boatNum = raceData[j]['Number'] || raceData[j-1]['Number'];
        var key = [raceData[j]['Surname'], raceData[j]['First name'], raceData[j]['Club']].join('|');
        if (key.length > 3) {
          boatNumsByPaddler[key] = boatNumsByPaddler[key] || [];
          boatNumsByPaddler[key].push(boatNum);
        }
      }
    }
  }
  for (var k in boatNumsByPaddler) {
    if (boatNumsByPaddler.hasOwnProperty(k)) {
      if (boatNumsByPaddler[k].length > 1) {
        warnings.push(k.replace(/\|/g, ', ') + ' found in crews ' + boatNumsByPaddler[k].join(', '));
      }
    }
  }
  return warnings;
}

exports.checkEntryDuplicateWarnings = checkEntryDuplicateWarnings;

/**
 * Look through all the current entries and flag duplicates
 *
 * @public
 */
function checkEntryDuplicates(spreadsheet) {
  var warnings = checkEntryDuplicateWarnings(spreadsheet);
  uiService.showDialog('Duplicate Entries', warnings.length > 0 ? '<p>' + warnings.join('<br/>') + '</p>' : '<p>No duplicates found</p>');
}

exports.checkEntryDuplicates = checkEntryDuplicates;

/**
 * @public
 */
exports.checkEntriesFromRankings = function checkEntriesFromRankings() {
  checkEntriesFromRankings_();
};

exports.parseDate = dateformat.parseDate;