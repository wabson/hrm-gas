/* jshint camelcase: false */

var drive = require('../../../server/drive');
var hrm = require('../../../server/hrm.server.main');
var uiUtils = require('../../../server/libs/lib.utils.ui.server');

exports.dialog_raceDetails_get = function dialog_raceDetails_get(spreadsheetId) {
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    var inlineInfo = hrm.getRaceInfo(spreadsheet);
    var entryFeesInfo = hrm.getEntryFeesInfo(spreadsheet);
    var raceDateInfo = hrm.getRaceDateInfo(spreadsheet);
    var driveProps = drive.getDriveProperties(spreadsheetId);
    return uiUtils.jsonSafeObj({
        raceName: inlineInfo.raceName || spreadsheet.getName(),
        raceRegion: inlineInfo.regionId || '',
        raceType: driveProps.hrmType || '',
        raceDate: raceDateInfo.raceDate || '',
        entrySenior: entryFeesInfo.entrySenior || '',
        entryVeteran: entryFeesInfo.entryVeteran || '',
        entryJunior: entryFeesInfo.entryJunior || '',
        entryDiv10: entryFeesInfo.entryDiv10 || '',
        entryLightning: entryFeesInfo.entryLightning || '',
        entrySeniorLate: entryFeesInfo.entrySeniorLate || '',
        entryVeteranLate: entryFeesInfo.entryVeteranLate || '',
        entryJuniorLate: entryFeesInfo.entryJuniorLate || '',
        entryDiv10Late: entryFeesInfo.entryDiv10Late || '',
        entryLightningLate: entryFeesInfo.entryLightningLate || ''
    });
};

exports.dialog_raceDetails_set = function dialog_raceDetails_set(spreadsheetId, formData) {
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId), data = uiUtils.objFromJson(formData);
    hrm.setRaceInfo({
        regionId: data.raceRegion || 'ALL',
        raceName: data.raceName
    }, spreadsheet);
    hrm.setEntryFeesInfo({
        entrySenior: data.entrySenior,
        entryVeteran: data.entryVeteran,
        entryJunior: data.entryJunior,
        entryDiv10: data.entryDiv10,
        entryLightning: data.entryLightning,
        entrySeniorLate: data.entrySeniorLate,
        entryVeteranLate: data.entryVeteranLate,
        entryJuniorLate: data.entryJuniorLate,
        entryDiv10Late: data.entryDiv10Late,
        entryLightningLate: data.entryLightningLate
    }, spreadsheet);
    hrm.setRaceDateInfo({
        raceDate: data.raceDate
    }, spreadsheet);
};