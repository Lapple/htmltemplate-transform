var traverse = require('traverse');

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

        var left = transform(this.node.left);
        var right = transform(this.node.right);

        if (operator === 'eq' || operator === 'neq') {
            right = "'" + right + "'";
        }

        return this.update(
            [left, right].join(' ' + operator + ' ')
        , true);
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
