describe('Print Sheets dialog', function() {

    var emptySheetsResponse = {
        spreadsheet: {
            lastUpdated: '2018-10-23T13:44:18Z'
        },
        entriesSheets: [],
        resultsSheets: []
    };
    var sheetsResponse = {
        spreadsheet: {
            lastUpdated: '2018-10-23T13:44:18Z'
        },
        entriesSheets: [{
            id: '1',
            name: 'Elmbridge 2018 (Printable Entries)',
            lastUpdated: '2018-10-21T16:20:32Z'
        }],
        resultsSheets: [{
            id: '2',
            name: 'Elmbridge 2018 (Printable Results)',
            lastUpdated: '2018-10-24T14:41:55Z'
        }]
    };

    var spreadsheetId = 'my-spreadsheet-123';

    it('should exist', function () {
        expect(PrintDialog).toBeDefined();
    });

    describe('rendering', function() {

        beforeEach(function() {

            var fixturesPath = 'fixtures';
            if (typeof window.__karma__ !== 'undefined') {
                fixturesPath = 'base/test/ui/' + fixturesPath;
            }
            jasmine.getFixtures().fixturesPath = fixturesPath;
            loadFixtures('print-dialog.fixture.html');

        });

        describe('with no renditions', function() {

            beforeEach(function () {

                google.script.run.addData('dialog_print_getResultsInfo', emptySheetsResponse);

                this.view = new PrintDialog({
                    el: '#print-dialog',
                    spreadsheetId: spreadsheetId
                });
                this.view.render();
            });

            it('should render an empty list of entries', function () {
                expect(this.view.el.querySelectorAll('#printable-entries div.file-list > div').length).toBe(0);
            });

            it('should render the create entries button', function() {
                expect(this.view.el.querySelector('#printable-entries div.create')).toBeDefined();
            });

            it('should show the create entries button', function() {
                expect(this.view.el.querySelector('#printable-entries button.create').offsetHeight).toBeGreaterThan(0);
            });

            it('should render an empty list of results', function() {
                expect(this.view.el.querySelectorAll('#printable-results div.file-list > div').length).toBe(0);
            });

            it('should render the create results button', function() {
                expect(this.view.el.querySelector('#printable-results div.create')).toBeDefined();
            });

            it('should show the create results button', function() {
                expect(this.view.el.querySelector('#printable-results button.create').offsetHeight).toBeGreaterThan(0);
            });

            it('should show new renditions after create entries button is clicked', function() {

                google.script.run.addData('dialog_print_getResultsInfo', sheetsResponse);
                google.script.run.addData('dialog_print_createEntriesSheet', {});
                this.view.el.querySelector('#printable-entries button.create').click();

            });

            it('should show new renditions after create results button is clicked', function() {

                google.script.run.addData('dialog_print_getResultsInfo', sheetsResponse);
                google.script.run.addData('dialog_print_createResultsSheet', {});
                this.view.el.querySelector('#printable-results button.create').click();

            });

        });

        describe('with renditions', function() {

            beforeEach(function() {

                google.script.run.addData('dialog_print_getResultsInfo', sheetsResponse);

                this.view = new PrintDialog({
                    el: '#print-dialog',
                    spreadsheetId: spreadsheetId
                });
                this.view.render();
            });

            it('should render the list of entries', function() {
                expect(this.view.el.querySelectorAll('#printable-entries div.file-list > div').length).toBe(1);
            });

            it('should render the create entries button', function() {
                expect(this.view.el.querySelector('#printable-entries div.create')).toBeDefined(1);
            });

            it('should hide the create entries button', function() {
                expect(this.view.el.querySelector('#printable-entries button.create').offsetHeight).toBe(0);
            });

            it('should render the list of results', function() {
                expect(this.view.el.querySelectorAll('#printable-results div.file-list > div').length).toBe(1);
            });

            it('should render the create results button', function() {
                expect(this.view.el.querySelector('#printable-results div.create')).toBeDefined(1);
            });

            it('should hide the create results button', function() {
                expect(this.view.el.querySelector('#printable-results button.create').offsetHeight).toBe(0);
            });

            it('should show new renditions after update entry button is clicked', function() {

                google.script.run.addData('dialog_print_getResultsInfo', emptySheetsResponse);
                google.script.run.addData('dialog_print_updateEntriesSheet', {});
                this.view.el.querySelector('#printable-entries div.file-list > div:first-child .update').click();

                expect(this.view.el.querySelectorAll('#printable-entries div.file-list > div').length).toBe(0);

            });

            it('should show new renditions after update results button is clicked', function() {

                google.script.run.addData('dialog_print_getResultsInfo', emptySheetsResponse);
                google.script.run.addData('dialog_print_updateResultsSheet', {});
                this.view.el.querySelector('#printable-results div.file-list > div:first-child .update').click();

                expect(this.view.el.querySelectorAll('#printable-results div.file-list > div').length).toBe(0);

            });

            it('should update renditions after delete entries button is clicked', function() {

                google.script.run.addData('dialog_print_getResultsInfo', emptySheetsResponse);
                google.script.run.addData('dialog_print_deleteSheet', {});
                this.view.el.querySelector('#printable-entries div.file-list > div:first-child .delete').click();

                expect(this.view.el.querySelectorAll('#printable-entries div.file-list > div').length).toBe(0);

            });

        });

        describe('error handling', function() {

            it('should indicate an error in fetching renditions', function() {

                google.script.run.addError('dialog_print_getResultsInfo', {});
                this.view = new PrintDialog({
                    el: '#print-dialog',
                    spreadsheetId: spreadsheetId
                });
                this.view.render();

                expect(this.view.el.querySelector('#messages').innerHTML).toBe('<p class="icon icon-error">Sorry, an error occurred</p>');

            });

            it('should indicate an error when creating entries', function() {

                google.script.run.addData('dialog_print_getResultsInfo', sheetsResponse);
                google.script.run.addError('dialog_print_createEntriesSheet', {});
                this.view = new PrintDialog({
                    el: '#print-dialog',
                    spreadsheetId: spreadsheetId
                });
                this.view.render();
                this.view.el.querySelector('#printable-entries button.create').click();

                expect(this.view.el.querySelector('#messages').innerHTML).toBe('<p class="icon icon-error">Sorry, an error occurred</p>');

            });

            it('should indicate an error when updating entries', function() {

                google.script.run.addData('dialog_print_getResultsInfo', sheetsResponse);
                google.script.run.addError('dialog_print_updateEntriesSheet', {});
                this.view = new PrintDialog({
                    el: '#print-dialog',
                    spreadsheetId: spreadsheetId
                });
                this.view.render();
                this.view.el.querySelector('#printable-entries div.file-list > div:first-child .update').click();

                expect(this.view.el.querySelector('#messages').innerHTML).toBe('<p class="icon icon-error">Sorry, an error occurred</p>');

            });

            it('should indicate an error when deleting entries', function() {

                google.script.run.addData('dialog_print_getResultsInfo', sheetsResponse);
                google.script.run.addError('dialog_print_deleteSheet', {});
                this.view = new PrintDialog({
                    el: '#print-dialog',
                    spreadsheetId: spreadsheetId
                });
                this.view.render();
                this.view.el.querySelector('#printable-entries div.file-list > div:first-child .delete').click();

                expect(this.view.el.querySelector('#messages').innerHTML).toBe('<p class="icon icon-error">Sorry, an error occurred</p>');

            });

        });

    });

});