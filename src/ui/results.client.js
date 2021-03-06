var newData = null, lastUpdated = null;
var timeRe = /\d{1,2}:\d{2}:\d{2}/;

// The code in this function runs when the page is loaded.
$(function() {
  // Initial data load
  if (show == 'entries') {
    if (race === '') {
      google.script.run.withSuccessHandler(onDataLoaded).getRaceEntriesSummary(key);
    } else {
      google.script.run.withSuccessHandler(onDataLoaded).getRaceEntries(key, race);
    }
  } else if (show == 'starters') {
    google.script.run.withSuccessHandler(onDataLoaded).getRaceStarters(key);
  } else if (show == 'results') {
    if (race === '') {
      google.script.run.withSuccessHandler(onDataLoaded).getRaceResultsSummary(key);
    } else {
      google.script.run.withSuccessHandler(onDataLoaded).getRaceResults(key, race);
    }
  } else {
    showLinks(key);
  }
});

function getScriptUrl(params) {
  var scriptUrl = url;
  if (params) {
    var initialSep = scriptUrl.indexOf('?') == -1 ? '?' : '&', pairs = [];
    for (var k in params) {
      if (params.hasOwnProperty(k)) {
        pairs.push(k + '=' + params[k]);
      }
    }
    scriptUrl += initialSep + pairs.join('&')
  }
  return scriptUrl;
}

function isScrollingEnabled() {
  return scroll == "1" || scroll == "true";
}

function onDataLoaded(data) {
  $('#messages').hide();
  if (show == 'entries') {
    if (race === '') {
      showEntriesSummary(data.races);
    } else {
      showEntries(data.races, true);
    }
  } else if (show == 'starters') {
    showEntries(data.races, false);
  } else {
    if (race === '' && !isScrollingEnabled()) {
      showSummaryData(data);
    } else {
      showData(data);
    }
  }
  if (isScrollingEnabled()) {
    console.log("Starting animation");
    startAnimation();
    // Check for updates
    window.setTimeout(checkLastUpdated, checkInterval*1000);
  } else {
    $('#results-data').hide().css('visibility', 'visible').fadeIn(600);
  }
  if (data.lastUpdated) {
    lastUpdated = data.lastUpdated;
  }
}

function checkLastUpdated() {
  google.script.run.withSuccessHandler(onLastUpdatedSuccess).getLastUpdated(key);
}

function onLastUpdatedSuccess(updated) {
  if (updated !== null && updated != lastUpdated) {
    reloadData();
  }
  window.setTimeout(checkLastUpdated, checkInterval*1000); // Queue up the function again
}

function reloadData() {
  console.log("Reload data");
  google.script.run.withSuccessHandler(onDataReloaded).getRaceResultsSummary(key);
}

function onDataReloaded(data) {
  if (isScrollingEnabled()) {
    $('#results').fadeOut(900, function() {
      stopAnimation();
      showData(data);
      $('#results').delay(900).show(0, function() {
        startAnimation();
      });
    });
  } else {
    if (show == 'entries') {
      if (race === '') {
        showEntriesSummary(data.races);
      } else {
        showEntries(data.races, true);
      }
    } else if (show == 'starters') {
      showEntries(data.races, false);
    } else {
      if (race === '') {
        showSummaryData(data);
      } else {
        showData(data);
      }
    }
  }
  if (data.lastUpdated) {
    lastUpdated = data.lastUpdated;
  }
}

function startAnimation() {
  var resultsHeight = $('#results').height(), screenHeight = window.innerHeight;
  if (resultsHeight > window.innerHeight) {
    // Set results to be just off the page and make them visible
    $('#results').css({
      paddingTop: '' + screenHeight + 'px',
      animationDuration: '' + ((resultsHeight + screenHeight) / 80) + 's' // 80 pixels per second, only works in FF for now
    });
    $('#results-data').css({
      visibility: 'visible'
    });
    // Start scrolling
    $('#page').addClass('scrolling');
    // Hard-code the container height to avoid messing up the percentage-based position on the child
    $('#results-container').css('height', '' + (resultsHeight + screenHeight) + 'px');
  } else {
    $('#results-data').css({
      visibility: 'visible'
    });
  }
  $('#results').addClass('scrolling-results');
}

function stopAnimation() {
  $('#results').removeClass('scrolling-results');
}

function showData(data) {
  if (data.races) {
    showResults(data.races, {
      showClubPoints: data.clubPoints && data.clubPoints.length,
      showPdTimes: data.pdTimes && data.pdTimes.length,
      showNotes: showNotes == "1" || showNotes == "true"
    });
  }
  if (data.pdTimes) {
    showPdTimes(data.pdTimes);
  }
  if (data.clubPoints) {
    showClubPoints(data.clubPoints);
  }
  if (data.lightningPoints) {
    showLightningPoints(data.lightningPoints);
  }
}

function showSummaryData(data) {
  if (data.races) {
    showResultsSummary(data.races, {
      allowPd: data.allowPd
    });
  }
  if (data.pdTimes) {
    showPdTimes(data.pdTimes);
  }
  if (data.clubPoints) {
    showClubPoints(data.clubPoints);
  }
  if (data.lightningPoints) {
    showLightningPoints(data.lightningPoints);
  }
}

function showResults(races, options) {
  var div = $('#results-races'), html = '';
  var ssKey = key;
  $('#file-links').html('<p><a href="' + getScriptUrl({ ssKey: key, show: 'results' }) + '" target="_top">&lt;&lt; Back up</a></p>');
  div.empty();
  for (var i = 0; i < races.length; i++) {
    html += formatRaceResults(races[i], options);
  }
  if (html === '') {
    html = isScrollingEnabled() ? '<p>Results will be displayed here as they become available</p>' : '<p>No results to display</p>';
  }
  div.append(html);
}

function formatRaceResults(race, options) {
  options = options || {};
  var html = '';
  if (race.results && race.results.length > 0) {
    html += ('<table>');
    html += ('<caption>' + race.name + '</caption>');
    html += ('  <tr>');
    html += ('     <th>Position</th>');
    html += ('     <th>Name</th>');
    html += ('     <th>Club</th>');
    html += ('     <th>Class</th>');
    html += ('     <th>Div</th>');
    html += ('     <th>Time</th>');
    if (options.showClubPoints)
      html += ('     <th>Points</th>');
    if (options.showPdTimes)
      html += ('     <th>P/D</th>');
    if (options.showNotes) {
      html += ('     <th>Notes</th>');
    }
    html += ('  </tr>');
    for (var j = 0; j < race.results.length; ++j) {
      if (race.results[j].time) {
        html += ('  <tr>');
        html += ('     <td>' + race.results[j].posn + '</td>');
        html += ('     <td>' + race.results[j].names.join("<br />").toUpperCase() + '</td>');
        html += ('     <td>' + race.results[j].clubs.join("<br />").toUpperCase() + '</td>');
        html += ('     <td>' + race.results[j].classes.join("<br />").toUpperCase() + '</td>');
        html += ('     <td>' + race.results[j].divs.join("<br />") + '</td>');
        html += ('     <td>' + race.results[j].time + '</td>');
        if (options.showClubPoints)
          html += ('     <td>' + race.results[j].points.join("<br />") + '</td>');
        if (options.showPdTimes)
          html += ('     <td>' + race.results[j].pd.join("<br />") + '</td>');
        if (options.showNotes) {
          html += ('     <td>' + races[i].results[j].notes.join("<br />") + '</td>');
        }
        html += ('       </tr>');
      }
    }
    html += ('</table>');
  }
  return html;
}

function _testDidStart(result) {
  return timeRe.test(result.startTime);
}

function _testDidFinish(result) {
  return timeRe.test(result.finishTime);
}

function _testIsComplete(result) {
  return result.time;
}

function _getFinishTime(result) {
  return result.finishTime;
}

function showResultsSummary(races, options) {
  options = options || {};
  var div = $('#results-summary'), html = '';
  var ssKey = key;
  var summaryItems = [];
  $('#file-links').html('<p><a href="' + getScriptUrl({ key: ssKey }) + '" target="_top">&lt;&lt; Back up</a></p>');
  div.empty();
  for (var i = 0; i < races.length; i++) {
    var starters, finishers, complete, finishTimes, startTime = null,
      first = null,
      last = null,
      numStarters = 0;
    starters = races[i].results.filter(_testDidStart);
    finishers = starters.filter(_testDidFinish);
    complete = starters.filter(_testIsComplete);
    finishTimes = finishers.map(_getFinishTime).sort();
    first = finishTimes[0];
    last = finishTimes.reverse()[0];
    numStarters = starters.length;
    if (numStarters === 0) {
      continue;
    }
    startTime = starters[0].startTime;
    summaryItems.push({
      name: races[i].name,
      completeness: '' + complete.length + '/' + numStarters,
      start: startTime,
      first: first || '-',
      last: last || '-'
    });
  }
  function compareSummary(a, b) {
    if (a.last < b.last)
      return -1;
    if (a.last > b.last)
      return 1;
    return 0;
  }
  summaryItems.sort(compareSummary).reverse();
  html += ('<table>');
  html += ('  <tr>');
  html += ('     <th>Race Name</th>');
  html += ('     <th>Complete</th>');
  html += ('     <th>Start</th>');
  html += ('     <th>First</th>');
  html += ('     <th>Last</th>');
  html += ('  </tr>');
  html += summaryItems.map(function(item) {
    return '  <tr>' +
      '     <td><a href="' + getScriptUrl({ key: ssKey, show: 'results', race: item.name }) + '" target="_top">' + item.name + '</a></td>' +
      '     <td>' + item.completeness + '</td>' +
      '     <td>' + item.start + '</td>' +
      '     <td>' + item.first + '</td>' +
      '     <td>' + item.last + '</td>' +
      '  </tr>';
  }).join('\n');
  html += ('</table>');
  html += ('<div id="pd-result"></div>');
  if (options.allowPd === true) {
    html += ('<p><button id="pd-div1" disabled>Div 1-3 Promotions</button></p>');
    html += ('<p><button id="pd-div4">Div 4-6 Promotions</button></p>');
    html += ('<p><button id="pd-div7">Div 7-9 Promotions</button></p>');
    html += ('<p><button id="points">Club Points</button></p>');
  }
  if (hasEditPermission) {
    html += ('<p><button id="check-finish-times">Check Finish Times</button></p>');
    html += ('<p><button id="publish-results">Publish Results</button></p>');
    html += ('<p><button id="send-sms-div1">Div 1-3 SMS Results</button></p>');
    html += ('<p><button id="send-sms-div4">Div 4-6 SMS Results</button></p>');
    html += ('<p><button id="send-sms-div7">Div 7-9 SMS Results</button></p>');
  }
  div.append(html);
  if (options.allowPd === true) {
    $("#pd-div1").button().on("click", function () {
      google.script.run.withSuccessHandler(function (data) {
        $("#pd-result").html('Applied ' + data.length + ' promotions/demotions for Divs 1-3');
      }).setPromotionsDiv123(ssKey, false);
    });
    $("#pd-div4").button().on("click", function () {
      $("#pd-result").html('Calculating promotions/demotions...');
      $("#pd-div4").button("disable");
      google.script.run.withSuccessHandler(function (data) {
        $("#pd-result").html('Applied ' + data.length + ' promotions/demotions  for Divs 4-6');
        $("#pd-div4").button("enable");
      }).withFailureHandler(function() {
        $("#pd-result").html('An error occurred while calculating promotions/demotions  for Divs 4-6');
        $("#pd-div4").button("enable");
      }).setPromotionsDiv456(ssKey, false);
    });
    $("#pd-div7").button().on("click", function () {
      $("#pd-result").html('Calculating promotions/demotions...');
      $("#pd-div7").button("disable");
      google.script.run.withSuccessHandler(function (data) {
        $("#pd-result").html('Applied ' + data.length + ' promotions/demotions  for Divs 7-9');
        $("#pd-div7").button("enable");
      }).withFailureHandler(function() {
        $("#pd-result").html('An error occurred while calculating promotions/demotions  for Divs 7-9');
        $("#pd-div7").button("enable");
      }).setPromotionsDiv789(ssKey, false);
    });
    $("#points").button().on("click", function () {
      $("#pd-result").html('Calculating points...');
      $("#points").button("disable");
      google.script.run.withSuccessHandler(function (data) {
        $("#points").button("enable");
        $("#pd-result").html('Calculated points OK');
      }).withFailureHandler(function() {
        $("#points").button("enable");
        $("#pd-result").html('An error occurred while calculating points');
      }).calculatePointsFromWeb(ssKey);
    });
    function enableSmsButton(btnId, sheets) {
      var btnSelector = '#' + btnId;
      $(btnSelector).button().on("click", function () {
        $("#pd-result").html('Sending SMS results...');
        $(btnSelector).button("disable");
        google.script.run.withSuccessHandler(function (data) {
          $("#pd-result").html('Sent SMS messages OK');
          $("#send-sms-div1").button("enable");
        }).withFailureHandler(function() {
          $("#pd-result").html('An error occurred while sending SMS messages');
          $(btnSelector).button("enable");
        }).sendRaceResultsSms(ssKey, sheets);
      });
    }
    enableSmsButton("send-sms-div1", ['Div1', 'Div2', 'Div3']);
    enableSmsButton("send-sms-div4", ['Div4', 'Div5', 'Div6']);
    enableSmsButton("send-sms-div7", ['Div7', 'Div8', 'Div9']);
  }
  if (hasEditPermission) {
    $("#publish-results").button().on("click", function () {
      $("#pd-result").html('Publishing results...');
      $("#publish-results").button("disable");
      google.script.run
        .withSuccessHandler(function (data) {
          $("#pd-result").html('Published results to <a href="https://drive.google.com/file/d/' + data.fileId + '/view" target="_blank">web page</a>');
          $("#publish-results").button("enable");
        })
        .withFailureHandler(function (data) {
          $("#pd-result").html('Unable to publish results');
          $("#publish-results").button("enable");
        })
        .saveResultsHTMLForSpreadsheet(ssKey);
    });
    $("#check-finish-times").button().on("click", function () {
      $("#pd-result").html('Checking finish times...');
      $("#check-finish-times").button("disable");
      google.script.run.withSuccessHandler(function (data) {
        var duplicates = data.duplicates, strangeTimes = data.strangeTimes;
        if (duplicates.length === 0) {
          $("#pd-result").html('No duplicate finish times found');
        } else {
          $("#pd-result").html('Found ' + duplicates.length + ' duplicated boats:<br />' + duplicates.map(function(dup) {
              var timesHtml = dup.times.map(function(time) {
                return (time.number ? ('(' + time.number + ') ') : '') + time.time;
              }).join(', ');
              return 'Boat ' + dup.boatNumber + ': found times ' + timesHtml;
            }).join('<br />'));
        }
        if (strangeTimes.length > 0) {
          $("#pd-result").html($("#pd-result").html() + '<br />Found ' + strangeTimes.length + ' strange times:<br />' + strangeTimes.map(function(row) {
              return '' + row.number + ' boat ' + row.boatNumber + ', time ' + row.time;
            }).join('<br />'));
        }
        $("#check-finish-times").button("enable");
      }).withFailureHandler(function (data) {
        $("#pd-result").html('Unable to check finish times');
        $("#check-finish-times").button("enable");
      }).checkFinishDuplicatesForSpreadsheet(ssKey, false);
    });
  }
}

function showPdTimes(pdTimes) {
  var div = $('#results-pdtimes'), html = "";
  div.empty();
  if (pdTimes && pdTimes.length > 0) {
    for (var i = 0; i < pdTimes.length; ++i) {
      html += ('<table>');
      html += ('<caption>P/D divs ' + pdTimes[i].title.split("").join(", ") + ' K1</caption>');
      html += ('  <tbody><tr>');
      html += ('     <th>P/D</th>');
      html += ('     <th>Time</th>');
      html += ('  </tr>');
      for (var j = 0; j < pdTimes[i].times.length; ++j) {
        html += ('  <tr>');
        html += ('     <td>' + pdTimes[i].times[j].name + '</td>');
        html += ('     <td>' + pdTimes[i].times[j].time + '</td>');
        html += ('  </tr>');
      }
      html += ('</tbody></table>');
    }
  }
  div.append(html);
}

function showClubPoints(clubPoints) {
  var div = $('#results-club-points'), html = "";
  div.empty();
  if (clubPoints && clubPoints.length > 0) {
    html += ('<table>');
    html += ('<caption>Club points</caption>');
    html += ('  <tbody><tr>');
    html += ('     <th>Club</th>');
    html += ('     <th>Points</th>');
    html += ('     <th>Overall</th>');
    html += ('  </tr>');
    for (var i = 0; i < clubPoints.length; ++i) {
      html += ('  <tr>');
      html += ('     <td>' + clubPoints[i].name + '</td>');
      html += ('     <td>' + clubPoints[i].totalPoints + '</td>');
      html += ('     <td>' + clubPoints[i].haslerPoints + '</td>');
      html += ('  </tr>');
    }
    html += ('</tbody></table>');
  }
  div.append(html);
}

function showLightningPoints(lightningPoints) {
  var div = $('#results-lightning-points'), html = "";
  div.empty();
  if (lightningPoints && lightningPoints.length > 0) {
    html += ('<table>');
    html += ('<caption>Lightning points</caption>');
    html += ('  <tbody><tr>');
    html += ('     <th>Club</th>');
    html += ('     <th>Points</th>');
    html += ('  </tr>');
    for (var i = 0; i < lightningPoints.length; ++i) {
      html += ('  <tr>');
      html += ('     <td>' + lightningPoints[i].name + '</td>');
      html += ('     <td>' + lightningPoints[i].totalPoints + '</td>');
      html += ('  </tr>');
    }
    html += ('</tbody></table>');
  }
  div.append(html);
}

function toUpper(str) {
  return str.toUpperCase();
}

function toCurrency(amount) {
  try {
    return amount ? '£' + parseFloat(amount).toFixed(2) : amount;
  } catch(e) {
    return amount;
  }
}

function emptyStringToSpace(str) {
  return (''+str).length > 0 ? str : '&nbsp;';
}

function showEntries(entries, showBCUDetails) {
  var div = $('#entries-data'), html = '';
  var ssKey = key;
  div.empty();
  $('#file-links').html('<p><a href="' + getScriptUrl({ key: ssKey, show: 'entries' }) + '" target="_top">&lt;&lt; Back up</a></p>');
  for (var i = 0; i < entries.length; ++i) {
    if (entries[i].results && entries[i].results.length > 0) {
      html += '<table>';
      html += '<caption>' + entries[i].name + '</caption>';
      html += '  <tbody><tr>';
      html += '     <th>Boat Num</th>';
      html += '     <th>Name</th>';
      if (showBCUDetails) {
        html += '     <th>BCU Number</th>';
        html += '     <th>Expiry</th>';
      }
      html += '     <th>Club</th>';
      html += '     <th>Class</th>';
      html += '     <th>Div</th>';
      if (showBCUDetails) {
        html += '     <th>Paid</th>';
      }
      html += '  </tr>';
      var n = 0;
      for (var j = 0; j < entries[i].results.length; ++j) {
        n ++;
        html += '  <tr>';
        html += '     <td>' + entries[i].results[j].num + '</td>';
        html += '     <td>' + entries[i].results[j].names.map(toUpper).map(emptyStringToSpace).join("<br />") + '</td>';
        if (showBCUDetails) {
          html += '     <td>' + entries[i].results[j].bcuNum.map(toUpper).map(emptyStringToSpace).join("<br />") + '</td>';
          html += '     <td>' + entries[i].results[j].expiry.map(toUpper).map(emptyStringToSpace).join("<br />") + '</td>';
        }
        html += '     <td>' + entries[i].results[j].clubs.map(toUpper).map(emptyStringToSpace).join("<br />") + '</td>';
        html += '     <td>' + entries[i].results[j].classes.map(toUpper).map(emptyStringToSpace).join("<br />") + '</td>';
        html += '     <td>' + entries[i].results[j].divs.map(emptyStringToSpace).join("<br />") + '</td>';
        if (showBCUDetails) {
          html += '     <td>' + entries[i].results[j].paid.map(toCurrency).map(emptyStringToSpace).join("<br />") + '</td>';
        }
        html += '  </tr>';
      }
      html += '</tbody></table>';
      html += '<p>Total ' + n + ' entries</p>';
    }
  }
  div.append(html);
}

function showEntriesSummary(races, options) {
  options = options || {};
  var div = $('#entries-summary'), html = '';
  var ssKey = key;
  var summaryItems = [];
  var m = 0;
  var entries, numPaid;
  $('#file-links').html('<p><a href="' + getScriptUrl({ key: ssKey }) + '" target="_top">&lt;&lt; Back up</a></p>');
  div.empty();
  for (var i = 0; i < races.length; i++) {
    entries = races[i].results;
    numPaid = entries.filter(function(entry) {
      return entry.paid.filter(function(amount) { return /\£?\d+\.?\d*/.test(amount); }).length > 0;
    }).length;
    numBcuOk = entries.filter(function(entry) {
      return entry.bcuNum.filter(function(bcuNum) { return bcuNum === ''; }).length === 0 && entry.expiry.filter(function(bcuExp) { return bcuExp === ''; }).length === 0;
    }).length;
    if (entries.length === 0) {
      continue;
    }
    summaryItems.push({
      name: races[i].name,
      entries: entries.length,
      paid: numPaid,
      bcu: numBcuOk
    });
    m += entries.length;
  }
  if (hasEditPermission) {
    html += ('<p><button id="publish-entries">Publish Entries</button></p>');
  }
  html += ('<div id="entries-result"></div>');
  html += ('<table>');
  html += ('  <tr>');
  html += ('     <th>Race Name</th>');
  html += ('     <th>Entered</th>');
  html += ('     <th>Paid</th>');
  html += ('     <th>Membership</th>');
  html += ('  </tr>');
  html += summaryItems.map(function(item) {
    return '  <tr>' +
      '     <td><a href="' + getScriptUrl({ key: ssKey, show: 'entries', race: item.name }) + '" target="_top">' + item.name + '</a></td>' +
      '     <td>' + item.entries + '</td>' +
      '     <td>' + item.paid + '</td>' +
      '     <td>' + item.bcu + '</td>' +
      '  </tr>';
  }).join('\n');
  html += ('</table>');
  html += '<p>Total ' + m + ' entries</p>';
  div.append(html);
  if (hasEditPermission) {
    $("#publish-entries").button().on("click", function () {
      $("#entries-result").html('Publishing entries...');
      google.script.run
        .withSuccessHandler(function (data) {
          $("#entries-result").html('Published entries to <a href="https://googledrive.com/host/' + data.fileId + '" target="_top">web page</a>');
        })
        .withFailureHandler(function (data) {
          $("#entries-result").html('Unable to publish entries');
        })
        .saveEntriesHTMLForSpreadsheet(ssKey);
    });
  }
}

function showLinks(ssKey) {
  var div = $('#file-links'), html = '';
  div.empty();
  html += '<p><a href="' + getScriptUrl({ key: ssKey, show: 'entries' }) + '" target="_top">Show Entries</a></p>';
  html += '<p><a href="' + getScriptUrl({ key: ssKey, show: "results" }) + '" target="_top">Show Results</a> or <a href="' + getScriptUrl({ key: ssKey, show: 'results', scroll: 1 }) + '" target="_top">Scrolling Results</a></p>';
  html += '<p><a href="https://docs.google.com/spreadsheets/d/' + ssKey + '/edit">Edit Full Spreadsheet</a></p>';
  div.append(html);
  $('#messages').hide();
}