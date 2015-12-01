var fs = require('fs');
var path = require('path');
var assert = require('assert');

var transform = require('../..');
var replaceConditionalAttribute = require('../../plugins/replace-conditional-attribute');

describe('replace-conditional-attribute transform', function() {
    ['001'].forEach(function(n) {
        var filename = 'template.' + n + '.tmpl';

        it(filename, function() {
            var template = path.join(__dirname, filename);
            var expected = JSON.parse(
                fs.readFileSync(
                    path.join(__dirname, 'ast.' + n + '.json'),
                    'utf8'
                )
            );

            var ast = transform(template)
                .using(replaceConditionalAttribute())
                .toAST();

            assert.deepEqual(ast, expected);
        });
    });
});
