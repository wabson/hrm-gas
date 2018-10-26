var getPublicProperty = function getPublicProperty(spreadsheetId, propertyName, defaultValue) {
  try {
    return Drive.Properties.get(spreadsheetId, propertyName, {
      visibility: 'PUBLIC'
    });
  } catch(e) {
    return { value: defaultValue };
  }
};

exports.getPublicProperty = getPublicProperty;

function getDriveProperties(spreadsheetId) {
  var driveResp = Drive.Properties.list(spreadsheetId), propertyMap = {};
  driveResp.items.forEach(function(p) {
    propertyMap[p.key] = p.value;
  });
  return propertyMap;
}

exports.getDriveProperties = getDriveProperties;

exports.savePublicProperty = function (spreadsheetId, propertyName, value) {
  try {
    Drive.Properties.insert({
      key: propertyName,
      value: value,
      visibility: 'PUBLIC'
    }, spreadsheetId);
  }
  catch (ex) {
  }
};

function buildCustomPropertySearchTerm(propertyName, propertyValue) {
  return 'properties has { key="' + propertyName + '" and value="' + propertyValue + '" and visibility="PUBLIC" }';
}

exports.searchByCustomProperty = function searchByCustomProperty(propertyValues) {
  var searchTerms = [
    'mimeType = "application/vnd.google-apps.spreadsheet"',
    'trashed=false'
  ];
  var customPropertySearchTerms = Object.keys(propertyValues).map(function(propName) {
    return buildCustomPropertySearchTerm(propName, propertyValues[propName]);
  });
  var query = searchTerms.concat(customPropertySearchTerms).join(' and ');
  var filesResponse, files = [];
  var pageToken;
  do {
    filesResponse = Drive.Files.list({
      q: query,
      maxResults: 100,
      pageToken: pageToken,
      orderBy: 'modifiedDate desc'
    }); //projection: 'FULL'
    if (filesResponse.items && filesResponse.items.length > 0) {
      for (var i = 0; i < filesResponse.items.length; i++) {
        files.push(filesResponse.items[i]);
      }
    }
    pageToken = filesResponse.nextPageToken;
  } while (pageToken);
  return files;
};