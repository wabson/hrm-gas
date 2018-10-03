var StartDialog = BaseComponent.extend({

    events: {
        'change #select-race-type': 'onRaceTemplateSelected',
        'submit form': 'onFormSubmit',
        'click #btn-cancel': 'onCloseClick'
    },

    initialize: function(options) {
        this.spreadsheetId = options.spreadsheetId;
    },

    render: function() {
        var regionSelect = new FormSelectField({
            fieldId: 'select-race-region',
            label: 'Hasler region',
            selectList: new SelectList({
                id: 'select-race-region',
                name: 'region',
                model: haslerRegionsData,
                placeholder: 'Select',
                required: true,
                disabled: true
            })
        });
        this.$('#form-group-region').empty().append(regionSelect.render().$el);
        google.script.run
            .withSuccessHandler(_.bind(this.onRaceTemplatesLoaded, this))
            .withFailureHandler(_.bind(this.onRaceTemplatesFailure, this))
            .dialog_start_getRaceTemplates();
    },

    setFormValues_: function(values) {
        var elName;
        _.each(this.$('input[type=text], input[type=date], select'), (function(el) {
            elName = el.name;
            if (elName && values[elName]) {
                $(el).val(values[elName]);
            }
        }));
    },

    onRaceTemplatesLoaded: function(data) {
        var selectEl = this.$('#select-race-type'), sheets = data, sheet, html = '';
        for (var i = 0; i<sheets.length; i++) {
            sheet = sheets[i];
            html += '<option value="'+sheet.type+'" data-drive-file-id="' + sheet.id + '">' + sheet.name + '</option>';
        }
        selectEl.append(html).prop('disabled', false);
        this.$('#btn-start').prop('disabled', false);

        google.script.run
            .withSuccessHandler(_.bind(this.onRaceInfoLoaded, this))
            .withFailureHandler(_.bind(this.onRaceInfoFailure, this))
            .dialog_start_getRaceInfo(this.spreadsheetId);

        this.$('#input-race-name').focus();
    },

    onRaceTemplatesFailure: function(error) {
        this.$('#messages').addClass('message error').html('<p class="icon icon-error">Could not load race templates</p>');
    },

    onRaceInfoLoaded: function(data) {
        this.setFormValues_({
            name: data.raceName,
            type: data.raceType,
            region: data.regionId
        });
        this.$('select[name=type]').trigger('change');
        if (data.hasContent === true) {
            this.$('#warning-content').css('display', 'block');
        }
    },

    onRaceInfoFailure: function(error) {
        this.$('#messages').addClass('message error').html('<p class="icon icon-error">Sorry, an error occurred looking up race info</p>');
        console.error(error);
    },

    onRaceTemplateSelected: function(event) {
        event.preventDefault();
        var regionSelectEl = this.$('#select-race-region'),
            raceTypeSelectEl = this.$('#select-race-type option:selected'),
            raceTypeName = raceTypeSelectEl.val(),
            regionInUse = raceTypeName == 'HRM';
        regionSelectEl.prop('disabled', !regionInUse);
        regionSelectEl.prop('required', regionInUse);
    },

    onFormSubmit: function(event) {
        event.preventDefault();
        var $form = $(event.target);
        $form.addClass('validate');
        this.$('#messages').empty().removeClass();
        var failedFields = $form.invalidFields();
        if (failedFields.length > 0) {
            console.log('Validation failed for some fields', failedFields);
        } else {
            var formData = $form.serializeObject();
            var typeSelectEl = this.$('select[name=type]')[0];
            if (typeSelectEl) {
                formData.type = $(typeSelectEl.options[typeSelectEl.selectedIndex]).attr('data-drive-file-id');
            }
            console.log(formData);
            $form.disableSubmit();
            google.script.run
                .withSuccessHandler(_.bind(function() {
                    this.$('form').restoreSubmit();
                    this.closeDialog_();
                }, this))
                .withFailureHandler(_.bind(this.onFailure, this))
                .dialog_start_submit(this.spreadsheetId, formData);
        }
    },

    onFailure: function(error) {
        this.$('#messages').addClass('message error').html('<p class="icon icon-error">Sorry, an error occurred</p>');
        this.$('form').restoreSubmit();
    },

    onCloseClick: function(event) {
        event.preventDefault();
        this.closeDialog_();
    },

    closeDialog_: function() {
        google.script.host.close();
    }
});