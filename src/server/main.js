var hrm = require('./hrm.server.main');
var uiService = require('./ui-service');
var web = require('./hrm.server.web');
var uiUtils = require('./libs/lib.utils.ui.server');
var dialogs = require('../ui/dialogs.controller.server');
var uiHome = require('../ui/home.controller.server');
var apiRaceDetails = require('../ui/dialogs/race-details/dialogs.race-details.server');
var apiStart = require('../ui/dialogs/start/dialogs.start.server');
var apiEntries = require('../ui/sidebars/entries/sidebar.entries.server');
var apiRankings = require('../ui/sidebars/rankings/sidebar.rankings.server');

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

global.dialog_start_getRaceTemplates = apiStart.dialog_start_getRaceTemplates;
global.dialog_start_getRaceInfo = apiStart.dialog_start_getRaceInfo;
global.dialog_start_submit = apiStart.dialog_start_submit;

global.dialog_raceDetails_get = apiRaceDetails.dialog_raceDetails_get;
global.dialog_raceDetails_set = apiRaceDetails.dialog_raceDetails_set;

global.getRaceSheetNamesHTML = uiHome.getRaceSheetNamesHTML;

global.sidebar_entries_race_info = apiEntries.sidebar_entries_race_info;
global.sidebar_entries_search = apiEntries.sidebar_entries_search;
global.sidebar_entries_add = apiEntries.sidebar_entries_add;
global.sidebar_entries_link = apiEntries.sidebar_entries_link;

global.sidebar_rankings_import = apiRankings.sidebar_rankings_import;
global.sidebar_rankings_info = apiRankings.sidebar_rankings_info;
global.sidebar_rankings_last_updated = apiRankings.sidebar_rankings_last_updated;
global.sidebar_rankings_insert = apiRankings.sidebar_rankings_insert;

global.openStartDialog = dialogs.openStartDialog;
global.openRaceDetailsDialog = dialogs.openRaceDetailsDialog;
global.openRankingsSidebar = dialogs.openRankingsSidebar;
global.openEntriesSidebar = dialogs.openEntriesSidebar;

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
global.include = uiUtils.includeHTML;
global.getLastUpdated = web.getLastUpdated;
global.sendResultsSms = web.sendResultsSms;

/**
 * Called when an add-on is installed.
 * @param {Object} e Apps Script onInstall event object
 */
global.onInstall = function onInstall(e) {
  Logger.log("onInstall()");
  global.onOpen(e);
};

/**
 * Called when a spreadsheet that is associated with this add-on is opened.
 * @param {Object} e Apps Script onInstall event object
 */
global.onOpen = function onOpen(e) {
  Logger.log("onOpen()");
  var ui = SpreadsheetApp.getUi(), menu = ui.createAddonMenu();
  menu.addItem('Start', 'openStartDialog')
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
      .addItem('Send SMS results', 'sendResultsSms'));
  menu.addToUi();
};