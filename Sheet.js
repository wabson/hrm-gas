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
        e.range.setComment("Number not found in Rankings");
      } else if (matches.length == 1) {
        // TODO Do this re-ordering of values via a util function
        var dataRowValues = [matches[0]['Surname'], matches[0]['First name'], matches[0]['BCU Number'], matches[0]['Expiry'], matches[0]['Club'], matches[0]['Class'], matches[0]['Division']]; // Surname  First name  BCU Number  Club  Class Div
        sheet.getRange(e.range.getRow(), 2, 1, 7).setValues([dataRowValues])
      } else {
        e.range.setComment("Multiple matches found in Rankings");
      }
    }
  }
  //e.range.setComment("Edited at: " + new Date().toTimeString());
};

/**
 * Add 'HRM' menu to the active sheet
 */
function addMenu() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var entries = [{
    name: "Race Details",
    functionName: "showEditRaceDetails"
  },
  null,
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
    name : "Add Entries",
    functionName : "addEntries"
  },
  {
    name : "Add Entries from File",
    functionName : "addEntriesFromFile"
  },
  {
    name : "Import Entries from CSV",
    functionName : "importEntries"
  },
  {
    name : "Clear Entries",
    functionName : "clearEntries"
  },
  null,
  {
    name: "Modify Crews",
    functionName: "modifyCrews"
  },
  null,
  {
    name: "Set Start Times",
    functionName: "setStartTimes"
  },
  {
    name: "Set Finish Times",
    functionName: "setFinishTimes"
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
    name : "View Entries",
    functionName : "showEntriesURL"
  },
  {
    name : "View Results",
    functionName : "showResultsURL"
  },
  {
    name : "Finance Summary",
    functionName : "showRaceLevies"
  }];
  sheet.addMenu("HRM", entries);
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
function addEntries() {
  HRM.showAddEntries();
}

/**
 * Menu hook for adding entries from a file
 */
function addEntriesFromFile() {
  HRM.showAddLocalEntries();
}

/**
 * Menu hook for uploading entries from a CSV file
 */
function importEntries() {
  HRM.showImportEntries();
}

/**
 * Menu hook for clearing existing entries
 */
function clearEntries() {
  HRM.showClearEntries();
}

/**
 * Menu hook for moving or deleting crews
 */
function modifyCrews() {
  HRM.showModifyCrews();
}

/**
 * Menu hook for setting start times
 */
function setStartTimes() {
  HRM.showSetStartTimes();
}

/**
 * Menu hook for setting finish times
 */
function setFinishTimes() {
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
 * Menu hook for editing race details
 */
function showEditRaceDetails() {
  HRM.showEditRaceDetails();
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
  HRM.setValidation();
}
/**
 * Menu hook for setting formatting
 */
function setFormatting() {
  HRM.setFormatting();
}