var perlExpression = require('./perl-expression');

module.exports = function(node) {
    var s = node.attributes.map(function(attribute) {
        if (attribute.type === 'Expression') {
            return perlExpression(attribute.content);
        }
        if (attribute.type === 'SingleAttribute') {
            return attribute.name;
        }
        if (attribute.type === 'PairAttribute') {
            return attribute.name + '=' +
            '"' + (attribute.value || transform(attribute.content)) + '"';
        }
    });

    if (s.length > 0) {
        return ' ' + s.join(' ');
    }

    return '';
}
