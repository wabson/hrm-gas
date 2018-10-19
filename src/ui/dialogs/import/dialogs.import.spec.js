describe('Import dialog', function() {

    it('should exist', function () {
        expect(ImportDialog).toBeDefined();
    });

    describe('rendering', function() {

        var data = {};
        var document = {};
        data[google.picker.Response.ACTION] = google.picker.Action.PICKED;
        data[google.picker.Response.DOCUMENTS] = [ document ];
        document[google.picker.Document.ID] = 'testId';
        document[google.picker.Document.NAME] = 'Test Doc';
        document[google.picker.Document.URL] = 'http://test.doc/testId';

        var importResults = {
            numCrews: 3,
            totalPaid: 0,
            sheets: [{
                name: 'Div1',
                crews: {
                    numCrews: 1,
                    crews: [{}],
                    places: [{}],
                    totalPaid: 0
                }
            }, {
                name: 'Div2',
                crews: {
                    numCrews: 2,
                    crews: [{}, {}],
                    places: [{}, {}],
                    totalPaid: 0
                }
            }]
        }, importResultsSingular = {
            numCrews: 1,
            totalPaid: 0,
            sheets: [{
                name: 'Div1',
                crews: {
                    numCrews: 1,
                    places: [{}],
                    totalPaid: 0
                }
            }]
        }, importResultsEmpty = {
            numCrews: 0,
            totalPaid: 0,
            sheets: []
        };

        var testToken = 'token123';

        beforeEach(function () {
            var fixturesPath = 'fixtures';
            if (typeof window.__karma__ !== 'undefined') {
                fixturesPath = 'base/test/ui/' + fixturesPath;
            }
            jasmine.getFixtures().fixturesPath = fixturesPath;
            loadFixtures('import-dialog.fixture.html');
            //google.script.run.addData('dialog_import_getOAuthToken', testToken);
            var spreadSheetId = 'my-spreadsheet-123';
            this.view = new ImportDialog({
                el: '#import-dialog',
                spreadsheetId: spreadSheetId,
                pickerApiKey: 'apiKey123',
                dialogWidth: 400,
                dialogHeight: 200
            });
            this.view.render();
        });

        describe('select file button', function() {

            it('should render select button', function () {
                expect(this.view.el.querySelectorAll('input#btn-select-file').length).toBe(1);
            });

            it('should make select button disabled initially', function () {
                expect(this.view.el.querySelector('input#btn-select-file').disabled).toBe(true);
            });

            it('should enable the select button when the Picker API has loaded', function () {
                this.view.onPickerApiLoaded();
                expect(this.view.el.querySelector('input#btn-select-file').disabled).toBe(false);
            });

            it('should indicate an error occurred if the OAuth token could not be loaded', function() {
                google.script.run.addError('dialog_import_getOAuthToken', 'Bad session');
                this.view.onPickerApiLoaded();
                this.view.$('input#btn-select-file').click();
                expect(this.view.el.querySelector('div#messages')).toContainText('Sorry, an error occurred');
            });

        });

        describe('after picking a file', function() {

            it('should populate the hidden input with the document ID', function() {
                this.view.pickerCallback(data);
                expect(this.view.el.querySelector('input[name="sourceFileId"]').value).toBe('testId');
            });

            it('should enable the Import button', function() {
                this.view.pickerCallback(data);
                expect(this.view.el.querySelector('input#btn-import').disabled).toBe(false);
            });

        });

        describe('entry set controls', function() {

            it('should render form controls', function () {
                expect(this.view.el.querySelectorAll('input[name=createEntrySet]').length).toBe(1);
                expect(this.view.el.querySelectorAll('input[name=entrySetName]').length).toBe(1);
            });

            it('should have create entryset unchecked initially', function () {
                expect(this.view.el.querySelector('input[name=createEntrySet]').checked).toBe(false);
            });

            it('should render name input disabled initially', function () {
                expect(this.view.el.querySelector('input[name=entrySetName]').disabled).toBe(true);
            });

            it('should enable name input after checkbox is checked', function () {
                this.view.$el.find('input[name=createEntrySet]').prop('checked', true).trigger('change');
                expect(this.view.el.querySelector('input[name=entrySetName]').disabled).toBe(false);
            });

        });

        describe('import button', function() {

            it('should have the Import button disabled initially', function() {
                expect(this.view.el.querySelector('input#btn-import').disabled).toBe(true);
            });

        });

        describe('import action', function() {

            beforeEach(function() {
                this.view.pickerCallback(data);
            });

            it('should show the results after clicking import', function() {
                google.script.run.addData('dialog_import_importEntries', importResults);
                this.view.pickerCallback(data);
                this.view.$('input#btn-import').trigger('click');
                expect(this.view.el.querySelector('#import-results .summary').innerHTML)
                    .toBe('Imported 3 crews from Test Doc');
                expect(this.view.el.querySelectorAll('#import-results ul li').length).toBe(2);
                expect(this.view.el.querySelectorAll('#import-results ul li')[0].innerHTML)
                    .toBe('Added 1 crew to Div1');
                expect(this.view.el.querySelectorAll('#import-results ul li')[1].innerHTML)
                    .toBe('Added 2 crews to Div2');
            });

            it('should show the results from a single import after clicking import', function() {
                google.script.run.addData('dialog_import_importEntries', importResultsSingular);
                this.view.pickerCallback(data);
                this.view.$('input#btn-import').trigger('click');
                expect(this.view.el.querySelector('#import-results .summary').innerHTML)
                    .toBe('Imported 1 crew from Test Doc');
                expect(this.view.el.querySelectorAll('#import-results ul li').length).toBe(1);
                expect(this.view.el.querySelectorAll('#import-results ul li')[0].innerHTML)
                    .toBe('Added 1 crew to Div1');
            });

            it('should show no results were imported', function() {
                google.script.run.addData('dialog_import_importEntries', importResultsEmpty);
                this.view.pickerCallback(data);
                this.view.$('input#btn-import').trigger('click');
                expect(this.view.el.querySelector('#import-results .summary').innerHTML)
                    .toBe('No crews found in Test Doc');
                expect(this.view.el.querySelectorAll('#import-results ul li').length).toBe(0);
            });

            it('should show a message if an error occurs', function() {
                google.script.run.addError('dialog_import_importEntries', 'Error');
                this.view.$('form').trigger('submit');
                expect(this.view.el.querySelector('div#messages').innerHTML).toContainText('Sorry, an error occurred');
            });

        });

    });

});