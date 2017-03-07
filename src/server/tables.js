/**
 * Get a complete list of all the rows in the given sheet as an array of objects
 *
 * Return {array} Array containing each row as an object, with properties named according to the table heading name. Array will be empty if no data rows are present.
 */
exports.getRows = function getTableRows(sheet, convertToLowerCase) {
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
};