var fs = require('fs');
var path = require('path');
var assert = require('assert');

var transform = require('../..');
var include = require('../../plugins/include');

describe('include transform', function() {
    before(function() {
        this.template = path.join(__dirname, 'template.tmpl');
        this.expected = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, 'ast.json'),
                'utf8'
            )
        );
    });

    it('should insert the included template in place', function(done) {
        transform(this.template)
            .using(
                include({
                    includeTags: ['TMPL_INCLUDE'],
                    resolvePath: function(tagname, from, to) {
                        return path.resolve(path.dirname(from), to);
                    },
                    // NOTE: This is just to make sure that tests have the same
                    // regardless of project location.
                    hashTemplateFileName: function(filename) {
                        return path.basename(filename).replace(/\./, '_');
                    }
                })
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
