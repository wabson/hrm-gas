/* jshint camelcase: false, node: true */
/* globals Logger, SpreadsheetApp, Utilities */

var hrm = require('../../../server/hrm.server.main');
var uiUtils = require('../../../server/libs/lib.utils.ui.server');

exports.sidebar_entries_race_info = function sidebar_entries_race_info(spreadsheetId) {

    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);

    var rankingsSheet = spreadsheet.getSheetByName('Rankings'),
        rankingsSize = 0, rankingsLastUpdated = null;

    if (rankingsSheet !== null) {
        rankingsSize = hrm.getNumRankings(rankingsSheet);
        rankingsLastUpdated = rankingsSize > 0 ? hrm.getRankingsLastUpdated(rankingsSheet) : null;
    }

    var driveProps = hrm.getDriveProperties(spreadsheetId);

    return {
        classes: hrm.CLASSES_DEFS,
        divisions: hrm.DIVS_ALL,
        clubs: hrm.getClubRows(spreadsheet.getSheetByName('Clubs')),
        rankingsSize: rankingsSize,
        lastUpdated: rankingsLastUpdated !== null ?
            Utilities.formatDate(rankingsLastUpdated, spreadsheet.getSpreadsheetTimeZone(), 'yyyy-MM-dd') : null,
        raceDate: driveProps.raceDate ? Utilities.formatDate(hrm.parseDate(driveProps.raceDate), spreadsheet.getSpreadsheetTimeZone(), 'yyyy-MM-dd') : ''
    };
};

exports.sidebar_entries_search = function sidebar_entries_search(spreadsheetId, term) {

    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    return uiUtils.jsonSafeArr(hrm.searchRankings(spreadsheet, term));
};

exports.sidebar_entries_add = function sidebar_entries_add(spreadsheetId, crewMembers, headers, selectedClass, isLate) {

    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    return hrm.addEntry(uiUtils.arrFromJson(crewMembers), headers, selectedClass, spreadsheet, isLate);
};

exports.sidebar_entries_link = function sidebar_entries_link(sheetName, rowNumber) {

    var ss = SpreadsheetApp.getActiveSpreadsheet(),
        sheet = ss.getSheetByName(sheetName),
        range = sheet.getRange(rowNumber, 1);

    SpreadsheetApp.setActiveSheet(sheet);
    SpreadsheetApp.setActiveRange(range);

};