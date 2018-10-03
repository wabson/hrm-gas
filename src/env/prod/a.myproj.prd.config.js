// For production, this script will now only be able to act on Spreadsheets that
// it is attached to via a user installing and activating the add-on.
/** @OnlyCurrentDoc */
// Put additional production configuration here

/**
 * @param {myproj.json.Configuration} configuration
 *     The current configuration settings.
 * @return {myproj.json.Configuration} configuration
 *     The current configuration settings, updated with test settings.
 */
function provideEnvironmentConfiguration_(configuration) {
    configuration.sheets.debugSpreadsheetId = '';
    configuration.debug = false;

    configuration.app.raceTemplatesFolderId = '14Zwl1QVTdEGRxcOwtOajfdFKg8REwAJZ';

    return configuration;
}
