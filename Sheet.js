/**
 * Automatically invoked whenever the spreadsheet is opened.
 */
function onOpen() {
  addMenu();
};

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
      if (matches.length == 0) {
        e.range.setComment("BCU Number " + e.value + " not known");
      } else if (matches.length == 1) {
        // TODO Do this re-ordering of values via a util function
        var dataRowValues = [], raceHeaders = HRM.getTableHeaders(sheet), headerName;
        for (var i = 1; i < raceHeaders.length; i++) {
          headerName = raceHeaders[i] == "Div" ? "Division" : raceHeaders[i]; // translate from rankings data to race sheet headings
          dataRowValues.push(matches[0][headerName] || "");
        };
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
};

/**
 * Display the edit race details dialog
 */
function showEditRaceDetails() {
  // Dialog height in pixels
  var dialogHeight = 300;
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create the UiInstance object myapp and set the title text
  var app = UiApp.createApplication().setTitle('Edit Race Details').setHeight(dialogHeight);
  
  // Create a vertical panel called mypanel and add it to myapp
  var mypanel = app.createVerticalPanel().setStyleAttribute("width", "100%");
  
  // Drop-down to select Hasler region
  var rlb = app.createListBox(false).setId('regionlb').setName('regionlb');
  rlb.setVisibleItemCount(1);
  rlb.addItem("London and South East", "LSE");
  rlb.addItem("East Anglia", "EA");
  rlb.addItem("Southern", "SO");
  rlb.addItem("Scotland", "SC");
  rlb.addItem("Wales", "WA");
  rlb.addItem("Midlands", "MID");
  rlb.addItem("Hasler Final", "FIN");
  mypanel.add(rlb);
  
  var grid = app.createGrid(7, 2);
  grid.setWidget(0, 0, app.createLabel("Race Name"));
  grid.setWidget(0, 1, app.createTextBox().setName("raceName").setId("raceName"));
  grid.setWidget(1, 0, app.createLabel("Race Date"));
  grid.setWidget(1, 1, app.createDateBox().setId("aEntryDeadlinePicker"));
  grid.setWidget(2, 0, app.createLabel("Hasler Region"));
  grid.setWidget(2, 1, rlb);
  grid.setWidget(3, 0, app.createLabel("Senior Entry (£)"));
  grid.setWidget(3, 1, app.createTextBox().setName("snrEntry").setId("snrEntry"));
  grid.setWidget(4, 0, app.createLabel("Junior Entry (£)"));
  grid.setWidget(4, 1, app.createTextBox().setName("jnrEntry").setId("jnrEntry"));
  grid.setWidget(5, 0, app.createLabel("Late Entry Surcharge (£)"));
  grid.setWidget(5, 1, app.createTextBox().setName("lateEntry").setId("lateEntry"));
  grid.setWidget(6, 0, app.createLabel("Advance Entry Deadline"));
  grid.setWidget(6, 1, app.createDateBox().setId("aEntryDeadlinePicker"));
  mypanel.add(grid);
  
  var bnpanel = app.createHorizontalPanel();
  
  // Button handler for saving details
  var savehandler = app.createServerHandler("saveRaceDetails").addCallbackElement(rlb);
  bnpanel.add(app.createButton("Save", savehandler).setId("saveBn"));
  
  // For the close button, we create a server click handler closeHandler and pass closeHandler to the close button as a click handler.
  // The function close is called when the close button is clicked.
  var closeButton = app.createButton('Cancel');
  closeButton.addClickHandler(app.createServerClickHandler('close'));
  bnpanel.add(closeButton);
  
  mypanel.add(bnpanel);
  
  // Add my panel to myapp
  app.add(mypanel);
  
  ss.show(app);
}

function saveRaceDetails() {
  // Do something!
  var app = UiApp.getActiveApplication();
  app.close();
  // The following line is REQUIRED for the widget to actually close.
  return app;
}

/**
 * Handler function for closing a dialog
 
 * @return {AppInstance} Active application instance
 */
function close() {
  var app = UiApp.getActiveApplication();
  app.close();
  // The following line is REQUIRED for the widget to actually close.
  return app;
}

/**
 * Add 'HRM' menu to the active sheet
 */
function addMenu() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  sheet.addMenu("HRM", [
    {
      name : "Load Rankings",
      functionName : "showLoadRankings"
    },
    {
      name : "Load Rankings from File",
      functionName : "showAddLocalRankings"
    },
    {
      name : "Clear Rankings",
      functionName : "clearRankings"
    },
    null,
    {
      name : "New HRM Sheet",
      functionName : "createHRMSheet"
    },
    {
      name : "New ARM Sheet",
      functionName : "createARMSheet"
    },
    {
      name : "New NRM Sheet",
      functionName : "createNRMSheet"
    },
    {
      name : "New K4 Sheet",
      functionName : "createK4Sheet"
    }
  ]);
  sheet.addMenu("Entries", [
    {
      name: "Race Details",
      functionName: "showEditRaceDetails"
    },
    null,
    {
      name : "Add Entries",
      functionName : "showAddEntries"
    },
    {
      name : "Add Entries from File",
      functionName : "showAddLocalEntries"
    },
    {
      name : "Import Entries from CSV",
      functionName : "showImportEntries"
    },
    {
      name : "Clear Entries",
      functionName : "showClearEntries"
    },
    null,
    {
      name: "Modify Crews",
      functionName: "showModifyCrews"
    },
    null,
    {
      name : "Live Entries",
      functionName : "showEntriesURL"
    },
    {
      name : "Publish Entries",
      functionName : "saveEntriesHTML"
    },
    {
      name : "Print Entries",
      functionName : "createPrintableEntries"
    },
    null,
    {
      name : "Finance Summary",
      functionName : "showRaceLevies"
    }
  ]);
  sheet.addMenu("Results", [
    {
      name: "Set Start Times",
      functionName: "showSetStartTimes"
    },
    {
      name: "Set Finish Times",
      functionName: "showSetFinishTimes"
    },
    {
      name: "Calculate Promotions",
      functionName: "calculatePromotions"
    },
    {
      name: "Calculate Points",
      functionName: "calculatePoints"
    },
    null,
    {
      name : "Live Results",
      functionName : "showResultsURL"
    },
    {
      name : "Publish Results",
      functionName : "saveResultsHTML"
    },
    {
      name : "Print Results",
      functionName : "createPrintableResults"
    }
  ]);
}

/**
 * Menu hook for adding current marathon rankings
 */
function showLoadRankings() {
  HRM.showLoadRankings();
}

/**
 * Menu hook for adding rankings from a spreadsheet
 */
function showAddLocalRankings() {
  HRM.showAddLocalRankings();
}

/**
 * Menu hook for clearing all rankings
 */
function clearRankings() {
  HRM.clearRankings();
}

/**
 * Menu hook for adding entries
 */
function showAddEntries() {
  HRM.showAddEntries();
}

/**
 * Menu hook for adding entries from a file
 */
function showAddLocalEntries() {
  HRM.showAddLocalEntries();
}

/**
 * Menu hook for uploading entries from a CSV file
 */
function showImportEntries() {
  HRM.showImportEntries();
}

/**
 * Menu hook for clearing existing entries
 */
function showClearEntries() {
  HRM.showClearEntries();
}

/**
 * Menu hook for moving or deleting crews
 */
function showModifyCrews() {
  HRM.showModifyCrews();
}

/**
 * Menu hook for setting start times
 */
function showSetStartTimes() {
  HRM.showSetStartTimes();
}

/**
 * Menu hook for setting finish times
 */
function showSetFinishTimes() {
  HRM.showSetFinishTimes();
}

/**
 * Menu hook for calculating promotions and demotions
 */
function calculatePromotions() {
  HRM.calculatePromotions();
}

/**
 * Menu hook for calculating Hasler and Lightning points
 */
function calculatePoints() {
  HRM.calculatePoints(ScriptProperties.getProperties());
}

/**
 * Menu hook for viewing live results
 */
function showResultsURL() {
  HRM.showResultsURL();
}

/**
 * Menu hook for viewing live entries
 */
function showEntriesURL() {
  HRM.showEntriesURL();
}

/**
 * Menu hook for viewing race levies summary
 */
function showRaceLevies() {
  HRM.showRaceLevies(ScriptProperties.getProperties());
}

/**
 * Menu hook for setting formulas
 */
function setFormulas() {
  HRM.setFormulas();
}
/**
 * Menu hook for setting validation
 */
function setValidation() {
  HRM.setValidation(ScriptProperties.getProperties());
}
/**
 * Menu hook for setting formatting
 */
function setFormatting() {
  HRM.setFormatting();
}
/**
 * Menu hook for setting race sheet headings
 */
function setAllRaceSheetHeadings() {
  HRM.setAllRaceSheetHeadings();
}
/**
 * Menu hooks for saving HTML
 */
function saveEntriesHTML() {
  HRM.saveEntriesHTML();
}
/**
 * Menu hook for saving HTML
 */
function saveResultsHTML() {
  HRM.saveResultsHTML();
}
/**
 * Menu hook for updating entries from ranking data
 */
function updateEntriesFromRankings() {
  HRM.updateEntriesFromRankings();
}
/**
 * Menu hooks for creating new spreadsheets
 */
function createK4Sheet() {
  HRM.createK4Sheet();
}
function createHRMSheet() {
  HRM.createHRMSheet();
}
function createARMSheet() {
  HRM.createARMSheet();
}
function createNRMSheet() {
  HRM.createNRMSheet();
}
function populateFromHtmlResults() {
  HRM.populateFromHtmlResults();
}
/**
 * Menu hook for creating printable entries sheets
 */
function createPrintableEntries() {
  HRM.createPrintableEntries();
}
/**
 * Menu hook for creating printable results sheets
 */
function createPrintableResults() {
  HRM.createPrintableResults();
}
/**
 * Menu hook for creating printable number board inserts
 */
function createNumberBoards() {
  HRM.createNumberBoards();
}
/**
 * Menu hook for checking for duplicates
 */
function checkEntryDuplicates() {
  HRM.checkEntryDuplicates();
}
/**
 * Menu hook for checking for inconsistencies between the entries and ranking data
 */
function checkEntriesFromRankings() {
  HRM.checkEntriesFromRankings();
}