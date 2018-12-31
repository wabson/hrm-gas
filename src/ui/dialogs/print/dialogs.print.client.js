var PrintDialog = BaseComponent.extend({

    spreadsheetId: null,

    spreadsheetLastUpdated: null,

    events: {
        'click #printable-entries button.create': 'onCreateEntriesClick',
        'click #printable-results button.create': 'onCreateResultsClick',
        'click a.update': 'onUpdateClick',
        'click a.delete': 'onDeleteClick',
        'click button.print': 'onPrintClick',
        'click #btn-cancel': 'onCloseClick'
    },

    initialize: function(options) {
        this.spreadsheetId = options.spreadsheetId;
    },

    render: function() {
        this.loadResultsInfo();
        return this;
    },

    renderRenditionsList: function(renditions, type) {
        this.$('#printable-' + type + ' .file-list').html(
            renditions.map(
                function(rendition) {
                    return _.template('<div data-spreadsheet-id="<%= id %>">' +
    '<div class="sheet-actions">' +
    '<button type="button" class="action print"><i class="material-icons">print</i> <span>Print</span></button></div>' +
    '<div class="sheet-label"><%= name %></div>' +
    '<div class="updated"><small>Updated <%= lastUpdated %> <%= status %></small></div><div class="actions">' +
    '<small><a class="update" href="#">Update</a> ' +
    '<a class="view" href="<%= editHref %>" target="_blank">View</a> ' +
    '<a class="delete" href="#">Delete</a></small></div>' +
    '</div>')({
                        id: rendition.id,
                        name: rendition.name,
                        lastUpdated: this.formatDate_(rendition.lastUpdated),
                        status: this.getStatus_(rendition),
                        editHref: 'https://docs.google.com/spreadsheets/d/' + rendition.id + '/edit'
                    });
                }, this
            )
        );
    },

    formatDate_: function(dateStr) {
        var formatOptions = {
            year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'
        };
        var dateObj = new Date(dateStr);
        if (typeof Intl === 'object' && typeof Intl.DateTimeFormat === 'function') {
            return new Intl.DateTimeFormat('en-GB', formatOptions).format(dateObj);
        } else {
            return dateObj.toString();
        }
    },

    getStatus_: function(rendition) {
        return this.spreadsheetLastUpdated < rendition.lastUpdated ?
            '<i class="material-icons">check</i> Up-to-date' :
            '<i class="material-icons">warning</i> Needs update';
    },

    toggleCreateButton: function(renditions, type) {
        this.$('#printable-' + type + ' div.create').css('display', renditions.length === 0 ? 'block' : 'none');
    },

    loadResultsInfo: function() {
        /* jshint camelcase:false */
        this.clearError_();
        google.script.run.withSuccessHandler(_.bind(this.onResultsInfoLoaded, this))
            .withFailureHandler(_.bind(this.onFailure, this))
            .dialog_print_getResultsInfo(this.spreadsheetId);
    },

    onResultsInfoLoaded: function(data) {
        this.spreadsheetLastUpdated = data.spreadsheet.lastUpdated;
        this.renderRenditionsList(data.entriesSheets, 'entries');
        this.renderRenditionsList(data.resultsSheets, 'results');
        this.toggleCreateButton(data.entriesSheets, 'entries');
        this.toggleCreateButton(data.resultsSheets, 'results');
    },

    onCreateEntriesClick: function(e) {
        /* jshint camelcase:false */
        this.clearError_();
        $(e.currentTarget).disableSubmit();
        google.script.run.withSuccessHandler(_.bind(this.onCreateSuccess, this))
            .withFailureHandler(_.bind(this.onCreateFailure, this))
            .dialog_print_createEntriesSheet(this.spreadsheetId);
    },

    onCreateResultsClick: function(e) {
        /* jshint camelcase:false */
        this.clearError_();
        $(e.currentTarget).disableSubmit();
        google.script.run.withSuccessHandler(_.bind(this.onCreateSuccess, this))
            .withFailureHandler(_.bind(this.onCreateFailure, this))
            .dialog_print_createResultsSheet(this.spreadsheetId);
    },

    onPrintClick: function(e) {
        var renditionId = $(e.currentTarget).closest('div[data-spreadsheet-id]').attr('data-spreadsheet-id');
        var url = 'https://docs.google.com/spreadsheets/d/{SS_ID}/export?'.replace('{SS_ID}', renditionId);
        var urlExt = 'format=pdf' +        // export as pdf / csv / xls / xlsx
            '&size=a4' +                           // paper size legal / letter / A4
            '&portrait=false' +                    // orientation, false for landscape
            '&fitw=true' +           // fit to page width, false for actual size
            '&sheetnames=true&printtitle=true' +   // show optional headers and footers
            '&pagenumbers=true&gridlines=true' +   // show page numbers and gridlines
            '&fzr=true' +                          // repeat row headers (frozen rows) on each page
            '&attachment=false';
        // '&gid=';                             // specific sheet gid to use (otherwise includes all sheets)
        var win = window.open(url + urlExt, '_blank');
        win.focus();
    },

    onUpdateClick: function(e) {
        /* jshint camelcase:false */
        e.preventDefault();
        this.clearError_();
        var divEl = $(e.currentTarget).closest('div[data-spreadsheet-id]');
        var renditionId = divEl.attr('data-spreadsheet-id');
        var runner = google.script.run.withSuccessHandler(_.bind(this.onUpdateSuccess, this))
            .withFailureHandler(_.bind(this.onUpdateFailure, this))
            .withUserObject({
                renditionId: renditionId,
                divElement: divEl
            });
        var fieldsetId = $(e.currentTarget).closest('fieldset').prop('id');
        if (fieldsetId === 'printable-entries') {
            $(e.currentTarget).html('Updating');
            runner.dialog_print_updateEntriesSheet(this.spreadsheetId, renditionId);
        } else if (fieldsetId === 'printable-results') {
            $(e.currentTarget).html('Updating');
            runner.dialog_print_updateResultsSheet(this.spreadsheetId, renditionId);
        }
    },

    onDeleteClick: function(e) {
        /* jshint camelcase:false */
        e.preventDefault();
        this.clearError_();
        var divEl = $(e.currentTarget).closest('div[data-spreadsheet-id]');
        var renditionId = divEl.attr('data-spreadsheet-id');
        $(e.currentTarget).html('Deleting');
        google.script.run.withSuccessHandler(_.bind(this.onDeleteSuccess, this))
            .withFailureHandler(_.bind(this.onDeleteFailure, this))
            .withUserObject({
                renditionId: renditionId,
                divElement: divEl
            }).dialog_print_deleteSheet(renditionId);
    },

    onCreateFailure: function() {
        this.$('button.create').restoreSubmit();
        this.onFailure();
    },

    onCreateSuccess: function() {
        this.loadResultsInfo();
    },

    onUpdateFailure: function(data, userObj) {
        this.$('div[data-spreadsheet-id="'+userObj.renditionId+'"] a.update').html('Update');
        this.showError_('Sorry, an error occurred');
    },

    onUpdateSuccess: function(data, userObj) {
        this.$('div[data-spreadsheet-id="'+userObj.renditionId+'"] a.update').html('Update');
        this.loadResultsInfo();
    },

    onDeleteSuccess: function(data, userObj) {
        this.$('button.create').restoreSubmit();
        this.loadResultsInfo();
    },

    onDeleteFailure: function(data, userObj) {
        this.$('div[data-spreadsheet-id="'+userObj.renditionId+'"] a.delete').html('Delete');
        this.onFailure();
    },

    onFailure: function() {
        this.showError_('Sorry, an error occurred');
    },

    onCloseClick: function(event) {
        event.preventDefault();
        this.closeDialog_();
    },

    showError_: function(message) {
        this.$('#messages').addClass('message error').html('<p class="icon icon-error">' + message + '</p>');
    },

    clearError_: function() {
        this.$('#messages').empty();
    },

    closeDialog_: function() {
        google.script.host.close();
    }
});