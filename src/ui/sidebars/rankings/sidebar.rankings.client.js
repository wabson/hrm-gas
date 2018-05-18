var dateFormatters = {
    short: function(d) {
        var parts = d.toDateString().split(' ');
        return parts.length === 4 ? [parts[2].replace(/^0/, ''), parts[1], parts[3]].join(' ') : '';
    }
};

var RankingsView = BaseComponent.extend({

    events: {
        'submit #import-form': 'onImportClick'
    },

    initialize: function (options) {

        this.spreadsheetId = options.spreadsheetId;

        var headings = ['Surname', 'First name', 'Club', 'Class', 'Division', 'BCU Number', 'Expiry'];
        var displayCols = ['Name', 'Class', 'Div', 'BCU #', 'Expiry'];
        var classListData = new SelectListData({
            options: []
        });
        var clubListData = new SelectListData({
            options: []
        });
        var rankingDetails = new HaslerRankingDetails({
            classListData: classListData,
            clubListData: clubListData
        });
        this.rankingDispatcher = _.extend({}, Backbone.Events);
        this.search = new RankingsSearch({
            el: '#rankings-search',
            dispatcher: this.rankingDispatcher,
            spreadsheetId: spreadSheetId,
            columns: headings,
            displayColumns: displayCols,
            cellRenderers: rankingDetails.getCellRenders(),
            classListData: this.classListData,
            clubListData: this.clubListData,
            divisionsListData: this.divisionsListData,
            resultsButtons: [
                new FormButton({
                    id: 'add-member',
                    type: 'submit',
                    text: 'Insert into Sheet',
                    className: 'action'
                }),
                new FormButton({
                    type: 'reset',
                    text: 'Clear'
                })
            ]
        });
        this.rankingDispatcher.bind('submit', function(payload) {
            $('#rankings-search-errors').empty();
            var newRows = payload.tableData['rankings-search-results'];
            google.script.run
                .withSuccessHandler(_.bind(this.onInsertRowsSuccess, this))
                .withFailureHandler(_.bind(this.onInsertRowsFailure, this))
                .sidebar_rankings_insert(newRows, headings);
        }, this);
    },

    render: function() {
        this.$('#rankings-search').empty().append(this.search.render().$el);
        google.script.run
            .withSuccessHandler(_.bind(this.onSpreadsheetInfoSuccess, this))
            .withFailureHandler(_.bind(this.onFailure, this))
            .sidebar_rankings_info(this.spreadsheetId);
        return this;
    },

    onImportClick: function(event) {
        event.preventDefault();
        var $form = $(event.target);
        var formData = $form.serializeObject();
        $form.disableSubmit();
        google.script.run
            .withSuccessHandler(_.bind(this.onImportRankingsSuccess, this))
            .withFailureHandler(_.bind(this.onImportRankingsFailure, this))
            .sidebar_rankings_import(this.spreadsheetId, formData);
    },

    formatSummary: function(data) {
        if (typeof data.rankingsSize == 'number') {
            var text = data.rankingsSize > 0 ? ('Spreadsheet has ' +
            (data.rankingsSize.toLocaleString ? data.rankingsSize.toLocaleString(): data.rankingsSize) +
            ' known marathon rankings') : 'No marathon rankings have been imported';
            if (data.lastUpdated) {
                text += ', last updated on ' + dateFormatters.short(new Date(data.lastUpdated));
            }
            return text;
        } else {
            return 'A problem occurred when looking up the rankings';
        }
    },
    onSpreadsheetInfoSuccess: function(data) {
        this.$('#rankings-info').html(this.formatSummary(data), false);
        new RankingsUpdateCheck({
            el: '#rankings-update',
            spreadsheetId: this.spreadsheetId,
            lastUpdated: data.lastUpdated
        }).render();
    },
    onImportRankingsSuccess: function(data) {
        this.onSpreadsheetInfoSuccess(data);
        this.$('#import-form').restoreSubmit();
    },
    onImportRankingsFailure: function(error) {
        this.$('#rankings-messages').html('Sorry, an error occurred importing the ranking data. Please try again later.');
        this.$('#import-form').restoreSubmit();
    },
    onFailure: function (error) {
        this.$('#rankings-messages').html('Sorry, an error occurred. Please try again later.');
    },
    onInsertRowsSuccess: function(data) {
        this.rankingDispatcher.trigger('submitSuccess', this);
    },
    onInsertRowsFailure: function(err) {
        this.$('#rankings-search-errors').html('<p class="icon icon-error">Could not insert crew member: ' + err.message+ '</p>');
        this.rankingDispatcher.trigger('submitFailure', this);
    }

});