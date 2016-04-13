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
                name: sheet.getName()
            });
        }
    }
    return data;
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