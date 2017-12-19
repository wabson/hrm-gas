var RaceDetailsDialog = BaseComponent.extend({

    initialize: function(options) {
        this.spreadsheetId = options.spreadsheetId;
    },

    render: function() {
        var regionListData = new SelectListData({
            options: []
        });
        var dispatcher = _.extend({}, Backbone.Events);
        new FormDialog({
            el: this.$('#edit-form-dialog'),
            spreadsheetId: spreadSheetId,
            dispatcher: dispatcher,
            formFields: [
                [
                    new FormField({
                        type: 'text',
                        label: 'Race Name',
                        name: 'raceName',
                        required: true
                    }),
                    new FormSelectField({
                        fieldId: 'region',
                        label: 'Race Region',
                        selectList: new SelectList({
                            id: 'select-region',
                            name: 'raceRegion',
                            model: haslerRegionsData,
                            placeholder: 'Select',
                            required: true
                        })
                    })
                ],
                [
                    new FormField({
                        type: 'date',
                        label: 'Race Date',
                        name: 'raceDate',
                        required: true
                    }),
                    new FormField({
                        type: 'checkbox',
                        label: 'Re-apply sheet validation',
                        name: 'setValidation',
                        value: 'y'
                    })
                ],
                {
                    label: 'Race Fees (£)',
                    fields: [[
                        new FormField({
                            type: 'number',
                            label: 'Senior',
                            name: 'entrySenior',
                            placeholder: '0.00',
                            step: '0.01'
                        }),
                        new FormField({
                            type: 'number',
                            label: 'Junior',
                            name: 'entryJunior',
                            placeholder: '0.00',
                            step: '0.01'
                        }),
                        new FormField({
                            type: 'number',
                            label: 'Lightning',
                            name: 'entryLightning',
                            placeholder: '0.00',
                            step: '0.01'
                        })
                    ]]
                },
                {
                    label: 'Late Fees (£)',
                    fields: [[
                        new FormField({
                            type: 'number',
                            label: 'Senior',
                            name: 'entrySeniorLate',
                            placeholder: '0.00',
                            step: '0.01'
                        }),
                        new FormField({
                            type: 'number',
                            label: 'Junior',
                            name: 'entryJuniorLate',
                            placeholder: '0.00',
                            step: '0.01'
                        }),
                        new FormField({
                            type: 'number',
                            label: 'Lightning',
                            name: 'entryLightningLate',
                            placeholder: '0.00',
                            step: '0.01'
                        })
                    ]]
                }
            ],
            buttons: [
                new FormButton({
                    type: 'submit',
                    text: 'Save',
                    className: 'action'
                }),
                new FormButton({
                    type: 'button',
                    text: 'Cancel'
                })
            ],
            dataGetFn: 'dialog_raceDetails_get',
            dataSetFn: 'dialog_raceDetails_set'
        }).render();

        dispatcher.bind('formData', function(payload) {
            console.log('Form data loaded', payload);
            $('select[name="raceRegion"]').prop('disabled', payload.data.raceType !== 'HRM');
        });
    }

});