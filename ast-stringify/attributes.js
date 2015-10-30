var position = require('./position');

var perlExpression = require('./perl-expression');

var t = position.track;

module.exports = function(node, transform) {
    var s = '';

    for (var i = 0, attribute; i < node.attributes.length; i++) {
        attribute = node.attributes[i];

        s += position.updateTo(attribute.position);

        if (attribute.type === 'Expression') {
            s += perlExpression(attribute);
        }
        if (attribute.type === 'SingleAttribute') {
            s += t(attribute.name);
        }
        if (attribute.type === 'PairAttribute') {
            s += t(attribute.name) + t('=') + transform([attribute.content]);
        }
    }

    return s;
}
