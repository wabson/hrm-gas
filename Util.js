function parseDate(dateStr) {
    var parts;
    if (dateStr.match(/\d{4}-\d{2}-\d{2}/)) {
        parts = dateStr.split('-');
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else if (dateStr.match(/\d{2}\/\d{2}\/\d{4}/)) {
        parts = dateStr.split('/');
        return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    } else if (dateStr.match(/\d{2}\/\d{2}\/\d{4}/)) {
        parts = dateStr.split('/');
        return new Date(2000 + parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
    } else {
        throw "Unsuppored date format for '" + dateStr + "' - must be YYYY-MM-DD or DD/MM/YY[YY]";
    }
}