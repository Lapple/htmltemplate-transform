var NOT_SURE = {};

var astStringify = require('../ast-stringify');

function asPerlBoolean(bool) {
    if (bool === '0') {
        return false;
    }

    return Boolean(bool);
}

module.exports = function(knownIdentifiers) {
    knownIdentifiers = knownIdentifiers || {};

    function evaluate(condition) {
        if (condition.type === 'Text') {
            return condition.content;
        }

        if (condition.type === 'Expression') {
            return evaluate(condition.content);
        }

        if (condition.type === 'BinaryExpression') {

            if (condition.operator === '&&') {
                var a = evaluate(condition.left),
                    b = evaluate(condition.right);

                if (a !== NOT_SURE && b !== NOT_SURE) {
                    return Boolean(a && b);
                }

                if (a !== NOT_SURE || b !== NOT_SURE) {
                    if (a !== NOT_SURE && !Boolean(a)) {
                        return false;
                    }

                    if (b !== NOT_SURE && !Boolean(b)) {
                        return false;
                    }
                }
            }

            if (condition.operator === '||') {
                var a = evaluate(condition.left),
                    b = evaluate(condition.right);

                if (a !== NOT_SURE && b !== NOT_SURE) {
                    return Boolean(a || b);
                }

                if (a !== NOT_SURE || b !== NOT_SURE) {
                    if (a !== NOT_SURE && Boolean(a)) {
                        return true;
                    }

                    if (b !== NOT_SURE && Boolean(b)) {
                        return true;
                    }
                }
            }

            if (condition.operator == 'eq') {
                var a = evaluate(condition.left),
                    b = evaluate(condition.right);

                if (a !== NOT_SURE && b !== NOT_SURE) {
                    return a == b;
                }
            }
        }

        if (condition.type === 'Literal') {
            // need to check with Perl
            return condition.value;
        }

        if (condition.type === 'Identifier' && condition.name.charAt(0) === '$') {
            var name = condition.name.slice(1);

            if (name in knownIdentifiers) {
                return knownIdentifiers[name];
            }
        }

        return NOT_SURE;
    }

    return function(node) {
        if (!node) {
            return;
        }

        if (node.name === 'TMPL_ASSIGN') {
            var identifierName = String(node.attributes[0].name);

            knownIdentifiers[identifierName] = evaluate(node.attributes[1]);
        }

        // very basic implementation for now
        if (node.name === 'TMPL_SETVAR') {
            var identifierName = String(node.attributes[0].name);

            knownIdentifiers[identifierName] = evaluate(node.content[0]);
        }

        // support TMPL_UNLESS
        if (node.type === 'Condition' && node.name === 'TMPL_IF') {
            var first = node.conditions[0];

            var result = evaluate(first.condition);

            if (result !== NOT_SURE) {
                if (asPerlBoolean(result)) {
                    this.update(first.content, true);
                } else {
                    if (node.otherwise) {
                        this.update(node.otherwise.content, true);
                    } else {
                        this.update(null, true);
                    }
                }
            }
        }

        return node;
    };
};
