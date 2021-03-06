var DataForm = Backbone.View.extend({

    tagName: 'form',

    events: {
        'submit': 'submit',
        'click button[type=reset]': 'onClickReset'
    },

    initialize: function(options) {

        this.dispatcher = options.dispatcher;
        this.blocks = options.blocks || [];

        if (this.dispatcher) {
            this.dispatcher.bind('submitSuccess', this.onSubmitSuccess, this);
            this.dispatcher.bind('submitFailure', this.onSubmitFailure, this);
            this.dispatcher.bind('formData', this.setFormData, this);
        }
    },

    render: function() {
        this.$el.empty().append(_.map(this.blocks, function(block) {
            return block.render().$el;
        }, this));
        return this;
    },

    submit: function(event) {
        event.preventDefault();
        if (this.dispatcher) {
            this.setButtonsDisabled_(true, 'submit');
            var formData = this.serializeFields();
            this.dispatcher.trigger('submit', {
                data: formData
            });
        }
    },

    serializeFields: function() {
        var o = {};
        _.each(this.$el.serializeArray(), function(arrItem) {
            if (o[arrItem.name] !== undefined) {
                if (!o[arrItem.name].push) {
                    o[arrItem.name] = [o[arrItem.name]];
                }
                o[arrItem.name].push(arrItem.value || '');
            } else {
                o[arrItem.name] = arrItem.value || '';
            }
        });
        return o;
    },

    onClickReset: function() {
        this.reset().focus();
    },

    reset: function(trigger) {
        this.resetFormFields_();
        if (trigger !== false) {
            this.dispatcher.trigger('reset');
        }
        return this;
    },

    onSubmitSuccess: function() {
        this.resetFormFields_();
        this.setButtonsDisabled_(false, 'submit');
    },

    onSubmitFailure: function() {
        this.setButtonsDisabled_(false, 'submit');
    },

    setButtonsDisabled_: function (disabled, type) {
        this.$el.find('button[type=' + (type || '') + ']').prop('disabled', disabled);
        return this;
    },

    resetFormFields_: function() {
        this.$el.find('input[type=text], input[type=date], input[type=search]').val('');
        this.$el.find('select').prop('selectedIndex', 0);
        return this;
    },

    setFormFieldsDisabled: function (disabled) {
        this.$el.find('input[type=text], input[type=date], input[type=search], select').prop('disabled', disabled);
        return this;
    },

    focus: function () {
        var els = this.$('input[type=text], input[type=search], select');
        if (els.length) {
            els[0].focus();
        }
        return this;
    },

    setFormData: function(formData) {
        _.each(formData.values, function(value, key) {
            this.$el.find('input[name="' + key + '"], select[name="' + key + '"]').val(value);
        }, this);
    }

});

var FormBlock = Backbone.View.extend({
    className: 'block form-group',
    initialize: function(options) {
        this.controls = options.controls;
    },
    render: function() {
        this.$el.empty().append(_.map(this.controls, function(control) {
            return control.render().$el;
        }, this));
        return this;
    },
    getTableControls: function() {
        return _.filter(this.controls, function (control) {
            return control.tagName === 'table';
        });
    }
});

var FormGroupInline = FormBlock.extend({
    className: 'inline form-group'
});

var FormFieldSet = FormBlock.extend({
    tagName: 'fieldset',
    className: 'block',
    initialize: function(options) {
        FormBlock.prototype.initialize.call(this, options);
        this.label = options.label;
    },
    render: function() {
        FormBlock.prototype.render.call(this);
        this.$el.prepend('<label>' + this.label + '</label>');
        return this;
    }
});

var FormDialog = Backbone.View.extend({

    events: {
        'click button[type=button]': 'onCloseClick'
    },

    initialize: function(options) {
        this.spreadsheetId = options.spreadsheetId;
        this.dataGetFn = options.dataGetFn;
        this.dataSetFn = options.dataSetFn;

        this.dispatcher = options.dispatcher || _.extend({}, Backbone.Events);
        this.dispatcher.bind('submit', this.onFormSubmit, this);
        this.form = this.buildFormComponent_(options, this.dispatcher);
    },

    render: function() {
        var messagesDiv = this.$('.messages');
        if (messagesDiv.length === 0) {
            messagesDiv = document.createElement('DIV');
            messagesDiv.className = 'messages';
            this.$el.append(messagesDiv);
        }
        this.$el.append(this.form.render().$el);
        if (this.dataGetFn) {
            this.form.setFormFieldsDisabled(true);
            this.form.setButtonsDisabled_(true, 'submit');
            google.script.run
                    .withSuccessHandler(_.bind(this.onDataGetSuccess, this))
                    .withFailureHandler(_.bind(this.onDataGetFailure, this))
                    [this.dataGetFn](this.spreadsheetId);
        }
        return this;
    },

    onDataGetSuccess: function(data) {
        this.form.setFormData({
            values: data
        });
        this.form.setFormFieldsDisabled(false);
        this.form.setButtonsDisabled_(false, 'submit');
        this.dispatcher.trigger('formData', {
            data: data
        });
    },

    onDataGetFailure: function(error) {
        this.$('.messages')
            .addClass('message error')
            .html('<p class="icon icon-error">Sorry, an error occurred: ' + error.message + '</p>');
    },

    onDataSetSuccess: function(data) {
        this.closeDialog_();
    },

    onDataSetFailure: function(error) {
        this.$('.messages')
            .addClass('message error')
            .html('<p class="icon icon-error">Sorry, an error occurred: ' + error.message + '</p>');
        this.dispatcher.trigger('submitFailure');
    },

    onFormSubmit: function(payload) {
        google.script.run
                .withSuccessHandler(_.bind(this.onDataSetSuccess, this))
                .withFailureHandler(_.bind(this.onDataSetFailure, this))
                [this.dataSetFn](this.spreadsheetId, payload.data);
    },

    onCloseClick: function(event) {
        event.preventDefault();
        this.closeDialog_();
    },

    buildFormComponent_: function(options, dispatcher) {
        var formFields = options.formFields;
        var buttons = options.buttons;
        return new DataForm({
            dispatcher: dispatcher,
            blocks: _.map(formFields, this.buildFormBlock_, this).concat([new FormBlock({
                controls: buttons
            })])
        });
    },

    buildFormBlock_: function(block) {
        return _.isArray(block) ? this.buildFormBlockFromArray_(block) : new FormFieldSet({
            label: block.label,
            controls: _.map(block.fields, this.buildFormBlockFromArray_, this)
        });
    },

    buildFormBlockFromArray_: function(controls) {
        return new FormBlock({
            controls: _.map(controls, function(control) {
                return new FormGroupInline({
                    controls: [control]
                });
            })
        });
    },

    setFormData: function(values) {
        this.form.setFormData(values);
    },

    closeDialog_: function() {
        google.script.host.close();
    }

});

var DataTableForm = DataForm.extend({

    initialize: function(options) {
        DataForm.prototype.initialize.call(this, options);
        if (this.dispatcher) {
            this.dispatcher.bind('selectedDataChange', this.onTableSelectedDataChange, this);
        }
    },

    render: function() {
        DataForm.prototype.render.call(this);
        this.setButtonsDisabled_(true, 'submit');
        return this;
    },

    onTableSelectedDataChange: function() {
        this.setButtonsDisabled_(this.getNumTableRowsSelected_() === 0, 'submit');
    },

    onSubmitSuccess: function() {
        DataForm.prototype.onSubmitSuccess.call(this);
        this.clearTableData_();
    },

    getTableControls: function() {
        var empty = [];
        return empty.concat.apply(empty, _.map(this.blocks, function(block) {
            return block.getTableControls();
        }));
    },

    getNumTableRowsSelected_: function() {
        return _.reduce(_.values(this.getTableData()), function(memo, val) {
            return memo + _.pairs(val).length;
        }, 0, this);
    },

    getTableData: function() {
        return _.object(_.map(_.filter(this.getTableControls(), function(control) {
            return control.id;
        }), function(control) {
            return [control.id, control.getSelectedData()];
        }));
    },

    clearTableData_: function() {
        _.each(this.getTableControls(), function(control) {
            control.truncateBody();
        });
    },

    submit: function(event) {
        event.preventDefault();
        var formData = this.serializeFields();
        if (this.dispatcher) {
            this.dispatcher.trigger('submit', {
                data: formData,
                tableData: this.getTableData()
            });
            this.setButtonsDisabled_(true, 'submit');
        }
    },

    reset: function() {
        DataForm.prototype.reset.call(this);
        this.clearTableData_();
        return this;
    }

});

var FormButton = Backbone.View.extend({
    tagName: 'button',
    initialize: function(options) {
        this.type = options.type || 'submit';
        this.disabled = options.disabled === true;
        this.text = options.text || 'Submit';
    },
    render: function() {
        this.$el.html(this.text)
                .attr('type', this.type)
                .prop('disabled', this.disabled);
        return this;
    }
});

var FormField = Backbone.View.extend({
    tagName: 'span',
    initialize: function(options) {
        this.fieldId = options.fieldId;
        this.fieldClassName = options.fieldClassName || '';
        this.name = options.name;
        this.type = options.type;
        this.label = options.label;
        this.disabled = options.disabled === true;
        this.required = options.required === true;
        this.checked = options.checked === true;
        this.value = options.value || '';
        this.pattern = options.pattern;
        this.step = options.step;
        this.placeholder = options.placeholder;
        this.title = options.title;
    },
    getFieldHtmlId_: function() {
        return this.fieldId || this.name;
    },
    getLabelHtml_: function() {
        return _.template('<label for="<%= id %>"><%= label %></label>')({
            id: this.getFieldHtmlId_(),
            label: this.label
        });
    },
    getControlHtml_: function() {
        var template;
        if (this.type === 'text' || this.type === 'date' || this.type === 'number' || this.type === 'checkbox') {
            template = '<input ' +
                'id="<%= id %>" ' +
                'class="<%= className %>" ' +
                'name="<%= name %>" ' +
                '<%= title ? \'title="\' + title + \'" \' : "" %>' +
                'type="<%= type %>" ' +
                'value="<%= value %>" ' +
                '<%= checked ? "checked " : "" %>' +
                '<%= required ? "required " : "" %>' +
                '<%= pattern ? \'pattern="\' + pattern + \'" \' : "" %>' +
                '<%= step ? \'step="\' + step + \'" \' : "" %>' +
                '<%= placeholder ? \'placeholder="\' + placeholder + \'" \' : "" %>' +
                '<%= disabled ? "disabled " : "" %> />';
        } else {
            throw 'Unknown type ' + this.type;
        }
        return _.template(template)({
            id: this.getFieldHtmlId_(),
            className: this.fieldClassName,
            name: this.name,
            type: this.type,
            disabled: this.disabled,
            required: this.required,
            checked: this.checked,
            value: this.value,
            pattern: this.pattern,
            step: this.step,
            placeholder: this.placeholder,
            title: this.title
        });
    },
    render: function() {
        var labelHtml = this.getLabelHtml_(), controlHtml = this.getControlHtml_();
        var parts = this.type === 'checkbox' ? [controlHtml, labelHtml] : [labelHtml, controlHtml];
        this.$el.empty().append(parts);
        return this;
    }
});

var FormSelectField = FormField.extend({
    initialize: function(options) {
        FormField.prototype.initialize.apply(this, arguments);
        this.selectList = options.selectList;
    },
    getControlHtml_: function() {
        return this.selectList.render().$el.attr('id', this.getFieldHtmlId_());
    }
});

var SelectListData = Backbone.Model.extend({});

var SelectList = Backbone.View.extend({
    tagName: 'select',
    initialize: function(options) {
        this.model = options.model;
        this.name = options.name;
        this.title = options.title;
        this.placeholder = options.placeholder;
        this.required = options.required;
        this.listenTo(this.model, 'change', this.render);
    },
    render: function() {
        this.$el.empty().append(this.placeholder ? '<option value="">' + this.placeholder + '</option>' : '')
                .append(this.model ? _.map(this.model.get('options'), function(option) {
                    var $el = $(document.createElement('option'));
                    if (_.isString(option)) {
                        $el.html(option);
                    } else if (_.isArray(option)) {
                        $el.attr('value', option[0]).html(option[1] || option[0]);
                    } else if (_.isObject(option)) {
                        $el.attr('value', option.value).html(option.text || option.value);
                    }
                    return $el;
                }, this) : [])
                .attr('name', this.name).attr('title', this.title);
        this.$el.prop('required', this.required === true);
        return this;
    },
    getSelectedValue: function() {
        return this.el.options[this.el.selectedIndex].value;
    },
    getSelectedText: function() {
        return this.el.options[this.el.selectedIndex].innerHTML;
    }
});