function openStartDialog() {
	var html = HtmlService.createTemplateFromFile('dialogs.start.view')
		.evaluate()
      	.setSandboxMode(HtmlService.SandboxMode.IFRAME);
  	SpreadsheetApp.getUi() // Or DocumentApp or FormApp.
      	.showModalDialog(html, 'Start project');

}