Hasler Race Management on Google Apps Script
============================================

![Travis build](https://travis-ci.org/wabson/hrm-gas.svg?branch=master)

An alternative but unofficial version of the Hasler Race Management (HRM) Excel add-on used to produce and report
results from the Hasler series of marathon canoe races in the UK.

The project runs as a Google Sheets Add-on and adds some sidebars and dialogs for creating HRM-compatible sheets in
Google Sheets, managing rankings and adding entries. Spreadsheets can be exported in Microsoft Excel `.xlsx` format
for importing into the official HRM.

Developed initially as a way to supply race entries in HRM-compatible format the system has since been used within
Richmond Canoe Club to run our own races.

Installing
----------

npm and gulp are used to build the modules into a single entry point compatible with Google Sheets and the build
supports publishing to multiple environments.

To install the project dependencies from npm and create a new environment named `dev`

    npm install
    mkdir -p build/dev

Follow the *Get Google Drive Credentials*, *Authenticate `gapps`* and *Initialize your project* steps of the
node-google-apps-script [Quickstart](https://www.npmjs.com/package/node-google-apps-script#quickstart), then run
gulp to upload the files

    cd build/dev
    gulp upload-latest --env=dev

You can now navigate to the Apps Script file you created when initialising the project and select *Add-ons* >
*Test as Add-on* from the menu.