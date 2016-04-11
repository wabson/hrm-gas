/**
 * Called when an add-on is installed.
 * @param {Object} e Apps Script onInstall event object
 */
function onInstall(e) {
  onOpen(e);
}


/**
 * Called when a spreadsheet that is associated with this add-on is opened.
 * @param {Object} e Apps Script onInstall event object
 */
function onOpen(e) {
  var ui = SpreadsheetApp.getUi();
  var addonMenu = ui.createAddonMenu();

  addonMenu
    .addItem('Start', 'openStartDialog')
    .addSubMenu(ui.createMenu('New')
      .addItem('HRM Sheet', 'createHRMSheet')
      .addItem('ARM Sheet', 'createARMSheet')
      .addItem('NRM Sheet', 'createNRMSheet')
      .addItem('K2 Sheet', 'createK2Sheet')
      .addItem('K4 Sheet', 'createK4Sheet'))
    .addSubMenu(ui.createMenu('Rankings')
      .addItem('Load Rankings', 'showLoadRankings')
      .addItem('Load Rankings from File', 'showAddLocalRankings')
      .addItem('Clear Rankings', 'clearRankings'))
    .addSubMenu(ui.createMenu('Entries')
      .addItem('Add Entries', 'showAddEntries')
      .addItem('Add Entries from File', 'showAddLocalEntries')
      .addItem('Import Entries from CSV', 'showImportEntries')
      .addItem('Update Expiry Dates', 'updateEntriesFromRankings')
      .addItem('Clear Entries', 'showClearEntries')
      .addSeparator()
      .addItem('Modify Crews', 'showModifyCrews')
      .addSeparator()
      .addItem('Live Entries', 'showEntriesURL')
      .addItem('Publish Entries', 'saveEntriesHTML')
      .addItem('Club Entries', 'createClubEntries')
      .addSeparator()
      .addItem('Finance Summary', 'showRaceLevies'))
    // .addSubMenu(ui.createMenu('Results')
    //   .addItem('Set Start Times', 'showSetStartTimes')
    //   .addItem('Set Finish Times', 'showSetFinishTimes')
    //   .addItem('Calculate Promotions', 'calculatePromotions')
    //   .addItem('Calculate Points', 'calculatePoints')
    //   .addSeparator()
    //   .addItem('Live Results', 'showResultsURL')
    //   .addItem('Publish Results', 'saveResultsHTML')
    //   .addItem('Print Results', 'createPrintableResults'))
    .addItem('Race Details', 'showEditRaceDetails');

  addonMenu.addToUi();
}


function onShowSidebar() {
  var html = HtmlService.createTemplateFromFile('a.myproj.home.view');
  html.mode = 'addon';
  SpreadsheetApp.getUi()
      .showSidebar(html.evaluate()
      .setSandboxMode(HtmlService.SandboxMode.IFRAME));
}

/**
 * Automatically invoked whenever a cell is edited
 */
function onEdit(e) {
  var sheet = e.range.getSheet();
  // If we are in a race sheet and this is a name or similar then capitalise the value
  var sheetName = sheet.getName();
  if (e.value && typeof e.value == "string" && e.range.getRow() > 1 && e.range.getColumn() > 1 && e.range.getColumn() < 8 &&
    sheetName != "Finishes" && sheetName != "Rankings" && sheetName != "Clubs" && sheetName != "Results" && 
      sheetName != "PandD" && sheetName != "Summary") {
        if (e.value.toUpperCase() != e.value) {
          e.range.setValue(e.value.toUpperCase());
        }
  }
  // Check for BCU numbers and auto-populate paddler details if we find them
  if (e.value && e.range.getColumn() == 4 && e.value.match(/\d+/)) {
    var headerRange = sheet.getRange(1, 4);
    if (headerRange.getValue() == "BCU Number") {
      var matches = HRM.findRankings(""+e.value);
      if (matches.length === 0) {
        e.range.setComment("BCU Number " + e.value + " not known");
      } else if (matches.length == 1) {
        // TODO Do this re-ordering of values via a util function
        var dataRowValues = [], raceHeaders = HRM.getTableHeaders(sheet), headerName;
        for (var i = 1; i < raceHeaders.length; i++) {
          headerName = raceHeaders[i] == "Div" ? "Division" : raceHeaders[i]; // translate from rankings data to race sheet headings
          dataRowValues.push(matches[0][headerName] || "");
        }
        // Remove empty values from the end
        while (dataRowValues.length > 0 && dataRowValues[dataRowValues.length-1] === "") {
          dataRowValues.pop();
        }
        sheet.getRange(e.range.getRow(), 2, 1, dataRowValues.length).setValues([dataRowValues]);
        e.range.clearNote();
      } else {
        e.range.setComment("Multiple matches found for " + e.value);
      }
    }
  }
  //e.range.setComment("Edited at: " + new Date().toTimeString());
}