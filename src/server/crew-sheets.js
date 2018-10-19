/**
 * Return a full list of the remaining entry placeholders on the given sheet
 *
 * @param sheet Sheet object representing the sheet to look for entry positions
 * @param hasHeaderRow {boolean} Whether or not the list of entries has a header row
 * @param startColumn {number} Column to start looking for entry data in - should contain index numbers, 1-based
 * @param numSearchColumns {number} Number of columns following the index column to search for empty values. Defaults
 * to 1.
 *
 * @return {Array} Array of three-element arrays with the first element of each member representing the index number,
 * the second the row number and the second the number of rows available before the next index position (or end of the
 * sheet)
 */
function getAvailableRows(sheet, hasHeaderRow, startColumn, numSearchColumns) {
  numSearchColumns = numSearchColumns || 1;
  var startRow = hasHeaderRow === true ? 2 : 1, lastRow = sheet.getLastRow(), numRows = lastRow - startRow + 1;
  if (numRows < 1) {
    return [];
  }
  var range = sheet.getRange(startRow, startColumn, numRows, numSearchColumns + 1),
    values = range.getValues(), rows = [], currEntry = null;
  for (var i=0; i<values.length; i++) {
    var hasIndex = ('' + values[i][0]).trim() !== '',
      hasContent = !values[i].slice(1).every(function(item) { return item === ''; });
    if (hasIndex) {
      if (currEntry !== null) {
        rows.push(currEntry);
      }
      if (hasContent) {
        currEntry = null;
      } else {
        currEntry = [values[i][0], i+2, 1];
      }
    } else {
      if (hasContent) {
        currEntry = null;
      }
      if (currEntry !== null) {
        currEntry[2] ++;
      }
    }
  }
  // There may still be an entry in the buffer
  if (currEntry !== null) {
    rows.push(currEntry);
  }
  return rows;
}

function groupRowsByIndex(rows, indexPropertyName) {
  var groups = [], currentGroup = [];
  for (var i=0; i<rows.length; i++) {
    if (rows[i][indexPropertyName] !== '' && rows[i][indexPropertyName] !== undefined) {
      groups.push(currentGroup);
      currentGroup = [];
    }
    currentGroup.push(rows[i]);
  }
  groups.push(currentGroup);
  return groups.filter(function(group) { return group.length > 0; });
}

exports.getAvailableRows = getAvailableRows;
exports.groupRows = groupRowsByIndex;