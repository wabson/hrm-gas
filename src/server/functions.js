var importModule = require('./import');

exports.addEntrySets = function(ssId, entrySets) {
  return importModule.importEntrySets(SpreadsheetApp.openById(ssId), entrySets);
};