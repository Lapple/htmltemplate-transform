var path = require('path');
var assert = require('assert');

var assign = require('object-assign');
var transform = require('../..');

describe('basic functionality', function() {
    before(function() {
        this.template = path.join(__dirname, 'template.tmpl');
    });

    it('should leave AST intact when no transforms were specified', function() {
        var ast = transform(this.template).toAST();

        assert.deepEqual(ast, [
            {
                type: 'Tag',
                name: 'TMPL_VAR',
                attributes: [
                    {
                        type: 'SingleAttribute',
                        name: 'a',
                        value: null,
                        position: {
                            line: 1,
                            column: 11
                        }
                    }
                ],
                position: {
                    line: 1,
                    column: 1
                }
            },
            {
                type: 'Text',
                content: '\n',
                position: {
                    line: 1,
                    column: 13
                }
            }
        ]);
    });

    it('should apply basic transform', function() {
        var ast = transform(this.template)
            .using(function(node) {
                if (node.type === 'SingleAttribute' && node.name === 'a') {
                    this.update(
                        assign({}, node, { name: 'b' }),
                        true
                    );
                }
            })
            .toAST();

        assert.deepEqual(ast, [
            {
                type: 'Tag',
                name: 'TMPL_VAR',
                attributes: [
                    {
                        type: 'SingleAttribute',
                        name: 'b',
                        value: null,
                        position: {
                            line: 1,
                            column: 11
                        }
                    }
                ],
                position: {
                    line: 1,
                    column: 1
                }
            },
            {
                type: 'Text',
                content: '\n',
                position: {
                    line: 1,
                    column: 13
                }
            }
        ]);
    });

    it('should apply multiple transforms', function() {
        var ast = transform(this.template)
            .using(function(node) {
                if (node.type === 'SingleAttribute' && node.name === 'a') {
                    this.update(
                        assign({}, node, { name: 'b' }),
                        true
                    );
                }
            })
            .using(function(node) {
                if (node.type === 'SingleAttribute' && node.name === 'b') {
                    this.update(
                        assign({}, node, {
                            type: 'PairAttribute',
                            name: 'name',
                            value: 'b'
                        }),
                        true
                    );
                }
            })
            .toAST();

        assert.deepEqual(ast, [
            {
                type: 'Tag',
                name: 'TMPL_VAR',
                attributes: [
                    {
                        type: 'PairAttribute',
                        name: 'name',
                        value: 'b',
                        position: {
                            line: 1,
                            column: 11
                        }
                    }
                ],
                position: {
                    line: 1,
                    column: 1
                }
            },
            {
                type: 'Text',
                content: '\n',
                position: {
                    line: 1,
                    column: 13
                }
            }
        ]);
    });
});
