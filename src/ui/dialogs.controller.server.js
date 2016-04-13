function openStartDialog() {
    var template = HtmlService.createTemplateFromFile('dialogs.start.view');
    template.spreadsheetId = SpreadsheetApp.getActiveSpreadsheet().getId();
    SpreadsheetApp.getUi().showModalDialog(template.evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME), 'Start project');
}