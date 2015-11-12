var fs = require('fs');

var parser = require('htmltemplate-parser');
var traverse = require('traverse');

function Transform(file, ast, parserOptions) {
    this._file = file;

    this._ast = ast || null;
    this._parserOptions = parserOptions || {};

    this.transforms = [];
}

Transform.prototype.using = function(fn) {
    this.transforms.push(fn);

    return this;
};

Transform.prototype._applyTransforms = function(ast) {
    var state = {
        rootFilepath: this._file,
        parserOptions: this._parserOptions
    };

    var updated = ast;

    if (this.transforms.length > 0) {
        var transform;

        for (var i = 0, len = this.transforms.length; i < len; i += 1) {
            transform = this.transforms[i];

            updated = traverse(updated).map(function(node) {
                this.state = state;

                transform.call(this, node);
            });
        }
    }

    return updated;
};

Transform.prototype.toAST = function() {
    if (this._ast) {
        return this._applyTransforms(this._ast);
    } else {
        var template = fs.readFileSync(this._file, 'utf8');
        var ast = parser.parse(template, this._parserOptions);

        return this._applyTransforms(ast);
    }
};

module.exports = Transform;
