describe('Forms components', function() {

    var MyBlock = Backbone.View.extend({});

    describe('Data form', function() {
        it('should exist', function() {
            expect(DataForm).toBeDefined();
        });
        it('should render a form element', function() {
            this.view = new DataForm({});
            expect(this.view.el).toEqual('form');
        });
        it('should render the form blocks specified', function() {
            this.view = new DataForm({
                blocks: [new MyBlock({id: 'a'}), new MyBlock({id: 'b'}), new MyBlock({id: 'c'})]
            });
            this.view.render();
            expect(this.view.el).toContainHtml('<div id="a"></div><div id="b"></div><div id="c"></div>');
        });
    });

});