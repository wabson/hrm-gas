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

            it('should create an empty table element', function() {
                expect(this.view.el.nodeName).toEqual('TABLE');
                expect(this.view.el.innerHTML).toEqual('');
            });

            it('should render an empty table initially', function() {
                this.view.render();
                expect(this.view.$el.find('thead').length).toBe(1);
                expect(this.view.$el.find('thead')[0].innerHTML).toEqual('<tr><th></th></tr>');
                expect(this.view.$el.find('tbody').length).toBe(1);
                expect(this.view.$el.find('tbody')[0].innerHTML).toEqual('');
            });

            it('should render table headings for each data column defined', function() {
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

        });

    });

});