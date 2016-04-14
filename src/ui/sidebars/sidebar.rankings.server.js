/* globals Logger, SpreadsheetApp, Utilities */

function sidebar_rankings_import(spreadsheetId) {

    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);

    clearRankingsIfSheetExists_(spreadsheet, false);
    loadRankingsXLS(spreadsheet);

    return sidebar_rankings_info(spreadsheetId);
}

function sidebar_rankings_info(spreadsheetId) {

    var spreadsheet = SpreadsheetApp.openById(spreadsheetId), rankingsSheet = spreadsheet.getSheetByName('Rankings'),
        rankingsSize = 0, rankingsLastUpdated = null;

    if (rankingsSheet !== null) {
        rankingsSize = getNumRankings_(rankingsSheet);
        rankingsLastUpdated = rankingsSize > 0 ? getRankingsLastUpdated_(rankingsSheet) : null;
    }

    return {
        rankingsSize: rankingsSize,
        lastUpdated: rankingsLastUpdated !== null ? Utilities.formatDate(rankingsLastUpdated, spreadsheet.getSpreadsheetTimeZone(), 'dd/MM/yy') : null
    };
}

function sidebar_rankings_last_updated(spreadsheetId) {

    var spreadsheet = SpreadsheetApp.openById(spreadsheetId),
        lastUpdated = getRankingsWebsiteLastUpdated_();

    return lastUpdated ? Utilities.formatDate(lastUpdated, spreadsheet.getSpreadsheetTimeZone(), 'dd/MM/yy') : null;
}