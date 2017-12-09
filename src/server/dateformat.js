/**
 * Format the given finish time, which may be a Date object or a string, e.g. 'dns'
 *
 * @param {Date|string} Input value to format
 * @return {string} row value to display for the elapsed time
 */
function formatTime(val) {
  if (val) {
    if (typeof val == "string") {
      return val.toLowerCase();
    } else {
      return "" + val.getHours() + ":" + formatTimePart(val.getMinutes()) + ":" + formatTimePart(val.getSeconds());
    }
  } else {
    return "";
  }
}

/**
 * Format the given date value, which may be a Date object or a string, e.g. 'dns'
 *
 * @param {Date|string} Input value to format
 * @return {string} row value to display for the given date
 */
function formatDate(val) {
  if (val) {
    if (typeof val == "string") {
      return val.toLowerCase();
    } else {
      return formatTimePart(val.getDate()) + "/" + formatTimePart(val.getMonth() + 1) + "/" + formatTimePart(val.getFullYear());
    }
  } else {
    return "";
  }
}

/**
 * Format a time part as two-digits, padding with a leading zero if the input value is less than ten.
 *
 * @param {int} p Time part, e.g. number of hours
 * @return {string} Formatted time part, with leading zero added if necessary
 */
function formatTimePart(p) {
  return (p < 10 ? "0" : "") + p;
}

function formatTimeAbs(t) {
  if (t === '') {
    return '';
  }
  var diffMs, absTime, baseTime = new Date('1899/12/30 00:00:00');
  diffMs = t - baseTime;
  absTime = new Date(baseTime.getTime() + Math.abs(diffMs));
  return (diffMs < 0 ? '-' : '') + formatTime(absTime);
}

function formatTimePenalty(t) {
  if (t !== '') {
    return 'includes ' + (t.indexOf('-') === 0 ? 'allowance of ' : 'penalty of ') + t.replace(/^\-/, '');
  } else {
    return '';
  }
}

function parseDate(dateStr) {
  if (dateStr === null) {
    return null;
  }
  var parts;
  var parsedDate;
  if (dateStr.match(/\d{4}-\d{2}-\d{2}/)) {
    parts = dateStr.split('-');
    parsedDate =  new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else if (dateStr.match(/\d{2}\/\d{2}\/\d{4}/)) {
    parts = dateStr.split('/');
    parsedDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
  } else if (dateStr.match(/\d{2}\/\d{2}\/\d{2}/)) {
    parts = dateStr.split('/');
    parsedDate = new Date(2000 + parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
  } else {
    throw "Unsupported date format for '" + dateStr + "' - must be YYYY-MM-DD or DD/MM/YY[YY]";
  }
  var timeMatch = dateStr.match(/(\d{2}):(\d{2}):(\d{2})/);
  if (timeMatch) {
    parsedDate.setHours(timeMatch[1]);
    parsedDate.setMinutes(timeMatch[2]);
    parsedDate.setSeconds(timeMatch[3]);
  }
  return parsedDate;
}

exports.formatDate = formatDate;
exports.formatTime = formatTime;
exports.formatTimeAbs = formatTimeAbs;
exports.formatTimePart = formatTimePart;
exports.formatTimePenalty = formatTimePenalty;
exports.parseDate = parseDate;