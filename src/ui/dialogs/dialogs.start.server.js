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

function dialog_start_submit() {
    Logger.log('Start');
}