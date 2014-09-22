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
function setRaceSheetHeadings() {
  HRM.setRaceSheetHeadings();
}
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