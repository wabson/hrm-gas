describe('Base components', function() {

    describe('Base component', function() {

        it('should exist', function () {
            expect(BaseComponent).toBeDefined();
        });

        describe('Utility methods', function() {

            beforeEach(function() {
                var TestView = BaseComponent.extend({
                    initialize: function(options) {
                    },
                    render: function() {
                    }
                });
                this.view = new TestView({
                    id: 'my-test-view'
                });
                this.view.render();
            });

            it('should create new DOM elements based on the parent ID', function() {
                var newEl = this.view.createDiv_('-child1');
                expect(newEl).not.toBeNull();
                expect(newEl.length).toBe(1);
                expect(newEl[0].id).toBe('my-test-view-child1');
            });

            it('should add specified class names to new DOM elements', function() {
                var newEl = this.view.createDiv_('-child2', {
                    className: 'myClassXYZ'
                });
                expect(newEl).not.toBeNull();
                expect(newEl.length).toBe(1);
                expect(newEl[0].className).toBe('myClassXYZ');
            });

            it('should pass through custom options for sub-views init', function() {
                var options = this.view.createOptionsForSubView({
                    prop1: 'value1',
                    prop2: 1234
                });
                expect(options.prop1).toBe('value1');
                expect(options.prop2).toBe(1234);
            });

            it('should augment options with the specified additional options', function() {
                var options = this.view.createOptionsForSubView({
                    prop1: 'value1',
                    prop2: 1234
                }, {
                    prop3: 'abc',
                    id: 'myView',
                    className: 'myClass2'
                });
                expect(options.prop1).toBe('value1');
                expect(options.prop2).toBe(1234);
                expect(options.prop3).toBe('abc');
                expect(options.id).toBe('myView');
                expect(options.className).toBe('myClass2');
            });

            it('should filter element-specific view options from the list generated for sub-views init', function() {
                var options = this.view.createOptionsForSubView({
                    id: 'my-element',
                    className: 'my-class',
                    myCustomOpt: 'yes'
                });
                expect(options.id).toBeUndefined();
                expect(options.className).toBeUndefined();
            });

            it('should filter any element reference from the list generated for sub-views init', function() {
                var options = this.view.createOptionsForSubView({
                    el: document.createElement('DIV')
                });
                expect(options.el).toBeUndefined();
            });

        });
    });

    describe('Data table', function() {

        it('should exist', function() {
            expect(DataTable).toBeDefined();
        });

        describe('Initialisation', function() {

            beforeEach(function() {
                this.data = new TableData();
                this.view = new DataTable({
                    data: this.data
                });
            });

            it('should create an empty table element on init', function() {
                expect(this.view.el.nodeName).toEqual('TABLE');
                expect(this.view.el.innerHTML).toEqual('');
            });

            it('should render an empty table if no columns specified', function() {
                this.view.render();
                var headEls = this.view.$el.find('thead');
                var bodyEls = this.view.$el.find('tbody');
                expect(headEls.length).toBe(1);
                expect(headEls[0].innerHTML).toEqual('<tr><th></th></tr>');
                expect(bodyEls.length).toBe(1);
                expect(bodyEls[0].innerHTML).toEqual('');
            });

            it('should update table headings when data columns property is updated', function() {
                this.data.set({
                    columns: ['col1', 'col2'],
                    values: []
                });
                var thEls = this.view.$el.find('thead th');
                expect(thEls.length).toEqual(3);
                expect(thEls[0].innerHTML).toEqual('');
                expect(thEls[1].innerHTML).toEqual('col1');
                expect(thEls[2].innerHTML).toEqual('col2');
            });

            it('should override table headings if display columns are specified', function() {
                this.view.displayColumns = ['b1', 'b2'];
                this.data.set({
                    columns: ['a1', 'a2'],
                    values: []
                });
                this.view.render();
                var thEls = this.view.$el.find('thead th');
                expect(thEls.length).toEqual(3);
                expect(thEls[0].innerHTML).toEqual('');
                expect(thEls[1].innerHTML).toEqual('b1');
                expect(thEls[2].innerHTML).toEqual('b2');
            });

        });

        describe('Data rendering', function() {

            beforeEach(function() {
                this.data = new TableData({
                    columns: ['Name', 'Age', 'Gender'],
                    values: [
                        {
                            'Name': 'Bob',
                            'Age': 32,
                            'Gender': 'M',
                            'Eyes': 'Blue'
                        },
                        {
                            'Name': 'Christine',
                            'Age': 37,
                            'Gender': 'F',
                            'Eyes': 'Green'
                        }
                    ]
                });
                this.view = new DataTable({
                    data: this.data
                });
                this.view.render();
            });

            it('should render a table row for each set of values', function() {
                var rowEls = this.view.$el.find('tbody tr');
                expect(rowEls.length).toBe(2);
            });

            it('should render a hidden input field in the first column of each row', function() {
                var rowEls = this.view.$el.find('tbody tr');
                expect(rowEls[0].children[0]).toContainElement('input[type=hidden]');
            });

            it('should return all rows in response to a query about what is selected, with hidden inputs', function() {
                var data = this.view.getSelectedData();
                expect(data.length).toBe(2);
            });

            it('should allow a checkbox input field to be displayed in the first column of each row', function() {
                this.view.inputType = 'checkbox';
                this.view.render();
                var rowEls = this.view.$el.find('tbody tr');
                expect(rowEls[0].children[0]).toContainElement('input[type=checkbox]');
            });

            it('should initially render checkboxes unchecked if more than one row', function() {
                this.view.inputType = 'checkbox';
                this.view.render();
                var rowEls = this.view.$el.find('tbody tr td input[type=checkbox]');
                expect(rowEls.length).toBe(2);
                expect(rowEls[0]).not.toBeChecked();
                expect(rowEls[1]).not.toBeChecked();
            });

            it('should initially render checkbox checked if only one row', function() {
                this.view.inputType = 'checkbox';
                this.view.render();
                this.data.set('values', this.data.get('values').slice(0, 1));
                var rowEls = this.view.$el.find('tbody tr td input[type=checkbox]');
                expect(rowEls.length).toBe(1);
                expect(rowEls[0]).toBeChecked();
            });

            it('should return no rows in response to a query about what is selected, with checkbox inputs', function() {
                this.view.inputType = 'checkbox';
                this.view.render();
                var data = this.view.getSelectedData();
                expect(data.length).toBe(0);
            });

            it('should fire a dispatcher event when row checkbox is clicked', function() {
                var dispatcher = _.extend({}, Backbone.Events);
                var eventPayload, callCount = 0;
                dispatcher.on('selectedDataChange', function(payload) {
                    eventPayload = payload;
                    callCount ++;
                });
                this.view.initialize({
                    data: this.data,
                    dispatcher: dispatcher,
                    inputType: 'checkbox'
                });
                this.view.render();
                this.view.$el.find('input[type=checkbox]:first').prop('checked', true).trigger('change');
                expect(eventPayload).toBeDefined();
                expect(eventPayload.selected).toBeDefined();
                expect(eventPayload.selected.length).toBe(1);
                expect(callCount).toBe(1);
                this.view.$el.find('input[type=checkbox]:first').prop('checked', false).trigger('change');
                expect(eventPayload.selected.length).toBe(0);
                expect(callCount).toBe(2);
            });

            it('should check/uncheck row and fire a dispatcher event when a row is clicked', function() {
                var dispatcher = _.extend({}, Backbone.Events);
                var eventPayload, callCount = 0;
                dispatcher.on('selectedDataChange', function(payload) {
                    eventPayload = payload;
                    callCount ++;
                });
                this.view.initialize({
                    data: this.data,
                    dispatcher: dispatcher,
                    inputType: 'checkbox'
                });
                this.view.render();
                this.view.$el.find('tbody tr:first').trigger('click');
                expect(eventPayload).toBeDefined();
                expect(eventPayload.selected).toBeDefined();
                expect(eventPayload.selected.length).toBe(1);
                expect(callCount).toBe(1);
                this.view.$el.find('tbody tr:first').trigger('click');
                expect(eventPayload.selected.length).toBe(0);
                expect(callCount).toBe(2);
            });

            it('should fill out the row with a cell for each property specified in the columns list', function() {
                var rowEls = this.view.$el.find('tbody tr');
                expect(rowEls[0].children.length).toBe(4);
                expect(rowEls[1].children.length).toBe(4);
            });

            it('should re-render automatically when data updated', function() {
                this.data.set('values', this.data.get('values').concat([
                    {
                        'Name': 'Robert',
                        'Age': 22,
                        'Gender': 'M',
                        'Eyes': 'Blue'
                    }
                ]));
                var rowEls = this.view.$el.find('tbody tr');
                expect(rowEls.length).toBe(3);
            });

            it('should fire an event when table data is updated', function() {
                var dispatcher = _.extend({}, Backbone.Events);
                var eventPayload, callCount = 0;
                dispatcher.on('selectedDataChange', function(payload) {
                    eventPayload = payload;
                    callCount ++;
                });
                this.view.dispatcher = dispatcher;
                this.view.inputType = 'checkbox';
                this.view.render();
                this.data.set('values', this.data.get('values').concat([
                    {
                        'Name': 'Robert',
                        'Age': 22,
                        'Gender': 'M',
                        'Eyes': 'Blue'
                    }
                ]));
                expect(eventPayload).toBeDefined();
                expect(eventPayload.selected).toBeDefined();
                expect(eventPayload.selected.length).toBe(0);
                expect(callCount).toBe(1);
            });

        });

        describe('Data operations', function() {

            beforeEach(function() {
                this.data = new TableData({
                    columns: ['Name', 'Age', 'Gender'],
                    values: [
                        {
                            'Name': 'Bob',
                            'Age': 32,
                            'Gender': 'M',
                            'Eyes': 'Blue'
                        },
                        {
                            'Name': 'Christine',
                            'Age': 37,
                            'Gender': 'F',
                            'Eyes': 'Green'
                        }
                    ]
                });
                this.view = new DataTable({
                    data: this.data
                });
                this.view.render();
            });

            it('should truncate the input data values list when requested to do so', function() {
                this.view.truncateBody();
                expect(this.data.get('values').length).toEqual(0);
            });

        });

    });

    describe('Tabs list', function() {

        var MockView = Backbone.View.extend();

        it('should exist', function () {
            expect(TabsList).toBeDefined();
        });

        describe('Initialisation', function() {

            beforeEach(function () {
                this.view = new TabsList({
                });
            });

            it('should create an empty div element on init', function() {
                expect(this.view.el.nodeName).toEqual('DIV');
                expect(this.view.el.innerHTML).toEqual('');
            });

        });

        describe('Rendering', function() {

            it('should create tabs based on constructor options tabs property', function() {
                this.view = new TabsList({
                    tabs: {
                        'Tab1': new MockView({id: 'view1'}).render(),
                        'Tab2': new MockView({id: 'view2'}).render()
                    }
                });
                this.view.render();
                var tabEls = this.view.el.childNodes;
                expect(tabEls.length).toBe(2);
                expect($(tabEls[0]).attr('data-target')).toBe('view1');
                expect(tabEls[0].innerText).toBe('Tab1');
                expect(tabEls[0].childNodes.length).toBe(1);
                expect(tabEls[0].childNodes[0].nodeName).toBe('A');
                expect(tabEls[0].className).toBe('tab selected');
                expect($(tabEls[1]).attr('data-target')).toBe('view2');
                expect(tabEls[1].innerText).toBe('Tab2');
                expect(tabEls[1].className).toBe('tab');
                expect(tabEls[1].childNodes.length).toBe(1);
                expect(tabEls[1].childNodes[0].nodeName).toBe('A');
            });

        });

        describe('Click interactions', function() {

            beforeEach(function () {
                this.mock1 = new MockView({id: 'view1'});
                this.mock2 = new MockView({id: 'view2'});
                this.view = new TabsList({
                    tabs: {
                        'Tab1': this.mock1.render(),
                        'Tab2': this.mock2.render()
                    }
                });
            });

            it('should reflect the new active tab when a different tab is clicked', function() {
                this.view.render();
                $(this.view.$el.find('.tab a')[1]).click();
                var tabEls = this.view.el.childNodes;
                expect(tabEls[0].className).toBe('tab');
                expect(tabEls[1].className).toBe('tab selected');
            });

            it('should show the related view and hide others when a different tab is clicked', function() {
                this.view.render();
                $(this.view.$el.find('.tab a')[1]).click();
                expect(this.mock1.$el.css('display')).toBe('none');
                expect(this.mock2.$el.css('display')).toBe('block');
            });

        });

        describe('Dispatcher notifications', function() {

            beforeEach(function () {
                this.mock1 = new MockView({id: 'view1'});
                this.mock2 = new MockView({id: 'view2'});
                this.dispatcher = _.extend({}, Backbone.Events);
                this.view = new TabsList({
                    tabs: {
                        'Tab1': this.mock1.render(),
                        'Tab2': this.mock2.render()
                    },
                    dispatcher: this.dispatcher
                });
            });

            it('should reflect the new active tab when a dispatcher notification is received', function() {
                this.view.render();
                this.dispatcher.trigger('select', {
                    id: 'view2'
                });
                var tabEls = this.view.el.childNodes;
                expect(tabEls[0].className).toBe('tab');
                expect(tabEls[1].className).toBe('tab selected');
            });

            it('should show the related view and hide others when a different tab is clicked', function() {
                this.view.render();
                this.dispatcher.trigger('select', {
                    id: 'view2'
                });
                expect(this.mock1.$el.css('display')).toBe('none');
                expect(this.mock2.$el.css('display')).toBe('block');
            });

        });

    });

});