// For testing - broadens the OAuth scope to allow opening any
// Spreadsheet on the current user's Drive
/** @NotOnlyCurrentDoc */

/**
 * @param {myproj.json.Configuration} configuration
 *     The current configuration settings.
 * @return {myproj.json.Configuration} configuration
 *     The current configuration settings, updated with test settings.
 */
function provideEnvironmentConfiguration_(configuration) {
    //TODO: (blog post reader) Change ID below to a Spreadsheet ID you can read
    configuration.sheets.debugSpreadsheetId =
        '1uLT2QyiqKdCRGLNuG0X0QU97c0OQiEWtiQHHGaBDWA0';
    configuration.debug = true;

    configuration.app.raceTemplatesFolderId = '0B8A0SXNo_BkZYkIzZnNiTzRGNms';
    configuration.app.clubsFileId = '1oUTH3FMWPd4HqyKA1AiaA1U3h9SZ1kVEGmS2B9bSxxs';

    return configuration;
}