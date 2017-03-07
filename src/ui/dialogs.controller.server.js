function openModalDialog_(templateFile, options) {
    var template = HtmlService.createTemplateFromFile(templateFile);
    template.spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
    SpreadsheetApp.getUi()
        .showModalDialog(template.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME), options.title);
}
function openSidebar_(templateFile, options) {
    var template = HtmlService.createTemplateFromFile(templateFile);
    template.spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
    var html = template.evaluate()
        .setSandboxMode(HtmlService.SandboxMode.IFRAME)
        .setTitle(options.title)
        .setWidth(300);
    SpreadsheetApp.getUi().showSidebar(html);
}
exports.openStartDialog = function openStartDialog() {
    openModalDialog_('dialogs.start.view', {
        title: 'Start project'
    });
};
exports.openRaceDetailsDialog = function openRaceDetailsDialog() {
    openModalDialog_('dialogs.race-details.view', {
        title: 'Race details'
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