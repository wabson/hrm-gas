describe('Base components', function() {

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

    });

    describe('Tabs list', function() {

        var mockView = Backbone.View.extend();

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
                        'Tab1': new mockView({id: 'view1'}).render(),
                        'Tab2': new mockView({id: 'view2'}).render()
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
                this.mock1 = new mockView({id: 'view1'});
                this.mock2 = new mockView({id: 'view2'});
                this.view = new TabsList({
                    tabs: {
                        'Tab1': this.mock1.render(),
                        'Tab2': this.mock2.render()
                    }
                });
            });

            it('should reflect the new active tab when a different tab is clicked', function() {
                this.view.render();
                this.view.$el.find('.tab a')[1].click();
                var tabEls = this.view.el.childNodes;
                expect(tabEls[0].className).toBe('tab');
                expect(tabEls[1].className).toBe('tab selected');
            });

            it('should show the related view and hide others when a different tab is clicked', function() {
                this.view.render();
                this.view.$el.find('.tab a')[1].click();
                expect(this.mock1.$el.css('display')).toBe('none');
                expect(this.mock2.$el.css('display')).toBe('block');
            });

        });

        describe('Dispatcher notifications', function() {

            beforeEach(function () {
                this.mock1 = new mockView({id: 'view1'});
                this.mock2 = new mockView({id: 'view2'});
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