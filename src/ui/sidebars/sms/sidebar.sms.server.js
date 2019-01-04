/* jshint camelcase: false */

var sms = require('../../../server/sms');
var uiUtils = require('../../../server/libs/lib.utils.ui.server');

exports.sidebar_sendSms_get = function sidebar_sendSms_get(spreadsheetId) {
    var documentProperties = PropertiesService.getDocumentProperties();
    var shortName = documentProperties.getProperty('raceShortName') || '';
    var resultsShortUrl = documentProperties.getProperty('resultsShortUrl') || '';
    return uiUtils.jsonSafeObj({
        'raceShortName': shortName,
        'resultsShortUrl': resultsShortUrl,
        'race': 'current'
    });
};

exports.sidebar_sendSms_send = function sidebar_sendSms_set(spreadsheetId, formData) {
    var spreadsheet = SpreadsheetApp.openById(spreadsheetId), data = uiUtils.objFromJson(formData);
    var documentProperties = PropertiesService.getDocumentProperties();
    var smsOptions = {
        'raceShortName': formData.raceShortName,
        'resultsShortUrl': formData.resultsShortUrl
    };
    documentProperties.setProperties(smsOptions);
    var results, sheetName;
    if (formData.race === 'all') {
        sheetName = 'ALL';
        results = sms.sendAllResultsSms(spreadsheet, null, smsOptions);
    } else {
        results = sms.sendRaceResultsSms(spreadsheet, null, smsOptions);
        sheetName = spreadsheet.getActiveSheet().getName();
    }
    return {
        sheetName: sheetName,
        messages: results
    };
};