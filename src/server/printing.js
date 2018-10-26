var renditions = require('./renditions');

var printableResultColumnNames = ["Number", "Surname", "First name", "Club", "Class", "Div", "Elapsed", "Posn"];
var printableResultColumnNamesHasler = ["Number", "Surname", "First name", "Club", "Class", "Div", "Elapsed", "Posn", "P/D", "Points"];
var printableEntriesColumnNames = ["Number", "Surname", "First name", "BCU Number", "Expiry", "Club", "Class", "Div", "Due", "Paid"];

exports.updatePrintableEntries = function createPrintableEntries(sourceSS, destSS) {
  return renditions.createRaceSheets(sourceSS, destSS, printableEntriesColumnNames, null, false);
};

/**
 * @public
 * @param ss
 */
exports.createPrintableEntries = function createPrintableEntries(ss) {
  var ssName = ss.getName() + ' (Printable Entries)',
    destSS = renditions.create(ss, 'printableEntries', ssName);
  return exports.updatePrintableEntries(ss, destSS);
};

exports.createPrintableClubEntries = function createPrintableClubEntries(ss) {
  var ssName = ss.getName() + ' (Club Entries)',
    destSS = renditions.create(ss, 'printableClubEntries', ssName);
  return renditions.createGroupSheets(ss, destSS, 'Club', printableEntriesColumnNames, null);
};

exports.updatePrintableResults = function createPrintableResults(sourceSS, destSS) {
  var isHaslerRace = sourceSS.getSheetByName('Div1') !== null,
    columnNames = isHaslerRace ? printableResultColumnNamesHasler : printableResultColumnNames;
  return renditions.createRaceSheets(sourceSS, destSS, columnNames, 'Posn', true);
};

/**
 * @public
 * @param ss
 */
exports.createPrintableResults = function createPrintableResults(ss) {
  var ssName = ss.getName() + ' (Printable Results)',
    destSS = renditions.create(ss, 'printableResults', ssName);
  return exports.updatePrintableResults(ss, destSS);
};