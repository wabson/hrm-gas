/**
 * Get a complete list of all the rows in the given sheet as an array of objects
 *
 * Return {array} Array containing each row as an object, with properties named according to the table heading name. Array will be empty if no data rows are present.
 */
function getTableRows(sheet, convertToLowerCase, skipCalculatedValues) {
  convertToLowerCase = typeof convertToLowerCase !== "undefined" ? convertToLowerCase : false;
  skipCalculatedValues = typeof skipCalculatedValues !== "undefined" ? skipCalculatedValues : false;
  if (sheet.getLastRow() < 2) {
    return [];
  }
  var range = sheet.getDataRange(), values = range.getValues(),
    formulas = skipCalculatedValues === true ? range.getFormulas() : null,
    headers = values[0], rows = [], row = null, value;
  for (var i=1; i<values.length; i++) {
    row = {};
    for (var j=0; j<headers.length; j++) {
      value = values[i][j];
      if (skipCalculatedValues === true && typeof formulas[i][j] === 'string' && formulas[i][j].length > 0) {
        value = '';
      }
      if (headers[j] && typeof headers[j] === "string") {
        row[convertToLowerCase ? headers[j].toLowerCase() : headers[j]] = value;
      }
    }
    rows.push(row);
  }
  return rows;
}

function setTableRangeValues(dstSheet, values, startRow) { // TODO Exclude boat numbers
  if (values.length === 0) {
    return;
  }
  var headers = getTableHeaders(dstSheet);
  var columnsWithValues = values.reduce(function(accumulator, currentRow) {
    return accumulator.concat(Object.keys(currentRow).filter(function(colName) {
      return currentRow[colName] !== null && currentRow[colName] !== '';
    }));
  }, []).filter(function(item, pos, items) { // return only unique values
    return items.indexOf(item) >= pos;
  });
  var columnPositionsWithValues = columnsWithValues.map(function(colName) {
    return headers.indexOf(colName);
  });
  var columnRanges = getRangeBoundaries(columnPositionsWithValues);
  var columnIndexes = columnRanges.map(function(range) {
    var rangeLength = range[1] - range[0] + 1;
    return Array.apply(null, Array(rangeLength)).map(function(item, pos) { return range[0] + pos });
  });
  var rangeColumnHeadings = columnIndexes.map(function(rangeIndexes) {
    return rangeIndexes.map(function(i) { return headers[i]; });
  });
  var rangesValues = rangeColumnHeadings.map(function(headings) {
    return values.map(function(rowValues) {
      return headings.map(function(heading) {
        return rowValues[heading];
      });
    });
  });
  var dstRanges = columnRanges.map(function(range) {
    return dstSheet.getRange(startRow, range[0] + 1, values.length, range[1] - range[0] + 1);
  });
  dstRanges.forEach(function(range, index) {
      range.setValues(rangesValues[index]);
  });
}

function getRangeValues(columns, ranges, values) {
  return ranges.map(function(range) {
    return values.map(function(row) {
      return row[columns[range]];
    });
  });
}

function sortNumber(a, b) {
  return a - b;
}

function getRangeBoundaries(positions) {
  positions.sort(sortNumber);
  var currentPos, lastPos = -1, currentRangeStart = -1, boundaries = [];
  for (var i=0; i<positions.length; i++) {
    currentPos = positions[i];
    if (currentRangeStart === -1) {
      currentRangeStart = currentPos;
    } else if (currentPos > lastPos + 1) {
      boundaries.push([currentRangeStart, lastPos]);
      currentRangeStart = currentPos;
    }
    lastPos = currentPos;
  }
  if (currentRangeStart > -1 && lastPos > -1) {
    boundaries.push([currentRangeStart, lastPos]);
  }
  return boundaries;
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
  setRangeValues: setTableRangeValues,
  appendRows: appendTableRowValues,
  getHeaders: getTableHeaders,
  lookupInTable: lookupInTable
};