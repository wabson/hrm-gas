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
    configuration.sheets.debugSpreadsheetId = 'DRIVE_FILE_ID';
    return configuration;
}