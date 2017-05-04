/* jshint camelcase: false */

var hrm = require('../../../server/hrm.server.main');
var uiUtils = require('../../../server/libs/lib.utils.ui.server');

exports.dialog_raceDetails_get = function dialog_raceDetails_get(spreadsheetId) {
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    var inlineInfo = hrm.getRaceInfo(spreadsheet);
    var driveProps = hrm.getDriveProperties(spreadsheetId);
    return uiUtils.jsonSafeObj({
        raceName: inlineInfo.raceName || spreadsheet.getName(),
        raceRegion: inlineInfo.regionId || '',
        raceType: driveProps.hrmType || '',
        raceDate: driveProps.raceDate || '',
        entrySenior: driveProps.entrySenior || '',
        entryJunior: driveProps.entryJunior || '',
        entryLightning: driveProps.entryLightning || '',
        entrySeniorLate: driveProps.entrySeniorLate || '',
        entryJuniorLate: driveProps.entryJuniorLate || '',
        entryLightningLate: driveProps.entryLightningLate || ''
    });
};

exports.dialog_raceDetails_set = function dialog_raceDetails_set(spreadsheetId, formData) {
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId), data = uiUtils.objFromJson(formData);
    hrm.setRaceInfo({
        regionId: data.raceRegion || 'ALL',
        raceName: data.raceName
    }, spreadsheet);
    var driveProps = {
        raceDate: data.raceDate,
        entrySenior: data.entrySenior,
        entryJunior: data.entryJunior,
        entryLightning: data.entryLightning,
        entrySeniorLate: data.entrySeniorLate,
        entryJuniorLate: data.entryJuniorLate,
        entryLightningLate: data.entryLightningLate
    };
    hrm.setDriveProperties(spreadsheetId, driveProps);

    if (formData.setValidation === 'y') {
        hrm.setValidation(spreadsheet);
    }
};