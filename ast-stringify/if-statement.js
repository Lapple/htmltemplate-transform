var iife = function(a) { return a; };

var lookupVariable = function(a) { return a; };

var perlExpression = require('./perl-expression');

var NULL_NODE = '';

function conditionAsTest(conditionNode) {
    if (conditionNode.type === 'SingleAttribute') {
        return lookupVariable(conditionNode.name);
    } else if (conditionNode.type === 'Expression') {
        return perlExpression(conditionNode.content);
    }
}

module.exports = function(context, transform) {
    var otherwise = NULL_NODE;

    if (context.node.otherwise) {
        otherwise = iife(
            transform(context.node.otherwise.content)
        );
    }

    return context.node.conditions.reduceRight(function(statement, node) {
        var expression = {
            type: 'ConditionalExpression',
            test: conditionAsTest(node.condition),
            consequent: iife(
                transform(node.content)
            ),
            alternate: statement
        };

        return expression;
    }, otherwise);
}
