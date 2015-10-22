var Transform = require('./lib/transform');

module.exports = function(file, ast, parserOptions) {
    return new Transform(file, ast, parserOptions);
};
