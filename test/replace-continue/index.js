var fs = require('fs');
var path = require('path');
var assert = require('assert');

var transform = require('../..');
var replaceContinue = require('../../plugins/replace-continue');

describe('replace-continue transform', function() {
    ['001', '002', '003', '004', '005'].forEach(function(n) {
        var filename = 'template.' + n + '.tmpl';

        it(filename, function(done) {
            var template = path.join(__dirname, filename);
            var expected = JSON.parse(
                fs.readFileSync(
                    path.join(__dirname, 'ast.' + n + '.json'),
                    'utf8'
                )
            );

            transform(template)
                .using(
                    replaceContinue({
                        loopTags: ['TMPL_LOOP', 'TMPL_FOR']
                    })
                )
                .toAST(function(err, ast) {
                    if (err) {
                        done(err);
                    } else {
                        assert.deepEqual(ast, expected);

                        done();
                    }
                });
        });
    });
});
