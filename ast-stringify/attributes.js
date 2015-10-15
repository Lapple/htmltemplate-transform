var position = require('./position');

var perlExpression = require('./perl-expression');

var t = position.track;

module.exports = function(node) {
    var s = '';

    for (var i = 0, attribute; i < node.attributes.length; i++) {
        attribute = node.attributes[i];

        s += position.updateTo(attribute.position);

        if (attribute.type === 'Expression') {
            s += t(perlExpression(attribute.content));
        }
        if (attribute.type === 'SingleAttribute') {
            s += t(attribute.name);
        }
        if (attribute.type === 'PairAttribute') {
            s += t(attribute.name) + t('=') +
            t('"') + t(attribute.value || transform(attribute.content)) + t('"');
        }
    }

    return s;
}
