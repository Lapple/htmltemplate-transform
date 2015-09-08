var Transform = require('./lib/transform');

module.exports = function(file, parserOptions) {
    return new Transform(file, parserOptions);
};
