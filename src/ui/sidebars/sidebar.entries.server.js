/* globals Logger, SpreadsheetApp, Utilities */

function sidebar_entries_race_info(spreadsheetId) {

    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    return {
        classes: CLASSES_DEFS,
        divisions: DIVS_ALL,
        clubs: getClubRows(spreadsheet.getSheetByName("Clubs"))
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