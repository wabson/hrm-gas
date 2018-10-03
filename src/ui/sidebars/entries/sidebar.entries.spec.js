describe('Entries sidebar', function() {

    it('should exist', function () {
        expect(AddEntryView).toBeDefined();
    });

    describe('rendering', function() {

        beforeEach(function () {
            google.script.run.addData('sidebar_entries_races', ['Sheet1', 'Sheet2']);
            google.script.run.addData('sidebar_entries_race_info', {
                classes: [],
                divisions: [],
                clubs: [],
                rankingsSize: 1048,
                lastUpdated: null,
                raceDate: ''
            });
            var spreadSheetId = 'my-spreadsheet-123';
            this.view = new AddEntryView({
                spreadsheetId: spreadSheetId,
                classListData: classListData,
                clubListData: clubListData
            });
            this.view.render();
        });

        it('should render the correct tabs', function () {
            expect(this.view.el.querySelectorAll('span.tab').length).toBe(2);
        });

        it('should render a checkbox to indicate a late entry', function() {
            expect(this.view.el.querySelector('input[name="isLate"][type="checkbox"]')).not.toBeNull();
        });

        it('should render late entry checkbox unchecked if race date not known', function() {
            expect(this.view.el.querySelector('input[name="isLate"][type="checkbox"]').checked).toBeFalsy();
        });

        it('should render late entry checkbox checked if race date today', function() {
            var now = new Date();
            var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            google.script.run.addData('sidebar_entries_race_info', {
                classes: [],
                divisions: [],
                clubs: [],
                rankingsSize: 1048,
                lastUpdated: null,
                raceDate: today
            });
            this.view.render();
            expect(this.view.el.querySelector('input[name="isLate"][type="checkbox"]').checked).toBeTruthy();
        });

        it('should render late entry checkbox checked if race date in the past', function() {
            var now = new Date();
            var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            var yesterday = new Date(today.getTime() - 3600 * 24 * 1000);
            google.script.run.addData('sidebar_entries_race_info', {
                classes: [],
                divisions: [],
                clubs: [],
                rankingsSize: 1048,
                lastUpdated: null,
                raceDate: yesterday
            });
            this.view.render();
            expect(this.view.el.querySelector('input[name="isLate"][type="checkbox"]').checked).toBeTruthy();
        });

        it('should render late entry checkbox unchecked if race date in the future', function() {
            var now = new Date();
            var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            var tomorrow = new Date(today.getTime() + 3600 * 24 * 1000);
            google.script.run.addData('sidebar_entries_race_info', {
                classes: [],
                divisions: [],
                clubs: [],
                rankingsSize: 1048,
                lastUpdated: null,
                raceDate: tomorrow
            });
            this.view.render();
            expect(this.view.el.querySelector('input[name="isLate"][type="checkbox"]').checked).toBeFalsy();
        });

    });

});