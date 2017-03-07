exports.lookupNationalPhoneNumber = function lookupNationalPhoneNumber(phoneNumber) {
    var lookupUrl = 'https://lookups.twilio.com/v1/PhoneNumbers/' + phoneNumber + '?CountryCode=GB';
    var options = {
        method: 'get',
        muteHttpExceptions: true
    };
    var config = Configuration.getCurrent();
    if (!config.integrations || !config.integrations.twilio) {
        throw 'Twilio configuration could not be found';
    }
    options.headers = {
        'Authorization': 'Basic ' + Utilities.base64Encode(
            config.integrations.twilio.accountSid + ':' +config.integrations.twilio.authToke
        )
    };
    return UrlFetchApp.fetch(lookupUrl, options);
};

exports.sendSms = function sendSms(toNumber, messageBody) {
    var config = Configuration.getCurrent();
    if (!config.integrations || !config.integrations.twilio) {
        throw 'Twilio configuration could not be found';
    }
    var messagesUrl = 'https://api.twilio.com/2010-04-01/Accounts/' +
        config.integrations.twilio.accountSid +
        '/Messages.json';
    var payload = {
        'To': toNumber,
        'Body' : messageBody,
        'From' : config.integrations.twilio.numbers[0]
    };
    var options = {
        method : 'post',
        payload: payload
    };
    options.headers = {
        'Authorization': 'Basic ' + Utilities.base64Encode(
            config.integrations.twilio.accountSid + ':' + config.integrations.twilio.authToken
        )
    };
    var response = UrlFetchApp.fetch(messagesUrl, options);
    var data = JSON.parse(response);
    Logger.log(data);
    return data;
};