var assign = require('object-assign');

function jpath() {
    return function(node) {
        if (this.isLeaf) {
            return;
        }

        if (node.type === 'SingleAttribute' && node.name.indexOf('.') !== -1) {
            var updated = assign({}, node, {
                type: 'Expression',
                content: accessExpression(node.name),
                value: node.name
            });

            delete updated.name;

            this.update(updated);
        }

        if (node.type === 'PairAttribute' && isJPathAccessToken(node.content)) {
            var updated = assign({}, node, {
                value: {
                    type: 'Expression',
                    content: accessExpression(node.value),
                    value: node.value
                }
            });

            delete updated.content;

            this.update(updated);
        }
    };
}

function accessExpression(jpath) {
    var path = jpath.split('.');

    return path
        .map(function(key, index) {
            return memberExpression(
                path.slice(0, index + 1)
            );
        })
        .reduce(function(expression, member, index) {
            return {
                type: 'BinaryExpression',
                operator: '&&',
                left: expression,
                right: member
            };
        });
}

function memberExpression(path) {
    return path
        .slice(1)
        .reduce(function(expression, key) {
            var number = +key;

            return {
                type: 'MemberExpression',
                object: expression,
                property: {
                    type: 'Literal',
                    value: isNaN(number) ? key : number
                }
            };
        }, {
            type: 'Identifier',
            name: '$' + path[0]
        });
}

function isJPathAccessToken(node) {
    return (
        // This can be `undefined` when an expression PairAttribute is met.
        node &&
        node.type === 'Identifier' &&
        node.name.indexOf('.') !== -1
    );
}

module.exports = jpath;
