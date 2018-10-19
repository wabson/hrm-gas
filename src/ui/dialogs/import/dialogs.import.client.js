var GOOGLE_SHEETS_MIMETYPE = 'application/vnd.google-apps.spreadsheet';
var MS_EXCEL_MIMETYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
];

var ImportDialog = BaseComponent.extend({

    dialogWidth: 600,

    dialogHeight: 425,

    pickerApiKey: '',

    pickerApiLoaded: false,

    allowConversion: false,

    events: {
        'click #btn-select-file': 'onSelectClick',
        'change #checkbox-create-entryset': 'onCreateEntrySetClick',
        'submit form': 'onFormSubmit',
        'click #btn-cancel': 'onCloseClick'
    },

    initialize: function(options) {
        this.spreadsheetId = options.spreadsheetId;
        this.pickerApiKey = options.pickerApiKey;
    },

    render: function() {
        return this;
    },

    onPickerApiLoaded: function onPickerApiLoaded() {
        this.pickerApiLoaded = true;
        this.$('#btn-select-file').prop('disabled', false);
    },

    onSelectClick: function() {
        google.script.run.withSuccessHandler(_.bind(this.createPicker, this))
            .withFailureHandler(_.bind(this.onGetOAuthTokenFailure, this)).dialog_import_getOAuthToken()
    },

    createPicker: function(token) {
        var mimeTypes = [ GOOGLE_SHEETS_MIMETYPE ];
        if (this.allowConversion === true) {
            mimeTypes = mimeTypes.concat(MS_EXCEL_MIMETYPES);
        }
        if (this.pickerApiLoaded && token) {
            var docsView = new google.picker.DocsView();
            docsView.setMimeTypes(mimeTypes.join(','));
            docsView.setIncludeFolders(false);
            //var uploadView = new google.picker.DocsUploadView();
            var picker = new google.picker.PickerBuilder()
                //.addView(google.picker.ViewId.SPREADSHEETS)
                .addView(docsView)
                //.addView(uploadView)
                .setSelectableMimeTypes(mimeTypes.join(','))
                .hideTitleBar()
                .setOAuthToken(token)
                .setDeveloperKey(this.pickerApiKey)
                .setCallback(_.bind(this.pickerCallback, this))
                .setOrigin(google.script.host.origin)
                // Instruct Picker to fill the dialog, minus 2 pixels for the border.
                .setSize(this.dialogWidth - 2, this.dialogHeight - 2)
                .build();
            picker.setVisible(true);
        } else {
            this.showError_('Unable to load the file picker.');
        }
    },

    pickerCallback: function pickerCallback(data) {
        var action = data[google.picker.Response.ACTION];
        if (action === google.picker.Action.PICKED) {
            var doc = data[google.picker.Response.DOCUMENTS][0];
            var id = doc[google.picker.Document.ID];
            var url = doc[google.picker.Document.URL];
            var title = doc[google.picker.Document.NAME];
            this.$('#selected-file-name').html('<a href="' + url + '">' + title + '</a>');
            this.$('#btn-import').prop('disabled', false);
            this.$('#input-selected-file-id').val(id);
            this.$('#input-selected-file-name').val(title);
        }
    },

    onGetOAuthTokenFailure: function(error) {
        this.showError_('Sorry, an error occurred');
    },

    onCreateEntrySetClick: function(event) {
        var nameInputEl = this.$('#input-entry-set-name'), disableNameInput = !event.target.checked;
        nameInputEl.prop('disabled', disableNameInput).prop('required', !disableNameInput);
        if (!disableNameInput) {
            nameInputEl.focus();
            if (nameInputEl.val() === '') {
                nameInputEl.val(this.$('input[name="sourceFileName"]').val());
            }
        }
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
            var sourceFileId = formData.sourceFileId;
            var sourceFileName = formData.sourceFileName;
            delete formData.sourceFileId;
            delete formData.sourceFileName;
            $form.disableSubmit();
            this.clearResults();
            google.script.run
                .withSuccessHandler(_.bind(function(results) {
                    this.$('form').restoreSubmit();
                    this.populateResults(results, sourceFileName);
                }, this))
                .withFailureHandler(_.bind(this.onFailure, this))
                .dialog_import_importEntries(this.spreadsheetId, sourceFileId, formData);
        }
    },

    clearResults: function(results, fileName) {
        this.$('#import-results .summary').html('');
        this.$('#import-results ul').html('');
    },

    populateResults: function(results, fileName) {
        var crewTerm = results.numCrews === 1 ? 'crew' : 'crews';
        if (results.numCrews > 0) {
            this.$('#import-results .summary').text('Imported ' + results.numCrews + ' ' + crewTerm  + ' from ' + fileName);
        } else {
            this.$('#import-results .summary').text('No crews found in ' + fileName);
        }
        var listItems = [];
        if (results.sheets) {
            listItems = results.sheets.map(function(sheet) {
                crewTerm = sheet.crews.numCrews === 1 ? 'crew' : 'crews';
                return '<li>Added ' + sheet.crews.numCrews + ' ' + crewTerm + ' to ' + sheet.name + '</li>';
            });
        }
        this.$('#import-results ul').html(listItems.join('\n'));
    },

    onFailure: function(error) {
        this.showError_('Sorry, an error occurred');
        this.$('form').restoreSubmit();
    },

    onCloseClick: function(event) {
        event.preventDefault();
        this.closeDialog_();
    },

    showError_: function(message) {
        this.$('#messages').addClass('message error').html('<p class="icon icon-error">' + message + '</p>');
    },

    closeDialog_: function() {
        google.script.host.close();
    }
});