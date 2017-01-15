/*jshint sub:true*/

var HaslerRankingDetails = function(options) {
    this.raceDate = options.raceDate ? new Date(options.raceDate) : new Date();
    this.bcuRegexp = '^(\\d+(?:/[A-Z])?|(SCA|WCA) ?\\d+|INT|[A-Z]{3}\\/\\d+|ET [\\w,]+)$';
    this.classListData = options.classListData || new Backbone.Model();
    this.clubListData = options.clubListData || new Backbone.Model();
};

var dateFormatters = {
    short: function(d) {
        var parts = d.toDateString().split(' ');
        return parts.length === 4 ? [parts[2].replace(/^0/, ''), parts[1], parts[3]].join(' ') : '';
    }
};

HaslerRankingDetails.prototype = {
    nameCellRenderer: function(value, index, object) {
        return object['Surname'] + ', ' + object['First name'];
    },
    classCellRenderer: function(value, index, object) {
        return this.addTitle(object['Club'], this.clubListData.get('options')) +
            ', ' + this.addTitle(object['Class'], this.classListData.get('options'));
    },
    bcuCellRenderer: function(value, index, object) {
        return this.wrapIfInvalid(object['BCU Number'], object, _.bind(this.isBCUNumberValid, this));
    },
    expiryCellRenderer: function(value, index, object) {
        return value ?
            this.wrapIfInvalid(dateFormatters.short(new Date(value)), object, _.bind(this.isBCUCurrent, this)) : '';
    },
    isBCUCurrent: function(value, object) {
        return new Date(object['Expiry']) >= this.raceDate;
    },
    isBCUNumberValid: function(value, object) {
        return object['BCU Number'] && new RegExp(this.bcuRegexp).test(object['BCU Number']);
    },
    wrapIfInvalid: function(value, object, validatorFn) {
        if (!validatorFn(value, object)) {
            return '<span class="warning">' + value + '</span>';
        } else {
            return value;
        }
    },
    addTitle: function(value, options) {
        if (value === '') {
            return '';
        }
        var matches = _.filter(options, function(option) {
            return value === option[0];
        });
        return matches.length > 0 ? '<abbr title="' + matches[0][1] + '">' + value + '</abbr>' : value;
    },
    getCellRenders: function() {
        return {
            'Name': this.nameCellRenderer,
            'Class': _.bind(this.classCellRenderer, this),
            'Div': function (value, index, object) {
                return object['Division'];
            },
            'BCU #': _.bind(this.bcuCellRenderer, this),
            'Expiry': _.bind(this.expiryCellRenderer, this)
        };
    }
};

var RankingsSearchForm = DataForm.extend({

    initialize: function(options) {

        DataForm.prototype.initialize.call(this, options);

        this.scriptMethod = options.scriptMethod;
        this.searchPrompt = options.searchPrompt || 'Search rankings';
        this.spreadsheetId = options.spreadsheetId;
        this.disabled = options.disabled === true;

        this.data = options.data;
    },

    render: function() {
        this.$el.html('<div class="block form-group">' +
                '<label for="name">' + this.searchPrompt + '</label>' +
                '<input type="search" name="name" id="name" value="" required aria-valuemin="2" autocomplete="off">' +
                '</div>');
        this.$('input').prop('disabled', this.disabled);
        return this;
    },

    submit: function(event) {
        event.preventDefault();
        var term = this.$('input').val();
        if (term && term.length > 1) {
            google.script.run
                    .withSuccessHandler(_.bind(this.onSearchResultsLoaded, this))
                    [this.scriptMethod](this.spreadsheetId, term);
        }
    },

    onSearchResultsLoaded: function (resp) {
        this.data.set('values', resp);
    }

});

var RankingsSearch = BaseComponent.extend({

    events: {
        'click button[type=button]': 'onEditClick'
    },

    initialize: function(options) {
        this.dispatcher = options.dispatcher;
        var childOpts = this.createOptionsForSubView(options, {
            data: new TableData({
                columns: options.columns,
                values: []
            })
        });
        this.searchForm = new RankingsSearchForm(_.extend({}, childOpts, {
            id: 'rankings-search-form',
            className: 'rankings-search-form',
            scriptMethod: 'sidebar_entries_search',
            searchPrompt: 'Search by name or BCU number',
            disabled: options.searchDisabled
        }));
        this.resultsForm = new DataTableForm(_.extend({}, childOpts, {
            id: 'results-form',
            className: 'rankings-search-results',
            blocks: [
                new FormBlock({
                    controls: [
                        new DataTable(_.extend({}, childOpts, {
                            id: 'rankings-search-results',
                            inputType: 'checkbox'
                        }))
                    ]
                }),
                new FormBlock({
                    controls: options.resultsButtons || [
                        new FormButton({
                            type: 'submit',
                            text: 'Add'
                        }),
                        new FormButton({
                            type: 'reset',
                            text: 'Clear'
                        })
                    ]
                })
            ]
        }));

        if (this.dispatcher) {
            this.dispatcher.bind('selectedDataChange', this.onSelectedDataChange, this);
            this.dispatcher.bind('submitSuccess', function(payload) {
                this.searchForm.reset();
            }, this);
            this.dispatcher.bind('reset', function() {
                this.searchForm.reset(false).focus();
            }, this);
        }
    },

    render: function() {
        this.$el.empty().append([
            this.searchForm.render().$el,
            this.resultsForm.render().$el,
            this.createDiv_('-messages')
        ]);
        return this;
    },

    onSelectedDataChange: function(payload) {
        this.selected = payload && payload.selected ? payload.selected : [];
        this.$('#edit-member').prop('disabled', this.selected.length !== 1);
    },

    onEditClick: function(event) {
        this.dispatcher.trigger('editMember', {
            selected: this.selected
        });
    }

});

var RankingsUpdateCheck = BaseComponent.extend({

    initialize: function(options) {
        this.spreadsheetId = options.spreadsheetId;
        this.lastUpdated = options.lastUpdated;
        this.displayUpToDateConfirmation = options.displayUpToDateConfirmation !== false;
    },

    render: function() {
        /* jshint camelcase: false */
        google.script.run
                .withSuccessHandler(_.bind(function (webLastUpdated) {
                    if (webLastUpdated !== null && this.lastUpdated !== null && webLastUpdated !== this.lastUpdated) {
                        this.$el.css('display', 'block')
                                .removeClass()
                                .addClass('message-box info')
                                .find('p')
                                .html('A new version of the ranking list may be available updated ' +
                                    dateFormatters.short(new Date(webLastUpdated)));
                    } else {
                        if (this.displayUpToDateConfirmation) {
                            this.$el.css('display', 'block')
                                    .removeClass()
                                    .addClass('message info')
                                    .find('p')
                                    .html('You have the latest version of the ranking list');
                        }
                    }
                }, this))
                .withFailureHandler(_.bind(this.onFailure, this))
                .sidebar_rankings_last_updated(this.spreadsheetId);
        return this;
    },

    onFailure: function (error) {
        this.$el.html('Sorry, an error occurred. Please try again later.');
    }
});