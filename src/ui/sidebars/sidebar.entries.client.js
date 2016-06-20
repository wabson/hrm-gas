$(function() {

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

    var AddEntryView = BaseComponent.extend({

        events: {
            'click div.results a': 'onAddedCrewClick'
        },

        initialize: function (options) {

            this.spreadsheetId = options.spreadsheetId;
            var rankingDispatcher = _.extend({}, Backbone.Events);
            var manualEntryDispatcher = _.extend({}, Backbone.Events);
            this.crewDispatcher = _.extend({}, Backbone.Events);
            var crewData = new TableData({
                columns: headings,
                values: []
            });

            this.classListData = options.classListData;
            this.clubListData = options.clubListData;
            this.divisionsListData = new SelectListData({
                options: []
            });
            this.search = new RankingsSearch({
                id: 'rankings-search',
                dispatcher: rankingDispatcher,
                spreadsheetId: this.spreadsheetId,
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
                        text: 'Add to Crew'
                    }),
                    new FormButton({
                        id: 'edit-member',
                        type: 'button',
                        text: 'Edit Details',
                        disabled: true
                    }),
                    new FormButton({
                        type: 'reset',
                        text: 'Clear'
                    })
                ],
                searchDisabled: true
            });
            this.manualForm = new DataForm({
                id: 'manual-entry-form',
                dispatcher: manualEntryDispatcher,
                blocks: [
                    new FormBlock({
                        controls: [
                            new FormGroupInline({
                                controls: [
                                    new FormField({
                                        name: 'Surname',
                                        className: 'surname',
                                        type: 'text',
                                        label: 'Surname',
                                        required: true
                                    })
                                ]
                            }),
                            new FormGroupInline({
                                controls: [
                                    new FormField({
                                        name: 'First name',
                                        className: 'first-name',
                                        type: 'text',
                                        label: 'First name',
                                        required: true
                                    })
                                ]
                            })
                        ]
                    }),
                    new FormBlock({
                        controls: [
                            new FormGroupInline({
                                controls: [
                                    new FormField({
                                        name: 'BCU Number',
                                        type: 'text',
                                        label: 'BCU Number',
                                        required: true,
                                        pattern: rankingDetails.bcuRegexp,
                                        title: 'Must be in the format XXX, CLB/XXX, WCA XXX, SCA XXX, INT or ET EVENT, where XXX is a number and CLB is a valid club code e.g. RIC'
                                    })
                                ]
                            }),
                            new FormGroupInline({
                                controls: [
                                    new FormField({
                                        name: 'Expiry',
                                        type: 'date',
                                        label: 'Expiry',
                                        required: true
                                    })
                                ]
                            })
                        ]
                    }),
                    new FormBlock({
                        controls: [
                            new FormGroupInline({
                                controls: [
                                    new FormSelectField({
                                        fieldId: 'select-class',
                                        label: 'Class',
                                        selectList: new SelectList({
                                            id: 'select-class',
                                            name: 'Class',
                                            model: this.classListData,
                                            placeholder: 'Select',
                                            required: true
                                        })
                                    })
                                ]
                            }),
                            new FormGroupInline({
                                controls: [
                                    new FormSelectField({
                                        fieldId: 'select-club',
                                        label: 'Club',
                                        selectList: new SelectList({
                                            id: 'select-club',
                                            name: 'Club',
                                            model: this.clubListData,
                                            placeholder: 'Select',
                                            required: true
                                        })
                                    })
                                ]
                            }),
                            new FormGroupInline({
                                controls: [
                                    new FormSelectField({
                                        fieldId: 'select-division',
                                        label: 'Division',
                                        selectList: new SelectList({
                                            id: 'select-division',
                                            name: 'Division',
                                            model: this.divisionsListData,
                                            placeholder: 'Select',
                                            required: true
                                        })
                                    })
                                ]
                            })
                        ]
                    }),
                    new FormBlock({
                        controls: [
                            new FormButton({
                                id: 'add-manual',
                                type: 'submit',
                                text: 'Add to Crew'
                            }),
                            new FormButton({
                                type: 'reset',
                                text: 'Clear'
                            })
                        ]
                    })
                ]
            });

            var crewTable = new DataTable({
                id: 'crew-members',
                dispatcher: this.crewDispatcher,
                data: crewData,
                displayColumns: displayCols,
                cellRenderers: rankingDetails.getCellRenders()
            });

            this.raceListData = new SelectListData({
                options: []
            });

            this.crewForm = new DataTableForm({
                id: 'crew-list-form',
                dispatcher: this.crewDispatcher,
                blocks: [
                    new FormBlock({
                        controls: [ crewTable ]
                    }),
                    new FormBlock({
                        controls: [
                            new SelectList({
                                title: 'Race',
                                name: 'race',
                                model: this.raceListData
                            }),
                            new FormButton({
                                id: 'add-entry',
                                className: 'action',
                                type: 'submit',
                                text: 'Add Entry'
                            }),
                            new FormButton({
                                id: 'clear-crew',
                                type: 'reset',
                                text: 'Clear'
                            })
                        ]
                    })
                ]
            });
            var tabsDispatcher = _.extend({}, Backbone.Events);
            this.tabs = new TabsList({
                dispatcher: tabsDispatcher,
                tabs: {
                    'Search Rankings': this.search,
                    'Manual Entry': this.manualForm
                }
            });

            rankingDispatcher.bind('submit', function(payload) {
                var newRows = payload.tableData['rankings-search-results'];
                crewData.set('values', crewData.get('values').concat(newRows));
                rankingDispatcher.trigger('submitSuccess', this);
            }, this);
            rankingDispatcher.bind('editMember', function(payload) {
                manualEntryDispatcher.trigger('formData', {
                    values: payload.selected[0]
                });
                tabsDispatcher.trigger('select', {
                    id: this.manualForm.el.id
                });
            }, this);

            manualEntryDispatcher.bind('submit', function(payload) {
                var newRows = [payload.data];
                crewData.set('values', crewData.get('values').concat(newRows));
                manualEntryDispatcher.trigger('submitSuccess', this);
            }, this);

            this.crewDispatcher.bind('submit', this.onCrewFormSubmit, this);
        },

        render: function () {
            this.$el.empty().append([this.tabs.render().$el, this.search.render().$el, this.manualForm.render().$el, this.crewForm.render().$el, this.createDiv_('-messages'), this.createDiv_('-results', {
                className: 'results'
            })]);
            this.loadRaceNames_();
            this.loadRaceInfo_();
        },

        loadRaceNames_: function() {
            google.script.run.withSuccessHandler(_.bind(this.onRaceNamesLoaded, this)).getRaceSheetNamesHTML(this.spreadsheetId);
        },

        loadRaceInfo_: function() {
            google.script.run.withSuccessHandler(_.bind(this.onRaceInfoLoaded, this)).sidebar_entries_race_info(this.spreadsheetId);
        },

        onRaceNamesLoaded: function(resp) {
            this.raceListData.set('options', ['Auto'].concat(resp));
            this.search.searchForm.setFormFieldsDisabled(false).focus();
        },

        onRaceInfoLoaded: function(resp) {
            this.classListData.set('options', resp.classes);
            this.clubListData.set('options', _.map(resp.clubs, function(clubArr) {
                return [clubArr[1], clubArr[0]];
            }));
            this.divisionsListData.set('options', resp.divisions);
            new RankingsUpdateCheck({
                el: '#rankings-update',
                spreadsheetId: this.spreadsheetId,
                lastUpdated: resp.lastUpdated,
                displayUpToDateConfirmation: false
            }).render();
        },

        onCrewFormSubmit: function(payload) {
            var raceName = payload.data.race, crewMembers = payload.tableData['crew-members'];
            google.script.run
                .withSuccessHandler(_.bind(this.onAddCrewSuccess, this))
                .withFailureHandler(_.bind(this.onAddCrewFailure, this))
                .withUserObject({
                    crewMembers: crewMembers
                })
                .sidebar_entries_add(
                    this.spreadsheetId,
                    crewMembers,
                    headings,
                    raceName
                );
            this.$('#' + this.el.id + '-messages').empty().removeClass();
        },

        onAddCrewSuccess: function(result, ctx) {
            this.crewDispatcher.trigger('submitSuccess');
            this.$('.results')
                .prepend('<p>Added <a href="#" data-row-num="' + result.rowNumber + '" data-sheet-name="' +
                    result.sheetName + '">' + result.boatNumber + ' ' + this.crewNames_(ctx.crewMembers) +
                    '</a> in ' + result.sheetName + '</p>');
            this.search.searchForm.focus();
        },

        onAddCrewFailure: function(error) {
            this.$('#' + this.el.id + '-messages')
                .addClass('message error')
                .html('<p class="icon icon-error">Sorry, a problem occurred adding the crew to the selected race: ' + error.message + '</p>');
            this.crewDispatcher.trigger('submitFailure');
        },

        crewNames_: function(members) {
            return members.map(function(o) {
                return rankingDetails.nameCellRenderer(null, null, o);
            }).join(' / ');
        },

        onAddedCrewClick: function(event) {
            var sheetName = $(event.target).attr('data-sheet-name'), rowNumber = $(event.target).attr('data-row-num');
            event.preventDefault();
            google.script.run
                .withSuccessHandler(function() {
                    google.script.host.editor.focus();
                })
                .sidebar_entries_link(sheetName, rowNumber);
        }

    });

    new AddEntryView({
        el: '#add-entry-widget',
        spreadsheetId: spreadSheetId,
        classListData: classListData,
        clubListData: clubListData
    }).render();

});