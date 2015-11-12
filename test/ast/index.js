var assert = require('assert');

var assign = require('object-assign');
var transform = require('../..');

describe('accepting AST', function() {
    before(function() {
        this.input = require('./in');
        this.output = require('./out');
    });

    it('should accept AST as a second parameter', function() {
        var ast = transform('template.tmpl', this.input)
            .using(function(node) {
                if (node.type === 'SingleAttribute' && node.name === 'a') {
                    this.update(
                        assign({}, node, { name: 'b' }),
                        true
                    );
                }
            })
            .toAST();

        assert.deepEqual(ast, this.output);
    });

});
