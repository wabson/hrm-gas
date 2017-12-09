/* jshint camelcase: false */

var hrm = require('../../../server/hrm.server.main');
var Configuration = require('../../../server/libs/lib.configuration');

exports.dialog_start_getRaceTemplates = function dialog_start_getRaceTemplates() {
    var config = Configuration.getCurrent(),
        templatesFolder = DriveApp.getFolderById(config.app.raceTemplatesFolderId),
        sheets, sheet, data = [];
    if (templatesFolder !== null) {
        sheets = templatesFolder.getFilesByType(MimeType.GOOGLE_SHEETS);
        while (sheets.hasNext()) {
            sheet = sheets.next();
            data.push({
                id: sheet.getId(),
                type: hrm.getDriveProperties(sheet.getId()).hrmType || '',
                name: sheet.getName()
            });
        }
    }
    return data;
};

exports.dialog_start_getRaceInfo = function dialog_start_getRaceInfo(spreadsheetId) {
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    var inlineInfo = hrm.getRaceInfo(spreadsheet);
    var driveProps = hrm.getDriveProperties(spreadsheetId);
    return {
        raceName: inlineInfo.raceName || spreadsheet.getName(),
        raceType: driveProps.hrmType || '',
        regionId: inlineInfo.regionId || '',
        hasContent: spreadsheet.getNumSheets() > 1 || spreadsheet.getSheets()[0].getLastRow() > 0
    };
};

exports.dialog_start_submit = function dialog_start_submit(spreadsheetId, formData) {
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId), template = SpreadsheetApp.openById(formData.type);

    Logger.log('Setting race region ' + formData.region || 'ALL');

    hrm.setupRaceFromTemplate(spreadsheet, template, {
        importClubs: false,
        importRankings: formData.importRankings === 'y',
        raceRegion: formData.region || 'ALL',
        raceName: formData.name
    });

    if (formData.openEntries === 'y') {
        openEntriesSidebar();
    }
};