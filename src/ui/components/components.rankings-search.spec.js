/* jshint sub:true */

describe('Rankings search component', function() {

    describe('HaslerRankingDetails', function() {

        it('should exist', function() {
            expect(HaslerRankingDetails).toBeDefined();
        });

        describe('rendering field values', function() {

            beforeEach(function() {
                this.item = {
                    'First name': 'Alice',
                    'Surname': 'Jones',
                    'BCU Number': '12345',
                    'Expiry': '2016-05-12',
                    'Class': 'VF',
                    'Club': 'ROY',
                    'Div': 7
                };
                this.haslerDetails = new HaslerRankingDetails({});
            });

            it('should render the full name', function() {
                expect(this.haslerDetails.nameCellRenderer(null, null, this.item)).toBe('Jones, Alice');
            });

            it('should render the class and club', function() {
                expect(this.haslerDetails.classCellRenderer(null, null, this.item)).toBe('ROY, VF');
            });

            it('should render the class name as an abbr', function() {
                this.haslerDetails.classListData = new Backbone.Model({
                    options: [[
                        'VF', 'Veteran Female'
                    ]]
                });
                expect(this.haslerDetails.classCellRenderer(null, null, this.item))
                    .toBe('ROY, <abbr title="Veteran Female">VF</abbr>');
            });

            it('should render the class name without an abbr when value not present', function() {
                this.haslerDetails.classListData = new Backbone.Model({
                    options: [[
                        'VFZ', 'Veteran Female Z'
                    ]]
                });
                expect(this.haslerDetails.classCellRenderer(null, null, this.item)).toBe('ROY, VF');
            });

            it('should render the club name as an abbr', function() {
                this.haslerDetails.clubListData = new Backbone.Model({
                    options: [[
                        'ROY', 'Royal'
                    ]]
                });
                expect(this.haslerDetails.classCellRenderer(null, null, this.item))
                    .toBe('<abbr title="Royal">ROY</abbr>, VF');
            });

            it('should render the club name without an abbr when value not present', function() {
                this.haslerDetails.clubListData = new Backbone.Model({
                    options: [[
                        'RIC', 'Richmond'
                    ]]
                });
                expect(this.haslerDetails.classCellRenderer(null, null, this.item)).toBe('ROY, VF');
            });

            it('should render the BCU number', function() {
                expect(this.haslerDetails.bcuCellRenderer(null, null, this.item)).toBe('12345');
            });

            it('should render the expiry date', function() {
                this.haslerDetails.raceDate = new Date(2016, 3, 28);
                expect(this.haslerDetails.expiryCellRenderer(this.item['Expiry'], null, this.item)).toBe('12 May 2016');
            });

            it('should render an empty cell when the expiry date is not available', function() {
                this.item['Expiry'] = '';
                expect(this.haslerDetails.expiryCellRenderer(this.item['Expiry'], null, this.item)).toBe('');
            });

            it('should render the expiry date with a warning when expired', function() {
                this.haslerDetails.raceDate = new Date(2016, 4, 28);
                expect(this.haslerDetails.expiryCellRenderer(this.item['Expiry'], null, this.item))
                    .toBe('<span class="warning">12 May 2016</span>');
            });

            it('should return true for a valid BCU number with just numbers', function() {
                expect(this.haslerDetails.isBCUNumberValid(null, this.item)).toBe(true);
                expect(this.haslerDetails.isBCUNumberValid(null, {
                    'BCU Number': 'RIC/567'
                })).toBe(true);
                expect(this.haslerDetails.isBCUNumberValid(null, {
                    'BCU Number': 'INT'
                })).toBe(true);
                expect(this.haslerDetails.isBCUNumberValid(null, {
                    'BCU Number': 'ET WIN'
                })).toBe(true);
                expect(this.haslerDetails.isBCUNumberValid(null, {
                    'BCU Number': 'SCA 2888'
                })).toBe(true);
                expect(this.haslerDetails.isBCUNumberValid(null, {
                    'BCU Number': 'WCA 3267'
                })).toBe(true);
            });

            it('should return a renderer for each column', function() {
                var renderers = this.haslerDetails.getCellRenders();
                expect(renderers['Name']).toBeDefined();
                expect(renderers['Class']).toBeDefined();
                expect(renderers['Div']).toBeDefined();
                expect(renderers['BCU #']).toBeDefined();
                expect(renderers['Expiry']).toBeDefined();
            });

        });

    });

    describe('RankingsSearchForm', function() {

        it('should exist', function() {
            expect(RankingsSearchForm).toBeDefined();
        });

        describe('rendering', function() {

            it('should render a basic form', function() {
                var form = new RankingsSearchForm({}).render();
                expect(form.el).toContainElement('div.block.form-group label');
                expect(form.el.querySelector('label').innerHTML).toBe('Search rankings');
                expect(form.el).toContainElement('div.block.form-group input[type=search]');
            });

            it('should render custom label content', function() {
                var form = new RankingsSearchForm({
                    searchPrompt: 'Custom label'
                }).render();
                expect(form.el.querySelector('label').innerHTML).toBe('Custom label');
            });

        });

        describe('searching', function() {

            beforeEach(function() {
                this.form = new RankingsSearchForm({
                    searchPrompt: 'Custom label',
                    scriptMethod: 'searchRankings',
                    spreadsheetId: 'blah123',
                    data: new Backbone.Model()
                }).render();
                google.script.run.addData('searchRankings', [{
                    field1: 'Bob',
                    field2: 'Anne'
                }]);
            });

            it('should not submit the form if the query field is empty', function() {
                var changedValues;
                this.form.data.on('change:values', function(items) {
                    changedValues = items;
                });
                this.form.$el.submit();
                expect(changedValues).not.toBeDefined();
            });

            it('should update the data model "values" attribute when search results received', function() {
                var changedValues;
                this.form.data.on('change:values', function(items) {
                    changedValues = items;
                });
                this.form.$el.find('input').val('searchTerm1');
                this.form.$el.submit();
                expect(changedValues).toBeDefined();
            });

        });

    });

});

describe('Rankings update check component', function() {

    describe('RankingsUpdateCheck', function () {

        it('should exist', function () {
            expect(RankingsUpdateCheck).toBeDefined();
        });

        it('should render a div element', function() {
            this.view = new RankingsUpdateCheck({});
            expect(this.view.el).toEqual('div');
        });

        it('should render an empty div initially', function() {
            /* jshint camelcase: false */
            google.script.run.sidebar_rankings_last_updated = function() {
            };
            this.view = new RankingsUpdateCheck({}).render();
            expect(this.view.el.innerHTML).toEqual('');
        });

        describe('Check for new rankings', function() {

            beforeEach(function() {
                var fixturesPath = 'fixtures';
                if (typeof window.__karma__ !== 'undefined') {
                    fixturesPath = 'base/test/ui/' + fixturesPath;
                }
                jasmine.getFixtures().fixturesPath = fixturesPath;
                loadFixtures('rankings-search.fixture.html');
                this.view = new RankingsUpdateCheck({
                    el: '#rankings-update-test',
                    lastUpdated: '2016-06-03'
                });
            });

            it('should show confirmation that the latest version of the ranking list is present when updated date is ' +
                'the same', function() {
                google.script.run.addData('sidebar_rankings_last_updated', '2016-06-03');
                this.view.render();
                expect(this.view.el.innerText).toEqual('You have the latest version of the ranking list');
            });

            it('should show confirmation that the latest version of the ranking list is present when updated date is ' +
                'later than web date', function() {
                google.script.run.addData('sidebar_rankings_last_updated', '2016-05-03');
                this.view.render();
                expect(this.view.el.innerText).toEqual('You have the latest version of the ranking list');
            });

            it('should not show confirmation that the latest version of the ranking list is present when configured',
                function() {
                    google.script.run.addData('sidebar_rankings_last_updated', '2016-06-03');
                    this.view.initialize({
                        el: '#rankings-update-test',
                        lastUpdated: '2016-06-03',
                        displayUpToDateConfirmation: false
                    });
                    this.view.render();
                    expect(this.view.el.innerText).toEqual('');
                });

            it('should indicate a newer version of the ranking list is available', function() {
                google.script.run.addData('sidebar_rankings_last_updated', '2016-06-04');
                this.view.render();
                expect(this.view.el.innerText)
                    .toEqual('A new version of the ranking list is available updated 4 Jun 2016');
            });

            it('should indicate a newer version of the ranking list is available when no last updated date is known',
                function() {
                    google.script.run.addData('sidebar_rankings_last_updated', '2016-06-03');
                    this.view.initialize({});
                    this.view.render();
                    expect(this.view.el.innerText)
                        .toEqual('A new version of the ranking list is available updated 3 Jun 2016');
                });

            it('should indicate errors encountered when checking for a newer version of the ranking list', function() {
                google.script.run.addError('sidebar_rankings_last_updated', { message: 'Error text 777' });
                this.view.render();
                expect(this.view.el.innerText).toEqual('Sorry, an error occurred. Please try again later.');
            });

        });

    });

    describe('Rankings search component', function() {

        describe('RankingsSearch', function () {

            it('should exist', function () {
                expect(RankingsSearch).toBeDefined();
            });

            it('should render a div element', function () {
                this.view = new RankingsSearch({});
                expect(this.view.el).toEqual('div');
            });

            it('should render a search form, results form and messages container', function () {
                var viewId = 'my-view';
                this.view = new RankingsSearch({
                    id: viewId
                }).render();
                expect(this.view.el).toContainElement('form.rankings-search-form');
                expect(this.view.el).toContainElement('form.rankings-search-results');
                expect(this.view.el).toContainElement('div#my-view-messages');
            });

            it('should render default buttons on the results selection form', function () {
                var viewId = 'my-view';
                this.view = new RankingsSearch({
                    id: viewId
                }).render();
                var searchFormEl = this.view.el.querySelector('form.rankings-search-results'),
                    buttonEls = searchFormEl.querySelectorAll('button');
                expect(buttonEls.length).toBe(2);
                expect(buttonEls[0]).toEqual('button[type=submit]');
                expect(buttonEls[0].innerHTML).toBe('Add');
                expect(buttonEls[1]).toEqual('button[type=reset]');
                expect(buttonEls[1].innerHTML).toBe('Clear');
            });

            it('should render custom buttons on the results selection form', function () {
                var viewId = 'my-view';
                this.view = new RankingsSearch({
                    id: viewId,
                    resultsButtons: [
                        new FormButton({
                            type: 'submit',
                            text: 'Custom Submit'
                        }),
                        new FormButton({
                            type: 'reset',
                            text: 'Custom Reset'
                        })
                    ]
                }).render();
                var searchFormEl = this.view.el.querySelector('form.rankings-search-results'),
                    buttonEls = searchFormEl.querySelectorAll('button');
                expect(buttonEls.length).toBe(2);
                expect(buttonEls[0]).toEqual('button[type=submit]');
                expect(buttonEls[0].innerHTML).toBe('Custom Submit');
                expect(buttonEls[1]).toEqual('button[type=reset]');
                expect(buttonEls[1].innerHTML).toBe('Custom Reset');
            });

            it('should render search results submit button disabled initially but not reset', function () {
                var viewId = 'my-view';
                this.view = new RankingsSearch({
                    id: viewId,
                    resultsButtons: [
                        new FormButton({
                            type: 'submit',
                            text: 'Custom Submit'
                        }),
                        new FormButton({
                            type: 'reset',
                            text: 'Custom Reset'
                        })
                    ]
                }).render();
                expect(this.view.el.querySelector('form.rankings-search-results button[type=submit]')).toBeDisabled();
                expect(this.view.el.querySelector('form.rankings-search-results button[type=reset]')).not.
                    toBeDisabled();
            });

            it('should enable edit-member button only when single result selected', function () {
                var dispatcher = _.clone(Backbone.Events);
                var viewId = 'my-view';
                this.view = new RankingsSearch({
                    id: viewId,
                    dispatcher: dispatcher,
                    resultsButtons: [
                        new FormButton({
                            type: 'submit',
                            text: 'Custom Submit'
                        }),
                        new FormButton({
                            id: 'edit-member',
                            type: 'button',
                            text: 'Edit',
                            disabled: true
                        }),
                        new FormButton({
                            type: 'reset',
                            text: 'Custom Reset'
                        })
                    ]
                }).render();
                expect(this.view.el.querySelector('form.rankings-search-results button#edit-member')).toBeDisabled();
                dispatcher.trigger('selectedDataChange', {
                    selected: [{}]
                });
                expect(this.view.el.querySelector('form.rankings-search-results button#edit-member')).not.
                    toBeDisabled();
                dispatcher.trigger('selectedDataChange', {
                    selected: [{}, {}]
                });
                expect(this.view.el.querySelector('form.rankings-search-results button#edit-member')).toBeDisabled();
            });

        });
    });
});