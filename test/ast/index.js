var assert = require('assert');

var assign = require('object-assign');
var transform = require('../..');

describe('accepting AST', function() {
    before(function() {
        this.input = require('./in');
        this.output = require('./out');
    });

    it('should accept AST as a second parameter', function(done) {
        transform('template.tmpl', this.input)
            .using(function(node) {
                if (node.type === 'SingleAttribute' && node.name === 'a') {
                    this.update(
                        assign({}, node, { name: 'b' }),
                        true
                    );
                }
            })
            .toAST(function(err, ast) {
                if (err) {
                    done(err);
                } else {
                    assert.deepEqual(ast, this.output);

                    done();
                }
            }.bind(this));
    });

});
