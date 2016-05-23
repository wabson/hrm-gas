function dialog_raceDetails_get(spreadsheetId) {
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    var inlineInfo = getRaceInfo_(spreadsheet);
    var driveProps = getDriveProperties_(spreadsheetId);
    return jsonSafeObj({
        raceName: inlineInfo.raceName || spreadsheet.getName(),
        raceRegion: inlineInfo.regionId || '',
        raceType: driveProps.hrmType || '',
        raceDate: driveProps.raceDate || '',
        entrySenior: driveProps.entrySenior || '',
        entryJunior: driveProps.entryJunior || '',
        entryLightning: driveProps.entryLightning || ''
    });
}

function dialog_raceDetails_set(spreadsheetId, formData) {
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId), data = objFromJson(formData);
    setRaceInfo_({
        regionId: data.raceRegion || 'ALL',
        raceName: data.raceName
    }, spreadsheet);
    var driveProps = {
        raceDate: data.raceDate,
        entrySenior: data.entrySenior,
        entryJunior: data.entryJunior,
        entryLightning: data.entryLightning
    };
    setDriveProperties_(spreadsheetId, driveProps);

    if (formData.setValidation == 'y') {
        setValidation(spreadsheet);
    }
}