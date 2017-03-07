// Copyright 2015 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


/**
 *  Used to insert any HTML file in the project into an outer HTML file.
 *  Called from within the outer HTML file.
 *  @param {String} filename Name of the file in the project.
 *      Do not include ".html".
 *  @return {String} HTML markup for the requested file.
 */
exports.include = function include(filename) {
  var baseName = filename.substring(filename.lastIndexOf('/') + 1);
  return HtmlService.createHtmlOutputFromFile(baseName)
      .getContent();
};

/**
 * Create a JSON-safe copy of the specified object, since the server cannot send a Date object we must encode this
 * as a string.
 *
 * @param source  {object} Source object to copy
 * @returns {object}  Copy of the input with date properties replaced with strings
 */
exports.jsonSafeObj = function jsonSafeObj(source) {
  var copy = {}, val;
  for (var p in source) {
    if (source.hasOwnProperty(p)) {
      val = source[p];
      copy[p] = val instanceof Date ? dateToString_(val) : val;
    }
  }
  return copy;
};

function dateToString_(d) {
  var day = ('0' + d.getDate()).slice(-2);
  var month = ('0' + (d.getMonth() + 1)).slice(-2);
  return [d.getFullYear(), month, day].join('-');
}

/**
 * Create a JSON-safe copy of an array of objects. A copy of each object will be created via jsonSafeObj() and these
 * will be returned in a new array of size equal to the input. The object copies are shallow and any properties which
 * are themselves objects will not be converted and will simply be copied by reference from the original.
 *
 * @param source {object[]} Source array to copy
 * @returns {object[]} New array with each item being a copy of the corresponding item in the original
 */
exports.jsonSafeArr = function jsonSafeArr(source) {
  return source.map(function (item) {
    return jsonSafeObj(item);
  });
};

/**
 * Convert an object received from the client, which may contain string-encoded dates
 *
 * @param source {object} Source object to copy
 * @returns {object}  Copy of the input with date-like string properties replaced with real date objects
 */
exports.objFromJson = function objFromJson(source) {
  var copy = {}, val, isDate, dateRe = /\w{3} \w{3} \d{1,2} \d{4}/i;
  for (var p in source) {
    if (source.hasOwnProperty(p)) {
      val = source[p];
      isDate = typeof val === 'string' && dateRe.test(val);
      copy[p] = isDate ? new Date(val) : val;
    }
  }
  return copy;
};

/**
 * Create a copy of an array of objects received from the client, with string-encoded dates converted to real dates.
 *
 * A copy of each object will be created via objFromJson() and these
 * will be returned in a new array of size equal to the input. The object copies are shallow and any properties which
 * are themselves objects will not be converted and will simply be copied by reference from the original.
 *
 * @param source {object[]} Source array to copy
 * @returns {object[]} New array with each item being a copy of the corresponding item in the original
 */
exports.arrFromJson = function arrFromJson(source) {
  return source.map(function (item) {
    return objFromJson(item);
  });
};