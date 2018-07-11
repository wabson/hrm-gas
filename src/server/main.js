var hrm = require('./hrm.server.main');
var uiService = require('./ui-service');
var web = require('./hrm.server.web');
var uiUtils = require('./libs/lib.utils.ui.server');
var dateformat = require('./dateformat');
var dialogs = require('../ui/dialogs.controller.server');
var apiRaceDetails = require('../ui/dialogs/race-details/dialogs.race-details.server');
var apiStart = require('../ui/dialogs/start/dialogs.start.server');
var apiEntries = require('../ui/sidebars/entries/sidebar.entries.server');
var apiRankings = require('../ui/sidebars/rankings/sidebar.rankings.server');

global.showClearEntries = hrm.showClearEntries;
global.confirmClearEntries = hrm.confirmClearEntries;
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

global.setFormulas = hrm.setFormulas;
global.setValidation = hrm.setValidation;
global.setFormatting = hrm.setFormatting;
global.setProtection = hrm.setProtection;
global.setFreezes = hrm.setFreezes;

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

global.getRaceSheetNamesHTML = web.getRaceSheetNamesHTML;
global.calculatePointsFromWeb = web.calculatePointsFromWeb;
global.checkFinishDuplicatesForSpreadsheet = web.checkFinishDuplicatesForSpreadsheet;
global.sendRaceResultsSms = web.sendRaceResultsSms;

// For publishing results
global.formatTime = dateformat.formatTime;
global.formatTimePenalty = dateformat.formatTimePenalty;

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

global.getRaceEntriesSummary = web.getRaceEntriesSummary;
global.getRaceEntries = web.getRaceEntries;
global.getRaceResultsSummary = web.getRaceResultsSummary;
global.getRaceResults = web.getRaceResults;
global.findSpreadsheetRankings = web.findSpreadsheetRankings;
global.onHTMLAddEntryClick = web.onHTMLAddEntryClick;
global.checkEntryDuplicateWarningsHTML = web.checkEntryDuplicateWarningsHTML;
global.saveResultsHTMLForSpreadsheet = web.saveResultsHTMLForSpreadsheet;
global.saveEntriesHTMLForSpreadsheet = web.saveEntriesHTMLForSpreadsheet;
global.getScriptUrl = web.getScriptUrl;
global.include = uiUtils.includeHTML;
global.getLastUpdated = web.getLastUpdated;
global.sendResultsSms = web.sendResultsSms;

global.addEntrySets = hrm.addEntrySets;

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
  var ui = SpreadsheetApp.getUi(), menu = ui.createAddonMenu();
  menu.addItem('Start', 'openStartDialog')
    .addItem('Rankings', 'openRankingsSidebar')
    .addItem('Entries', 'openEntriesSidebar')
    .addItem('Race Details', 'openRaceDetailsDialog')
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
      .addItem('Set Formulas', 'setFormulas')
      .addSeparator()
      .addItem('Live Results', 'showResultsURL')
      .addItem('Publish Results', 'saveResultsHTML')
      .addItem('Print Results', 'createPrintableResults')
      .addItem('Send SMS results', 'sendResultsSms'));
  menu.addToUi();
};