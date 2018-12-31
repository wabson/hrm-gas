var crewSheets = require('./crew-sheets');
var dateformat = require('./dateformat');
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

function isPayPalPaymentApproved(payment) {
  return payment.type = 'paypal' && payment.state === 'approved';
}

function isStripePaymentApproved(payment) {
  return payment.type = 'stripe' && payment.state === 'succeeded';
}

function getTotalPaidForEntrySet(entrySet) {
  var isPaid;
  return entrySet.payments.reduce(function(total, payment) {
    isPaid = isPayPalPaymentApproved(payment) || isStripePaymentApproved(payment);
    return total + (isPaid ? parseFloat(payment.amount) : 0);
  }, 0);
}

function importEntrySets(ss, entrySets) {
  var ENTRY_SETS_SHEET_NAME = 'Entry Sets';
  var MEMBERSHIP_PROOF_SHEET_NAME = 'Memberships';
  var ENTRY_SETS_COLUMNS = ['ID', 'Name', 'Club', 'Email', 'Phone', 'Team Leader?', 'Entered', 'Due', 'Paid', 'Added'];
  var MEMBERSHIP_PROOF_COLUMNS = ['Surname', 'First name', 'Club', 'Class', 'BCU Number', 'Expiry', 'Member name'];
  // First make sure we have a sheet called Entry Sets
  var added = new Date();
  var results = [];
  var membershipProofRows = [];
  if (ss) {
    var raceSheetNames = racing.getRaceSheetNames(ss);
    var entrySetsSheet = ss.getSheetByName(ENTRY_SETS_SHEET_NAME) || ss.insertSheet(ENTRY_SETS_SHEET_NAME);
    entrySetsSheet.getRange(1, 1, 1, ENTRY_SETS_COLUMNS.length).setValues([ENTRY_SETS_COLUMNS]);
    var membershipProofsSheet = ss.getSheetByName(MEMBERSHIP_PROOF_SHEET_NAME) || ss.insertSheet(MEMBERSHIP_PROOF_SHEET_NAME);
    membershipProofsSheet.getRange(1, 1, 1, MEMBERSHIP_PROOF_COLUMNS.length).setValues([MEMBERSHIP_PROOF_COLUMNS]);
    var entriesToAdd = {};
    var availablePlacesBySheet = {};
    var getAvailablePlaces = function(raceName) {
      availablePlacesBySheet[raceName] = availablePlacesBySheet[raceName] ||
        crewSheets.getAvailableRows(ss.getSheetByName(raceName), true, 1, 2);
      return availablePlacesBySheet[raceName];
    };
    var entrySetRows = entrySets.map(function(entrySet) {
      return {
        'ID': entrySet.id,
        'Name': entrySet.name,
        'Club': entrySet.club,
        'Email': entrySet.email,
        'Phone': entrySet.phone,
        'Team Leader?': entrySet.isTeamLeader ? 'Y' : '',
        'Entered': dateformat.parseDate(entrySet.enteredOn),
        'Due': parseFloat(entrySet.due) || '',
        'Paid': parseFloat(getTotalPaidForEntrySet(entrySet)) || '',
        'Added': added
      };
    });
    entrySets.forEach(function(entrySet) {
      var totalDue = 0;
      var totalPaid = getTotalPaidForEntrySet(entrySet);
      entrySet.entries.forEach(function(entries) {
        var raceClass = entries.raceClass;
        var entriesList = entries.list;
        // Add payment info
        entriesList.forEach(function(entryCrew) {
          entryCrew.forEach(function(crewMember, index) {
            var dueAmount = parseFloat(crewMember.due || 0);
            totalDue += dueAmount;
            if (totalPaid > 0) {
              crewMember.paid = dueAmount;
            }
            crewMember.setId = entrySet.id;
            crewMember.index = index;
            if (crewMember.membershipProof) {
              if (crewMember.membershipProof.type === 'upload' && crewMember.membershipProof.uploads) {
                crewMember.membershipProof.uploads.forEach(function(upload) {
                  var parsedResult = upload.parsedResults[0];
                  membershipProofRows.push({
                    'Surname': crewMember.surname,
                    'First name': crewMember.firstName,
                    'Club': crewMember.club,
                    'Class': crewMember.className,
                    'BCU Number': parsedResult ? parsedResult.number : '',
                    'Expiry': parsedResult ? dateformat.parseDate(parsedResult.expiry) : '',
                    'Member name': parsedResult ? parsedResult.name : ''
                  });
                });
              }
            }
          });
        });
        if (raceSheetNames.indexOf(raceClass) > -1) {
          entriesToAdd[raceClass] = (entriesToAdd[raceClass] || []).concat(entriesList);
          if (getAvailablePlaces(raceClass).length < entriesToAdd[raceClass].length) {
            throw 'Not enough places to import race class ' + raceClass + ' in entry set ' + entrySet.id +
            ' (needs ' + entriesToAdd[raceClass].length + ', found ' + getAvailablePlaces(raceClass).length + ')';
          }
        } else {
          throw 'Could not find race sheet for ' + raceClass;
        }
      });
      if (totalPaid > 0 && totalDue !== totalPaid) {
        throw 'Paid amount ' + totalPaid + ' does not match total due amount ' + totalDue;
      }
    });
    // Run through each race in the set of entries
    //  and check the race sheet exists
    //  if so then check the number of available spaces
    // and if more spaces are available then add
    for (var raceName in entriesToAdd) {
      if (entriesToAdd.hasOwnProperty(raceName)) {
        var addtoSheet = ss.getSheetByName(raceName);
        var entryRows = entriesToAdd[raceName].reduce(function(existing, entries) {
          return existing.concat(entries.map(function(entry) {
            return {
              'Number': entry.index === 0 ? '101' : '',
              'Surname': entry.surname,
              'First name': entry.firstName,
              'BCU Number': entry.membershipNumber,
              'Expiry': dateformat.parseDate(entry.membershipExpiry),
              'Club': entry.club,
              'Class': entry.className,
              'Div': entry.division,
              'ET?': entry.eventTicket.toLowerCase() === 'true',
              'Paid': entry.paid || '',
              'Set': entry.setId
            };
          }));
        }, []);
        appendEntryRows(entryRows, addtoSheet, true);
      }
    }
    tables.setValues(membershipProofsSheet, membershipProofRows, null, null, membershipProofsSheet.getLastRow()+1);
    tables.setValues(entrySetsSheet, entrySetRows, null, null, entrySetsSheet.getLastRow()+1);
    return results;
  } else {
    throw 'Spreadsheet with ID could not be found';
  }
}

exports.importSheet = appendEntryRows;

exports.importEntrySets = importEntrySets;

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