var perlExpression = require('./perl-expression');

var position = require('./position');

var t = position.track;

function conditionAsTest(conditionNode) {
    if (conditionNode.type === 'SingleAttribute') {
        return t(conditionNode.name);
    } else if (conditionNode.type === 'Expression') {
        return perlExpression(conditionNode);
    }
}

module.exports = function(node, transform) {
    var first = node.conditions[0];

    return t('<') + t(node.name) + t(' ') +
        conditionAsTest(first.condition) + t('>') +
        transform(first.content) +

        (
            node.otherwise ? (
                t('<TMPL_ELSE>') +
                    transform(node.otherwise.content)
                )
            : ''
        ) +

    t('</') + t(node.name) + t('>');
}
