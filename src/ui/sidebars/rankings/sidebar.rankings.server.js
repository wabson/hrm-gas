/* jshint camelcase: false */
/* globals Logger, SpreadsheetApp, Utilities */

var hrm = require('../../../server/hrm.server.main');
var rankings = require('../../../server/rankings');

exports.sidebar_rankings_import = function sidebar_rankings_import(spreadsheetId) {

    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);

    rankings.clearRankingsIfSheetExists(spreadsheet, false);
    rankings.loadRankingsXLS(spreadsheet);

    return exports.sidebar_rankings_info(spreadsheetId);
};

exports.sidebar_rankings_info = function sidebar_rankings_info(spreadsheetId) {

    var spreadsheet = SpreadsheetApp.openById(spreadsheetId), rankingsSheet = spreadsheet.getSheetByName('Rankings'),
        rankingsSize = 0, rankingsLastUpdated = null;

    if (rankingsSheet !== null) {
        rankingsSize = rankings.getNumRankings(rankingsSheet);
        rankingsLastUpdated = rankingsSize > 0 ? rankings.getRankingsLastUpdated(rankingsSheet) : null;
    }

    return {
        rankingsSize: rankingsSize,
        lastUpdated: rankingsLastUpdated !== null ?
            Utilities.formatDate(rankingsLastUpdated, spreadsheet.getSpreadsheetTimeZone(), 'yyyy-MM-dd') : null
    };
};

exports.sidebar_rankings_last_updated = function sidebar_rankings_last_updated(spreadsheetId) {

    var spreadsheet = SpreadsheetApp.openById(spreadsheetId),
        lastUpdated = rankings.getRankingsWebsiteLastUpdated();

    return lastUpdated ? Utilities.formatDate(lastUpdated, spreadsheet.getSpreadsheetTimeZone(), 'yyyy-MM-dd') : null;
};

exports.sidebar_rankings_insert = function sidebar_rankings_insert(rows, headers) {
    var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getActiveSheet(),
        range = SpreadsheetApp.getActiveRange();
    hrm.addRowsToSheet(rows, headers, sheet, range.getRow());
};