/**
 * Get a complete list of all the rows in the given sheet as an array of objects
 *
 * Return {array} Array containing each row as an object, with properties named according to the table heading name. Array will be empty if no data rows are present.
 */
function getTableRows(sheet, convertToLowerCase) {
  convertToLowerCase = typeof convertToLowerCase != "undefined" ? convertToLowerCase : false;
  if (sheet.getLastRow() < 2)
    return [];
  var range = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()), values = range.getValues(), headers = values[0], rows = [], row = null;
  for (var i=1; i<values.length; i++) {
    row = {};
    for (var j=0; j<headers.length; j++) {
      if (headers[j] && typeof headers[j] == "string") {
        row[convertToLowerCase ? headers[j].toLowerCase() : headers[j]] = values[i][j];
      }
    }
    rows.push(row);
  }
  return rows;
}

function setTableRowValues(sheet, values, startColumnName, endColumnName, startRow, convertHeadersToLowerCase) {
  convertHeadersToLowerCase = typeof convertHeadersToLowerCase != "undefined" ? convertHeadersToLowerCase : false;
  if (values.length === 0) {
    return;
  }
  startRow = startRow || 2;
  var headers = getTableHeaders(sheet);
  if (convertHeadersToLowerCase) {
    headers = headers.map(function(n) {return n.toLowerCase();});
  }
  var startColumnIndex = startColumnName ? headers.indexOf(startColumnName): 0;
  var endColumnIndex = endColumnName ? headers.indexOf(endColumnName) : 0;
  if (startColumnIndex == -1) {
    throw 'Could not find start column ' + startColumnName + ' in columns ' + headers.join(', ');
  }
  if (endColumnIndex == -1) {
    throw 'Could not find end column ' + endColumnName + ' in columns ' + headers.join(', ');
  }
  var valueList = new Array(values.length);
  for (var i = 0; i < values.length; i++) {
    var row = [];
    for (var j = (startColumnName ? startColumnIndex : 0); j < (endColumnName ? endColumnIndex + 1 : headers.length); j++) {
      row.push(values[i][headers[j]] || "");
    }
    valueList[i] = row;
  }
  sheet.getRange(startRow, (startColumnName ? startColumnIndex + 1 : 1), valueList.length, valueList[0].length).setValues(valueList);
}

function appendTableRowValues(sheet, values) {
  setTableRowValues(sheet, values, null, null, sheet.getLastRow()+1);
}

/**
 * Return an array containing the list of table heading cells taken from row 1 in the given sheet
 *
 * Return {array} Array containing the heading cell values, which may be empty if there were no values in row 1
 */
function getTableHeaders(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol > 0) {
    var range = sheet.getRange(1, 1, 1, lastCol), values = range.getValues();
    var headers =  values.length > 0 ? values[0] : [];
    while (headers.length > 0 && (headers[headers.length - 1] === "" || typeof headers[headers.length - 1] != "string")) {
      headers.pop();
    }
    return headers;
  } else {
    return [];
  }
}

function matchTableRow_(row, matchValues, useOr) {
  var match = useOr !== true, colMatch, propName, propType, propValue;
  matchValues.forEach(function (toMatch) {
    propName = toMatch.name;
    propType = toMatch.type;
    propValue = toMatch.value;
    if (propType == 'regexp') {
      colMatch = propValue.test(''+row[propName]);
    } else {
      colMatch = row[propName] === propValue || (''+row[propName]).trim() === (''+propValue).trim();
    }
    match = useOr === true ? (match || colMatch) : (match && colMatch);
  });
  return match;
}

function lookupInTable(rows, matchValues, useOr) {
  var matches = [], match;
  for (var i = 0; i < rows.length; i++) {
    match = matchTableRow_(rows[i], matchValues, useOr);
    if (match) {
      matches.push(rows[i]);
    }
  }
  return matches;
}

module.exports = {
  getRows: getTableRows,
  setValues: setTableRowValues,
  appendRows: appendTableRowValues,
  getHeaders: getTableHeaders,
  lookupInTable: lookupInTable
};