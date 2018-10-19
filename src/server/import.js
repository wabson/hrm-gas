var crewSheets = require('./crew-sheets');
var racing = require('./racing');
var tables = require('./tables');

function uploadAndConvertHRMFile(driveFile) {
  var newBlob = doHRMConversion(driveFile).getBlob();
  var sourceFileParents = driveFile.getParents();
  var file = {
    title: driveFile.getName().replace(/\.xlsx?$/, ''),
    parents: sourceFileParents.length === 1 ? sourceFileParents : [ DriveApp.getRootFolder() ]
  };
  file = Drive.Files.insert(file, newBlob, {
    convert: true
  });
  return file
}

function doHRMConversion(file) {
  var conversionUrl = 'https://hrmio.herokuapp.com/public/upload';
  return doMultipartPost(conversionUrl, file);
}

function doMultipartPost(url, file) {
  var boundary = "xxxxxxxxxx";
  var payload = Utilities.newBlob(
    "--"+boundary+"\r\n"
    + "Content-Disposition: form-data; name=\"file\"; filename=\""+file.getName()+"\"\r\n"
    + "Content-Type: " + file.getMimeType()+"\r\n\r\n").getBytes()
    .concat(file.getBlob().getBytes())
    .concat(Utilities.newBlob("\r\n--"+boundary+"--\r\n").getBytes());
  var options = {
    method : "post",
    contentType : "multipart/form-data; boundary=" + boundary,
    payload : payload
  };
  return UrlFetchApp.fetch(url, options);
}

function appendEntryRows(rows, dstSheet, importPaid) {
  var sheetName = dstSheet.getName();
  var totalPaid = 0;
  var totalEntryCount = 0;
  var crews = [], sheetPlaces = [];
  if (rows.length > 0) {
    if (dstSheet !== null) {
      crews = crewSheets.groupRows(rows, 'Number');
      sheetPlaces = crewSheets.getAvailableRows(dstSheet, true, 1, 2);
      if (crews.length > sheetPlaces.length) {
        throw 'Too many entries to import into ' + sheetName + ' (' + crews.length + ' crews, ' + sheetPlaces.length + ' places in sheet)';
      }

      // Group consecutive rows to write into sets of rows
      var crewSets = groupCrewsIntoSets(crews, sheetPlaces);

      // Remove numbers, Paid if desired
      deleteArrayObjectProperty(rows, 'Number');
      if (importPaid !== true) {
        deleteArrayObjectProperty(rows, 'Paid');
      } else {
        totalPaid += sumArrayObjectProperty(rows, 'Paid');
      }

      var rangeStartRow, numPlacesNeeded, places, rangeRows;
      for (var i = 0; i < crewSets.length; i++) {
        rangeStartRow = sheetPlaces[totalEntryCount][1];
        numPlacesNeeded = crewSets[i].length;
        places = sheetPlaces.slice(totalEntryCount, totalEntryCount + numPlacesNeeded);
        rangeRows = crewSets[i].reduce(function (accumulator, item) {
          return accumulator.concat(item)
        }, []);
        tables.setRangeValues(dstSheet, rangeRows, rangeStartRow);
        totalEntryCount += numPlacesNeeded;
      }
    } else {
      throw('Destination sheet ' + sheetName + ' not found');
    }
  }
  return {
    numCrews: totalEntryCount,
    crews: crews,
    places: sheetPlaces ? sheetPlaces.slice(0, crews.length) : [],
    totalPaid: totalPaid
  }
}

exports.importSheet = appendEntryRows;

function groupCrewsIntoSets(crews, sheetPlaces) {
  var rowSets = [], indexNum, rowPos, numRows, lastRowPos, previousLastRowPos = -1;
  for (var i = 0; i < crews.length; i++) {
    indexNum = sheetPlaces[i][0];
    rowPos = sheetPlaces[i][1];
    numRows = sheetPlaces[i][2];
    lastRowPos = rowPos + numRows;
    if (rowPos - previousLastRowPos > 1) { // Start a new set
      rowSets.push([]);
    }
    if (crews[i].length <= numRows) {
      rowSets.push(rowSets.pop().concat([crews[i]])); // Add crew to the current set
      previousLastRowPos = lastRowPos;
    } else {
      throw 'Could not insert crew with ' + crews[i].length + ' into index ' + indexNum + ' of length ' + numRows;
    }
  }
  return rowSets;
}

function deleteArrayObjectProperty(items, propertyName) {
  items.forEach(function(item) {
    delete item[propertyName];
  });
}

function sumArrayObjectProperty(items, propertyName) {
  return items.reduce(function(accumulator, item) {
    return accumulator + item[propertyName];
  }, 0);
}