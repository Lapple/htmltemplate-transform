var traverse = require('traverse');

var position = require('./position');

var t = position.track;

var operatorStack = [];

var order = {
    'and': 1,
    'or': 2
};

function handler() {
    if (this.node.type === 'Identifier') {
        return this.update(t(this.node.name), true);
    }

    if (this.node.type === 'CallExpression') {
        var out = t(this.node.callee.name);

        out +=
            t('(') +
                this.node.arguments.map(transform).join(', ') +
            t(')');

        return this.update(out, true);
    }

    if (this.node.type === 'UnaryExpression') {
        var operator = this.node.operator;

        return this.update(
            operator +
            t(this.node.stringEntities.whitespace) +
            transform(this.node.argument),
        true);
    }

    if (this.node.type === 'Literal') {
        var isString = typeof this.node.value === 'string';

        if (isString) {
            return this.update(t('"') + t(this.node.value) + t('"'), true);
        }

        return this.update(t(this.node.value), true);
    }

    if (this.node.type === 'BinaryExpression') {
        var operator = this.node.operator;
        var previousOperator = operatorStack[operatorStack.length - 1];

        if (operatorStack.length > 0 && order[previousOperator] < order[operator]) {
            var shouldWrap = true;
        }

        operatorStack.push(operator);

        var out =
            transform(this.node.left) +
            t(this.node.stringEntities.before) +
            t(operator) +
            t(this.node.stringEntities.after) +
            transform(this.node.right);

        operatorStack.pop();

        if (shouldWrap) {
            out = '(' + out + ')';
        }

        return this.update(out, true);
    }

    if (this.node.type === 'MemberExpression') {
        return this.update(
            transform(this.node.object) + '->{' + transform(this.node.property) + '}'
        );
    }
}

function transform(ast) {
    return traverse(ast).map(handler);
}

module.exports = function(node) {
    return t(node.stringEntities.before) + transform(node.content) + t(node.stringEntities.after);
}
