function openStartDialog() {
    var template = HtmlService.createTemplateFromFile('dialogs.start.view');
    template.spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
    SpreadsheetApp.getUi()
        .showModalDialog(template.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME), 'Start project');
}
function openRaceDetailsDialog() {
    var template = HtmlService.createTemplateFromFile('dialogs.race-details.view');
    template.spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
    SpreadsheetApp.getUi()
        .showModalDialog(template.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME), 'Race details');
}
function openRankingsSidebar() {
    var template = HtmlService.createTemplateFromFile('sidebar.rankings.view');
    template.spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
    var html = template.evaluate()
        .setSandboxMode(HtmlService.SandboxMode.IFRAME)
        .setTitle('Rankings')
        .setWidth(300);
    SpreadsheetApp.getUi().showSidebar(html);
}
function openEntriesSidebar() {
    var template = HtmlService.createTemplateFromFile('sidebar.entries.view');
    template.spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
    var html = template.evaluate()
        .setSandboxMode(HtmlService.SandboxMode.IFRAME)
        .setTitle('Add Entries')
        .setWidth(300);
    SpreadsheetApp.getUi().showSidebar(html);
}