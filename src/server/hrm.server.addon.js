/* jshint eqeqeq: false, quotmark: false, maxdepth: false, maxstatements: false, maxlen: false */

var hrm = require('./hrm.server.main');
var uiService = require('./ui-service');
var web = require('./hrm.server.web');

global.showClearEntries = hrm.showClearEntries;
global.confirmClearEntries = hrm.confirmClearEntries;
global.showLoadRankings = hrm.showLoadRankings;
global.showAddLocalRankings = hrm.showAddLocalRankings;
global.addLocalRankings = hrm.addLocalRankings;
global.showClearRankings = hrm.showClearRankings;
global.confirmClearRankings = hrm.confirmClearRankings;
global.showAddLocalEntries = hrm.showAddLocalEntries;
global.showImportEntries = hrm.showImportEntries;
global.importEntries = hrm.importEntries;
global.addLocalEntries = hrm.addLocalEntries;
global.showModifyCrews = hrm.showModifyCrews;
global.moveCrews = hrm.moveCrews;
global.deleteCrews = hrm.deleteCrews;
global.updateEntriesFromMemberships = hrm.updateEntriesFromMemberships;
global.updateEntriesFromRankings = hrm.updateEntriesFromRankings;

global.saveEntriesHTML = hrm.saveEntriesHTML;
global.saveResultsHTML = hrm.saveResultsHTML;
global.showResultsURL = hrm.showResultsURL;
global.showEntriesURL = hrm.showEntriesURL;
global.showRaceLevies = hrm.showRaceLevies;

global.showSetStartTimes = hrm.showSetStartTimes;
global.setStartTimes = hrm.setStartTimes;
global.onSetStartTimesEnter = hrm.onSetStartTimesEnter;
global.showSetFinishTimes = hrm.showSetFinishTimes;
global.setFinishTimes = hrm.setFinishTimes;

global.calculatePromotions = hrm.calculatePromotions;
global.setPromotionsDiv123 = hrm.setPromotionsDiv123;
global.setPromotionsDiv456 = hrm.setPromotionsDiv456;
global.setPromotionsDiv789 = hrm.setPromotionsDiv789;
global.calculatePoints = hrm.calculatePoints;

global.setFormulas = hrm.setFormulas;
global.setValidation = hrm.setValidation;
global.setFormatting = hrm.setFormatting;
global.setProtection = hrm.setProtection;
global.setFreezes = hrm.setFreezes;

global.createK4Sheet = hrm.createK4Sheet;
global.createK2Sheet = hrm.createK2Sheet;
global.createARMSheet = hrm.createARMSheet;
global.createARMSheet = hrm.createARMSheet;
global.createNRMSheet = hrm.createNRMSheet;
global.populateFromHtmlResults = hrm.populateFromHtmlResults;
global.createPrintableEntries = hrm.createPrintableEntries;
global.createPrintableResults = hrm.createPrintableResults;
global.createClubEntries = hrm.createClubEntries;
global.createNumberBoards = hrm.createNumberBoards;
global.checkEntriesFromRankings = hrm.checkEntriesFromRankings;

global.close = uiService.close;

/**
 * Respond to a browser request
 *
 * TODO Move this to a separate project?
 *
 * @param {object} e Event information
 */
global.doGet = function doGet(e) {
  var key = e.parameter.key, action = e.parameter.show || "links";
  if (key) {
    switch (action) {
      case "results":
        return web.printResults(e);
      case "entries":
        return web.printResults(e);
      case "starters":
        return web.printResults(e);
      case "links":
        return web.printResults(e);
      default:
        throw "Unsupported action " + action;
    }
  } else {
    return web.listFiles(e);
  }
};

global.saveResultsHTMLForSpreadsheet = web.saveResultsHTMLForSpreadsheet;
global.saveEntriesHTMLForSpreadsheet = web.saveEntriesHTMLForSpreadsheet;
global.getScriptUrl = web.getScriptUrl;
global.getLastUpdated = web.getLastUpdated;
global.sendResultsSms = web.sendResultsSms;

/**
 * Called when an add-on is installed.
 * @param {Object} e Apps Script onInstall event object
 */
global.onInstall = function onInstall(e) {
  global.onOpen(e);
};


/**
 * Called when a spreadsheet that is associated with this add-on is opened.
 * @param {Object} e Apps Script onInstall event object
 */
global.onOpen = function onOpen(e) {
  var ui = SpreadsheetApp.getUi();
  //var addonMenu = ui.createAddonMenu();

  ui.createMenu('Custom Menu')
    .addItem('Start', 'openStartDialog')
    .addItem('Rankings', 'openRankingsSidebar')
    .addItem('Entries', 'openEntriesSidebar')
    .addItem('Race Details', 'openRaceDetailsDialog')
    .addSubMenu(ui.createMenu('New')
      .addItem('HRM Sheet', 'createHRMSheet')
      .addItem('ARM Sheet', 'createARMSheet')
      .addItem('NRM Sheet', 'createNRMSheet')
      .addItem('K2 Sheet', 'createK2Sheet')
      .addItem('K4 Sheet', 'createK4Sheet'))
    .addSubMenu(ui.createMenu('Rankings')
      .addItem('Load Rankings', 'showLoadRankings')
      .addItem('Load Rankings from File', 'showAddLocalRankings')
      .addItem('Clear Rankings', 'confirmClearRankings'))
    .addSubMenu(ui.createMenu('Entries')
      .addItem('Add Entries from File', 'showAddLocalEntries')
      .addItem('Import Entries from CSV', 'showImportEntries')
      .addItem('Update from Rankings', 'updateEntriesFromRankings')
      .addItem('Update from Memberships', 'updateEntriesFromMemberships')
      .addItem('Check against Rankings', 'checkEntriesFromRankings')
      .addItem('Clear Entries', 'showClearEntries')
      .addItem('Set Formatting', 'setFormatting')
      .addItem('Set Formulas', 'setFormulas')
      .addItem('Set Protection', 'setProtection')
      .addItem('Set Validation', 'setValidation')
      .addSeparator()
      .addItem('Modify Crews', 'showModifyCrews')
      .addSeparator()
      .addItem('Live Entries', 'showEntriesURL')
      .addItem('Publish Entries', 'saveEntriesHTML')
      .addItem('Print Entries', 'createPrintableEntries')
      .addItem('Club Entries', 'createClubEntries')
      .addSeparator()
      .addItem('Finance Summary', 'showRaceLevies'))
     .addSubMenu(ui.createMenu('Results')
    //   .addItem('Set Start Times', 'showSetStartTimes')
    //   .addItem('Set Finish Times', 'showSetFinishTimes')
       .addItem('Calculate Promotions', 'calculatePromotions')
       .addItem('Calculate Points', 'calculatePoints')
       .addItem('Set Formulas', 'setFormulas')
       .addSeparator()
       .addItem('Live Results', 'showResultsURL')
       .addItem('Publish Results', 'saveResultsHTML')
       .addItem('Print Results', 'createPrintableResults')
       .addItem('Send SMS results', 'sendResultsSms')).addToUi();

  //addonMenu.addToUi();
};

/**
 * Automatically invoked whenever a cell is edited
 */
global.onEdit = function onEdit(e) {
  var sheet = e.range.getSheet();
  // If we are in a race sheet and this is a name or similar then capitalise the value
  var sheetName = sheet.getName();
  if (e.value && typeof e.value == "string" && e.range.getRow() > 1 && e.range.getColumn() > 1 && e.range.getColumn() < 8 &&
    sheetName != "Finishes" && sheetName != "Rankings" && sheetName != "Clubs" && sheetName != "Results" &&
      sheetName != "PandD" && sheetName != "Summary") {
        if (e.value.toUpperCase() != e.value) {
          e.range.setValue(e.value.toUpperCase());
        }
  }
  // Check for BCU numbers and auto-populate paddler details if we find them
  if (e.value && e.range.getColumn() == 4 && e.value.match(/\d+/)) {
    var headerRange = sheet.getRange(1, 4);
    if (headerRange.getValue() == "BCU Number") {
      var matches = HRM.findRankings(""+e.value);
      if (matches.length === 0) {
        e.range.setComment("BCU Number " + e.value + " not known");
      } else if (matches.length == 1) {
        // TODO Do this re-ordering of values via a util function
        var dataRowValues = [], raceHeaders = HRM.getTableHeaders(sheet), headerName;
        for (var i = 1; i < raceHeaders.length; i++) {
          headerName = raceHeaders[i] == "Div" ? "Division" : raceHeaders[i]; // translate from rankings data to race sheet headings
          dataRowValues.push(matches[0][headerName] || "");
        }
        // Remove empty values from the end
        while (dataRowValues.length > 0 && dataRowValues[dataRowValues.length-1] === "") {
          dataRowValues.pop();
        }
        sheet.getRange(e.range.getRow(), 2, 1, dataRowValues.length).setValues([dataRowValues]);
        e.range.clearNote();
      } else {
        e.range.setComment("Multiple matches found for " + e.value);
      }
    }
  }
  //e.range.setComment("Edited at: " + new Date().toTimeString());
};