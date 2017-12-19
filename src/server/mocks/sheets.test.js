var FakeRange = function(data, formulas, row, column, numRows, numColumns) {
  this.data = data;
  this.formulas = formulas;
  this.row = row;
  this.column = column;
  this.numRows = numRows;
  this.numColumns = numColumns;
};
FakeRange.prototype = {
  getValues: function() {
    return [].concat(this.data);
  },
  setValues: function(values) {
    return this.setDataValues(values, this.data);
  },
  setDataValues: function(values, data) {
    this.padRowData(this.row - 1 + values.length);
    if (data.length > 0 && this.numColumns !== data[0].length) {
      throw 'No of columns in range must be equal to the no of columns in the sheet';
    }
    data.splice.apply(data, [this.row - 1, values.length].concat(values));
  },
  padRowData: function(newSize) {
    if (this.data.length >= newSize) {
      return;
    }
    for (var i=Math.max(0, this.data.length-1); i<newSize; i++) {
      this.data.push(['']);
    }
  },
  getFormulas: function() {
    return this.formulas;
  },
  setFormulas: function(values) {
    return this.setDataValues(values, this.formulas);
  }
};

var FakeSheet = function(name, data) {
  this.name = name || 'Sheet1';
  this.data = (data || []).concat([]);
  this.hidden = false;
  this.formulas = [];
};
FakeSheet.prototype = {
  copyTo: function(ss) {
    ss.sheets.push(this);
    return this;
  },
  getLastColumn: function() {
    return this.data.length ? this.data[0].length : 1;
  },
  getLastRow: function() {
    return Math.max(this.data.length, 1);
  },
  getRange: function(row, column, numRows, numColumns) {
    return new FakeRange(this.data, this.formulas, row, column, numRows, numColumns);
  },
  setName: function(name) {
    this.name = name;
    return this;
  },
  isSheetHidden: function() {
    return this.hidden;
  },
  hideSheet: function() {
    this.hidden = true;
  },
  showSheet: function() {
    this.hidden = false;
  }
};

var FakeSS = function() {
  this.sheets = [];
};
FakeSS.prototype = {
  getSheetByName: function(name) {
    var match = this.sheets.find(function(s) {
      return s.name === name;
    });
    return match ? match : null;
  },
  insertSheet: function(name, index) {
    var newSheet = new FakeSheet(name);
    this.sheets.push(newSheet);
    return newSheet;
  }
};

exports.MockSS = FakeSS;
exports.MockSheet = FakeSheet;
exports.MockRange = FakeRange;