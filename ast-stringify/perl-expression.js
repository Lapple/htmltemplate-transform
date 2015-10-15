var traverse = require('traverse');

var operatorStack = [];

var order = {
    'and': 1,
    'or': 2
};

function handler() {
    if (this.node.type === 'Identifier') {
        return this.update(this.node.name, true);
    }

    if (this.node.type === 'UnaryExpression') {
        var operator = this.node.operator;

        return this.update(
            operator + transform(this.node.argument),
        true);
    }

    if (this.node.type === 'Literal') {
        return this.update(this.node.value, true);
    }

    if (this.node.type === 'BinaryExpression') {
        var operator = this.node.operator;
        var previousOperator = operatorStack[operatorStack.length - 1];

        if (operatorStack.length > 0 && order[previousOperator] < order[operator]) {
            var shouldWrap = true;
        }

        operatorStack.push(operator);

        var left = transform(this.node.left);
        var right = transform(this.node.right);

        operatorStack.pop();

        if (operator === 'eq' || operator === 'neq') {
            right = "'" + right + "'";
        }

        var out = [left, right].join(' ' + operator + ' ');

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
    return '[% ' + transform(node) + ' %]';
}
