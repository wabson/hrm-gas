(function() {
    var runner = google.script.run;
    runner.addData('dialog_start_getRaceTemplates', [{
        id: '1',
        type: 'HRM',
        name: 'Hasler Race'
    }, {
        id: '2',
        type: 'NRM',
        name: 'Nationals'
    }]);
    runner.addData('dialog_start_getRaceInfo', {
        raceName: 'Test Race',
        raceType: 'HRM',
        regionId: 'MID'
    });
    runner.addData('dialog_start_submit', {});
    runner.addData('sidebar_rankings_import', {
        lastUpdated: '2016-04-26',
        rankingsSize: 48910
    });
    runner.addData('sidebar_rankings_info', {
        lastUpdated: '2016-04-24',
        rankingsSize: 32323
    });
    runner.addData('sidebar_rankings_last_updated', '2016-04-23');
    runner.addData('sidebar_entries_search', [{
        'First name': 'WILLIAM',
        'Surname': 'ABSON',
        'Club': 'RIC',
        'Class': 'S',
        'BCU Number': 231636,
        'Expiry': '2016-02-03',
        'Division': 4
    },{
        'First name': 'MIKE',
        'Surname': 'PIGOTT',
        'Club': 'RIC',
        'Class': 'S',
        'BCU Number': '49662/F',
        'Expiry': '2016-07-04',
        'Division': 5
    }]);
    runner.addData('sidebar_entries_add', {
        boatNumber: 301,
        crewName: 'ABSON',
        sheetName: 'Div1'
    });
    runner.addData('sidebar_entries_race_info', {
        divisions: ['1', '2', '3', '4', '5', '6'],
        classes: [
            ['S', 'Senior Male'],
            ['J', 'Junior Male'],
            ['V', 'Veteran Male']
        ],
        clubs: [['Addlestone CC', 'ADS', 'LS'], ['Richmond CC', 'RIC', 'LS'], ['Royal CC', 'ROY', 'LS']],
        raceDate: '2016-05-26'
    });
    runner.addData('sidebar_entries_races', ['Div1', 'Div2', 'Div3']);
    runner.addData('dialog_raceDetails_get', {
        raceName: 'Test Race',
        raceRegion: 'MID',
        raceDate: '2016-05-26',
        entrySenior: 8,
        entryJunior: 6,
        entryLightning: 2.5,
        entrySeniorLate: 10,
        entryJuniorLate: 8,
        entryLightningLate: 2.5
    });
    runner.addData('dialog_import_getOAuthToken', 'blahToken');
})();