// for pretty output
// ./bin/optimize --path test/optimize-conditions/template.tmpl

var fs = require('fs');
var path = require('path');
var assert = require('assert');

var parser = require('htmltemplate-parser');

var transform = require('../../');

var optimizeConditions = require('../../plugins/optimize-conditions');

var astStringify = require('../../ast-stringify/');

describe('optimize-conditions', function() {
    it('should optimize TMPL_IF conditions', function(done) {
        var expected = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, 'ast.json'),
                'utf8'
            )
        );

        transform(
            path.join(__dirname, 'template.tmpl'),
            null,
            {
                ignoreHTMLTags: true,
                collectStringEntities: true
            }
        )
        .using(
            optimizeConditions({
                '$falsy': false,
                '$truthy': true
            })
        )
        .toAST(function(err, ast) {
            assert.deepEqual(ast, expected);

            done();
        });
    });
});
