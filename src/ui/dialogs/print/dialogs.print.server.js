/* jshint camelcase: false */

var renditions = require('../../../server/renditions');
var printing = require('../../../server/printing');
var uiUtils = require('../../../server/libs/lib.utils.ui.server');

var getResultsRenditions = function getResultsRenditions(ssId) {
    var ss = SpreadsheetApp.openById(ssId);
    return {
        spreadsheet: uiUtils.jsonSafeObj({
            lastUpdated: DriveApp.getFileById(ssId).getLastUpdated().toISOString()
        }),
        entriesSheets: renditions.list(ss, 'printableEntries').map(function(file) {
            return {
                id: file.id,
                name: file.title,
                lastUpdated: file.modifiedDate
            };
        }),
        resultsSheets: renditions.list(ss, 'printableResults').map(function(file) {
            return {
                id: file.id,
                name: file.title,
                lastUpdated: file.modifiedDate
            };
        })
    };
};

var spreadsheetToJson = function(ss) {
    var ssId = ss.getId();
    return {
        id: ssId,
        name: ss.getName(),
        lastUpdated: DriveApp.getFileById(ssId).getLastUpdated()
    };
};

var createEntriesSheet = function createResultsSheet(ssId) {
    var sourceSS = SpreadsheetApp.openById(ssId);
    var destSS = printing.createPrintableEntries(sourceSS);
    return spreadsheetToJson(destSS);
};

var createResultsSheet = function createResultsSheet(ssId) {
    var sourceSS = SpreadsheetApp.openById(ssId);
    var destSS = printing.createPrintableResults(sourceSS);
    return spreadsheetToJson(destSS);
};

var updateEntriesSheet = function updateResultsSheet(sourceSSId, destSSId) {
    var sourceSS = SpreadsheetApp.openById(sourceSSId),
        destSS = SpreadsheetApp.openById(destSSId);
    printing.updatePrintableEntries(sourceSS, destSS);
};

var updateResultsSheet = function updateResultsSheet(sourceSSId, destSSId) {
    var sourceSS = SpreadsheetApp.openById(sourceSSId),
        destSS = SpreadsheetApp.openById(destSSId);
    printing.updatePrintableResults(sourceSS, destSS);
};

var deleteSheet = function(ssId) {
    DriveApp.getFileById(ssId).setTrashed(true);
};

exports.dialog_print_getRenditions = getResultsRenditions;
exports.dialog_print_createEntriesSheet = createEntriesSheet;
exports.dialog_print_updateEntriesSheet = updateEntriesSheet;
exports.dialog_print_createResultsSheet = createResultsSheet;
exports.dialog_print_updateResultsSheet = updateResultsSheet;
exports.dialog_print_deleteSheet = deleteSheet;