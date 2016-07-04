describe('Forms components', function() {

    var MyBlock = Backbone.View.extend({});
    var MockInput = Backbone.View.extend({
        initialize: function(options) {
            this.options = options || {};
        },
        render: function() {
            this.el.innerHTML =
                _.template('<input type="<%=type%>" name="<%=name%>" value="<%=value%>" />')(this.options);
            return this;
        }
    });
    var MockSelect = Backbone.View.extend({
        initialize: function(options) {
            this.options = options || {};
        },
        render: function() {
            this.el.innerHTML =
                _.template('<select name="<%=name%>">'+
                    _.map(this.options.options, function(opt) {return '<option>' + opt + '</option>'; }).join('') +
                    '</select>')(this.options);
            return this;
        }
    });
    var MockButton = Backbone.View.extend({
        initialize: function(options) {
            this.options = options || {};
        },
        render: function() {
            this.el.innerHTML =
                _.template('<button type="<%=type%>" name="<%=name%>"><%=value%></button>')(this.options);
            return this;
        }
    });

    describe('Data form', function() {
        it('should exist', function() {
            expect(DataForm).toBeDefined();
        });
        it('should render a form element', function() {
            this.view = new DataForm({});
            expect(this.view.el).toEqual('form');
        });
        it('should render the form blocks specified', function() {
            this.view = new DataForm({
                blocks: [new MyBlock({id: 'a'}), new MyBlock({id: 'b'}), new MyBlock({id: 'c'})]
            });
            this.view.render();
            expect(this.view.el).toContainHtml('<div id="a"></div><div id="b"></div><div id="c"></div>');
        });

        describe('Form actions', function() {

            beforeEach(function() {
                this.dispatcher = _.extend({}, Backbone.Events);
                this.dispatcher.on('submit', _.bind(function(payload) {
                    this.submitPayload = payload;
                }, this));
                this.resetCount = 0;
                this.dispatcher.on('reset', _.bind(function(payload) {
                    this.resetCount ++;
                }, this));
                this.view = new DataForm({
                    dispatcher: this.dispatcher,
                    blocks: [
                        new MockInput({
                            type: 'text',
                            name: 'field1',
                            value: 'aaa'
                        }),
                        new MockInput({
                            type: 'hidden',
                            name: 'field2',
                            value: 'bbb'
                        }),
                        new MockSelect({
                            name: 'field3',
                            options: ['opt1', 'opt2', 'opt3 ']
                        }),
                        new MockButton({
                            type: 'submit',
                            name: 'action',
                            value: 'Submit'
                        }),
                        new MockButton({
                            type: 'reset',
                            name: 'action',
                            value: 'Reset'
                        })
                    ]
                });
                this.view.render();
            });

            it('should render submit elements enabled by default', function() {
                expect(this.view.el.querySelector('button[type=submit]')).not.toBeDisabled();
            });

            it('should fire a dispatcher event when the form is submitted', function() {
                this.view.$el.submit();
                expect(this.submitPayload).toBeDefined();
                expect(this.submitPayload.data).toBeDefined();
            });

            it('should disable submit button when the form is submitted', function() {
                this.view.$el.submit();
                expect(this.view.el.querySelector('button[type=submit]')).toBeDisabled();
            });

            it('should include current field values with submit event', function() {
                this.view.render();
                this.view.$el.submit();
                expect(this.submitPayload).toBeDefined();
                expect(this.submitPayload.data).toBeDefined();
                expect(this.submitPayload.data.field1).toBe('aaa');
                expect(this.submitPayload.data.field2).toBe('bbb');
                expect(this.submitPayload.data.field3).toBe('opt1');
            });

            it('should clear fields after a successful submit', function() {
                var select = this.view.el.querySelector('select[name=field3]');
                select.selectedIndex = 1;
                this.view.$el.submit();
                this.dispatcher.trigger('submitSuccess');
                expect(this.view.$el.find('input[name=field1]').val()).toBe('');
                expect(this.view.$el.find('input[name=field2]').val()).toBe('bbb');
                expect(select.selectedIndex).toBe(0);
            });

            it('should re-enable submit button after a successful submit', function() {
                this.view.$el.submit();
                this.dispatcher.trigger('submitSuccess');
                expect(this.view.el.querySelector('button[type=submit]')).not.toBeDisabled();
            });

            it('should not clear fields after a failed submit', function() {
                var select = this.view.el.querySelector('select[name=field3]');
                select.selectedIndex = 1;
                this.view.$el.submit();
                this.dispatcher.trigger('submitFailure');
                expect(this.view.$el.find('input[name=field1]').val()).toBe('aaa');
                expect(this.view.$el.find('input[name=field2]').val()).toBe('bbb');
                expect(select.selectedIndex).toBe(1);
            });

            it('should re-enable submit button after a failed submit', function() {
                this.view.$el.submit();
                this.dispatcher.trigger('submitFailure');
                expect(this.view.el.querySelector('button[type=submit]')).not.toBeDisabled();
            });

            it('should reset text form fields when reset button clicked', function() {
                var e = jQuery.Event('click', { target: this.view.$el.find('button[type=reset]')[0] } );
                this.view.$el.trigger(e);
                expect(this.view.$el.find('input[name=field1]').val()).toBe('');
            });

            it('should reset select fields when reset button clicked', function() {
                var select = this.view.el.querySelector('select[name=field3]');
                select.selectedIndex = 1;
                expect(select.selectedIndex).toBe(1);
                var e = jQuery.Event('click', { target: this.view.$el.find('button[type=reset]')[0] } );
                this.view.$el.trigger(e);
                expect(select.selectedIndex).toBe(0);
            });

            it('should not reset hidden form fields when reset button clicked', function() {
                var e = jQuery.Event('click', { target: this.view.$el.find('button[type=reset]')[0] } );
                this.view.$el.trigger(e);
                expect(this.view.$el.find('input[name=field2]').val()).toBe('bbb');
            });

            it('should focus on the first text form field when reset button clicked', function() {
                document.body.appendChild(this.view.el);
                var e = jQuery.Event('click', { target: this.view.$el.find('button[type=reset]')[0] } );
                this.view.$el.trigger(e);
                expect(this.view.$el.find('input[name=field1]')).toBeFocused();
                document.body.removeChild(this.view.el);
            });

            it('should fire dispatcher event when reset button clicked', function() {
                var e = jQuery.Event('click', { target: this.view.$el.find('button[type=reset]')[0] } );
                this.view.$el.trigger(e);
                expect(this.resetCount).toBe(1);
            });

            it('should fire dispatcher event when reset() method called', function() {
                this.view.reset();
                expect(this.resetCount).toBe(1);
            });

            it('should not fire dispatcher event when reset() method called with trigger=false', function() {
                this.view.reset(false);
                expect(this.resetCount).toBe(0);
            });

            it('should set field contents from values specified', function() {
                var formValues = {
                    field1: 'abc',
                    field2: 'xyz',
                    field3: 'opt3'
                };
                this.view.setFormData({values: formValues});
                expect(this.view.el.querySelector('input[name=field1]').value).toBe('abc');
                expect(this.view.el.querySelector('input[name=field2]').value).toBe('xyz');
                expect(this.view.el.querySelector('select[name=field3]').value).toBe('opt3');
            });

            it('should set fields disabled when setFormFieldsDisabled(true) called', function() {
                this.view.setFormFieldsDisabled(true);
                expect(this.view.el.querySelector('input[name=field1]')).toBeDisabled();
                expect(this.view.el.querySelector('select[name=field3]')).toBeDisabled();
            });

            it('should set fields enabled when setFormFieldsDisabled(true) called', function() {
                this.view.setFormFieldsDisabled(false);
                expect(this.view.el.querySelector('input[name=field1]')).not.toBeDisabled();
                expect(this.view.el.querySelector('select[name=field3]')).not.toBeDisabled();
            });

        });

    });

    describe('Form block', function() {

        it('should exist', function () {
            expect(FormBlock).toBeDefined();
        });

        it('should render a div element with the correct classes', function () {
            var block = new FormBlock({}).render();
            expect(block.el).toEqual('div.block.form-group');
        });

        it('should render configured form controls', function () {
            var block = new FormBlock({
                controls: [
                    new MockInput({
                        type: 'text',
                        name: 'field1',
                        value: 'aaa'
                    }),
                    new MockInput({
                        type: 'hidden',
                        name: 'field2',
                        value: 'bbb'
                    })
                ]
            }).render();
            expect(block.el).toContainElement('input[name=field1]');
            expect(block.el).toContainElement('input[name=field2]');
        });

        it('should return table controls', function () {
            var table = new Backbone.View({
                tagName: 'table'
            });
            var block = new FormBlock({
                controls: [
                    new MockInput({
                        type: 'text',
                        name: 'field1',
                        value: 'aaa'
                    }),
                    new MockInput({
                        type: 'hidden',
                        name: 'field2',
                        value: 'bbb'
                    }),
                    table
                ]
            }).render();
            var tableControls = block.getTableControls();
            expect(tableControls.length).toBe(1);
            expect(tableControls[0]).toBe(table);
        });
    });

    describe('Form fieldset', function() {

        it('should exist', function() {
            expect(FormFieldSet).toBeDefined();
        });

        it('should render a fieldset element with the correct classes', function() {
            var block = new FormFieldSet({}).render();
            expect(block.el).toEqual('fieldset.block');
        });

        it('should render configured form controls', function() {
            var block = new FormFieldSet({
                controls: [
                    new MockInput({
                        type: 'text',
                        name: 'field1',
                        value: 'aaa'
                    }),
                    new MockInput({
                        type: 'hidden',
                        name: 'field2',
                        value: 'bbb'
                    })
                ]
            }).render();
            expect(block.el).toContainElement('input[name=field1]');
            expect(block.el).toContainElement('input[name=field2]');
        });

        it('should render a label before the form controls', function() {
            var block = new FormFieldSet({
                label: 'My Label',
                controls: [
                    new MockInput({
                        type: 'text',
                        name: 'field1',
                        value: 'aaa'
                    }),
                    new MockInput({
                        type: 'hidden',
                        name: 'field2',
                        value: 'bbb'
                    })
                ]
            }).render();
            expect(block.el.children[0]).toEqual('label');
            expect(block.el.children[0]).toContainText('My Label');
        });

    });

    describe('Form dialog', function() {

        it('should exist', function () {
            expect(FormDialog).toBeDefined();
        });

        it('should render a div element', function () {
            var block = new FormDialog({}).render();
            expect(block.el).toEqual('div');
        });

        it('should initialise the component from the passed-in options', function() {
            var dialog = new FormDialog({
                spreadsheetId: '123456'
            }).render();
            expect(dialog.spreadsheetId).toBe('123456');
        });

        it('should create a new dispatcher if not passed in', function() {
            var dialog = new FormDialog({
                spreadsheetId: '123456'
            }).render();
            expect(dialog.dispatcher).toBeDefined();
        });

        describe('Form rendering', function() {

            it('should render disabled form fields and buttons initially', function() {
                google.script.run.doNothing = function() {
                };
                var dialog = new FormDialog({
                    spreadsheetId: '123456',
                    formFields: [
                        [
                            new MockInput({
                                type: 'text',
                                name: 'field1',
                                value: ''
                            }),
                            new MockInput({
                                type: 'hidden',
                                name: 'field2',
                                value: ''
                            }),
                            new MockButton({
                                type: 'submit',
                                name: 'action',
                                value: 'Submit'
                            })
                        ]
                    ],
                    dataGetFn: 'doNothing'
                }).render();
                expect(dialog.el.querySelector('input[name=field1]')).toBeDisabled();
                expect(dialog.el.querySelector('button[type=submit]')).toBeDisabled();
            });

            it('should populate form data initially via a get function', function() {
                google.script.run.addData('testData', {
                    field1: 'Bob',
                    field2: 'Anne'
                });
                var dialog = new FormDialog({
                    spreadsheetId: '123456',
                    formFields: [
                        [
                            new MockInput({
                                type: 'text',
                                name: 'field1',
                                value: ''
                            }),
                            new MockInput({
                                type: 'hidden',
                                name: 'field2',
                                value: ''
                            }),
                            new MockButton({
                                type: 'submit',
                                name: 'action',
                                value: 'Submit'
                            })
                        ]
                    ],
                    dataGetFn: 'testData'
                }).render();
                expect(dialog.el.querySelector('input[name=field1]')).toBeDefined();
                expect(dialog.el.querySelector('input[name=field1]').value).toBe('Bob');
                expect(dialog.el.querySelector('input[name=field2]').value).toBe('Anne');
            });

            it('should disable form fields and indicate an error when the get function has a problem', function() {
                google.script.run.addError('doError', { message: 'Error text 777' });
                var dialog = new FormDialog({
                    spreadsheetId: '123456',
                    formFields: [
                        [
                            new MockInput({
                                type: 'text',
                                name: 'field1',
                                value: ''
                            }),
                            new MockInput({
                                type: 'hidden',
                                name: 'field2',
                                value: ''
                            }),
                            new MockButton({
                                type: 'submit',
                                name: 'action',
                                value: 'Submit'
                            })
                        ]
                    ],
                    dataGetFn: 'doError'
                }).render();
                expect(dialog.el.querySelector('input[name=field1]')).toBeDisabled();
                expect(dialog.el.querySelector('button[type=submit]')).toBeDisabled();
                var messagesEl = dialog.el.getElementsByClassName('messages');
                expect(messagesEl.length).toBe(1);
                expect(messagesEl[0].innerText).toBe('Sorry, an error occurred: Error text 777');
            });

        });

        describe('Form submission', function() {

            it('should send form data as expected when form submitted', function() {
                var dialog = new FormDialog({
                    spreadsheetId: '123456',
                    formFields: [
                        [
                            new MockInput({
                                type: 'text',
                                name: 'field1',
                                value: 'abc'
                            }),
                            new MockInput({
                                type: 'hidden',
                                name: 'field2',
                                value: 'xyz'
                            })
                        ]
                    ],
                    dataSetFn: 'setTestData'
                }).render();
                var submittedData, submittedSpreadsheetId;
                google.script.run.setTestData = function(spreadsheetId, data) {
                    submittedSpreadsheetId = spreadsheetId;
                    submittedData = data;
                };
                dialog.$el.find('form').submit();
                expect(submittedData).toBeDefined();
                expect(submittedData.field1).toBe('abc');
                expect(submittedData.field2).toBe('xyz');
            });

            it('should disable submit buttons when form submitted', function() {
                google.script.run.doNothing = function() {
                };
                var dialog = new FormDialog({
                    spreadsheetId: '123456',
                    formFields: [
                        [
                            new MockInput({
                                type: 'text',
                                name: 'field1',
                                value: ''
                            }),
                            new MockInput({
                                type: 'hidden',
                                name: 'field2',
                                value: ''
                            }),
                            new MockButton({
                                type: 'submit',
                                name: 'action',
                                value: 'Submit'
                            }),
                            new MockButton({
                                type: 'reset',
                                name: 'action',
                                value: 'Reset'
                            })
                        ]
                    ],
                    dataSetFn: 'doNothing'
                }).render();
                // var e = jQuery.Event('submit', { target: dialog.$el.find('form')[0] } );
                // dialog.$el.trigger(e);
                dialog.$el.find('form').submit();
                expect(dialog.el.querySelector('button[type=submit]')).toBeDisabled();
                expect(dialog.el.querySelector('button[type=reset]')).not.toBeDisabled();
            });

            it('should re-enable submit buttons if an error occurred submmitting the form', function() {
                google.script.run.addError('doError', { message: 'Error text 888' });
                var dialog = new FormDialog({
                    spreadsheetId: '123456',
                    formFields: [
                        [
                            new MockInput({
                                type: 'text',
                                name: 'field1',
                                value: ''
                            }),
                            new MockInput({
                                type: 'hidden',
                                name: 'field2',
                                value: ''
                            }),
                            new MockButton({
                                type: 'submit',
                                name: 'action',
                                value: 'Submit'
                            }),
                            new MockButton({
                                type: 'reset',
                                name: 'action',
                                value: 'Reset'
                            })
                        ]
                    ],
                    dataSetFn: 'doError'
                }).render();
                dialog.$el.find('form').submit();
                expect(dialog.el.querySelector('button[type=submit]')).not.toBeDisabled();
                expect(dialog.el.querySelector('button[type=reset]')).not.toBeDisabled();
                var messagesEl = dialog.el.getElementsByClassName('messages');
                expect(messagesEl.length).toBe(1);
                expect(messagesEl[0].innerText).toBe('Sorry, an error occurred: Error text 888');
            });

        });

    });

});