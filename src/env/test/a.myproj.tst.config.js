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

    configuration.app.raceTemplatesFolderId = '1OT6_GP_4OpU5L9M6vWY6ZeLD8VFJ_sjV';
    configuration.app.clubsFileId = '1bOrOHTGa6qZvau9n87A0ogU5FYQyyVqi8kZDZJo0skU';

    return configuration;
}