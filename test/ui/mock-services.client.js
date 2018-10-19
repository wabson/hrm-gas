var Runner = function () {
};
Runner.prototype.withSuccessHandler = function(successHandler) {
    this.successHandler = successHandler;
    return this;
};
Runner.prototype.withFailureHandler = function(failureHandler) {
    this.failureHandler = failureHandler;
    return this;
};
Runner.prototype.withUserObject = function(obj) {
    this.userObject = obj;
    return this;
};
Runner.prototype.addData = function(fnName, data) {
    this[fnName] = function() {
        this.successHandler(data, this.userObject);
    }.bind(this);
};
Runner.prototype.addError = function(fnName, data) {
    this[fnName] = function() {
        this.failureHandler(data, this.userObject);
    }.bind(this);
};

var runner = new Runner();

var google = {
    script: {
        run: runner,
        host: {
            close: function() {
                alert('Dialog closed');
            }
        }
    }
};

google.picker = {
    Response: {
        ACTION: 'Action',
        DOCUMENTS: 'Documents'
    },
    Action: {
        PICKED: 'Picked'
    },
    Document: {
        ID: 'id',
        NAME: 'name',
        URL: 'url'
    }
};