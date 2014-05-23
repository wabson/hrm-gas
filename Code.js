/*
 * Hasler Race Management Spreadsheet functions
 *
 * Author: Will Abson
 *
 * These are designed to be called from a Spreadsheet or from a webapp (TODO: provide doGet() function to implement this)
 */

/**
 * Rankings sheet column names
 */
var rankingsSheetColumnNames = ["Surname", "First name", "Club", "Class", "BCU Number", "Expiry", "Division"];
var rankingsSheetName = "Rankings";
var rankingsUri = "http://www.marathon-canoeing.org.uk/marathon/media/RankingList.xls";

/**
 * Race sheet column names
 */
var raceSheetColumnNames = ["Number", "Surname", "First name", "BCU Number", "Expiry", "Club", "Class", "Div", "Paid", "Time+/-", "Start", "Finish", "Elapsed", "Posn", "Notes"];
var raceSheetColumnAlignments = ["left", "left", "left", "left", "center", "left", "left", "center", "right", "right", "center", "center", "center", "center", "left"];
// For Hasler races, add the Promotion and Points columns before Notes
if (SpreadsheetApp.getActiveSpreadsheet() && isHaslerRace()) {
  raceSheetColumnNames.splice(raceSheetColumnNames.length - 1, 0, "P/D", "Points");
  raceSheetColumnAlignments.splice(raceSheetColumnAlignments.length - 1, 0, "center", "center");
}

/**
 * ID assigned to this library
 */
var PROJECT_ID = "AKfycbzymqCQ6rUDYiNeG63i9vYeXaSE1YtiHDEgRHFQ0TdXaBSwkLs";

/**
 * List of canoe clubs
 */
var clubs = [];

/**
 * Button handler for load rankings dialog
 *
 * @param {object} eventInfo Event information
 * @return {AppInstance} Active application instance
 */
function loadRankings(eventInfo) {
  var app = UiApp.getActiveApplication(),
    clubId = eventInfo.parameter.club, 
    clear = eventInfo.parameter.clear, 
    current = eventInfo.parameter.current;
  Logger.log("Current checkbox: " + (current == 'true'));
  Logger.log("Clear checkbox: " + (clear == 'true'));
  if (clear == 'true') {
    Logger.log("Clearing existing rankings");
    clearRankings();
  }
  loadRankingsXLS(clubId, current == 'true');
  app.close();
  return app;
}

/**
 * Display the load rankings dialog
 */
function showLoadRankings() {
  // Dialog height in pixels
  var dialogHeight = 125;
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create the UiInstance object myapp and set the title text
  var app = UiApp.createApplication().setTitle('Load Hasler Rankings').setHeight(dialogHeight);
  
  // Create a vertical panel called mypanel and add it to myapp
  var mypanel = app.createVerticalPanel().setStyleAttribute("width", "100%");
  
  mypanel.add(app.createLabel("This will load rankings from the MRC web site into the spreadsheet. This may take a short while if loading rankings from all clubs."));
  
  var lb = app.createListBox(false).setId('club').setName('club');
  lb.setVisibleItemCount(1);
  lb.addItem("All Clubs", "");

  // add items to ListBox
  try
  {
    var clubs = getClubList();
    for (var i=0; i<clubs.length; i++) {
      lb.addItem(clubs[i].name, clubs[i].code);
    }
  }
  catch (e)
  {
    // Do nothing
  }
  mypanel.add(lb);
  var cb = app.createCheckBox("Clear existing records first").setValue(true).setId('clear').setName('clear'), 
      currentCb = app.createCheckBox("Current rankings only").setValue(true).setId('current').setName('current');
  mypanel.add(cb);
  mypanel.add(currentCb);
  
  var clientHandler =
    app.createClientHandler().forEventSource().setEnabled(false);

  var closeButton = app.createButton('Load');
  var closeHandler = app.createServerClickHandler('loadRankings').addCallbackElement(lb).addCallbackElement(cb).addCallbackElement(currentCb);
  closeButton.addClickHandler(closeHandler).addClickHandler(clientHandler);
  mypanel.add(closeButton);

  // Add my panel to myapp
  app.add(mypanel);
  
  ss.show(app);
}

/**
 * Fetch a list of all canoe clubs, retrieved from ScraperWiki
 *
 * @return {Array} List of clubs as object literals with properties 'name', 'code' and 'region_code'
 */
function getClubList() {
  if (clubs.length == 0) {
    swQuery("hasler_marathon_club_list", "`swdata`.* from `swdata` order by name", function appendClubs(data) {
      clubs = clubs.concat(data);
    });
  }
  return clubs;
}

/**
 * Load current Hasler Rankings from the ScraperWiki datastore, and place these into the Rankings sheet in the spreadsheet
 * If the Rankings sheet does not currently exist it will be created. If the sheet contains data it will be removed, before
 * the new data is loaded.
 *
 * @param {string} clubName Code of the club which should be loaded, if null then rankings from all clubs will be loaded
 * @param {boolean} onlyLatest True if only current rankings should be loaded. Old rankings are also available from the scraper.
 */
function loadRankingsData(clubName, onlyLatest) {
  var sheetName = "Rankings";
  // Locate Rankings sheet or create it if it doesn't already exist
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName, ss.getSheets().length);
  
  var baseQuery = "`swdata`.* from `swdata`",
      whereClauses = [];
  if (clubName) {
    whereClauses.push("club='" + clubName + "'");
  }
  if (onlyLatest == true) {
    baseQuery += ", `swvariables`"
    whereClauses.push("`swvariables`.name='last_updated' and updated=`swvariables`.value_blob");
  }
  if (whereClauses.length > 0) {
    baseQuery += " where " + whereClauses.join(" and ");
  }
  swQuery("hasler_marathon_ranking_list", baseQuery, function appendRankings(data) {
    if (data.length > 0)
    {
      var destinationRange = sheet.getRange(1 + sheet.getLastRow(), 1, data.length, rankingsSheetColumnNames.length);
      var dataRows = [];
      for (var j=0; j < data.length; j++)
      {
        dataRows.push([data[j]['surname'], data[j]['first_name'], data[j]['club'], data[j]['class'], data[j]['bcu_number'], data[j]['division']]);
      }
      destinationRange.setValues(dataRows);
    }
  });
  // Add the last update date to the sheet
  swQuery("hasler_marathon_ranking_list", "* from swvariables", function appendRankings(data) {
    if (data.length > 0) {
      sheet.getRange(1, 7).setValues([[data[0]['value_blob']]]);
    } else {
      throw "Last update date not found";
    }
  });
}

/**
 * Load current Hasler Rankings from the latest Excel file on the marathon web site
 *
 * @param {string} clubName Code of the club which should be loaded, if null then rankings from all clubs will be loaded
 */
function loadRankingsXLS(clubName) {
  var pageResp = UrlFetchApp.fetch("http://canoeracing.org.uk/marathon/index.php/latest-marathon-ranking-list/"), pageSrc = pageResp.getContentText(),
    reMatch = /<a href="([\w\/\-_:\.]+)">Ranking *List<\/a>/ig.exec(pageSrc);
  if (!reMatch) {
    throw("Ranking list URL not found");
  }
  var rankingListUrl = reMatch[1], response = UrlFetchApp.fetch(rankingListUrl);
  if (response.getResponseCode() == 200) {
    //DocsList.createFile(response.getBlob());
    // Need to convert to Google Sheets native format
    // Blocked by http://code.google.com/p/google-apps-script-issues/issues/detail?id=1019
    //throw("Not yet implemented!");
    var file = {
      title: 'RankingList.xls'
    };
    file = Drive.Files.insert(file, response.getBlob(), {
      convert: true
    });
  } else {
    throw "An error was encountered loading the rankings spreadsheet (code: " + response.getResponseCode() + ")";
  }
  
  // TODO refactor the following code into a common method, shared between loadRankingsXLS() and loadRankingsData()
  var sheetName = "Rankings";
  // Locate Rankings sheet or create it if it doesn't already exist
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sourceSS = SpreadsheetApp.openById(file.id),
    sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName, ss.getSheets().length), 
    sourceRange = sourceSS.getActiveSheet().getDataRange(), sourceHeaderRange = sourceSS.getActiveSheet().getRange(1, 1, 1, sourceRange.getWidth());
  
  if (sourceRange.getHeight() > 0)
  {
    var destinationRange = sheet.getRange(sheet.getLastRow(), 1, sourceRange.getHeight(), sourceRange.getWidth()),
      headerRange = sheet.getRange(1, 1, 1, sourceRange.getWidth());
    // Copying ranges directly is not supported between spreadsheets
    destinationRange.setValues(sourceRange.getValues());
    // Set expiration date formats (column F)
    sheet.getRange(2, 6, sourceRange.getHeight()-1, 1).setNumberFormat("dd/MM/yyyy");
    // Set header row format
    headerRange.setBackgrounds(sourceHeaderRange.getBackgrounds());
    headerRange.setHorizontalAlignments(sourceHeaderRange.getHorizontalAlignments());
    var numberFormats = sourceHeaderRange.getNumberFormats();
    // Override date number format as it does not seem to get applied correctly
    numberFormats[0][7] = "dd/MM/yyyy";
    headerRange.setNumberFormats(numberFormats);

    Browser.msgBox("Added " + (sourceRange.getHeight()-1) + " rankings");
  }

  DriveApp.removeFile(DriveApp.getFileById(file.id));
}

/**
 * Query the ScraperWiki datastore and perform some action against the returned items
 *
 * @param {string} scraper Name of the scraper to query
 * @param {string} baseQuery Items to include in the SELECT statement (do not include SELECT prefix itself)
 * @param {function} dataFn Function to execute against each data item in turn
 */
function swQuery(scraper, baseQuery, dataFn) {
  var batchSize = 100, batchNum = 0, data;
  while (typeof data == "undefined" || data.length > 0)
  {
    var query = "select " + baseQuery + " limit " + (batchSize * batchNum) + ", " + batchSize;
    var url = "https://api.scraperwiki.com/api/1.0/datastore/sqlite?format=jsondict" +
        "&name=" + encodeURIComponent(scraper) + 
        "&query=" + encodeURIComponent(query);
    Logger.log("Fetching data from " + url);
    var response = UrlFetchApp.fetch(url);
    var json = response.getContentText();
    data = JSON.parse(json);
    if (data.length > 0) {
      dataFn.call(this, data);
    }
    batchNum ++;
  }
}

/**
 * Clear all Hasler rankings in the current spreadsheet
 */
function clearRankings() {
  var sheetName = "Rankings";
  // Locate Rankings sheet or create it if it doesn't already exist
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw "Could not find Rankings sheet";
  }
  sheet.clear();
  sheet.appendRow(rankingsSheetColumnNames);
}

/**
 * Clear all entries in the specified sheet
 */
function clearEntriesSheet(sheet) {
  if (!sheet) {
    throw "Could not find entries sheet " + sheetName;
  }
  if (sheet.getLastRow() > 2 && sheet.getLastColumn() > 2) {
    sheet.getRange(2, 2, sheet.getLastRow()-1, sheet.getLastColumn()-1).clear({contentsOnly: true, commentsOnly: true, formatOnly: true});
  }
}

function clearAllEntries() {
  var sheets = getRaceSheets();
  for (var i=0; i<sheets.length; i++) {
    clearEntriesSheet(sheets[i]);
  }
  setValidation();
  setFormulas();
}

/**
 * Add the specified Hasler rankings to the current spreadsheet
 *
 * @param {array} items List of items as object literals. Must include the properties 'surname', 'first_name', 'club', 'class', 'bcu_number' and 'division'
 */
function addRankings(items) {
  var destinationRange = sheet.getRange(2 + (batchSize * batchNum), 1, items.length, rankingsSheetColumnNames.length);
  var dataRows = [];
  for (var j=0; j < data.length; j++)
  {
    dataRows.push([data[j]['surname'], data[j]['first_name'], data[j]['club'], data[j]['class'], data[j]['bcu_number'], data[j]['division']]);
  }
  destinationRange.setValues(dataRows);
}

/**
 * Display the dialog used to add Hasler rankings from a spreadsheet stored in Google Docs
 */
function showAddLocalRankings() {
  // Dialog height in pixels
  var dialogHeight = 80;
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create the UiInstance object myapp and set the title text
  var app = UiApp.createApplication().setTitle('Add Local Rankings').setHeight(dialogHeight);
  
  // Create a vertical panel called mypanel and add it to myapp
  var mypanel = app.createVerticalPanel().setStyleAttribute("width", "100%");
  
  var lb = app.createListBox(false).setId('spreadsheetId').setName('spreadsheetId');
  lb.setVisibleItemCount(1);

  // add items to ListBox
  var mySpreadsheets = DocsList.getFilesByType(DocsList.FileType.SPREADSHEET);
  for (var i=0; i<mySpreadsheets.length; i++) {
    lb.addItem(mySpreadsheets[i].getName(), mySpreadsheets[i].getId());
  }
  mypanel.add(lb);
  
  var closeButton = app.createButton('Add');
  var closeHandler = app.createServerClickHandler('addLocalRankings').addCallbackElement(lb);
  closeButton.addClickHandler(closeHandler);
  mypanel.add(closeButton);

  // Add my panel to myapp
  app.add(mypanel);
  
  ss.show(app);
}

/**
 * Handler for adding Hasler Rankings from a spreadsheet stored in Google Docs. This is intended to be called when the dialog's submit button is clicked.
 *
 * @param {object} eventInfo Event information
 * @return {AppInstance} Active application instance
 */
function addLocalRankings(eventInfo) {
  var app = UiApp.getActiveApplication();
  // Because the list box was named "spreadsheetId" and added as a callback element to the
  // button's click event, we have its value available in eventInfo.parameter.spreadsheetId.
  var ssId = eventInfo.parameter.spreadsheetId;
  if (ssId)
  {
    var ss = SpreadsheetApp.openById(ssId),
        sheet = ss.getActiveSheet();
    
    var ass = SpreadsheetApp.getActiveSpreadsheet(),
        rsheet = ass.getSheetByName("Rankings");
    
    if (!rsheet) {
      throw "Current spreadsheet has no Rankings sheet";
    }
    
    var range = sheet.getRange(2, 1, sheet.getLastRow()-1, 6), values = range.getValues();
    //throw "hello" + values.length;
    var destinationRange = rsheet.getRange(rsheet.getLastRow() + 1, 1, values.length, 6);
    
    destinationRange.setValues(values);
  } else {
    throw "Could not locate source spreadsheet";
  }
  app.close();
  return app;
}

/**
 * Display the dialog used to add Hasler rankings from a spreadsheet stored in Google Docs
 */
function showAddLocalEntries() {
  // Dialog height in pixels
  var dialogHeight = 130;
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create the UiInstance object myapp and set the title text
  var app = UiApp.createApplication().setTitle('Add Entries from Spreadsheet').setHeight(dialogHeight);
  
  // Create a vertical panel called mypanel and add it to myapp
  var mypanel = app.createVerticalPanel().setStyleAttribute("width", "100%");
  
  var lb = app.createListBox(false).setId('addLocalEntriesSpreadsheetId').setName('spreadsheetId');
  lb.setVisibleItemCount(1);

  // add items to ListBox
  var mySpreadsheets = DocsList.getFilesByType(DocsList.FileType.SPREADSHEET);
  for (var i=0; i<mySpreadsheets.length; i++) {
    lb.addItem(mySpreadsheets[i].getName(), mySpreadsheets[i].getId());
  }
  mypanel.add(lb);
  
  var addButton = app.createButton('Add Entries').setId("addLocalEntriesAddBn");
  var addHandler = app.createServerClickHandler('addLocalEntries').addCallbackElement(lb);
  addButton.addClickHandler(addHandler).addClickHandler(app.createClientHandler().forEventSource().setEnabled(false));
  mypanel.add(addButton);
  
  // Status text
  mypanel.add(app.createHTML("").setId("addLocalEntriesResult").setVisible(false).setSize("100%", "100px").setStyleAttribute("overflow", "scroll"));
  
  // For the close button, we create a server click handler closeHandler and pass closeHandler to the close button as a click handler.
  // The function close is called when the close button is clicked.
  var closeButton = app.createButton('Done').setId("addLocalEntriesCloseBn").setVisible(false);
  var closeHandler = app.createServerClickHandler('close');
  closeButton.addClickHandler(closeHandler).addClickHandler(app.createClientHandler().forEventSource().setEnabled(false));
  mypanel.add(closeButton);

  // Add my panel to myapp
  app.add(mypanel);
  
  ss.show(app);
}

/**
 * Display the dialog used to import entries from a CSV file stored in Google Docs
 */
function showImportEntries() {
  // Dialog height in pixels
  var dialogHeight = 130;
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create the UiInstance object myapp and set the title text
  var app = UiApp.createApplication().setTitle('Add Entries from CSV File').setHeight(dialogHeight);
  
  // Create a vertical panel called mypanel and add it to myapp
  var mypanel = app.createVerticalPanel().setStyleAttribute("width", "100%");
  //    upload = app.createFileUpload().setName('csvfile');
  
  var lb = app.createListBox(false).setId('importEntriesFileId').setName('spreadsheetId');
  lb.setVisibleItemCount(1);

  // add items to ListBox
  var mySpreadsheets = DocsList.getFilesByType(DocsList.FileType.OTHER);
  for (var i=0; i<mySpreadsheets.length; i++) {
    if (mySpreadsheets[i].getName().match(/\.csv$/i)) {
      lb.addItem(mySpreadsheets[i].getName(), mySpreadsheets[i].getId());
    }
  }
  mypanel.add(lb);
  //mypanel.add(upload);
  
  var addButton = app.createButton('Import Entries').setId("importEntriesAddBn");
  var addHandler = app.createServerClickHandler('importEntries').addCallbackElement(lb);
  addButton.addClickHandler(addHandler).addClickHandler(app.createClientHandler().forEventSource().setEnabled(false));
  mypanel.add(addButton);
  
  // Status text
  mypanel.add(app.createHTML("").setId("importEntriesResult").setVisible(false).setSize("100%", "100px").setStyleAttribute("overflow", "scroll"));
  
  // For the close button, we create a server click handler closeHandler and pass closeHandler to the close button as a click handler.
  // The function close is called when the close button is clicked.
  var closeButton = app.createButton('Done').setId("importEntriesCloseBn").setVisible(false);
  var closeHandler = app.createServerClickHandler('close');
  closeButton.addClickHandler(closeHandler).addClickHandler(app.createClientHandler().forEventSource().setEnabled(false));
  mypanel.add(closeButton);

  // Add my panel to myapp
  app.add(mypanel);

  ss.show(app);
}

/**
 * Handler for importing entries from a CSV file stored in Google Docs. This is intended to be called when the dialog's submit button is clicked.
 * TODO Support keeping boat numbers
 * TODO Ensure that the first member of each crew 'lines up' with a boat number in the destination sheet
 *
 * @param {object} eventInfo Event information
 * @return {AppInstance} Active application instance
 */
function importEntries(eventInfo) {
  var app = UiApp.getActiveApplication();
  // Because the upload control was named "csvfile" and added as a callback element to the
  // button's click event, we have its value available in eventInfo.parameter.csvfile.
  //var csvBlob = eventInfo.parameter.csvfile;
  //for (var p in eventInfo.parameter) {
  //  Logger.log("" + p + ": " + eventInfo.parameter[p]);
  //}
  //if (csvBlob)
  //{
  //  var csvData = csvToArray(csvBlob.contents),
  var csvId = eventInfo.parameter.spreadsheetId;
  if (csvId)
  {
    var csv = DocsList.getFileById(csvId),
        csvData = csvToArray(csv.getContentAsString()),
        ass = SpreadsheetApp.getActiveSpreadsheet(),
        sheets = getRaceSheets(ass), sheet, rows, results = [], numCrewsByRace = {},
        startRow = 1, // Assume a header row exists
        newRows = {},
        startCol = 1; // Number of columns to skip at the start of each row

    for (var i=startRow; i<csvData.length; i++) {
      // "Date","First Name","Last Name","Club","Class","BCU Number","Marathon Ranking","First Name","Last Name","Club","Class","BCU Number","Marathon Ranking","Race Class"
      if (csvData[i].length >= 14) {
        var raceClass = csvData[i][startCol+12], sourceData = csvData[i].slice(startCol, startCol+13); // Will yield a 13-value list
        if (raceClass !== null && raceClass !== "") {
          newRows[raceClass] = newRows[raceClass] || [];
          numCrewsByRace[raceClass] = numCrewsByRace[raceClass] || 0;
          newRows[raceClass].push(
            [sourceData[1], sourceData[0], sourceData[4], sourceData[2], sourceData[3], sourceData[5]],
            [sourceData[7], sourceData[6], sourceData[10], sourceData[8], sourceData[9], sourceData[11]]
          ); // Surname, First name, BCU Number, Club, Class, Div
          numCrewsByRace[raceClass] ++;
        }
      }
    }
    
    for (var raceName in newRows) {
      rows = newRows[raceName];
      // Iterate through all paddlers
      // TODO Below same code as in second part of addLocalEntries()
      if (rows.length == 0) {
        Logger.log("No rows for sheet " + raceName);
        continue;
      } else {
        Logger.log("" + rows.length + " rows for sheet " + raceName);
      }
      
      var dstsheet = findMatchingRaceSheet(raceName);
      
      if (dstsheet != null) {
        // Find the latest row with a number but without a name in the sheet
        var nextRow = getNextEntryRow(dstsheet);
        if (nextRow > 0) {
          Logger.log("Adding new rows at row " + nextRow);
          if (dstsheet.getLastRow()-nextRow+1 >= rows.length) {
            dstsheet.getRange(nextRow, 2, rows.length, 6).setValues(rows); // TODO Allow numbers to be added, in which case length will be 7 rather than 6
            results.push("Added " + numCrewsByRace[raceName] + " crews to " + raceName);
          } else {
            throw "Too many rows to import into " + raceName + " (" + rows.length + " data rows, " + (dstsheet.getLastRow()-nextRow+1) + " in sheet)";
          }
        } else {
          throw("No space left in sheet " + raceName);
        }
      } else {
        throw("Destination sheet " + raceName + " not found");
      }
    }
  } else {
    throw "Could not locate source spreadsheet";
  }
  
  app.getElementById("importEntriesFileId").setVisible(false);
  app.getElementById("importEntriesAddBn").setVisible(false);
  app.getElementById("importEntriesResult").setHTML(results.join("<br />")).setVisible(true);
  app.getElementById("importEntriesCloseBn").setVisible(true);

  return app;
}

/* From http://stackoverflow.com/questions/1293147/javascript-code-to-parse-csv-data */
// This will parse a delimited string into an array of
// arrays. The default delimiter is the comma, but this
// can be overriden in the second argument.
function csvToArray( strData, strDelimiter ){
  // Check to see if the delimiter is defined. If not,
  // then default to comma.
  strDelimiter = (strDelimiter || ",");
  
  // Create a regular expression to parse the CSV values.
  var objPattern = new RegExp(
    (
      // Delimiters.
      "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
      
      // Quoted fields.
      "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
      
      // Standard fields.
      "([^\"\\" + strDelimiter + "\\r\\n]*))"
    ),
    "gi"
  );
  
  // Create an array to hold our data. Give the array
  // a default empty first row.
  var arrData = [[]];
  
  // Create an array to hold our individual pattern
  // matching groups.
  var arrMatches = null;
  
  // Keep looping over the regular expression matches
  // until we can no longer find a match.
  while (arrMatches = objPattern.exec( strData )){
    
    // Get the delimiter that was found.
    var strMatchedDelimiter = arrMatches[ 1 ];
    
    // Check to see if the given delimiter has a length
    // (is not the start of string) and if it matches
    // field delimiter. If id does not, then we know
    // that this delimiter is a row delimiter.
    if (
      strMatchedDelimiter.length &&
      (strMatchedDelimiter != strDelimiter)
      ){
        // Since we have reached a new row of data,
        // add an empty row to our data array.
        arrData.push( [] );
      }
    
    // Now that we have our delimiter out of the way,
    // let's check to see which kind of value we
    // captured (quoted or unquoted).
    if (arrMatches[ 2 ]){
      // We found a quoted value. When we capture
      // this value, unescape any double quotes.
      var strMatchedValue = arrMatches[ 2 ].replace(
        new RegExp( "\"\"", "g" ),
        "\""
      );
      
    } else {
      
      // We found a non-quoted value.
      var strMatchedValue = arrMatches[ 3 ];
      
    }
    
    
    // Now that we have our value string, let's add
    // it to the data array.
    arrData[ arrData.length - 1 ].push( strMatchedValue );
  }
  
  // Return the parsed data.
  return( arrData );
}

function findMatchingRaceSheet(raceName, sheets) {
  var ass = SpreadsheetApp.getActiveSpreadsheet(), sheet = null;
  if (!sheets) { // First try simple match
    sheet = ass.getSheetByName(raceName);
  }
  if (sheet == null) {
    var k2re = /Div(\d)_(\d)/, nameMatch = raceName.match(k2re);
    if (nameMatch) { // K2 divisional race?
      sheets = sheets || ass.getSheets(); // Fall back to active SS sheets if no list provided
      for (var i=0; i<sheets.length; i++) {
        var match = sheets[i].getName().match(k2re);
        // Does the potential destination sheet 'include' the source sheet? e.g. Div3_4 includes Div3_3 and Div4_4, Div 4_6 (hypothetical) would include Div5_6
        if (match && parseInt(match[1]) <= parseInt(nameMatch[1]) && parseInt(match[2]) >= parseInt(nameMatch[2])) {
          sheet = sheets[i];
          break;
        }
      }
    }
    return sheet;
  }
  return sheet;
}

/**
 * Handler for adding entries from a spreadsheet stored in Google Docs. This is intended to be called when the dialog's submit button is clicked.
 * TODO Support keeping boat numbers
 * TODO Ensure that the first member of each crew 'lines up' with a boat number in the destination sheet
 *
 * @param {object} eventInfo Event information
 * @return {AppInstance} Active application instance
 */
function addLocalEntries(eventInfo) {
  var app = UiApp.getActiveApplication();
  // Because the list box was named "spreadsheetId" and added as a callback element to the
  // button's click event, we have its value available in eventInfo.parameter.spreadsheetId.
  var ssId = eventInfo.parameter.spreadsheetId;
  if (ssId)
  {
    var ss = SpreadsheetApp.openById(ssId),
        sheets = getRaceSheets(ss), sheet, rows, results = [], numCrews;

    for (var i=0; i<sheets.length; i++) {
      sheet = sheets[i];
      rows = [], numCrews = 0;
      // Iterate through all paddlers
      if (sheet.getLastRow() > 1) {
        var range = sheet.getRange(2, 1, sheet.getLastRow()-1, 7), values = range.getValues(),
            rows = [],
            lastRow = -1; // Last row with some data in. We can drop all rows after this.
        for (var j=0; j<values.length; j++) {
          rows.push(values[j].slice(1));
          if (values[j][1].trim() != "" || values[j][2].trim() != "" || values[j][3].trim() != "") { // First name surname or BCU number filled out
            if ((""+values[j][0]).trim() != "") {
              numCrews ++;
            }
            lastRow = j;
          }
        }
        if (lastRow > -1) {
          rows = rows.slice(0, lastRow+1);
        } else {
          rows = [];
        }
      }
      
      if (rows.length == 0) {
        Logger.log("No rows for sheet " + sheet.getName());
        continue;
      } else {
        Logger.log("" + rows.length + " rows for sheet " + sheet.getName());
      }
      
      var dstsheet = findMatchingRaceSheet(sheet.getName());
      
      if (dstsheet != null) {
        // Find the latest row with a number but without a name in the sheet
        var nextRow = getNextEntryRow(dstsheet);
        if (nextRow > 0) {
          Logger.log("Adding new rows at row " + nextRow);
          if (dstsheet.getLastRow()-nextRow+1 >= rows.length) {
            dstsheet.getRange(nextRow, 2, rows.length, 6).setValues(rows); // TODO Allow numbers to be added, in which case length will be 7 rather than 6
            results.push("Added " + numCrews + " crews to " + dstsheet.getName());
          } else {
            throw "Too many rows to import into " + dstsheet.getName() + " (" + rows.length + " data rows, " + (dstsheet.getLastRow()-nextRow+1) + " in sheet)";
          }
        } else {
          throw("No space left in sheet " + sheet.getName());
        }
      } else {
        throw("Destination sheet " + sheet.getName() + " not found");
      }
    }
  } else {
    throw "Could not locate source spreadsheet";
  }
  
  app.getElementById("addLocalEntriesSpreadsheetId").setVisible(false);
  app.getElementById("addLocalEntriesAddBn").setVisible(false);
  app.getElementById("addLocalEntriesResult").setHTML(results.join("<br />")).setVisible(true);
  app.getElementById("addLocalEntriesCloseBn").setVisible(true);

  return app;
}

/**
 * Display the dialog for adding race entries
 */
function showAddEntries() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(rankingsSheetName);
  if (sheet && sheet.getLastRow() > 1) {
    // Dialog height in pixels
    var dialogHeight = 360;
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Create the UiInstance object myapp and set the title text
    var app = UiApp.createApplication().setTitle('Add Entries').setHeight(dialogHeight);
    
    // Crew member 1 controls
    var text1 = app.createTextBox().setName("name1").setId("name1");
    var lb1 = app.createListBox(false).setId('list1').setName('list1').setEnabled(false).setVisibleItemCount(8);
    var shandler1 = app.createServerHandler("onAddEntrySearch").addCallbackElement(text1).addCallbackElement(lb1);
    var search1 = app.createButton("Search", shandler1).setId("search1");
    var text1Handler = app.createServerKeyHandler('onAddEntryEnter').addCallbackElement(text1).addCallbackElement(lb1);
    text1.addKeyUpHandler(text1Handler);
    
    // Crew member 2 controls
    var text2 = app.createTextBox().setName("name2").setId("name2");
    var lb2 = app.createListBox(false).setId('list2').setName('list2').setEnabled(false).setVisibleItemCount(8);
    var shandler2 = app.createServerHandler("onAddEntrySearch").addCallbackElement(text2).addCallbackElement(lb2);
    var search2 = app.createButton("Search", shandler2).setId("search2");
    var text2Handler = app.createServerKeyHandler('onAddEntryEnter').addCallbackElement(text2).addCallbackElement(lb2);
    text2.addKeyUpHandler(text2Handler);
    
    // Create a vertical panel called mypanel and add it to myapp
    var mypanel = app.createVerticalPanel().setStyleAttribute("width", "100%");
    
    // Radio buttons to select K1 or K2, with client-side handlers
    var boatgrid = app.createGrid(1, 2);
    var k1button = app.createRadioButton("boat", "K1").addValueChangeHandler(
      app.createClientHandler().forTargets(text2).setEnabled(false).forTargets(lb2).setEnabled(false).forTargets(search2).setEnabled(false)).setValue(true, true);
    var k2button = app.createRadioButton("boat", "K2").setName("boat").addValueChangeHandler(
      app.createClientHandler().forTargets(text2).setEnabled(true).forTargets(lb2).setEnabled(true).forTargets(search2).setEnabled(true));
    boatgrid.setWidget(0, 0, k1button);
    boatgrid.setWidget(0, 1, k2button);
    mypanel.add(boatgrid);
    
    // Grid for crew members
    var crewgrid = app.createGrid(3, 2).setStyleAttribute("width", "100%");
    
    // Paddler 1
    crewgrid.setWidget(0, 0, text1);
    crewgrid.setWidget(1, 0, search1);
    crewgrid.setWidget(2, 0, lb1);
    
    // Paddler 2
    crewgrid.setWidget(0, 1, text2);
    crewgrid.setWidget(1, 1, search2);
    crewgrid.setWidget(2, 1, lb2);
    
    // Add crew grid to panel
    mypanel.add(crewgrid);
    
    // Drop-down to select class to enter crew into
    var clb = app.createListBox(false).setId('className').setName('className');
    clb.setVisibleItemCount(1);
    
    // add items to ListBox
    var sheetNames = getRaceSheetNames();
    clb.addItem("Auto");
    for (var i=0; i<sheetNames.length; i++) {
      clb.addItem(sheetNames[i], sheetNames[i]);
    }
    mypanel.add(clb);
    
    // Button handler for adding entry
    var addhandler = app.createServerHandler("add").addCallbackElement(lb1).addCallbackElement(lb2).addCallbackElement(clb).addCallbackElement(k1button).addCallbackElement(k2button);
    
    // Button to add crew to entries list
    //mypanel.add(app.createButton("Add", addhandler).setId("add").addClickHandler(app.createClientHandler().forEventSource().setEnabled(false)));
    mypanel.add(app.createButton("Add", addhandler).setId("add"));
    
    // Status text
    var appState = app.createHidden("lastAdd", "").setId("lastAdd");
    mypanel.add(app.createHTML("").setId("result").addClickHandler(app.createServerHandler("onEntryResultClick").addCallbackElement(appState)).setStyleAttributes({cursor: 'pointer'}));
    
    // For the close button, we create a server click handler closeHandler and pass closeHandler to the close button as a click handler.
    // The function close is called when the close button is clicked.
    var closeButton = app.createButton('Done');
    var closeHandler = app.createServerClickHandler('close');
    closeButton.addClickHandler(closeHandler);
    mypanel.add(closeButton);
    
    // Add my panel to myapp
    app.add(mypanel);
    
    app.add(appState);
  
    // Set focus
    text1.setFocus(true);
    
    ss.show(app);
  } else {
    throw "No rankings found. You must add some rankings before you can enter crew details."
  }
}

function onEntryResultClick(e) {
  var app = UiApp.getActiveApplication(), source = e.parameter.source,
      widget = app.getElementById(source);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (e.parameter.lastAdd) {
    var pair = e.parameter.lastAdd.split("!");
    if (pair.length == 2) {
      var targetSheet = ss.getSheetByName(pair[0]);
      ss.setActiveSheet(targetSheet);
      ss.setActiveSelection(targetSheet.getRange(pair[1], 1));
    }
  }
  return app;
}

/**
 * Event handler for keypress in search box - used to detect when the enter key is pressed
 *
 * @param {object} e Event information
 * @return {AppInstance} Active application instance
 */
function onAddEntryEnter(e) {
  if (e.parameter.keyCode==13) {
    var n = parseInt(e.parameter.source.replace(/[a-z]+/, "")); // Paddler 1 or 2?
    return onAddEntrySearch(e, n);
  }
  var app = UiApp.getActiveApplication();
  return app;
}

/**
 * Event handler for paddler search box - handles both search boxes for K2 entries
 *
 * @param {object} eventInfo Event information
 * @param {int} n Column number 1 or 2 (optional, will attempt to retrieve from event if not specified)
 * @return {AppInstance} Active application instance
 */
function onAddEntrySearch(eventInfo, n) {
  n = n || parseInt(eventInfo.parameter.source.replace(/[a-z]+/, "")); // Paddler 1 or 2?
  var app = UiApp.getActiveApplication();
  // Because the text box was named "namex" and added as a callback element to the
  // button's click event, we have its value available in eventInfo.parameter.namex.
  var name = eventInfo.parameter["name" + n];
  if (name)
  {
    var search = app.getElementById("search" + n), list = app.getElementById("list" + n);
    search.setEnabled(false);
    list.clear();
    var matches = findRankings(name.trim());
    if (matches.length > 0) {
      for (var i=0; i<matches.length; i++) {
        var expiryDate = matches[i]["Expiry"],
          itemName = "" + matches[i]["Surname"] + ", " + matches[i]["First name"] + " (" + matches[i]["Club"] + ", " + matches[i]["Class"] + ")",
          itemValue = "" + matches[i]["Surname"] + "|" + matches[i]["First name"] + "|" + matches[i]["Club"] + "|" + matches[i]["Class"] + "|" + 
            matches[i]["BCU Number"] + "|" + (expiryDate instanceof Date ? expiryDate.toDateString() : expiryDate) + "|" + matches[i]["Division"];
        list.addItem(itemName, itemValue);
      }
    } else {
      //app.createDialogBox().setText("No results found for '" + name + "'").setVisible(true);
      throw ("No results found for '" + name + "'");
    }
    // Auto-select the paddler if there is only one match
    if (matches.length == 1) {
      list.setSelectedIndex(0);
    }
    list.setEnabled(true);
    search.setEnabled(true);
  }
  return app;
}

/**
 * Return a new object generated by assigning the specified values to the set of object properties with the given keys.
 */
function arrayZip(keys, values)
{
  if (typeof keys.length != "number")
    throw "Keys must be an array";
  if (typeof values.length != "number")
    throw "Values must be an array";
  if (keys.length != values.length)
    throw "Keys and values arrays must be the same length";
  var obj = {};
  for (var i = 0; i < keys.length; i++) {
    obj[keys[i]] = values[i];
  };
  return obj;
}

/**
 * Find ranked competitors with the given name or BCU number. Returns an array of records each being a seven-element array containing the following string values:
 * Surname, First name, Club, Class, BCU Number, BCU Expiration, Division
 *
 * @param {string} name Search for paddlers whose names match the given string
 * @return {array} Two-dimensional array containing matching rows from the Rankings sheet
 */
function findRankings(name) {
  var matches = [], bcuRegexp = /^\s*[A-Z]*\/?(\d+)\/?[A-Z]*\s*$/;
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName("Rankings");
  if (sheet) {
    if (sheet.getLastRow() < 2) {
      throw "No data in Rankings sheet";
    }
    if (name) { // check name is not emptysheet.getLastRow()
      var isBCUNum = bcuRegexp.test(name.toUpperCase()), 
          range = sheet.getRange(1, 1, sheet.getLastRow()-1, sheet.getLastColumn()), values = range.getValues(), columnNames = values[0];
      for (var i=1; i<values.length; i++) {
        if (isBCUNum) { // BCU number
          var bcu = String(values[i][columnNames.indexOf("BCU Number")]).toUpperCase().trim(), result = bcuRegexp.exec(bcu);
          if (result && (bcu == name || result[1] == name)) { // Match the whole number or just the content between the slashes (if present)
            matches.push(arrayZip(columnNames, values[i]));
          }
        } else { // Name
          if ((""+values[i][columnNames.indexOf("Surname")]).toLowerCase().trim().indexOf(name.toLowerCase()) == 0 || (""+values[i][columnNames.indexOf("First name")]).toLowerCase().trim().indexOf(name.toLowerCase()) == 0) {
            matches.push(arrayZip(columnNames, values[i]));
          }
        }
      }
    }
    return matches;
  } else {
    // TODO Support live lookups from ScraperWiki
    throw "Rankings sheet could not be found"
  }
}

/**
 * Event handler Add Entry button click
 *
 * @param {object} eventInfo Event information
 * @return {AppInstance} Active application instance
 */
function add(eventInfo) {
  var rankingsSheetName = "Rankings";
  var app = UiApp.getActiveApplication();
  // Because the text box was named "text" and added as a callback element to the
  // button's click event, we have its value available in eventInfo.parameter.text.
  var add1 = eventInfo.parameter.list1, add2 = eventInfo.parameter.list2, k2button = eventInfo.parameter.boat;
  if (add1) {
    var items1 = add1.split("|"), 
        items2 = add2 ? add2.split("|") : [], 
        name1 = items1[0] + ", " + items1[1],
        name2 = null,
        crew = name1;
    if (k2button == "true") {
      if (items2.length > 0) { // Was there a second crew member selected?
        name2 = items2[0] + ", " + items2[1];
        crew = name1 + " / " + name2;
      } else {
        throw("You must select a second crew member");
      }
    }
    var selectedClass = eventInfo.parameter.className,
        sheetName = ("Auto" == selectedClass) ? getTabName(items1, items2) : selectedClass;
    
    var row1 = [items1[rankingsSheetColumnNames.indexOf("Surname")], items1[rankingsSheetColumnNames.indexOf("First name")], items1[rankingsSheetColumnNames.indexOf("BCU Number")], 
        items1[rankingsSheetColumnNames.indexOf("Expiry")], items1[rankingsSheetColumnNames.indexOf("Club")], items1[rankingsSheetColumnNames.indexOf("Class")], 
        items1[rankingsSheetColumnNames.indexOf("Division")]],
      row2 = (items2.length > 0 ? [items2[rankingsSheetColumnNames.indexOf("Surname")], items2[rankingsSheetColumnNames.indexOf("First name")], items2[rankingsSheetColumnNames.indexOf("BCU Number")], 
        items2[rankingsSheetColumnNames.indexOf("Expiry")], items2[rankingsSheetColumnNames.indexOf("Club")], items2[rankingsSheetColumnNames.indexOf("Class")], 
        items2[rankingsSheetColumnNames.indexOf("Division")]] : null),
      result;
    // Convert dates
    if (row1[3]) {
      row1[3] = new Date(row1[3]);
    }
    if (row2 && row2[3]) {
      row2[3] = new Date(row2[3]);
    }

    result = addEntryToSheet(row1, row2, sheetName);
    
    if (result && result.boatNumber) {
      app.getElementById("result").setText("Added " + result.boatNumber + " " + crew + " in " + sheetName);
      app.getElementById("name1").setValue("");
      app.getElementById("name2").setValue("");
      app.getElementById("list1").clear();
      app.getElementById("list2").clear();
      app.getElementById("lastAdd").setValue(sheetName + "!" + result.rowNumber);
      return app;
    } else {
      throw("Could not add " + crew + " in " + sheetName);
    }
  } else {
    throw("Nobody was selected");
  }
  return app;
}

/**
 * Convert ranking data row to an entry row by translating property names
 */
function rankingToEntryData(ranking) {
  var entry = {};
  for (var k in ranking) {
    entry[k == "Division" ? "Div" : k] = ranking[k];
  }
  return entry;
}

function lookupInTable(rows, key, matchValue) {
  var matches = [];
  for (var i = 0; i < rows.length; i++) {
    if (rows[i][key] === matchValue) {
      matches.push(rows[i]);
    }
  }
  return matches;
}

/**
 * Look through all the current entries and update with any new data from the rankings sheet
 */
function updateEntriesFromRankings() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), rankingsSheet = ss.getSheetByName("Rankings"), sheets = getRaceSheets(ss);
  var rankingData = getTableRows(rankingsSheet), sheet;
  for (var i = 0; i < sheets.length; i++) {
    sheet = sheets[i];
    var raceData = getTableRows(sheet);
    if (raceData.length > 0) {
      for (var j = 0; j < raceData.length; j++) {
        var bcuNum = raceData[j]['BCU Number'];
        if (bcuNum) {
          Logger.log("BCU Number: " + bcuNum);
          var matches = lookupInTable(rankingData, 'BCU Number', bcuNum);
          if (matches.length == 1) {
            Logger.log("Found match: " + matches[0]);
            var update = rankingToEntryData(matches[0]);
            for (var p in update) {
              Logger.log("Set " + p + ": " + update[p]);
              raceData[j][p] = update[p];
            }
          }
        }
      }
      setTableRowValues(sheet, raceData, "Surname", "Div");
    }
  }
}

function setTableRowValues(sheet, values, startColumnName, endColumnName) {
  if (values.length == 0) {
    return;
  }
  var headers = getTableHeaders(sheet);
  var valueList = new Array(values.length);
  for (var i = 0; i < values.length; i++) {
    var row = new Array();
    for (var j = (startColumnName ? headers.indexOf(startColumnName) : 0); j < (endColumnName ? headers.indexOf(endColumnName) + 1 : headers.length); j++) {
      row.push(values[i][headers[j]]);
    }
    valueList[i] = row;
  }
  sheet.getRange(2, (startColumnName ? headers.indexOf(startColumnName) + 1 : 1), valueList.length, valueList[0].length).setValues(valueList);
}

/**
 * Return an array containing the list of table heading cells taken from row 1 in the given sheet
 *
 * Return {array} Array containing the heading cell values, which may be empty if there were no values in row 1
 */
function getTableHeaders(sheet) {
  var range = sheet.getRange(1, 1, 1, sheet.getLastColumn()), values = range.getValues();
  var headers =  values.length > 0 ? values[0] : [];
  while (headers.length > 0 && headers[headers.length - 1] === "") {
    headers.pop();
  }
  return headers;
}

/**
 * Get a complete list of all the rows in the given sheet as an array of objects
 *
 * Return {array} Array containing each row as an object, with properties named according to the table heading name. Array will be empty if no data rows are present.
 */
function getTableRows(sheet) {
  if (sheet.getLastRow() < 2)
    return [];
  var range = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()), values = range.getValues(), headers = values[0], rows = [], row = null;
  for (var i=1; i<values.length; i++) {
    row = new Object();
    for (var j=0; j<headers.length; j++) {
      row[headers[j]] = values[i][j];
    }
    rows.push(row);
  }
  return rows;
}

/**
 * Return a full list of the taken entry placeholders on the given sheet
 * TODO This can be replaced with getEntryRowData()
 *
 * @return {array} Array of three-element arrays with the first element of each member representing the boat number, the second the row number and the second the number of rows available in the entry
 */
function getEntryRows(sheet) {
  Logger.log("getEntryRows: Sheet " + sheet.getName());
  // Find the latest row with a number but without a name in the sheet
  var range = sheet.getRange(2, 1, sheet.getLastRow()-1, 4), values = range.getValues(), rows = [], currEntry = null;
  for (var i=0; i<values.length; i++) {
    if (values[i][0] && !((""+values[i][1]).trim() == "" && (""+values[i][2]).trim() == "" && (""+values[i][3]).trim() == "")) { // Number present and a name or BCU number
      Logger.log("getEntryRows: Add " + values[i][0]);
      if (currEntry != null) {
        rows.push(currEntry);
      }
      currEntry = [values[i][0], i+2, 1];
    } else if ((""+values[i][0]).trim() == "") { // No number
      if (currEntry != null) {
        currEntry[2] ++;
      }
    } else { // Number present but no details, this is not a completed entry
      if (currEntry != null) {
        rows.push(currEntry);
      }
      currEntry = null;
    }
  }
  // There may still be an entry in the buffer
  if (currEntry != null) {
    rows.push(currEntry);
  }
  return rows;
}

/**
 * Return a full list of the spreadsheet rows, grouped into entries
 *
 * @return {array} Array of objects, each object represents an entry and includes the raw values from the rows
 */
function getEntryRowData(range, config) {
  // Find the latest row with a number but without a name in the sheet
  var values = range.getValues(), rows = [], currEntry = null;
  for (var i=0; i<values.length; i++) {
    if (values[i][0] && !((""+values[i][1]).trim() == "" && (""+values[i][2]).trim() == "" && (""+values[i][3]).trim() == "")) { // Number present and a name or BCU number
      Logger.log("getEntryRowValues: Add " + values[i][0]);
      if (currEntry != null) {
        rows.push(currEntry);
      }
      currEntry = {
        boatNumber: values[i][0], 
        rowNumber: range.getRow() + i,
        values: [values[i]],
        sheet: range.getSheet()
      };
      currRows = [];
    } else if ((""+values[i][0]).trim() == "") { // No number
      if (currEntry != null) {
        currEntry.values.push(values[i]);
      }
    } else { // Number present but no details, this is not a completed entry
      if (currEntry != null) {
        rows.push(currEntry);
      }
      currEntry = null;
    }
  }
  // There may still be an entry in the buffer
  if (currEntry != null) {
    rows.push(currEntry);
  }
  return rows;
}

/**
 * Return a full list of the remaining entry placeholders on the given sheet
 *
 * @return {array} Array of three-element arrays with the first element of each member representing the boat number, the second the row number and the second the number of rows available in the entry
 */
function getNextEntryRows(sheet) {
  // Find the latest row with a number but without a name in the sheet
  var range = sheet.getRange(2, 1, sheet.getLastRow()-1, 2), values = range.getValues(), rows = [], currEntry = null;
  for (var i=0; i<values.length; i++) {
    if (values[i][0] && values[i][1] == "") { // Number present but no name
      if (currEntry != null) {
        rows.push(currEntry);
      }
      currEntry = [values[i][0], i+2, 1];
    } else if ((""+values[i][0]).trim() == "" && values[i][1] == "") { // No number, no name
      if (currEntry != null) {
        currEntry[2] ++;
      }
    } else { // Name present but no number, entry is not valid
      currEntry = null;
    }
  }
  // There may still be an entry in the buffer
  if (currEntry != null) {
    rows.push(currEntry);
  }
  return rows;
}

/**
 * Find the latest row with a number but without a name in the sheet
 *
 * @return {int} Row number, or zero if no matching row is found (i.e. all entry spots are taken already)
 */
function getNextEntryRow(sheet) {
  var range = sheet.getRange(2, 1, sheet.getLastRow()-1, 2), values = range.getValues();
  for (var i=0; i<values.length; i++) {
    if (values[i][0] && values[i][1] == "") {
      return i+2;
    }
  }
  return 0;
}

/**
 * Find the last row in the given sheet with a race number, regardless of whether the row contains an entry or not
 *
 * @return {int} Row number of the last row with a boat number, or zero if no race numbers are present in the first column
 */
function getLastEntryRowNumber(sheet) {
  Logger.log("Getting last entry row number in sheet " + sheet.getName());
  var range = sheet.getRange(2, 1, sheet.getLastRow()-1, 1), values = range.getValues(), lastBn = "_", lastN = 0;
  Logger.log("Found " + values.length + " rows");
  for (var i=0; i<values.length; i++) {
    if (values[i][0]) {
      Logger.log("Found boat number " + values[i][0]);
      lastN = range.getRow() + i; // Current row number
      // Bit of a hacky way to account for K2s, where we should leave an extra row at the bottom
      if (lastBn == "") {
        lastN ++;
      }
    }
    lastBn = values[i][0];
  }
  return lastN;
}

function addEntryToSheet(row1, row2, sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getSheetByName(sheetName);
  // Check that sheet exists!
  if (!sheet) {
    throw("Could not find sheet " + sheetName);
  }
  var nextRows = getNextEntryRows(sheet), 
      nextBoatNum = (nextRows.length > 0) ? nextRows[0][0] : 0,
      nextRowPos = (nextRows.length > 0) ? nextRows[0][1] : 0,
      nextRowSize = (nextRows.length > 0) ? nextRows[0][2] : 0;
  if (nextRowPos > 0) {
    var rowValues = [row1];
    if (row2 && row2.length > 0) {
      rowValues.push(row2)
    }
    if (nextRowSize != rowValues.length) {
      if (nextRowSize == 1 && rowValues.length == 2) {
        throw("Cannot add a K2 to a K1 race");
      } else if (nextRowSize == 2 && rowValues.length == 1) {
        throw("Cannot add a K1 to a K2 race");
      } else {
        throw("Could not add entry of size " + rowValues.length + " in row " + nextRowPos + " (" + nextRowSize + " rows available)");
      }
    }
    var rowRange = sheet.getRange(nextRowPos, 2, rowValues.length, rowValues[0].length);
    rowRange.setValues(rowValues);
  }
  return { boatNumber: nextBoatNum, rowNumber: nextRowPos };
}

/**
 * Calculate the correct combined division given up to two sets of crew details, then return the sheet name that corresponds to that division
 *
 * @param {object} crew1 Object representing the first crew member
 * @param {object} crew2 Object representing the second crew member, may be null for K1
 * @return {string} Name of the sheet where the entry should be placed for this crew
 */
function getTabName(crew1, crew2) {
  var tname = getRaceName(crew1, crew2);
  // Lightning tabs are unusual as they contain a space
  if (tname == "U10M") {
    tname = "U10 M";
  } else if (tname == "U10F") {
    tname = "U10 F";
  } else if (tname == "U12M") {
    tname = "U12 M";
  } else if (tname == "U12F") {
    tname = "U12 F";
  }
  return tname;
}

/**
 * Look at the tabs of the workbook and return the named races as an array of Strings
 */
function getRaceSheets(spreadsheet) {
  var sheets = (spreadsheet || SpreadsheetApp.getActiveSpreadsheet()).getSheets(), raceSheets = [], sheet;
  for (var i=0; i<sheets.length; i++) {
    sheet = sheets[i];
    if ("Finishes" == sheet.getName()) {
      break;
    }
    raceSheets.push(sheet);
  }
  return raceSheets;
}

/**
 * Look at the tabs of the workbook and return the named races as an array of Strings
 */
function getRaceSheetNames(spreadsheet) {
  var sheets = getRaceSheets(spreadsheet), sheetNames = [];
  for (var i=0; i<sheets.length; i++) {
    sheetNames.push(sheets[i].getName());
  }
  return sheetNames;
}

/**
 * Look at the sheets in the workbook and return the named races as an array of Strings (values will be without the 'Div' prefix)
 */
function getRaceNames(spreadsheet) {
  var sheetNames = getRaceSheetNames(spreadsheet), raceNames = [];
  for (var i=0; i<sheetNames.length; i++) {
    raceNames.push(sheetNames[i].replace("Div", ""));
  }
  return raceNames;
}

/**
 * Calculate the correct combined division given up to two sets of crew details, then return the name of that division
 *
 * @param {object} crew1 Object representing the first crew member
 * @param {object} crew2 Object representing the second crew member, may be null for K1
 * @return {string} Name of the division
 */
function getRaceName(crew1, crew2) {
  var divIndex = rankingsSheetColumnNames.indexOf("Division"), 
      div1 = crew1[divIndex],
      div2 = null;
  if (crew2.length > 0) {
      div2 = crew2[divIndex];
  } else {
    return parseInt(div1) ? ("Div" + parseInt(div1)) : div1;
  }
  var combined = combineDivs(div1, div2), // Will come back as '1' or 'U10M'
      combinedInt = parseInt(combined);
  if (combinedInt) {
    if (crew2) {
      // OLD IMPLEMENTATION
      // return "Div" + combinedInt + "_" + combinedInt
      // NEW IMPLEMENTATION
      // As of 2013 K2 races are now combined for Div1/2 and 3/4.
      // Therefore there is no Div1_1, Div2_2, Div3_3 or Div4_4, only Div1_2 and Div3_4
      var races = getRaceNames(), re = /(\d)_(\d)/;
      for (var i=0; i<races.length; i++) {
        var match = races[i].match(re);
        if (match && parseInt(match[1]) <= combinedInt && parseInt(match[2]) >= combinedInt) {
          return "Div" + races[i];
        }
      }
    } else {
      return "Div" + combinedInt;
    }
  } else {
    return combined;
  }
}

/**
 * Combine two divisions to get the overall division into which a K2 should be entered
 *
 * @param {string} div1 Division of the first crew member
 * @param {string} div2 Division of the second crew member, may be null for K1
 * @return {string} Name of the combined division
 */
function combineDivs(div1, div2) {
  if (div1 == div2 || div2 == null) {
    return div1;
  }
  if (!parseInt(div1) || !parseInt(div2)) {
    if (div1.indexOf("U10") == 0 && div2.indexOf("U10") == 0) {
      return "HodyU10";
    } else if (div1.indexOf("U12") == 0 && div2.indexOf("U10") == 0) {
      return "HodyU12";
    } else if (div1.indexOf("U10") == 0 && div2.indexOf("U12") == 0) {
      return "HodyU12";
    } else if (div1.indexOf("U12") == 0 && div2.indexOf("U12") == 0) {
      return "HodyU12";
    } else {
      throw "Cannot combine " + div1 + " and " + div2;
    }
  } else {
    var hdiv = Math.max(parseInt(div1), parseInt(div2)),
        ldiv = Math.min(parseInt(div1), parseInt(div2));
    var div = Math.floor((hdiv + ldiv) / 2);
    if (div > (Math.ceil(ldiv / 3) * 3)) {
      div = Math.ceil(ldiv / 3) * 3;
    }
    return div;
  }
}

/**
 * Return true if the current spreadsheet represents a race within the Hasler system, false otherwise
 */
function isHaslerRace() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName("PandD") !== null;
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
 * Display the URL for accessing results
 */
function showResultsURL() {
  showWebURL("results");
}

/**
 * Display the URL for accessing results
 */
function showEntriesURL() {
  showWebURL("entries");
}

/**
 * Display the URL for accessing results
 */
function showWebURL(type) {
  // Create the UiInstance object myapp and set the title text
  var ss = SpreadsheetApp.getActiveSpreadsheet(), capitalizedType = type.charAt(0).toUpperCase() + type.slice(1),
    url = "https://script.google.com/macros/exec?service=" + PROJECT_ID + "&key=" + ss.getId() + "&show=" + type;
  showLinkDialog('View ' + capitalizedType + ' Summary',
    "<p>Use this link to access the live " + type + ":</p>",
    url);
}

/**
 * Display a dialog with a link, which the user can close with an OK button
 */
function showLinkDialog(title, text, linkHref, linkText, linkTarget, dialogHeight) {
  // Dialog height in pixels
  dialogHeight = dialogHeight||125;
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create the UiInstance object myapp and set the title text
  var app = UiApp.createApplication().setTitle(title).setHeight(dialogHeight),
      mypanel = app.createVerticalPanel().setStyleAttribute("width", "100%");
  
  mypanel.add(app.createHTML(text));
  mypanel.add(app.createAnchor(linkText||linkHref, linkHref).setTarget(linkTarget||"_blank"));
  
  var closeButton = app.createButton('OK');
  var closeHandler = app.createServerClickHandler('close');
  closeButton.addClickHandler(closeHandler);
  mypanel.add(closeButton);
  
  app.add(mypanel);
  
  ss.show(app);
}

/**
 * Display the total sum owed in race levies (£2 per senior, £1 per junior)
 */
function showRaceLevies(scriptProps) {
  var totalJnr = 0, totalSnr = 0, totalLightning = 0, totalUnknown = 0, totalReceived = 0;
  var sheets = getRaceSheets(), sheet;
  for (var i=0; i<sheets.length; i++) {
    sheet = sheets[i];
    // Iterate through all paddlers' classes (column F)
    var range = sheet.getRange(2, 1, sheet.getLastRow()-1, 8), values = range.getValues();
    for (var j=0; j<values.length; j++) {
      var class = (values[j][5] || "").toUpperCase().trim(), 
          raceName = sheet.getName().replace(" ", ""),
          received = parseFloat(values[j][7]) || 0.0;
      if (values[j][1] != "" || values[j][2] != "" || values[j][3] != "") { // Surname, lastname or BCU number filled out
        if (/U1[02][MF]/i.exec(raceName) != null || raceName.indexOf("Hody") == 0) {
          totalLightning ++;
        } else {
          if (class != "") {
            if (class == "J" || class == "JF" || class == "JC" || class == "JCF") {
              totalJnr ++;
            } else if (class == "S" || class == "SM" || class == "V" || class == "VM" || class == "F" || class == "SF" || class == "VF" || class == "C" || class == "SC" || class == "VC") {
              totalSnr ++;
            } else {
              totalUnknown ++;
            }
          } else {
            totalUnknown ++;
          }
        }
      }
      if (received > 0) {
        totalReceived += received;
      }
    }
  }
  
  var totalLevies = totalSnr * 2 + totalJnr * 1 + totalUnknown * 2;
  
  // Dialog height in pixels
  var dialogHeight = 245;
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create the UiInstance object myapp and set the title text
  var app = UiApp.createApplication().setTitle('Finance Summary').setHeight(dialogHeight),
      mypanel = app.createVerticalPanel().setStyleAttribute("width", "100%");
  
  mypanel.add(app.createHTML("<p>Total Received: £" + totalReceived + "</p>"));
  mypanel.add(app.createHTML("<p>Total Seniors: " + totalSnr + "<br />Total Juniors: " + totalJnr + "<br />Total Lightnings: " + totalLightning + "<br />Total Unknown: " + totalUnknown + "</p>"));
  if (scriptProps && scriptProps.entrySenior && scriptProps.entryJunior && scriptProps.entryLightning) {
    var totalPaid = parseFloat(scriptProps.entrySenior) * totalSnr + parseFloat(scriptProps.entryJunior) * totalJnr + parseFloat(scriptProps.entryLightning) * totalLightning;
    mypanel.add(app.createHTML("<p>Total Due: £" + totalPaid + "</p>"));
  }
  mypanel.add(app.createHTML("<p>MRC Levies Due: £" + totalLevies + "</p>"));
  
  var closeButton = app.createButton('OK');
  var closeHandler = app.createServerClickHandler('close');
  closeButton.addClickHandler(closeHandler);
  mypanel.add(closeButton);
  
  app.add(mypanel);
  
  ss.show(app);
}

/**
 * Function to display a popup dialog with a prompt, plus OK and Cancel buttons
 */
function showPrompt(title, text, fnName, height) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create the UiInstance object myapp and set the title text
  var app = UiApp.createApplication().setTitle(title).setHeight(height);
  
  // Create a vertical panel called mypanel and add it to myapp
  var mypanel = app.createVerticalPanel().setStyleAttribute("width", "100%"),
      hpanel = app.createHorizontalPanel();
  
  mypanel.add(app.createHTML(text));
  
  var closeButton = app.createButton('Cancel');
  closeButton.addClickHandler(app.createServerClickHandler('close'));
  var okButton = app.createButton('OK');
  okButton.addClickHandler(app.createServerClickHandler(fnName)).addClickHandler(app.createClientHandler().forEventSource().setEnabled(false).forTargets(closeButton).setEnabled(false));
  hpanel.add(okButton);
  hpanel.add(closeButton);
  mypanel.add(hpanel);

  // Add my panel to myapp
  app.add(mypanel);
  
  ss.show(app);
}

/**
 * OK button handler, so that we avoid polluting clearAllEntries() with UiApp code
 */
function confirmClearEntries() {
  clearAllEntries();
  var app = UiApp.getActiveApplication();
  app.close();
  // The following line is REQUIRED for the widget to actually close.
  return app;
}

/**
 * Display the confirmation dialog used to clear all entries
 */
function showClearEntries() {
  showPrompt('Clear Entries', '<p>Are you sure you want to clear all existing entries/results?</p>', 'confirmClearEntries', 80);
}

/**
 * OK button handler, so that we avoid polluting clearRankings() with UiApp code
 */
function confirmClearRankings() {
  clearRankings();
  var app = UiApp.getActiveApplication();
  app.close();
  // The following line is REQUIRED for the widget to actually close.
  return app;
}

/**
 * Display the confirmation dialog used to clear all rankings
 */
function showClearRankings() {
  showPrompt('Clear Rankings', '<p>Are you sure you want to clear all Hasler rankings? You will need to re-import some rankings before you can add any further race entries.</p>', 'confirmClearRankings', 80);
}

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

function getSelectedEntryRows(sheet) {
  // getEntryRows() returns a list of 3-element arrays giving boat number, row number and crew size
  var allEntries = getEntryRows(sheet), range = SpreadsheetApp.getActiveRange(), selectedEntries = [], entryTop, entryBottom;
  Logger.log("Found " + allEntries.length + " entries in sheet");
  for (var i=0; i<allEntries.length; i++) {
    // If the entry overlaps the selected area in any way, then we'll add it
    // This means either the bottom of the entry falls within the selected range, or the top does, or both
    entryTop = allEntries[i][1], entryBottom = allEntries[i][1] + allEntries[i][2] - 1;
    if (entryTop >= range.getRow() && entryTop <= range.getLastRow() ||
      entryBottom >= range.getRow() && entryBottom <= range.getLastRow()) {
        Logger.log("Adding boat " + allEntries[i][0]);
        selectedEntries.push(allEntries[i]);
    }
  }
  return selectedEntries;
}

/**
 * Display the modify crews dialog
 */
function showModifyCrews() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getActiveSheet();
  
  // Create the UiInstance object myapp and set the title text
  var app = UiApp.createApplication().setTitle('Modify Crews').setHeight(140);
  
  // Create a vertical panel called mypanel and add it to the app
  var mypanel = app.createVerticalPanel().setStyleAttribute("width", "100%").setSpacing(5).setVerticalAlignment(UiApp.VerticalAlignment.MIDDLE);
  
  // Selection list allowing us to pick another race to move the crew(s) to
  var mvpanel = app.createHorizontalPanel().setSpacing(5);
  mvpanel.add(app.createHTML("Move to "));
  // Drop-down to select Division
  var clb = app.createListBox(false).setId('className').setName('className');
  clb.setVisibleItemCount(1);
  clb.addItem("--Select--", "");
  var sheetNames = getRaceSheetNames();
  for (var i=0; i<sheetNames.length; i++) {
    if (sheetNames[i] != sheet.getName()) {
      clb.addItem(sheetNames[i]);
    }
  }
  mvpanel.add(clb);
  mvpanel.add(app.createHTML("then"));
  var mlb = app.createListBox(false).setId('moveAction').setName('moveAction');
  mlb.addItem("renumber and remove old numbers", "remove");
  mlb.addItem("renumber and leave old numbers", "leave");
  mlb.addItem("keep current numbers", "keep");
  mvpanel.add(mlb);
  var mvbutton = app.createButton("Move").setStyleAttributes({"margin": "0px", "padding": "0px"});
  mvbutton.addClickHandler(app.createServerHandler("moveCrews").addCallbackElement(clb).addCallbackElement(mlb));
  mvpanel.add(mvbutton)
  mypanel.add(mvpanel);
  
  var delpanel = app.createHorizontalPanel().setSpacing(5);
  delpanel.add(app.createHTML("Delete crews then "));
  var dlb = app.createListBox(false).setId('delAction').setName('delAction');
  dlb.addItem("remove old numbers", "remove");
  dlb.addItem("leave old numbers", "leave");
  delpanel.add(dlb);
  var delbutton = app.createButton("Delete").setStyleAttributes({"margin": "0px", "padding": "0px"});
  delbutton.addClickHandler(app.createServerHandler("deleteCrews").addCallbackElement(dlb));
  delpanel.add(delbutton);
  mypanel.add(delpanel);
  
  // Status text
  mypanel.add(app.createHTML("").setId("modifyCrewsResult"));
  
  // Done button
  var closeButton = app.createButton('Done');
  var closeHandler = app.createServerClickHandler('close');
  closeButton.addClickHandler(closeHandler);
  mypanel.add(closeButton);
  
  // Add my panel to myapp
  app.add(mypanel);
  
  ss.show(app);
}

function moveEntryRows(srcRange, dstSheet) {
  var entries = getEntryRowData(srcRange), 
      dstRows = getNextEntryRows(dstSheet);
  if (dstRows.length < entries.length) {
    throw "Destination sheet does not have sufficient room for entries (needs " + entries.length + ", found " + dstRows.length + ")";
  }
  // Implement a 1:1 mapping for source entry rows to destination rows
  // This means each destination row must be the same size as its corresponding source row, if it is not then an exception will be thrown
  Logger.log("Copying " + entries.length + " entries (" + srcRange.getA1Notation() + ") to " + dstSheet.getName());
  for (var i=0; i<entries.length; i++) {
    if (!entries[i].values) {
      throw "No values found in the entry";
    }
    if (!(entries[i].values.length > 0)) {
      throw "Entry must have at least 1 row";
    }
    if (dstRows[i][2] != entries[i].values.length) {
      throw "Destination does not have correct number of rows for the entry";
    }
    if (!parseInt(entries[i].rowNumber)) {
      throw "No row number found in the entry";
    }
    Logger.log("Entry " + i + ": boatNumber=" + entries[i].boatNumber + ", rowNumber=" + entries[i].rowNumber + ", values=" + entries[i].values);
    var dstRange = dstSheet.getRange(dstRows[i][1], 2, dstRows[i][2], entries[i].values[0].length),
        entryRange = srcRange.getSheet().getRange(entries[i].rowNumber, 2, entries[i].values.length, entries[i].values[0].length);
    Logger.log("Copying " + entryRange.getSheet().getName() + "!" + entryRange.getA1Notation() + " to " + dstRange.getSheet().getName() + "!" + dstRange.getA1Notation());
    // Retrive the smaller range for this entry only and copy this to the destination
    entryRange.moveTo(dstRange);
  }
}

/**
 * Move crews button click handler
 *
 * @param {object} eventInfo Event information
 * @return {AppInstance} Active application instance
 */
function moveCrews(eventInfo) {
  var app = UiApp.getActiveApplication();
  var action = eventInfo.parameter.moveAction, 
      dstSheetName = eventInfo.parameter.className,
      dstSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(dstSheetName),
      sheet = SpreadsheetApp.getActiveSheet();
  if (dstSheetName == "") {
    throw "You must select a race";
  }
  if (dstSheet == null) {
    throw "Could not find sheet " + dstSheetName;
  }
  var selectedEntries = getSelectedEntryRows(sheet);
  if (selectedEntries.length > 0) {
    // Assume that the entries are in a continuous range, for now
    Logger.log("selectedEntries: " + selectedEntries);
    var firstRow = parseInt(selectedEntries[0][1]),
        lastEntry = selectedEntries[selectedEntries.length-1],
        lastRow = parseInt(lastEntry[1]) + parseInt(lastEntry[2]) - 1,
        numRows = lastRow - firstRow + 1;
    
    Logger.log("firstRow: " + firstRow + ", lastRow: " + lastRow + ", numRows: " + numRows);
    
    var srcRange = sheet.getRange(firstRow, 1, numRows, sheet.getLastColumn());
    if (action == "remove") { // Re-number and remove the old boat numbers in the current sheet. Generally numbers should not be re-used if they have already been allocated to others.
      moveEntryRows(srcRange, dstSheet);
      sheet.deleteRows(firstRow, numRows);
    } else if (action == "leave") { // Re-number and leave the old boat numbers (empty) in the current sheet
      moveEntryRows(srcRange, dstSheet);
    } else if (action == "keep") { // Keep numbers in the new sheet, must be removed from this one
      Logger.log("Moving entries with numbers intact");
      var lastRowNum = getLastEntryRowNumber(dstSheet);
      Logger.log("Last row number is " + lastRowNum);
      srcRange.moveTo(dstSheet.getRange(lastRowNum+1, 1, srcRange.getNumRows(), srcRange.getNumColumns()));
      sheet.deleteRows(firstRow, numRows);
    } else {
      throw "Unsupported action " + action;
    }
    app.getElementById("modifyCrewsResult").setText("Moved " + selectedEntries.length + " crews to " + dstSheetName);
  } else {
    throw "No entries were selected";
  }
  return app;
}

/**
 * Delete crews button click handler
 *
 * @param {object} eventInfo Event information
 * @return {AppInstance} Active application instance
 */
function deleteCrews(eventInfo) {
  var app = UiApp.getActiveApplication();
  var action = eventInfo.parameter.delAction,
      sheet = SpreadsheetApp.getActiveSheet();
  var selectedEntries = getSelectedEntryRows(sheet);
  if (selectedEntries.length > 0) {
    // Assume that the entries are in a continuous range, for now
    Logger.log("selectedEntries: " + selectedEntries);
    var firstRow = parseInt(selectedEntries[0][1]),
        lastEntry = selectedEntries[selectedEntries.length-1],
        lastRow = parseInt(lastEntry[1]) + parseInt(lastEntry[2]) - 1,
        numRows = lastRow - firstRow + 1;
    
    Logger.log("firstRow: " + firstRow + ", lastRow: " + lastRow + ", numRows: " + numRows);
    
    if (action == "remove") {
      sheet.deleteRows(firstRow, numRows);
    } else if (action == "leave") {
      sheet.getRange(firstRow, 2, numRows, sheet.getLastColumn() - 1).clearContent();
    } else {
      throw "Unsupported action " + action;
    }
    app.getElementById("modifyCrewsResult").setText("Deleted " + selectedEntries.length + " crews");
  } else {
    throw "No entries were selected";
  }
  return app;
}

/**
 * Display the set start times dialog
 */
function showSetStartTimes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getActiveSheet();
  
  // Create the UiInstance object myapp and set the title text
  var app = UiApp.createApplication().setTitle('Enter Start Times').setHeight(130);
  
  // Create a vertical panel called mypanel and add it to the app
  var mypanel = app.createVerticalPanel().setStyleAttribute("width", "100%").setSpacing(5);
  
  mypanel.add(app.createHTML("Enter times in format HH:MM:SS or MM:SS"));
  
  // Selection list allowing us to pick another race to move the crew(s) to
  var hpanel = app.createHorizontalPanel().setSpacing(10).setVerticalAlignment(UiApp.VerticalAlignment.MIDDLE);
  //hpanel.add(app.createHTML("Move to "));
  // Drop-down to select Division
  var clb = app.createListBox(false).setName('raceName').setId('setStartTimes-raceName');
  clb.setVisibleItemCount(1);
  var sheetNames = getRaceSheetNames();
  for (var i=0; i<sheetNames.length; i++) {
    clb.addItem(sheetNames[i]);
    if (sheet.getName() == sheetNames[i]) {
      clb.setItemSelected(i, true);
    }
  }
  hpanel.add(clb);
  var time = app.createTextBox().setName("time").setId("setStartTimes-time");
  hpanel.add(time);
  var setbutton = app.createButton("Set").setStyleAttributes({"margin": "0px", "padding": "0px"});
  setbutton.addClickHandler(app.createServerHandler("setStartTimes").addCallbackElement(clb).addCallbackElement(time));
  hpanel.add(setbutton)
  mypanel.add(hpanel);
  
  // Key handler to detect when enter key is pressed
  var keyHandler = app.createServerKeyHandler('onSetStartTimesEnter').addCallbackElement(clb).addCallbackElement(time);
  time.addKeyUpHandler(keyHandler);
  
  // Status text
  mypanel.add(app.createHTML("").setId("setStartTimes-result"));
  
  // Done button
  var closeButton = app.createButton('Done');
  var closeHandler = app.createServerClickHandler('close');
  closeButton.addClickHandler(closeHandler);
  mypanel.add(closeButton);
  
  // Add my panel to myapp
  app.add(mypanel);
  
  // Set focus
  clb.setFocus(true);
  
  ss.show(app);
}

/**
 * Event handler for keypress in time field - used to detect when the enter key is pressed
 *
 * @param {object} e Event information
 * @return {AppInstance} Active application instance
 */
function onSetStartTimesEnter(e) {
  if (e.parameter.keyCode==13) {
    return setStartTimes(e);
  }
  var app = UiApp.getActiveApplication();
  return app;
}

/**
 * Set start times button click handler
 *
 * @param {object} eventInfo Event information
 * @return {AppInstance} Active application instance
 */
function setStartTimes(eventInfo) {
  var app = UiApp.getActiveApplication(),
      time = eventInfo.parameter.time,
      raceName = eventInfo.parameter.raceName,
      sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(raceName),
      finishColIndex = getTableColumnIndex("Finish");
  if (raceName == "") {
    throw "You must select a race";
  }
  if (sheet == null) {
    throw "Race " + raceName + " was not found";
  }
  if (time == "") {
    throw "You must enter a time";
  }
  if (time.match(/^\d+[:\.]\d+$/)) {
    time = "00:" + time.replace(".", ":");
  } else if (time.match(/^\d+[:\.]\d+[:\.]\d+$/)) {
    time = time.replace(".", ":");
  } else {
    throw "Invalid time format, must be MM:SS or HH:MM:SS";
  }
  var entriesRange = sheet.getRange(2, 1, sheet.getLastRow()-1, finishColIndex + 1), entries = getEntryRowData(entriesRange), entry, newTime, changedCount = 0;
  if (entries.length > 0) {
    // Assume that the entries are in a continuous range, for now
    Logger.log("Found " + entries.length + " entries");
    var firstRow = entries[0].rowNumber, lastEntry = entries[entries.length-1], lastRow = (lastEntry.rowNumber + lastEntry.values.length - 1),
      timeValues = new Array(lastRow - 1); // Not including header
    // Intialise array elements
    for (var i=0; i<timeValues.length; i++) {
      timeValues[i] = [""];
    }
    // Set times on those rows where we have an entry
    for (var i=0; i<entries.length; i++) {
      entry = entries[i];
      if (!entry.rowNumber) {
        throw "Row number not found for entry " + entry;
      }
      if (!entry.boatNumber) {
        throw "Boat number not found for entry " + entry;
      }
      newTime = (""+entry.values[0][finishColIndex]).toLowerCase() != "dns" ? time : entry.values[0][9];
      Logger.log("Setting time '" + newTime + "' for row " + entry.rowNumber);
      timeValues[entry.rowNumber-2][0] = newTime;
      if (newTime != "dns") {
        changedCount ++;
      }
    }
    sheet.getRange(2, finishColIndex + 1, timeValues.length, 1).setValues(timeValues);
    app.getElementById("setStartTimes-result").setText("Set start time " + time + " for " + changedCount + " crews");
    app.getElementById("setStartTimes-time").setValue("");
  } else {
    throw "No entries in race " + raceName;
  }
  return app;
}

/**
 * Display the set finish times dialog
 */
function showSetFinishTimes() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getActiveSheet();
  
  // Create the UiInstance object myapp and set the title text
  var app = UiApp.createApplication().setTitle('Enter Finish Times').setHeight(300);
  
  // Create a vertical panel called mypanel and add it to the app
  var mypanel = app.createVerticalPanel().setStyleAttribute("width", "100%").setSpacing(5);
  
  mypanel.add(app.createHTML("Enter finishers one-per-line, as a boat number, followed by a space, followed by times in format HH:MM:SS or MM:SS or 'dns' or 'rtd' or 'dsq'"));
  
  var times = app.createTextArea().setName("times").setId("setFinishTimes-times").setHeight("160px").setStyleAttribute("width", "100%");
  mypanel.add(times);
  var setbutton = app.createButton("Set");
  setbutton.addClickHandler(app.createServerHandler("setFinishTimes").addCallbackElement(times));
  mypanel.add(setbutton);
  
  // Status text
  mypanel.add(app.createHTML("").setId("setFinishTimes-result"));
  
  // Done button
  var closeButton = app.createButton('Done');
  var closeHandler = app.createServerClickHandler('close');
  closeButton.addClickHandler(closeHandler);
  mypanel.add(closeButton);
  
  // Add my panel to myapp
  app.add(mypanel);
  
  // Set focus
  times.setFocus(true);
  
  ss.show(app);
}

/**
 * Set start times button click handler
 *
 * @param {object} eventInfo Event information
 * @return {AppInstance} Active application instance
 */
function setFinishTimes(eventInfo) {
  var app = UiApp.getActiveApplication(),
      lines = eventInfo.parameter.times.split(/\r\n|\r|\n/g), line, pair,
      sheet, finishValues = [], times = [], boatNumber, time;
  // First check the data entered
  for (var i=0; i<lines.length; i++) {
    line = lines[i].trim();
    if (line.length > 0) { // Skip empty lines without erroring
      pair = line.split(/[ \t]+/g);
      if (pair.length == 2) {
        boatNumber = pair[0], time = pair[1];
        if (!boatNumber) {
          throw "Bad boat number '" + pair[0] + "' at line " + i + ", must be a number";
        }
        if (time.match(/^\d+[:\.]\d+$/)) {
          time = "00:" + time.replace(".", ":");
        } else if (time.match(/^\d+[:\.]\d+[:\.]\d+$/)) {
          time = time.replace(".", ":");
        } else if (time == "dns" || time == "rtd" || time == "dsq") {
          // Do nothing
        } else {
          throw "Invalid time format for boat " + boatNumber + " (line " + i + "), must be MM:SS or HH:MM:SS";
        }
        times.push({
          boatNumber: boatNumber,
          time: time
        });
        finishValues.push([boatNumber, time]);
      } else {
        throw "Bad content '" + line + "' at line " + i + ", must contain two parts separated by spaces or tabs";
      }
    }
  }
  if (times.length == 0) {
    throw "You must enter some times";
  }
  // Write to the Finishes sheet
  var finishesSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Finishes");
  if (finishesSheet) {
    finishesSheet.getRange(getNextFinishesRow(finishesSheet), 2, finishValues.length, 2).setValues(finishValues);
  }
  // Fetch all of the entries
  var allEntries = [], sheets = getRaceSheets(), finishColNum = getTableColumnIndex("Finish") + 1;
  for (var i=0; i<sheets.length; i++) {
    allEntries = allEntries.concat(getEntryRowData(sheets[i].getRange(2, 1, sheets[i].getLastRow()-1, getTableColumnIndex("Class"))));
  }
  // Now check against the entries to locate the row and sheet in which the boat is found
  var entry;
  if (allEntries.length == 0) {
    throw "Did not find any entries";
  }
  for (var i=0; i<times.length; i++) {
    for (var j=0; j<allEntries.length; j++) {
      entry = allEntries[j];
      if (!entry.rowNumber) {
        throw "Row number not found for entry " + entry;
      }
      if (!entry.boatNumber) {
        throw "Boat number not found for entry " + entry;
      }
      if (!entry.sheet) {
        throw "Sheet not found for entry " + entry;
      }
      if (times[i].boatNumber == entry.boatNumber) {
        times[i].rowNumber = entry.rowNumber;
        times[i].sheet = entry.sheet;
        continue;
      }
    }
    if (!times[i].rowNumber) {
      throw "Entry was not found for boat " + times[i].boatNumber;
    }
    if (!times[i].sheet) {
      throw "Sheet was not found for boat " + times[i].boatNumber;
    }
  }
  // Finally we can set the values in the sheets
  for (var i=0; i<times.length; i++) {
    Logger.log("Adding finish time " + times[i].time + " to row " + times[i].rowNumber + ", sheet " + times[i].sheet.getName());
    times[i].sheet.getRange(times[i].rowNumber, finishColNum).setValue(times[i].time);
  }
  app.getElementById("setFinishTimes-result").setText("Set start times for " + times.length + " crews");
  app.getElementById("setFinishTimes-times").setValue("");
  return app;
}

/**
 * Find the last row in the given finishes sheet, which does not have a race number
 *
 * @return {int} Row number of the first empty row in the sheet
 */
function getNextFinishesRow(sheet) {
  if (sheet.getLastRow() > 1) {
    var startRow = 2, range = sheet.getRange(startRow, 2, sheet.getLastRow()-1, 1), values = range.getValues();
    for (var i=0; i<values.length; i++) {
      if (values[i][0] == "") {
        return startRow + i;
      }
    }
  }
  return sheet.getLastRow() + 1;
}

function getTimesAndPD(sheet) {
  var lastNonBlank = 0;
  if (sheet.getLastRow() > 1) {
    var startRow = 2, range = sheet.getRange(startRow, 1, sheet.getLastRow()-1, getTableColumnIndex("P/D") + 1), values = range.getValues();
    for (var i=0; i<values.length; i++) {
      if (values[i][0] != "") { // If there is a time then add the row
        lastNonBlank = i;
      }
    }
  }
  return values.slice(0, i+1);
}

function setPD(sheet, values) {
  var colValues = [];
  for (var i=0; i<values.length; i++) {
    colValues.push([values[i][13]]);
  }
  if (colValues.length > 0) {
    var startRow = 2, range = sheet.getRange(startRow, getTableColumnIndex("P/D") + 1, colValues.length, 1);
    range.setValues(colValues);
  }
}

function timeInMillis(d) {
  return (d.getUTCHours()*3600 + d.getUTCMinutes()*60 + d.getUTCSeconds()) * 1000 + d.getUTCMilliseconds();
}

function numEntries(values) {
  var count = 0;
  for (var i=0; i<values.length; i++) {
    if (values[i][0] != "") {
      count ++;
    }
  }
  return count;
}

function medianTime(values) {
  var times = [], timeColIndex = getTableColumnIndex("Elapsed");
  for (var i=0; i<values.length; i++) {
    if (values[i][0] != "" && (values[i][timeColIndex] instanceof Date)) { // If there is a time then add the row
      times.push(timeInMillis(values[i][timeColIndex]));
      Logger.log("Adding median item " + timeInMillis(values[i][timeColIndex]));
    }
  }
  Logger.log("Calculating median from " + times);
  return medianValue(times);
}

function medianValue(values) {
  if (values.length == 0) {
    return NaN;
  }
  values.sort( function(a,b) {return a - b;} );
  var half = Math.floor(values.length/2);
  if(values.length % 2)
    return values[half];
  else
    return (values[half-1] + values[half]) / 2.0;
}

function meanValue(values) {
  var count = 0, total = 0.0;
  for (var i=0; i<values.length; i++) {
    if (!isNaN(values[i])) {
      total += values[i];
      count ++;
    }
  }
  return total / count;
}

function overallZero(divZeroes) {
  return meanValue(divZeroes);
}

function pdStatus(values, pFactors, dFactors, raceDiv) {
  var status = "", classDivIndex = 6, classColIndex = 5, timeColIndex = getTableColumnIndex("Elapsed"), time = timeInMillis(values[timeColIndex]);
  // Rule 32(h) and 33(g) Paddlers transferred from another division are not eligible for promotion/demotion
  if ((""+values[0]).indexOf(""+raceDiv) != 0) {
    Logger.log("Transferred from another division, skipping");
    return "";
  }
  var currDiv = parseInt(values[classDivIndex]), class = (typeof class == "string") ? values[classColIndex] : "";
  // Go through promotion times
  for (var i=0; i<pFactors.length; i++) {
    if (time < pFactors[i][2] && currDiv && currDiv > pFactors[i][0]) {
      var newDiv = pFactors[i][0];
      // No female junior paddler to be promoted higher than division 4
      if (class.indexOf("J") > -1 && class.indexOf("F") > -1 && newDiv < 4) {
        continue;
      }
      // No woman or canoe paddler to be promoted higher than division 3
      if ((class.indexOf("F") > -1 || class.indexOf("C") > -1) && newDiv < 3) {
        continue;
      }
      // No male junior kayak paddler to be promoted higher than division 2
      if (class.indexOf("J") > -1 && newDiv < 2) {
        continue;
      }
      status = "P" + pFactors[i][0];
      break;
    }
  }
  // Go backwards through demotion times, process lower divs first
  for (var i=dFactors.length-1; i>0; i--) {
    if (time > dFactors[i][2] && currDiv && currDiv < dFactors[i][0]) {
      status = "D" + dFactors[i][0];
      break;
    }
  }
  return status;
}

/**
 * Get the next free row in the given column in a sheet
 */
function getNextColumnRow(sheet, column) {
  var startRow = 2;
  Logger.log("Looking for next available row in sheet " + sheet.getName());
  if (sheet.getLastRow() > startRow) {
    Logger.log("Looking through rows " + startRow + " to " + sheet.getLastRow());
    var range = sheet.getRange(startRow, column, sheet.getLastRow()-startRow-1, 1), values = range.getValues();
    for (var i=0; i<values.length; i++) {
      if (values[i][0] == "") {
        return startRow + i;
      }
    }
  }
  return Math.max(sheet.getLastRow(), startRow);
}

function setCoursePromotions(calculateFromDivs, applyToDivs, sourceFactors, pFactors, dFactors) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), 
      sheetName, sheetValues = new Array(10), sheets = new Array(10), sheet, zeroTimes = [], 
      timeColIndex = getTableColumnIndex("Elapsed"), pdColIndex = getTableColumnIndex("P/D"), pdTimeRows = [],
      min;
  if (sourceFactors.length != calculateFromDivs.length) {
    throw "Number of source factors must be the same as the number of source sheets";
  }
  for (var i=0; i<calculateFromDivs.length; i++) {
    sheetName = "Div" + calculateFromDivs[i]
    sheet = ss.getSheetByName(sheetName);
    if (sheet != null) {
      if (!sheets[calculateFromDivs[i]]) {
        sheets[calculateFromDivs[i]] = sheet;
      }
      if (!sheetValues[calculateFromDivs[i]]) {
        sheetValues[calculateFromDivs[i]] = getTimesAndPD(sheet);
      }
      var median = medianTime(sheetValues[calculateFromDivs[i]]);
      zeroTimes.push(median / sourceFactors[i]);
      Logger.log("Adding median value " + median);
    } else {
      throw "Source sheet " + sheetName + " not found";
    }
  }
  var zeroTime = overallZero(zeroTimes);
  Logger.log("Calculated handicapped zero as " + new Date(zeroTime).toUTCString());
  
  // Calculate P/D times
  var pTimes = new Array(pFactors.length), d;
  for (var i=0; i<pFactors.length; i++) {
    pTimes[i] = zeroTime * pFactors[i][1];
    pFactors[i].push(pTimes[i]);
    d = new Date(pTimes[i]), t = ""+d.getUTCHours()+":"+d.getUTCMinutes()+":"+d.getUTCSeconds()+"."+d.getUTCMilliseconds();
    pdTimeRows.push([""+applyToDivs.join("")+"K1P to Div " + pFactors[i][0], t]);
    Logger.log(""+applyToDivs.join("")+"K1P to Div " + pFactors[i][0] + ": " + d.getUTCHours()+":"+d.getUTCMinutes()+":"+d.getUTCSeconds()+"."+d.getUTCMilliseconds());
  }
  var dTimes = new Array(dFactors.length);
  for (var i=0; i<dFactors.length; i++) {
    dTimes[i] = zeroTime * dFactors[i][1];
    dFactors[i].push(dTimes[i]);
    d = new Date(dTimes[i]), t = ""+d.getUTCHours()+":"+d.getUTCMinutes()+":"+d.getUTCSeconds()+"."+d.getUTCMilliseconds();
    pdTimeRows.push([""+applyToDivs.join("")+"K1D to Div " + dFactors[i][0], t]);
    Logger.log(""+applyToDivs.join("")+"K1D to Div " + dFactors[i][0] + ": " + d.getUTCHours()+":"+d.getUTCMinutes()+":"+d.getUTCSeconds()+"."+d.getUTCMilliseconds());
  }
  
  // Apply promotions
  var pdRows = [], pdDivRows;
  // TODO Keep track of all promotions and demotions and associated paddler details so they can be added to the PD sheet
  for (var i=0; i<applyToDivs.length; i++) {
    sheetName = "Div" + applyToDivs[i]
    sheet = ss.getSheetByName(sheetName);
    pdDivRows = [];
    if (sheet != null) {
      if (!sheets[applyToDivs[i]]) {
        sheets[applyToDivs[i]] = sheet;
      }
      if (!sheetValues[applyToDivs[i]]) {
        sheetValues[applyToDivs[i]] = getTimesAndPD(sheet);
      }
      // Check there are at least 5 entries in the sheet
      var values = sheetValues[applyToDivs[i]];
      if (numEntries(values) >= 5) {
        // Look through the times and set each P/D value
        Logger.log("Setting P/D times for " + sheetName);
        for (var j=0; j<values.length; j++) {
          if (values[j][timeColIndex] && values[j][timeColIndex] instanceof Date) {
            var status = pdStatus(values[j], pFactors, dFactors, applyToDivs[i]);
            if (status != "")
              Logger.log("Got P/D status " + status + " for boat " + values[j][0]);
            if (status)
              pdDivRows.push(values[j].slice(1, 7).concat(status));
            values[j][pdColIndex] = status.replace(/^D\d$/, "D?");
          }
        }
        setPD(sheets[applyToDivs[i]], sheetValues[applyToDivs[i]]);
        if (pdDivRows.length > 0) {
          pdRows = pdRows.concat([["Div"+applyToDivs[i], "", "", "", "", "", ""], ["Surname", "First name", "BCU number", "Club", "Class", "Division", "P/D"]], pdDivRows);
        }
      } else {
        Logger.log("Fewer than 5 starters in " + sheetName + ", no automatic promotions/demotions");
      }
    } else {
      throw "Destination sheet " + sheetName + " not found";
    }
  }
  var pdSheet = ss.getSheetByName("PandD");
  if (pdSheet != null) {
    if (pdRows.length > 0) {
      pdSheet.getRange(getNextColumnRow(pdSheet, 1), 1, pdRows.length, 7).setValues(pdRows);
    }
    if (pdTimeRows.length > 0) {
      pdSheet.getRange(getNextColumnRow(pdSheet, 12), 12, pdTimeRows.length, 2).setValues(pdTimeRows);
    }
  } else {
    throw "Cannot find PandD sheet";
  }
}

function calculatePromotions() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(),
      pdSheet = ss.getSheetByName("PandD");
  if (pdSheet != null) {
    // Clear existing values
    if (pdSheet.getLastRow() > 1) {
      pdSheet.getRange(2, 1, pdSheet.getLastRow()-1, pdSheet.getLastColumn()).clear();
    }
    setCoursePromotions([1, 2, 3], [1, 2, 3], [1.033, 1.117, 1.2], [], [[2, 1.083], [3, 1.167], [4, 1.25]]); // No automatic promotions, only demotions
    setCoursePromotions([4, 5, 6], [4, 5, 6], [1.283, 1.367, 1.45], [[3, 1.233], [4, 1.317], [5, 1.4]], [[5, 1.333], [6, 1.417], [7, 1.5]]);
    setCoursePromotions([7, 8], [7, 8, 9], [1.533, 1.617], [[5, 1.4], [6, 1.483], [7, 1.567], [8, 1.65]], [[8, 1.583], [9, 1.667]]);
  } else {
    throw "Cannot find PandD sheet";
  }
}

function calculatePointsBoundary(entries, raceName) {
  var boatNum, pd, time, timeColIndex = getTableColumnIndex("Elapsed"), pdColIndex = getTableColumnIndex("P/D");
  // No cut-off for Div9
  if (raceName[0] == "9") {
    return null;
  }
  for (var i=0; i<entries.length; i++) {
    boatNum = entries[i].boatNumber, pd = entries[i].values[0][pdColIndex], time = entries[i].values[0][timeColIndex];
    // Skip boats transferred from another division (i.e. strange numbers)
    if (raceName && raceName[0] != (""+boatNum)[0]) {
      continue;
    }
    // Skip promoted boats
    if (pd != "") {
      Logger.log("Skipping due to PD: " + pd);
      continue;
    }
    // Skip boats with no finish time
    if (!(time instanceof Date)) {
      continue;
    }
    Logger.log("Using boat " + boatNum + " for points cutoff boundary");
    return timeInMillis(time) * 1.1;
  }
  return null;
}

function getClubRows(sheet) {
  if (sheet.getLastRow() > 0) {
    return sheet.getRange(1, 1, sheet.getLastRow(), 3).getValues();
  } else {
    return null;
  }
}

function getClubCodes(rows, regionCode) {
  var codes = [];
  for (var i=0; i<rows.length; i++) {
    if (!regionCode || rows[i][2] == regionCode) {
      codes.push(rows[i][1]);
    }
  }
  return codes;
}

function getClubNames(rows, regionCode) {
  var codes = [];
  for (var i=0; i<rows.length; i++) {
    if (!regionCode || rows[i][2] == regionCode) {
      codes.push(rows[i][0]);
    }
  }
  return codes;
}

function sumPoints(values, count) {
  values.sort(function(a, b) { return a - b; }).reverse();
  if (count)
    values = values.slice(0, count);
  var total = 0;
  for (var i=0; i<values.length; i++) {
    if (!isNaN(values[i])) {
      total += values[i];
    }
  }
  Logger.log("Sum " + values + ", got " + total);
  return total;
}

function calculatePoints(scriptProps) {
  if (!scriptProps.haslerRegion) {
    throw "No Hasler region is defined";
  }
  
  var ss = SpreadsheetApp.getActiveSpreadsheet(),
      clubsSheet = ss.getSheetByName("Clubs"), clubRows = [], clubsRange, clubsInRegion, clubNames, allClubs, allClubNames, haslerPoints, lightningPoints, unfoundClubs = [],
      clubColIndex = getTableColumnIndex("Club"), timeColIndex = getTableColumnIndex("Elapsed"), posnColIndex = getTableColumnIndex("Posn"), 
      pdColIndex = getTableColumnIndex("P/D"), numHeaders = raceSheetColumnNames.length;
  if (clubsSheet != null) {
    // Clear existing calculated values
    if (clubsSheet.getLastRow() > 1 && clubsSheet.getLastColumn() > 4) {
      clubsSheet.getRange(2, 5, clubsSheet.getLastRow()-1, clubsSheet.getLastColumn()-4).clearContent();
    }
  } else {
    throw "Cannot find Clubs sheet";
  }
  
  clubsRange = getClubRows(clubsSheet);
  clubsInRegion = getClubCodes(clubsRange, scriptProps.haslerRegion);
  clubNames = getClubNames(clubsRange, scriptProps.haslerRegion);
  allClubs = getClubCodes(clubsRange);
  Logger.log("All clubs: " + allClubs);
  allClubNames = getClubNames(clubsRange);
  if (clubsInRegion.length == 0) {
    throw "No clubs found in region " + scriptProps.haslerRegion;
  }
  haslerPoints = new Array(clubsInRegion.length), lightningPoints = new Array(allClubs.length);
  for (var i=0; i<clubsInRegion.length; i++) {
    haslerPoints[i] = [];
  }
  for (var i=0; i<allClubs.length; i++) {
    lightningPoints[i] = [];
  }
  
  // TODO Check that promotions have first been calculated...
  
  // For each race...
  var entries = [], sheets = getRaceSheets(), divStr, boundary, colValues, isHaslerRace, isLightningRace;
  for (var i=0; i<sheets.length; i++) {
    // Fetch all of the entries
    if (sheets[i].getLastRow() < 2) {
      continue;
    }
    divStr = sheets[i].getName().replace("Div", "");
    isHaslerRace = sheets[i].getName().indexOf("Div") == 0, isLightningRace = sheets[i].getName().match(/U\d+/) != null;
    var sheetRange = sheets[i].getRange(2, 1, sheets[i].getLastRow()-1, numHeaders), sheetValues = sheetRange.getValues();
    colValues = Array(sheetRange.getNumRows());
    entries = getEntryRowData(sheetRange);
    // Calculate 110% boundary - time of fastest crew NOT promoted for K1 or 110% of winning boat for K2
    // Boats must not have been transferred from another division
    entries.sort( function(a,b) {return (parseInt(a.values[0][posnColIndex])||999) - (parseInt(b.values[0][posnColIndex])||999);} ); // Sort by position, ascending then blanks (non-finishers)
    boundary = calculatePointsBoundary(entries, divStr);
    // Allocate points to clubs within the region
    var count = 20, pointsByBoatNum = new Array(99);
    var boatNum, pd, time, minPoints = (divStr[0] == "9" ? 2 : 1);
    for (var j=0; j<entries.length; j++) {
      boatNum = entries[j].boatNumber, pd = entries[j].values[0][pdColIndex], time = entries[j].values[0][timeColIndex], 
        club1 = entries[j].values[0][clubColIndex], club2 = entries[j].values[1] ? entries[j].values[1][clubColIndex] : "",
        posn = parseInt(entries[j].values[0][posnColIndex]) || 0;
      if (posn > 0 && (!isHaslerRace || clubsInRegion.indexOf(club1) >= 0 || club2 && clubsInRegion.indexOf(club2) >= 0)) {
        if (isHaslerRace && boundary && time instanceof Date && boundary < timeInMillis(time)) {
          pointsByBoatNum[entries[j].boatNumber] = minPoints;
        } else {
          pointsByBoatNum[entries[j].boatNumber] = Math.max(minPoints, count);
        }
        Logger.log("Allocate " + pointsByBoatNum[entries[j].boatNumber] + " to boat " + boatNum + " (pos " + posn + ") - club in region: " + club1);
        // TODO Should we decrement this all the time? What if two crews cross the line together?
        count --;
      } else {
          pointsByBoatNum[entries[j].boatNumber] = "";
      }
      // Check clubs are in the main list
      if (club1 != "" && allClubs.indexOf(club1) == -1) {
        unfoundClubs.push([club1, entries[j].boatNumber]);
      }
      if (club2 != "" && allClubs.indexOf(club2) == -1) {
        unfoundClubs.push([club2, entries[j].boatNumber]);
      }
    }
    // Set the values into the sheet
    var bn = 0, clubIndex, points;
    for (var j=0; j<sheetValues.length; j++) {
      bn = sheetValues[j][0] || bn; // Use last boat number encountered, to cover second person in a K2
      clubIndex = clubsInRegion.indexOf(sheetValues[j][4])
      // Check clubs again, as only one of the K2 partners may be entitled to points
      if (clubIndex >= 0) {
        points = pointsByBoatNum[bn]
        colValues[j] = [points || ""];
        if (points) {
          if (isHaslerRace) {
            haslerPoints[clubIndex].push(points);
          } else if (isLightningRace) {
            Logger.log("Adding " + allClubs.indexOf(sheetValues[j][4]) + " lightning points");
            lightningPoints[allClubs.indexOf(sheetValues[j][4])].push(points);
          }
        }
      } else {
        colValues[j] = [""];
      }
    }
    
    // We cannot set the same range we used to read the data, since this replaces formulae in other columns with the raw cell value :-(
    sheets[i].getRange(2, 15, sheetValues.length, 1).setValues(colValues);
  }
  
  if (haslerPoints.length > 0) {
    var clubPointsRows = [], lastPoints = 9999;
    for (var j=0; j<clubsInRegion.length; j++) {
      if (haslerPoints[j].length > 0) {
        clubPointsRows.push([clubNames[j], clubsInRegion[j], sumPoints(haslerPoints[j], 12)]);
      }
    }
    if (clubPointsRows.length > 0) {
      clubPointsRows.sort(function(a, b) { return b[2] - a[2] }); // Sort by number of points
      // Add Hasler points column value
      var lastpos = 11, nextpos = 10, pos;
      for (var j=0; j<clubPointsRows.length; j++) {
        pos = clubPointsRows[j][2] == lastPoints ? lastpos : nextpos;
        nextpos = nextpos - 1;
        clubPointsRows[j].push(pos);
        lastpos = pos
        lastPoints = clubPointsRows[j][2]
      }
      clubsSheet.getRange(2, 8, clubPointsRows.length, 4).setValues(clubPointsRows);
    }
  }
  
  if (lightningPoints.length > 0) {
    var lightningPointsRows = [];
    for (var j=0; j<allClubs.length; j++) {
      if (lightningPoints[j].length > 0) {
        lightningPointsRows.push([allClubNames[j], allClubs[j], sumPoints(lightningPoints[j])]);
      }
    }
    if (lightningPointsRows.length > 0) {
      lightningPointsRows.sort(function(a, b) { return b[2] - a[2] }); // Sort by number of points
      Logger.log("Lightning points rows: " + lightningPointsRows);
      clubsSheet.getRange(2, 13, lightningPointsRows.length, 3).setValues(lightningPointsRows);
    }
  }
  
  if (unfoundClubs.length > 0) {
    clubsSheet.getRange(2, 5, unfoundClubs.length, 2).setValues(unfoundClubs);
  }
}

/**
 * Return the zero-based index of the column with the specified header name, or -1 if not found. Columns are looked up from the spreadsheet.
 * 
 * Return values are cached for 5 minutes, after this the name will be looked up again in the spreadsheet.
 *
 * @param colName The name of the column header to look for
 * @param sheet The sheet in which to look for table headings (optional, defaults to the first sheet in the current spreadsheet if not specified/null)
 */
function getTableColumnIndex(colName, sheet) {
  sheet = sheet || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var cache = CacheService.getPrivateCache(), cacheKey = "col_index__" + sheet.getName() + "__" + colName;
  var cached = cache.get(cacheKey);
  if (cached != null) {
     return +cached; // convert to a number
  }
  var headers = getTableHeaders(SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]); // takes some time
  var index = headers.indexOf(colName);
  cache.put(cacheKey, index, 300); // cache for 5 minutes
  return index;
}

/**
 * Return the number (starting from 1, not zero) of the column with the specified header, or -1 if not found
 */
function getRaceColumnNumber(colName) {
  return getTableColumnIndex(colName) + 1;
}

/**
 * Return the letter denoting of the column with the specified header in A1 notation, or '' if not found
 */
function getRaceColumnA1(colName) {
  var index = getTableColumnIndex(colName);
  return index > -1 ? String.fromCharCode(65 + index) : '';
}

/**
 * Set forumalas for all race sheets
 */
function setFormulas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getActiveSheet(), sheets = getRaceSheets(),
    timePlusMinusColA1 = getRaceColumnA1("Time+/-"), startColA1 = getRaceColumnA1("Start"), finishColA1 = getRaceColumnA1("Finish"), elapsedColA1 = getRaceColumnA1("Elapsed"), 
    elapsedCol = getRaceColumnNumber("Elapsed"), posnCol = getRaceColumnNumber("Posn");
  for (var i=0; i<sheets.length; i++) {
    var lastRow = sheets[i].getLastRow();
    if (lastRow > 1) {
      // Elapsed time
      if (elapsedCol > 0) {
        sheets[i].getRange(2, elapsedCol).setFormula('=IFERROR(IF('+startColA1+'2="dns","dns",IF('+finishColA1+'2="rtd", "rtd", IF(AND(NOT(ISTEXT('+finishColA1+'2)), NOT(ISTEXT('+startColA1+'2)), '+finishColA1+'2-'+startColA1+'2 > 0), '+finishColA1+'2-'+startColA1+'2+'+timePlusMinusColA1+'2, ""))))');
        sheets[i].getRange(2, elapsedCol, lastRow-1).setFormulaR1C1(sheets[i].getRange(2, elapsedCol).getFormulaR1C1());
      }
      // Posn
      if (posnCol > 0) {
        sheets[i].getRange(2, posnCol).setFormula('=IFERROR(RANK('+elapsedColA1+'2,'+elapsedColA1+'$2:'+elapsedColA1+'$' + lastRow + ', 1))');
        sheets[i].getRange(2, posnCol, lastRow-1).setFormulaR1C1(sheets[i].getRange(2, posnCol).getFormulaR1C1());
      }
    }
  }
}

/**
 * Set validation
 */
function setValidation() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheet = ss.getActiveSheet(), sheets = getRaceSheets(), clubsSheet = ss.getSheetByName('Clubs'),
    classRule = SpreadsheetApp.newDataValidation().requireValueInList('S,V,J,F,VF,JF,SC,VC,JC,FC,VFC,JFC'.split(','), true).build(),
    divRule = SpreadsheetApp.newDataValidation().requireValueInList('1,2,3,4,5,6,7,8,9,U12M,U12F,U10M,U10F'.split(','), true).build(),
    clubRule = clubsSheet !== null && clubsSheet.getLastRow() > 0 ? SpreadsheetApp.newDataValidation().requireValueInRange(clubsSheet.getRange(1, 2, clubsSheet.getLastRow(), 1)).build() : null;
  for (var i=0; i<sheets.length; i++) {
    var lastRow = sheets[i].getLastRow(), r;
    if (lastRow > 1) {
      Logger.log("Setting validation for sheet " + sheets[i].getName());
      if (clubRule !== null) {
        r = sheets[i].getRange(2, getRaceColumnNumber("Club"), lastRow-1);
        if (r)
          r.clearDataValidations();
          r.setDataValidation(clubRule);
      }
      r = sheets[i].getRange(2, getRaceColumnNumber("Class"), lastRow-1);
      if (r)
        r.clearDataValidations();
        r.setDataValidation(classRule);
      r = sheets[i].getRange(2, getRaceColumnNumber("Div"), lastRow-1);
      if (r)
        r.clearDataValidations();
        r.setDataValidation(divRule);
    }
  }
}

/**
 * Set formatting
 */
function setFormatting() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheets = getRaceSheets();
  for (var i=0; i<sheets.length; i++) {
    var lastRow = sheets[i].getLastRow();
    sheets[i].getRange(1, 1, lastRow, sheets[i].getLastColumn()).setFontFamily("Courier New");
    // Set Start, Finish and Elapsed columns to show as times, Paid as pounds and Div as integer
    if (lastRow > 1) {
      sheets[i].getRange(2, getRaceColumnNumber("BCU Number"), lastRow-1, 3).setNumberFormat("0");
      sheets[i].getRange(2, getRaceColumnNumber("Expiry"), lastRow-1, 3).setNumberFormat("dd/MM/yyyy");
      sheets[i].getRange(2, getRaceColumnNumber("Div"), lastRow-1, 3).setNumberFormat("0");
      sheets[i].getRange(2, getRaceColumnNumber("Paid"), lastRow-1, 3).setNumberFormat("£0.00");
      sheets[i].getRange(2, getRaceColumnNumber("Start"), lastRow-1, 3).setNumberFormat("HH:mm:ss");
    }
  }
}

/**
 * Re-set the column names on all race sheets, including contents and formats
 */
function setRaceSheetHeadings() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), sheets = getRaceSheets(), headersRange;
  for (var i=0; i<sheets.length; i++) {
    headersRange = sheets[i].getRange(1, 1, 1, raceSheetColumnNames.length);
    // Clear existing header
    sheets[i].getRange(1, 1, 1, sheets[i].getLastColumn()).clear().setBorder(false, false, false, false, false, false);
    // Set the new values and format
    headersRange.setValues([raceSheetColumnNames]).setHorizontalAlignments([raceSheetColumnAlignments]).setFontFamily("Courier New").setFontWeight("bold").setBackground("#ccffff").setBorder(true, true, true, true, true, true);
    // Set the last column header (Notes) to be italicised
    sheets[i].getRange(1, raceSheetColumnNames.length).setFontStyle("italic");
  }
}