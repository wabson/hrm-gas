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
      return formatTimePart(val.getDate()) + "/" + formatTimePart(val.getMonth() + 1) + "/" + formatTimePart(val.getYear());
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

exports.formatDate = formatDate;
exports.formatTime = formatTime;
exports.formatTimeAbs = formatTimeAbs;
exports.formatTimePart = formatTimePart;