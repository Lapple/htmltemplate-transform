// for pretty output
// ./bin/optimize --path test/optimize-conditions/template.tmpl

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var parser = require('htmltemplate-parser');

var transform = require('../..');

var optimizeConditions = require('../../plugins/optimize-conditions');

var astStringify = require('../../ast-stringify/');

describe('optimize-conditions', function() {
    before(function() {
        this.template = path.join(__dirname, 'template.tmpl');
        this.expected = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, 'ast.json'),
                'utf8'
            )
        );
    });

    it('should optimize TMPL_IF conditions', function() {
        var parserOptions = {
            ignoreHTMLTags: true,
            collectStringEntities: true
        };

        var ast = transform(this.template, null, parserOptions)
            .using(
                optimizeConditions({
                    'falsy': false,
                    'truthy': true
                })
            )
            .toAST();

        assert.deepEqual(ast, this.expected);
    });
});
