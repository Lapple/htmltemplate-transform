var NOT_SURE = {};

module.exports = function(knownIdentifiers) {
    knownIdentifiers = knownIdentifiers || {};

    function and(left, right) {
        return evaluate(left) && evaluate(right);
    }

    function evaluate(condition) {
        if (condition.type === 'Expression') {
            return evaluate(condition.content);
        }

        if (condition.type === 'BinaryExpression') {
            if (condition.operator === '&&') {
                return and(condition.left, condition.right);
            }

            if (condition.operator == 'eq') {
                return true;
            }
        }

        if (condition.type === 'Literal') {
            // need to check with Perl
            return Boolean(condition.value);
        }

        if (condition.type === 'Identifier' && condition.name in knownIdentifiers) {
            return knownIdentifiers[condition.name];
        }

        return NOT_SURE;
    }

    return function(node) {
        if (!node) {
            return;
        }

        // support TMPL_UNLESS
        if (node.type === 'Condition' && node.name === 'TMPL_IF') {
            var first = node.conditions[0];

            var result = evaluate(first.condition);

            if (typeof result === 'boolean') {
                if (result) {
                    this.update(first.content[0], true);
                } else {
                    if (node.otherwise) {
                        this.update(node.otherwise.content[0], true);
                    } else {
                        this.update(null, true);
                    }
                }
            }
        }

        return node;
    };
};
