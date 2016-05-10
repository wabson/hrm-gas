function dialog_start_getRaceTemplates() {
    var config = Configuration.getCurrent(), 
        templatesFolder = DriveApp.getFolderById(config.app.raceTemplatesFolderId),
        sheets, sheet, data = [];
    if (templatesFolder !== null) {
        sheets = templatesFolder.getFilesByType(MimeType.GOOGLE_SHEETS);
        while (sheets.hasNext()) {
            sheet = sheets.next();
            data.push({
                id: sheet.getId(),
                type: getDriveProperties_(sheet.getId()).hrmType || '',
                name: sheet.getName()
            });
        }
    }
    return data;
}

function dialog_start_getRaceInfo(spreadsheetId) {
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    var inlineInfo = getRaceInfo_(spreadsheet);
    var driveProps = getDriveProperties_(spreadsheetId);
    return {
        raceName: inlineInfo.raceName || spreadsheet.getName(),
        raceType: driveProps.hrmType || '',
        regionId: inlineInfo.regionId || '',
        hasContent: spreadsheet.getNumSheets() > 1 || spreadsheet.getSheets()[0].getLastRow() > 0
    };
}

function dialog_start_submit(spreadsheetId, formData) {
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId), template = SpreadsheetApp.openById(formData.type);

    Logger.log('Setting race region ' + formData.region || 'ALL');

    setupRaceFromTemplate_(spreadsheet, template, {
        importClubs: true,
        importRankings: formData.importRankings == 'y',
        raceRegion: formData.region || 'ALL',
        raceName: formData.name
    });

    // TODO open entries sidebar if requested
}