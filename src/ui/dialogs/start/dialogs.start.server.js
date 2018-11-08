/* jshint camelcase: false */

var drive = require('../../../server/drive');
var hrm = require('../../../server/hrm.server.main');
var Configuration = require('../../../server/libs/lib.configuration');

exports.dialog_start_getRaceTemplates = function dialog_start_getRaceTemplates() {
    var config = Configuration.getCurrent(),
        templatesFolder = DriveApp.getFolderById(config.app.raceTemplatesFolderId),
        sheets, sheet, data = [], hrmType;
    if (templatesFolder !== null) {
        sheets = templatesFolder.getFilesByType(MimeType.GOOGLE_SHEETS);
        while (sheets.hasNext()) {
            sheet = sheets.next();
            hrmType = drive.getDriveProperties(sheet.getId()).hrmType;
            if (hrmType !== undefined) {
                data.push({
                    id: sheet.getId(),
                    type: drive.getDriveProperties(sheet.getId()).hrmType || '',
                    name: sheet.getName()
                });
            }
        }
    }
    return data;
};

exports.dialog_start_getRaceInfo = function dialog_start_getRaceInfo(spreadsheetId) {
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    var inlineInfo = hrm.getRaceInfo(spreadsheet);
    var driveProps = drive.getDriveProperties(spreadsheetId);
    return {
        raceName: inlineInfo.raceName || spreadsheet.getName(),
        raceType: driveProps.hrmType || '',
        regionId: inlineInfo.regionId || '',
        hasContent: spreadsheet.getNumSheets() > 1 || spreadsheet.getSheets()[0].getLastRow() > 0
    };
};

exports.dialog_start_submit = function dialog_start_submit(spreadsheetId, formData) {
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId), template = SpreadsheetApp.openById(formData.type);

    hrm.setupRaceFromTemplate(spreadsheet, template, {
        importRankings: formData.importRankings === 'y',
        raceRegion: formData.region || 'ALL',
        raceName: formData.name
    });

    if (formData.openEntries === 'y') {
        openEntriesSidebar();
    }
};