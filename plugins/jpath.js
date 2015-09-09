var assign = require('object-assign');

function jpath() {
    return function(node) {
        if (this.isLeaf) {
            return;
        }

        if (node.type === 'SingleAttribute' && isJPathAccessToken(node.name)) {
            var updated = assign({}, node, {
                type: 'Expression',
                content: accessExpression(node.name),
                value: node.name
            });

            delete updated.name;

            this.update(updated);
        }

        if (node.type === 'PairAttribute' && isJPathAccessToken(node.value)) {
            var updated = assign({}, node, {
                value: {
                    type: 'Expression',
                    content: accessExpression(node.value),
                    value: node.value
                }
            });

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

function isJPathAccessToken(name) {
    return (
        !isQuote(name.charAt(0)) &&
        !isQuote(name.charAt(name.length - 1)) &&
        name.indexOf('.') !== -1
    );
}

function isQuote(character) {
    return character === '"' || character === '\'';
}

module.exports = jpath;
