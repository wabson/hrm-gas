var raceChoices = new SelectListData({
    options: [
        ['current', 'Current Sheet'],
        ['all', 'All Sheets']
    ]
});

var SendSmsSidebar = BaseComponent.extend({

    initialize: function(options) {
        this.spreadsheetId = options.spreadsheetId;
    },

    render: function() {
        var dispatcher = _.extend({}, Backbone.Events);
        new FormDialog({
            el: this.$('#sms-form-sidebar'),
            spreadsheetId: spreadSheetId,
            dispatcher: dispatcher,
            formFields: [
                [
                    new FormField({
                        type: 'text',
                        label: 'Race Short Name',
                        name: 'raceShortName',
                        required: true
                    }),
                    new FormSelectField({
                        fieldId: 'race',
                        label: 'Select Race',
                        selectList: new SelectList({
                            id: 'select-race',
                            name: 'race',
                            model: raceChoices,
                            placeholder: 'Select',
                            required: true
                        })
                    })
                ],
                [
                    new FormField({
                        type: 'text',
                        label: 'Results URL',
                        name: 'resultsShortUrl',
                        required: true
                    })
                ]
            ],
            buttons: [
                new FormButton({
                    type: 'submit',
                    text: 'Send',
                    className: 'action'
                })
            ],
            dataGetFn: 'sidebar_sendSms_get',
            dataSetFn: 'sidebar_sendSms_send',
            closeOnSubmit: false,
            clearOnSubmit: false
        }).render();

        dispatcher.bind('submitSuccess', function(data) {
            document.getElementById('sms-form-result').innerHTML += '<p>Sent SMS results to ' + data.messages.length +
                ' recipients in ' + data.sheetName + '</p>';
        });
    }

});