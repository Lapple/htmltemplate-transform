var fs = require('fs');
var path = require('path');
var assert = require('assert');

var transform = require('../..');
var deadCode = require('../../plugins/dead-code');

describe('dead-code transform', function() {
    before(function() {
        this.template = path.join(__dirname, 'template.tmpl');
        this.expected = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, 'ast.json'),
                'utf8'
            )
        );
    });

    it('should remove unreachable code', function(done) {
        transform(this.template)
            .using(
                deadCode()
            )
            .toAST(function(err, ast) {
                if (err) {
                    done(err);
                } else {
                    assert.deepEqual(ast, this.expected);

                    done();
                }
            }.bind(this));
    });

});
