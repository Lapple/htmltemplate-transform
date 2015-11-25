var fs = require('fs');
var path = require('path');
var assert = require('assert');

var transform = require('../..');
var replaceBreak = require('../../plugins/replace-break');

describe('replace-break transform', function() {
    ['001', '002', '003'].forEach(function(n) {
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
                .using(
                    replaceBreak({
                        loopTags: ['TMPL_LOOP', 'TMPL_FOR']
                    })
                )
                .toAST();

            assert.deepEqual(ast, expected);
        });
    });
});
