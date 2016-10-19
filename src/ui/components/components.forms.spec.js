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

            it('should allow form values to be set programatically', function() {
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
                    ]
                }).render();
                dialog.setFormData({
                    values: {
                        field1: 'Diamond',
                        field2: 'Bob'
                    }
                });
                expect(dialog.el.querySelector('input[name=field1]').value).toBe('Diamond');
                expect(dialog.el.querySelector('input[name=field2]').value).toBe('Bob');
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

    describe('Data table form', function() {

        it('should exist', function () {
            expect(DataTableForm).toBeDefined();
        });

        it('should render a form element', function () {
            var form = new DataTableForm({}).render();
            expect(form.el).toEqual('form');
        });

        it('should render the blocks specified', function () {
            var form = new DataTableForm({
                blocks: [new MyBlock({id: 'a'}), new MyBlock({id: 'b'}), new MyBlock({id: 'c'})]
            }).render();
            expect(form.el).toContainHtml('<div id="a"></div><div id="b"></div><div id="c"></div>');
        });

        it('should render submit buttons disabled by default', function () {
            var form = new DataTableForm({
                blocks: [
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
            }).render();
            expect(form.el).toContain('button[type=submit]');
            expect(form.el.querySelector('button[type=submit]')).toBeDisabled();
        });

        describe('forms with tables present', function() {

            beforeEach(function() {
                this.dispatcher = _.clone(Backbone.Events);
                var data = new TableData({
                    columns: ['Name', 'Age', 'Gender'],
                    values: [
                        {
                            'Name': 'Bob',
                            'Age': 32,
                            'Gender': 'M',
                            'Eyes': 'Blue'
                        },
                        {
                            'Name': 'Christine',
                            'Age': 37,
                            'Gender': 'F',
                            'Eyes': 'Green'
                        }
                    ]
                });
                var tableView = new DataTable({
                    id: 'table1',
                    dispatcher: this.dispatcher,
                    data: data,
                    inputType: 'checkbox'
                });
                this.formView = new DataTableForm({
                    dispatcher: this.dispatcher,
                    blocks: [
                        new FormBlock({
                            controls: [
                                tableView
                            ]
                        }),
                        new FormBlock({
                            controls: [
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
                        })
                    ]
                }).render();

            });

            it('should leave submit buttons disabled initially', function() {
                expect(this.formView.getNumTableRowsSelected_()).toBe(0);
                expect(this.formView.el.querySelector('button[type=submit]')).toBeDisabled();

            });

            it('should enable submit buttons when table with valid ID has data selected', function() {
                this.formView.$el.find('input[type="checkbox"]:first').prop('checked', true).trigger('change');
                expect(this.formView.getNumTableRowsSelected_()).toBe(1);
                expect(this.formView.el.querySelector('button[type=submit]')).not.toBeDisabled();

            });

            it('should clear table data when reset button clicked', function() {
                this.formView.$el.find('input[type="checkbox"]:first').prop('checked', true).trigger('change');
                expect(this.formView.$el.find('input[type="checkbox"]:first')[0]).toBeChecked();
                var e = jQuery.Event('click', { target: this.formView.$el.find('button[type=reset]')[0] } );
                this.formView.$el.trigger(e);
                expect(this.formView.$el.find('input[type="checkbox"]:first')[0]).not.toBeChecked();

            });

            it('should disable submit buttons during submit', function() {
                this.formView.$el.find('input[type="checkbox"]:first').prop('checked', true).trigger('change');
                expect(this.formView.$el.find('input[type="checkbox"]:first')[0]).toBeChecked();
                this.formView.$el.submit();
                expect(this.formView.el.querySelector('button[type=submit]')).toBeDisabled();

            });

            it('should clear table data after submit', function() {
                this.formView.$el.find('input[type="checkbox"]:first').prop('checked', true).trigger('change');
                expect(this.formView.$el.find('input[type="checkbox"]:first')[0]).toBeChecked();
                this.dispatcher.trigger('submitSuccess', {});
                expect(this.formView.$el.find('input[type="checkbox"]:first')[0]).not.toBeChecked();

            });

        });

    });

    describe('Form button', function() {

        it('should exist', function () {
            expect(FormButton).toBeDefined();
        });

        it('should render a button element', function () {
            var form = new FormButton({}).render();
            expect(form.el).toEqual('button');
        });

        it('should enable the button initially if not specified otherwise', function () {
            var form = new FormButton({}).render();
            expect(form.$el.prop('disabled')).toBe(false);
        });

        it('should disable the button if the options specify this', function () {
            var form = new FormButton({
                disabled: true
            }).render();
            expect(form.$el.prop('disabled')).toBe(true);
        });

        it('should render a submit button by default', function () {
            var form = new FormButton({}).render();
            expect(form.$el.attr('type')).toBe('submit');
        });

        it('should render a reset button if the options specify this', function () {
            var form = new FormButton({
                type: 'reset'
            }).render();
            expect(form.$el.attr('type')).toBe('reset');
        });

        it('should render the button text "Submit" by default', function () {
            var form = new FormButton({}).render();
            expect(form.el.innerHTML).toBe('Submit');
        });

        it('should render the supplied button text', function () {
            var form = new FormButton({
                text: 'My Custom Button'
            }).render();
            expect(form.el.innerHTML).toBe('My Custom Button');
        });

    });

    describe('Form select list', function() {

        it('should exist', function () {
            expect(SelectList).toBeDefined();
        });

        it('should render a select element', function () {
            var select = new SelectList({}).render();
            expect(select.el).toEqual('select');
        });

        it('should render options correctly when passed a string list', function () {
            var data = new SelectListData({
                options: [
                    'optionA',
                    'optionB',
                    'optionC'
                ]
            });
            var select = new SelectList({
                model: data
            }).render();
            expect(select.el).toEqual('select');
            expect(select.el.children.length).toBe(3);
            expect(select.el).toContainHtml('<option>optionA</option>');
            expect(select.el).toContainHtml('<option>optionB</option>');
            expect(select.el).toContainHtml('<option>optionC</option>');
        });

        it('should render options correctly when passed a array list with just values', function () {
            var data = new SelectListData({
                options: [
                    ['optionA'],
                    ['optionB'],
                    ['optionC']
                ]
            });
            var select = new SelectList({
                model: data
            }).render();
            expect(select.el).toEqual('select');
            expect(select.el.children.length).toBe(3);
            expect(select.el).toContainHtml('<option value="optionA">optionA</option>');
            expect(select.el).toContainHtml('<option value="optionB">optionB</option>');
            expect(select.el).toContainHtml('<option value="optionC">optionC</option>');
        });

        it('should render options correctly when passed a array list with contents and values', function () {
            var data = new SelectListData({
                options: [
                    ['optionA', 'Option AA'],
                    ['optionB', 'Option BB'],
                    ['optionC', 'Option CC']
                ]
            });
            var select = new SelectList({
                model: data
            }).render();
            expect(select.el).toEqual('select');
            expect(select.el.children.length).toBe(3);
            expect(select.el).toContainHtml('<option value="optionA">Option AA</option>');
            expect(select.el).toContainHtml('<option value="optionB">Option BB</option>');
            expect(select.el).toContainHtml('<option value="optionC">Option CC</option>');
        });

        it('should render options correctly when passed an object list', function () {
            var data = new SelectListData({
                options: [
                    {
                        value: 'optionA',
                        text: 'Option AA'
                    },
                    {
                        value: 'optionB',
                        text: 'Option BB'
                    }
                ]
            });
            var select = new SelectList({
                model: data
            }).render();
            expect(select.el).toEqual('select');
            expect(select.el.children.length).toBe(2);
            expect(select.el).toContainHtml('<option value="optionA">Option AA</option>');
            expect(select.el).toContainHtml('<option value="optionB">Option BB</option>');
        });

        it('should render options correctly when passed an object list with value only', function () {
            var data = new SelectListData({
                options: [
                    {
                        value: 'optionA'
                    },
                    {
                        value: 'optionB'
                    }
                ]
            });
            var select = new SelectList({
                model: data
            }).render();
            expect(select.el).toEqual('select');
            expect(select.el.children.length).toBe(2);
            expect(select.el).toContainHtml('<option value="optionA">optionA</option>');
            expect(select.el).toContainHtml('<option value="optionB">optionB</option>');
        });

        it('should render a placeholder before the options', function () {
            var data = new SelectListData({
                options: [
                    {
                        value: 'optionA',
                        text: 'Option AA'
                    }
                ]
            });
            var select = new SelectList({
                model: data,
                placeholder: 'Select an option'
            }).render();
            expect(select.el).toEqual('select');
            expect(select.el.children.length).toBe(2);
            expect(select.el.children[0].outerHTML).toBe('<option value="">Select an option</option>');
        });

        describe('querying', function() {

            beforeEach(function() {
                var data = new SelectListData({
                    options: [
                        {
                            value: 'optionA',
                            text: 'Option AA'
                        }
                    ]
                });
                this.select = new SelectList({
                    model: data
                }).render();
            });

            it('should return the currently-selected value', function () {
                expect(this.select.getSelectedValue()).toEqual('optionA');
            });

            it('should return the currently-selected text', function () {
                expect(this.select.getSelectedText()).toEqual('Option AA');
            });

        });

    });

    describe('Form field', function() {

        it('should exist', function () {
            expect(FormField).toBeDefined();
        });

        it('should render a span element', function () {
            var field = new FormField({
                type: 'text'
            }).render();
            expect(field.el).toEqual('span');
        });

        it('should throw an exception when type not specified', function () {
            expect(function() {
                new FormField({}).render();
            }).toThrow('Unknown type undefined');
        });

        it('should throw an exception when bad type specified', function () {
            expect(function() {
                new FormField({
                    type: 'dsss'
                }).render();
            }).toThrow('Unknown type dsss');
        });

        describe('field label', function() {

            it('should render a label', function () {
                var field = new FormField({
                    type: 'text'
                }).render();
                expect(field.el).toContainElement('label');
                expect(field.el.querySelector('label').innerHTML).toBe('');
            });

            it('should populate the label with the supplied text', function () {
                var field = new FormField({
                    type: 'text',
                    label: 'Custom Field 123'
                }).render();
                expect(field.el).toContainElement('label');
                expect(field.el.querySelector('label').innerHTML).toBe('Custom Field 123');
            });

        });

        describe('text control', function() {

            it('should render a basic text control', function () {
                var field = new FormField({
                    type: 'text'
                }).render();
                expect(field.el.children[0]).toEqual('label');
                expect(field.el.children[1]).toEqual('input[type=text]');
            });

            it('should link label and input when supplied with an ID', function () {
                var field = new FormField({
                    type: 'text',
                    fieldId: 'abc'
                }).render();
                var inputEl = field.el.querySelector('input'), labelEl = field.el.querySelector('label');
                expect(inputEl.getAttribute('id')).toBe('abc');
                expect(labelEl.getAttribute('for')).toBe('abc');
            });

            it('should link label and input when supplied with a name', function () {
                var field = new FormField({
                    type: 'text',
                    name: 'abc'
                }).render();
                var inputEl = field.el.querySelector('input'), labelEl = field.el.querySelector('label');
                expect(inputEl.getAttribute('id')).toBe('abc');
                expect(labelEl.getAttribute('for')).toBe('abc');
            });

            it('should render a text control with validation', function () {
                var field = new FormField({
                    type: 'text',
                    required: true,
                    pattern: '[0-9]+',
                    title: 'Must be a number'
                }).render();
                var inputEl = field.el.querySelector('input');
                expect(inputEl.hasAttribute('required'));
                expect(inputEl.getAttribute('pattern')).toBe('[0-9]+');
                expect(inputEl.getAttribute('title')).toBe('Must be a number');
            });

        });

        describe('number control', function() {

            it('should render a basic number control', function () {
                var field = new FormField({
                    type: 'number'
                }).render();
                expect(field.el.children[1]).toEqual('input[type=number]');
            });

            it('should render a number control with validation', function () {
                var field = new FormField({
                    type: 'number',
                    required: true,
                    step: '0.1'
                }).render();
                var inputEl = field.el.querySelector('input');
                expect(inputEl.hasAttribute('required'));
                expect(inputEl.getAttribute('step')).toBe('0.1');
            });

        });

        describe('date control', function() {

            it('should render a basic date control', function () {
                var field = new FormField({
                    type: 'date'
                }).render();
                expect(field.el.children[1]).toEqual('input[type=date]');
            });

        });

        describe('checkbox control', function() {

            it('should render a basic checkbox control', function () {
                var field = new FormField({
                    type: 'checkbox'
                }).render();
                expect(field.el.children[0]).toEqual('input[type=checkbox]');
                expect(field.el.children[1]).toEqual('label');
            });

        });

    });

    describe('Select form field', function() {

        it('should exist', function () {
            expect(FormSelectField).toBeDefined();
        });

        describe('rendering', function() {

            beforeEach(function() {
                var data = new SelectListData({
                    options: [
                        {
                            value: 'optionA',
                            text: 'Option AA'
                        }
                    ]
                });
                var select = new SelectList({
                    model: data,
                    placeholder: 'Select an option'
                });
                this.field = new FormSelectField({
                    fieldId: 'my-field',
                    selectList: select
                }).render();
            });

            it('should render a span element', function () {
                expect(this.field.el).toEqual('span');
            });

            it('should render a select control with label', function () {
                expect(this.field.el.children[0]).toEqual('label[for=my-field]');
                expect(this.field.el.children[1]).toEqual('select#my-field');
            });

        });

    });

});