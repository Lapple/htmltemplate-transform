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

Transform.prototype._applyTransforms = function(ast, callback) {
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

    callback(null, updated);
};

Transform.prototype.toAST = function(callback) {
    if (this._ast) {
        this._applyTransforms(this._ast, callback);
        return;
    }

    fs.readFile(this._file, 'utf8', function(err, template) {
        if (err) {
            return callback(err);
        }

        try {
            var ast = parser.parse(template, this._parserOptions);

            this._applyTransforms(ast, callback);
        } catch(e) {
            callback(e);
        }
    }.bind(this));
};

module.exports = Transform;
