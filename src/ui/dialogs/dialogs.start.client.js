<script>
function onRaceTemplatesLoaded(data) {
    var selectEl = $('#select-race-type'), sheets = data, sheet, html = '';
    for (var i = 0; i<sheets.length; i++) {
        sheet = sheets[i];
        html += '<option name="'+sheet.id+'">' + sheet.name + '</option>';
    }
    selectEl.append(html).prop('disabled', false);
    $('#btn-start').prop('disabled', false);
}

$(function() {

    $('#btn-start').click(function(event) {
        event.preventDefault();
        google.script.run.withSuccessHandler(function() {
            google.script.host.close();
        }).dialog_start_submit();
    });

    $('#btn-cancel').click(function(event) {
        event.preventDefault();
        google.script.host.close();
    });

    google.script.run.withSuccessHandler(onRaceTemplatesLoaded).dialog_start_getRaceTemplates();
});
</script>