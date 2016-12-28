/* jshint camelcase: false */
/* globals Logger, SpreadsheetApp, Utilities */

function sidebar_entries_race_info(spreadsheetId) {

    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);

    var rankingsSheet = spreadsheet.getSheetByName('Rankings'),
        rankingsSize = 0, rankingsLastUpdated = null;

    if (rankingsSheet !== null) {
        rankingsSize = getNumRankings_(rankingsSheet);
        rankingsLastUpdated = rankingsSize > 0 ? getRankingsLastUpdated_(rankingsSheet) : null;
    }

    var driveProps = getDriveProperties_(spreadsheetId);

    return {
        classes: CLASSES_DEFS,
        divisions: DIVS_ALL,
        clubs: getClubRows(spreadsheet.getSheetByName('Clubs')),
        rankingsSize: rankingsSize,
        lastUpdated: rankingsLastUpdated !== null ?
            Utilities.formatDate(rankingsLastUpdated, spreadsheet.getSpreadsheetTimeZone(), 'dd/MM/yy') : null,
        raceDate: driveProps.raceDate ? Utilities.formatDate(new Date(driveProps.raceDate)) : ''
    };
}

function sidebar_entries_search(spreadsheetId, term) {

    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    return jsonSafeArr(searchRankings_(spreadsheet, term));
}

function sidebar_entries_add(spreadsheetId, crewMembers, headers, selectedClass) {

    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    return addEntry_(arrFromJson(crewMembers), headers, selectedClass, spreadsheet);
}

function sidebar_entries_link(sheetName, rowNumber) {

    var ss = SpreadsheetApp.getActiveSpreadsheet(),
        sheet = ss.getSheetByName(sheetName),
        range = sheet.getRange(rowNumber, 1);

    SpreadsheetApp.setActiveSheet(sheet);
    SpreadsheetApp.setActiveRange(range);

}