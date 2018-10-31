var isFormula = function isFormula(val) {
  return typeof val === 'string' && val.indexOf('=') === 0;
};
var FakeRange = function(data, formulas, row, column, numRows, numColumns) {
  this.data = data;
  this.formulas = formulas;
  this.row = row;
  this.column = column;
  this.numRows = numRows;
  this.numColumns = numColumns;
};
FakeRange.prototype = {
  getWidth: function() {
    return this.numColumns;
  },
  getHeight: function() {
    return this.numRows;
  },
  getLastRow: function() {
    return this.row + this.numRows - 1;
  },
  getLastColumn: function() {
    return this.column + this.numColumns - 1;
  },
  getValues: function() {
    return this.getDataValues(this.data);
  },
  setValues: function(values) {
    var formulaValues = this.copyAndTransformValues_(values, function(val) {
      return isFormula(val) ? val : '';
    });
    var dataValues = this.copyAndTransformValues_(values, function(val) {
      return !isFormula(val) ? val : '';
    });
    this.setDataValues(dataValues, this.data);
    this.setDataValues(formulaValues, this.formulas);
    return this;
  },
  getEmptyData: function() {
    return (new Array(this.numRows).fill([])).map(function() { return (new Array(this.numColumns)).fill(''); }, this );
  },
  getDataValues: function(data) {
    var start = this.row - 1;
    var base = this.getEmptyData(), items = [].concat(data.slice(start, start + this.numRows).map(function(row) {
      return [].concat(row);
    }));
    return base.map(function(blankRow, rowIdx) {
      return blankRow.map(function(blankVal, colIdx) {
        return items[rowIdx] && items[rowIdx][colIdx] ? items[rowIdx][colIdx] : blankVal;
      });
    });
  },
  setDataValues: function(values, data) {
    var newLength = Math.max(this.row - 1 + values.length);
    var newRowLength = this.column - 1 + this.numColumns;
    this.padRows(data, newLength);
    this.padColumns(data, newRowLength);
    if (values.length > 0) {
      if (!values.every(function(rowValues) { return this.numColumns === rowValues.length; }, this)) {
        throw 'No of columns in range must be equal to the no of values columns';
      }
    }
    if (values.length !== this.numRows) {
      throw 'No of rows must be equal to the number of rows in the range';
    }
    var rowsSlice = data.slice(this.row - 1, this.row - 1 + values.length);
    rowsSlice.forEach(function(rowData, index) {
      var itemsToRemove = values[index].length;
      rowData.splice.apply(rowData, [this.column - 1, itemsToRemove].concat(values[index]));
    }, this);
    return this;
  },
  pad: function pad(data, newSize, fillItem) {
    if (data.length >= newSize) {
      return;
    }
    for (var i=data.length; i<newSize; i++) {
      var fillCopy = Array.isArray(fillItem) ? [].concat(fillItem) : fillItem;
      data.push(fillCopy);
    }
  },
  padRows: function(data, newSize) {
    this.pad(data, newSize, ['']);
  },
  padColumns: function(data, newSize) {
    data.forEach(function(rowData) {
      this.pad(rowData, newSize, '');
    }, this);
  },
  getEmptyValues: function(data) {
    var start = this.row - 1;
    return [].concat(data.slice(start, start + this.numRows).map(function(row) { return new Array(row.length); } ));
  },
  getFormulas: function() {
    return this.getDataValues(this.formulas);
  },
  setFormulas: function(values) {
    var formulaValues = this.copyAndTransformValues_(values, function(val) {
      return isFormula(val) ? val : '';
    });
    var dataValues = this.copyAndTransformValues_(values, function(val) {
      return '';
    });
    this.setDataValues(dataValues, this.data);
    this.setDataValues(formulaValues, this.formulas);
    return this;
  },
  copyAndTransformValues_: function copyAndTransformValuesIfMatch(values, transformFn) {
    return values.map(function(row, rowIdx) {
      return row.map(function(col, colIdx) {
        return transformFn(col, colIdx);
      });
    });
  },
  getNumberFormats: function() {
    return this.getEmptyValues(this.data);
  },
  setNumberFormat: function() {
  },
  setNumberFormats: function() {
    return this;
  },
  getDataValidations: function() {
    return this.getEmptyValues(this.data);
  },
  setDataValidations: function() {
    return this;
  },
  clearDataValidations: function() {
    return this;
  },
  getBackgrounds: function() {
    return [];
  },
  setBackgrounds: function() {
    return this;
  },
  getHorizontalAlignments: function() {
    return [];
  },
  setHorizontalAlignments: function() {
    return this;
  },
  setFontFamily: function() {
    return this;
  },
  setBorder: function() {
    return this;
  },
  setFontWeight: function() {
    return this;
  },
  setBackground: function() {
    return this;
  },
  clearContent: function() {
    this.setValues(this.getEmptyData());
    this.setFormulas(this.getEmptyData());
    return this;
  }
};

var FakeSheet = function(name, data) {
  this.name = name || 'Sheet1';
  this.data = (data || []).concat([]);
  this.hidden = false;
  this.formulas = [];
  this.numFrozenRows = 0;
};
FakeSheet.prototype = {
  copyTo: function(ss) {
    var newSheet = new FakeSheet(this.name, this.data);
    newSheet.hidden = this.hidden;
    newSheet.formulas = this.formulas;
    ss.sheets.push(newSheet);
    return newSheet;
  },
  getLastColumn: function() {
    return this.data.length ? this.data[0].length : 1;
  },
  getLastRow: function() {
    return Math.max(this.data.length, this.formulas.length, 1);
  },
  getRange: function(row, column, numRows, numColumns) {
    if (row < 1) {
      throw 'Row must be greater than 1';
    }
    if (column < 1) {
      throw 'Column must be greater than 1';
    }
    if (numRows < 1) {
      throw 'Number of rows must be greater than 1';
    }
    if (numColumns < 1) {
      throw 'Number of columns must be greater than 1';
    }
    return new FakeRange(this.data, this.formulas, row, column, numRows, numColumns);
  },
  getDataRange: function() {
    return new FakeRange(this.data, this.formulas, 1, 1, Math.max(this.data.length, 1),
      this.data.length ? Math.max(this.data[0].length, 1) : 1);
  },
  getName: function() {
    return this.name;
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
  },
  clear: function() {
    this.data = [[]];
    this.formulas = [[]];
  },
  getFrozenRows: function() {
    return this.numFrozenRows;
  },
  setFrozenRows: function(numRows) {
    this.numFrozenRows = numRows;
    return this;
  },
  getColumnWidth: function() {
  },
  setColumnWidth: function() {
  }
};

var FakeSS = function() {
  this.sheets = [];
  this.activeSheet = null;
};
FakeSS.prototype = {
  getSheets: function getSheets() {
    return this.sheets;
  },
  getSheetByName: function(name) {
    var match = this.sheets.find(function(s) {
      return s.name === name;
    });
    return match ? match : null;
  },
  insertSheet: function(name, index) {
    var newSheet = new FakeSheet(name);
    this.sheets.push(newSheet);
    this.setActiveSheet(newSheet);
    return newSheet;
  },
  getNumSheets: function() {
    return this.sheets.length;
  },
  getActiveSheet: function() {
    return this.activeSheet;
  },
  setActiveSheet: function(sheet) {
    this.activeSheet = sheet;
  },
  moveActiveSheet: function(index) {
    if (this.activeSheet === null) {
      throw 'Active sheet not set';
    }
    var matchIndex = this.sheets.findIndex(function(s) {
      return s.name === this.activeSheet.name;
    }, this);
    if (matchIndex === -1) {
      throw 'Active sheet was not found';
    }
    if (index < 1 || index > this.sheets.length) {
      throw 'Index must be greater than zero and less than or equal to the number of sheets';
    }
    var newIndex = index - 1;
    this.sheets.splice(newIndex, 0, this.activeSheet);
    this.sheets.splice(newIndex < matchIndex ? matchIndex + 1 : matchIndex, 1);
  },
  deleteSheet: function(sheet) {
    for (var i=this.sheets.length - 1; i>=0; i--) {
      if (this.sheets[i].getName() === sheet.getName()) {
        this.sheets.splice(i, 1);
      }
    }
  }
};

exports.MockSS = FakeSS;
exports.MockSheet = FakeSheet;
exports.MockRange = FakeRange;