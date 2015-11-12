var fs = require('fs');
var path = require('path');
var assert = require('assert');

var transform = require('../..');
var jpath = require('../../plugins/jpath');

describe('jpath transform', function() {
    before(function() {
        this.template = path.join(__dirname, 'template.tmpl');
        this.expected = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, 'ast.json'),
                'utf8'
            )
        );
    });

    it('should convert all jpath lookups to safe-lookup expressions', function() {
        var ast = transform(this.template)
            .using(jpath())
            .toAST();

        assert.deepEqual(ast, this.expected);
    });

});
