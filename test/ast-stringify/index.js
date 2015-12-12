var fs = require('fs');
var path = require('path');
var assert = require('assert');

var parser = require('htmltemplate-parser');

var astStringify = require('../../ast-stringify/');

xdescribe('astStringify', function() {
    it('should convert AST tree into template string', function() {
        var templateString = fs.readFileSync(
            path.join(__dirname, 'template.tmpl')
        ).toString();

        var AST = parser.parse(templateString, {
            ignoreHTMLTags: true,
            collectStringEntities: true
        });

        assert.equal(templateString, astStringify(AST));
    });
});
