/* jshint camelcase: false */

var uiUtils = require('./libs/lib.utils.ui.server');
var dialogs = require('../ui/dialogs.controller.server');
var apiRaceDetails = require('../ui/dialogs/race-details/dialogs.race-details.server');
var apiStart = require('../ui/dialogs/start/dialogs.start.server');
var apiImport = require('../ui/dialogs/import/dialogs.import.server');
var apiPrint = require('../ui/dialogs/print/dialogs.print.server');
var apiEntries = require('../ui/sidebars/entries/sidebar.entries.server');
var apiRankings = require('../ui/sidebars/rankings/sidebar.rankings.server');
var apiSendSms = require('../ui/sidebars/sms/sidebar.sms.server');

var functions = require('./functions');

global.dialog_start_getRaceTemplates = apiStart.dialog_start_getRaceTemplates;
global.dialog_start_getRaceInfo = apiStart.dialog_start_getRaceInfo;
global.dialog_start_submit = apiStart.dialog_start_submit;

global.dialog_raceDetails_get = apiRaceDetails.dialog_raceDetails_get;
global.dialog_raceDetails_set = apiRaceDetails.dialog_raceDetails_set;

global.dialog_import_getOAuthToken = apiImport.dialog_import_getOAuthToken;
global.dialog_import_importEntries = apiImport.dialog_import_importEntries;

global.dialog_print_getResultsInfo = apiPrint.dialog_print_getRenditions;
global.dialog_print_createEntriesSheet = apiPrint.dialog_print_createEntriesSheet;
global.dialog_print_updateEntriesSheet = apiPrint.dialog_print_updateEntriesSheet;
global.dialog_print_createResultsSheet = apiPrint.dialog_print_createResultsSheet;
global.dialog_print_updateResultsSheet = apiPrint.dialog_print_updateResultsSheet;
global.dialog_print_deleteSheet = apiPrint.dialog_print_deleteSheet;

global.sidebar_entries_race_info = apiEntries.sidebar_entries_race_info;
global.sidebar_entries_races = apiEntries.sidebar_entries_races;
global.sidebar_entries_search = apiEntries.sidebar_entries_search;
global.sidebar_entries_add = apiEntries.sidebar_entries_add;
global.sidebar_entries_link = apiEntries.sidebar_entries_link;

global.sidebar_rankings_import = apiRankings.sidebar_rankings_import;
global.sidebar_rankings_info = apiRankings.sidebar_rankings_info;
global.sidebar_rankings_last_updated = apiRankings.sidebar_rankings_last_updated;
global.sidebar_rankings_insert = apiRankings.sidebar_rankings_insert;

global.sidebar_sendSms_get = apiSendSms.sidebar_sendSms_get;
global.sidebar_sendSms_send = apiSendSms.sidebar_sendSms_send;

global.openStartDialog = dialogs.openStartDialog;
global.openRaceDetailsDialog = dialogs.openRaceDetailsDialog;
global.openImportDialog = dialogs.openImportDialog;
global.openPrintDialog = dialogs.openPrintDialog;
global.openRankingsSidebar = dialogs.openRankingsSidebar;
global.openEntriesSidebar = dialogs.openEntriesSidebar;
global.openSmsSidebar = dialogs.openSmsSidebar;

global.include = uiUtils.includeHTML;

global.addEntrySets = functions.addEntrySets;

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
    .addItem('Race Details', 'openRaceDetailsDialog')
    .addSeparator()
    .addItem('Rankings', 'openRankingsSidebar')
    .addSeparator()
    .addItem('Add Entries', 'openEntriesSidebar')
    .addItem('Import Entries', 'openImportDialog')
    .addSeparator()
    .addItem('Print Sheets', 'openPrintDialog')
    .addItem('Send SMS Results', 'openSmsSidebar');
  menu.addToUi();
};