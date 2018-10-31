/* jshint camelcase: false */

var entrySets = require('../../../server/entry-sets');
var importSheet = require('../../../server/import');
var racing = require('../../../server/racing');
var tables = require('../../../server/tables');

/**
 * Gets the user's OAuth 2.0 access token so that it can be passed to Picker.
 * This technique keeps Picker from needing to show its own authorization
 * dialog, but is only possible if the OAuth scope that Picker needs is
 * available in Apps Script. In this case, the function includes an unused call
 * to a DriveApp method to ensure that Apps Script requests access to all files
 * in the user's Drive.
 *
 * @return {string} The user's OAuth 2.0 access token.
 */
exports.dialog_import_getOAuthToken = function dialog_import_getOAuthToken() {
    DriveApp.getRootFolder();
    return ScriptApp.getOAuthToken();
};

exports.dialog_import_importEntries = function dialog_import_importEntries(destId, sourceId, options) {
    if (destId === sourceId) {
        throw 'Cannot import from the same spreadsheet';
    }
    var driveFile = DriveApp.getFileById(sourceId);
    if (driveFile) {
        var sourceSS = SpreadsheetApp.openById(sourceId), destSS = SpreadsheetApp.openById(destId),
            srcSheets = racing.getRaceSheets(sourceSS), srcSheet, sheetName, results = [];

        var filterNonEmptyRows = function(row) {
            return !(row['Surname'] === '' && row['First name'] === '')
        };
        var totalCrews = 0, totalPaid = 0, srcRows;
        var entrySetId = entrySets.generateId(destSS);
        for (var i=0; i<srcSheets.length; i++) {
            srcSheet = srcSheets[i];
            sheetName = srcSheet.getName();
            srcRows = tables.getRows(srcSheet, false, true).filter(filterNonEmptyRows);
            srcRows.forEach(function(row) {
                row['Set'] = entrySetId;
            });
            var newCrews =
                importSheet.importSheet(srcRows, destSS.getSheetByName(sheetName), options.importPaid === 'y');
            if (newCrews.numCrews > 0) {
                results = results.concat({
                    name: sheetName,
                    crews: {
                        numCrews: newCrews.numCrews,
                        totalPaid: newCrews.totalPaid
                    }
                });
                totalCrews += newCrews.numCrews;
                totalPaid += newCrews.totalPaid;
            }
        }
        if (options.createEntrySet === 'y' && totalCrews > 0) {
            entrySets.addEntrySets(destSS, [{
                'ID': entrySetId,
                'Label': options.entrySetName
            }]);
        }
        return {
            numCrews: totalCrews,
            totalPaid: totalPaid,
            sheets: results
        };
    } else {
        throw 'Spreadsheet with ID ' + sourceId + ' could not be found';
    }
};