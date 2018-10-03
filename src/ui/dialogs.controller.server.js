var DIALOG_DEFAULT_WIDTH = 500, DIALOG_DEFAULT_HEIGHT = 340, SIDEBAR_DEFAULT_WIDTH = 300;

function openModalDialog_(templateFile, options) {
    options = options || {};
    var template = HtmlService.createTemplateFromFile(templateFile);
    template.spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
    var html = template.evaluate()
        .setSandboxMode(HtmlService.SandboxMode.IFRAME)
        .setWidth(options.width || DIALOG_DEFAULT_WIDTH)
        .setHeight(options.height || DIALOG_DEFAULT_HEIGHT);
    SpreadsheetApp.getUi().showModalDialog(html, options.title);
}
function openSidebar_(templateFile, options) {
    options = options || {};
    var template = HtmlService.createTemplateFromFile(templateFile);
    template.spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
    var html = template.evaluate()
        .setSandboxMode(HtmlService.SandboxMode.IFRAME)
        .setTitle(options.title)
        .setWidth(options.width || SIDEBAR_DEFAULT_WIDTH);
    SpreadsheetApp.getUi().showSidebar(html);
}
exports.openStartDialog = function openStartDialog() {
    openModalDialog_('dialogs.start.view', {
        title: 'Start project',
        height: 280
    });
};
exports.openRaceDetailsDialog = function openRaceDetailsDialog() {
    openModalDialog_('dialogs.race-details.view', {
        title: 'Race details',
        height: 360
    });
};
exports.openRankingsSidebar = function openRankingsSidebar() {
    openSidebar_('sidebar.rankings.view', {
        title: 'Rankings'
    });
};
exports.openEntriesSidebar = function openEntriesSidebar() {
    openSidebar_('sidebar.entries.view', {
        title: 'Add Entries'
    });
};