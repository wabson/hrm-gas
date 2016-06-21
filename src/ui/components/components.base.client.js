var BaseComponent = Backbone.View.extend({

    createDiv_: function(idSuffix, options) {
        var newEl = $(document.createElement('div')).attr('id', this.el.id  + idSuffix);
        if (options && options.className) {
            newEl.addClass(options.className);
        }
        return newEl;
    },

    createOptionsForSubView: function(options, additionalOptions) {
        var childOpts = _.clone(options);
        delete childOpts.el;
        delete childOpts.id;
        delete childOpts.className;
        return _.extend(childOpts, additionalOptions || {});
    }

});

var TableData = Backbone.Model.extend({});

var DataTable = Backbone.View.extend({

    tagName: 'table',

    events: {
        'change input[name=entry]': 'toggleResult',
        'click input[name=entry]': 'clickResult',
        'click tr': 'clickResultRow'
    },

    initialize: function(options) {

        this.dispatcher = options.dispatcher;

        this.inputType = options.inputType || 'hidden';

        this.data = options.data;

        this.displayColumns = options.displayColumns || this.data.get('columns');
        this.headingsRenderer = options.headingsRenderer || this.defaultHeadingsRenderer;
        this.cellRenderers = options.cellRenderers || {};

        this.listenTo(this.data, 'change', this.onDataChanged);
    },

    render: function() {
        this.$el.html('<thead><tr></tr></thead><tbody></tbody>');
        this.renderTableHeadings_();
        this.renderTableData_();
        return this;
    },

    onDataChanged: function(data) {
        if (data.changed.columns) {
            this.displayColumns = data.changed.columns;
        }
        this.render();
        if (this.dispatcher) {
            this.dispatcher.trigger('selectedDataChange');
        }
    },

    getSelectedData: function() {
        return _.map(this.$('input[type=checkbox]:checked, input[type=hidden]'), function(el) {
            return this.data.get('values')[parseInt($(el).val())];
        }, this);
    },

    defaultCellRenderer: function(value) {
        return value;
    },

    dataRenderer: function(row) {
        return _.map(this.displayColumns, function (colName, index) {
            var cellRenderer = this.cellRenderers[colName] || this.defaultCellRenderer;
            return '<td>' + cellRenderer(row[colName], index, row) + '</td>';
        }, this);
    },

    renderTableHeadings_: function() {
        this.$('thead tr').html('<th></th>').append(this.headingsRenderer(this.displayColumns));
    },

    renderTableData_: function () {

        var count = -1;
        this.$('tbody').empty().append(_.map(this.data.get('values'), function(row) {
            count ++;
            return this.generateDataRowHtml_(row, count);
        }, this));

        if (this.data.get('values') && this.data.get('values').length === 1) {
            this.$('input[type=' + this.inputType + ']').prop('checked', true).change();
        }
    },

    generateDataRowHtml_: function(row, index) {
        return '<tr>' +
                '<td><input type="' + this.inputType + '" name="entry" value="' + index + '" /></td>' +
                this.dataRenderer(row) +
                '</tr>';
    },

    truncateBody: function() {
        this.data.set('values', []);
    },

    toggleResult: function(event) {
        var $row = $(event.currentTarget).closest('tr');
        if (event.currentTarget.checked) {
            $row.addClass('selected');
        } else {
            $row.removeClass('selected');
        }
        this.dispatcher.trigger('selectedDataChange', {
            selected: this.getSelectedData()
        });
    },

    clickResult: function(event) {
        event.stopPropagation(); // Stop event going to the row
    },

    clickResultRow: function(event) {
        $(event.currentTarget).find('input[name=entry]').each(function(idx, el) {
            var currentState = $(el).prop('checked');
            $(el).prop('checked', !currentState).change();
        });
    },

    defaultHeadingsRenderer: function(names) {
        return _.map(names, function (colName) {
            return '<th>' + colName + '</th>';
        }, this);
    },

    defaultDataRenderer: function(values) {
        return values.map(function (value) {
            return '<td>' + value + '</td>';
        });
    }

});

var TabsList = Backbone.View.extend({

    tagName: 'div',

    events: {
        'click a': 'clickTab'
    },

    initialize: function (options) {
        this.dispatcher = options.dispatcher;
        this.tabs = options.tabs;
        this.dispatcher.bind('select', this.selectTab, this);
    },

    render: function () {
        this.$el.empty().append(_.map(_.pairs(this.tabs), function(pair, index) {
            var name = pair[0], view = pair[1];
            return _.template('<span class="<%= className %>" data-target="<%= targetId %>">' +
                '<a href="#"><%= name %></a>' +
                '</span>')({
                name: name,
                targetId: view.el.id,
                className: index === 0 ? 'tab selected' : 'tab'
            });
        }));
        return this;
    },

    showView_: function(elId) {
        _.each(_.values(this.tabs), function(view) {
            if (view.el.id === elId) {
                view.$el.css('display', 'block');
            } else {
                view.$el.css('display', 'none');
            }
        }, this);
        this.$('span.tab').removeClass('selected');
        this.$('span.tab[data-target=' + elId + ']').addClass('selected');
    },

    clickTab: function(event) {
        event.preventDefault();
        this.showView_($(event.target).closest('span').attr('data-target'));
    },

    selectTab: function(payload) {
        this.showView_(payload.id);
    }
});