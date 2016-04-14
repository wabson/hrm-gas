function openStartDialog() {
    var template = HtmlService.createTemplateFromFile('dialogs.start.view');
    template.spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
    SpreadsheetApp.getUi().showModalDialog(template.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME), 'Start project');
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
}