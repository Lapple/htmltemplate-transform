var assign = require('object-assign');
var findIndex = require('find-index');

var TRUE_LITERAL = {
    type: 'Literal',
    value: true
};

var NULL_LITERAL = {
    type: 'Literal',
    value: null
};

module.exports = function() {
    return function(node) {
        if (this.isLeaf) {
            return;
        }

        if (hasConditionalAttributes(node)) {
            var updatedAttributes = [];

            node.forEach(function(attribute) {
                if (!isConditionalAttribute(attribute)) {
                    updatedAttributes.push(attribute);

                    return;
                }

                var conditions = attribute.conditions.slice();

                if (attribute.otherwise) {
                    conditions.push({
                        type: 'ConditionBranch',
                        content: attribute.otherwise
                    });
                }

                conditions.forEach(function(c, index) {
                    c.content.forEach(function(attr) {
                        var attributeName = attr.name;
                        var attributeContent = getConsequentAttributeContent(attr);

                        var precondition = getPrecondition(
                            conditions.slice(0, index),
                            c.condition
                        );

                        var expressionContent = {
                            type: 'ConditionalExpression',
                            test: precondition,
                            consequent: attributeContent,
                            alternate: NULL_LITERAL
                        };

                        var existingAttributeIndex = findIndex(updatedAttributes, function(attribute) {
                            return attribute.name === attributeName;
                        });

                        var transformedConditionalAttribute = {
                            type: 'PairAttribute',
                            name: attributeName,
                            value: {
                                type: 'Expression',
                                content: expressionContent
                            }
                        };

                        if (existingAttributeIndex === -1) {
                            updatedAttributes.push(transformedConditionalAttribute);
                        } else {
                            if (isTransformedConditionalAttribute(updatedAttributes[existingAttributeIndex])) {
                                updatedAttributes[existingAttributeIndex].value.content.alternate = expressionContent;
                            } else {
                                updatedAttributes[existingAttributeIndex] = transformedConditionalAttribute;
                            }
                        }
                    });
                });
            });

            this.update(updatedAttributes, true);
        }
    };
};

function getPrecondition(prerequisites, condition) {
    if (prerequisites.length === 0) {
        return asExpression(condition);
    }

    var precondition = prerequisites
        .map(function(prerequisite) {
            return {
                type: 'UnaryExpression',
                operator: '!',
                argument: asExpression(prerequisite.condition),
                prefix: true
            };
        })
        .reduceRight(and);

    if (condition) {
        return and(precondition, asExpression(condition));
    }

    return precondition;
}

function getConsequentAttributeContent(attr) {
    if (attr.type === 'SingleAttribute') {
        return [TRUE_LITERAL];
    }

    if (attr.type === 'PairAttribute') {
        if (attr.content) {
            return attr.content;
        }

        return [
            {
                type: 'Literal',
                value: attr.value
            }
        ];
    }
}

function asExpression(condition) {
    if (condition.type === 'SingleAttribute') {
        var identifier = '$' + condition.name;

        return {
            type: 'Identifier',
            name: identifier
        };
    } else {
        return condition.content;
    }
}

function and(a, b) {
    return {
        type: 'BinaryExpression',
        operator: '&&',
        left: a,
        right: b
    };
}

function isConditionalAttribute(node) {
    return node.type === 'ConditionalAttribute';
}

function hasConditionalAttributes(node) {
    return (
        Array.isArray(node) &&
        node.some(isConditionalAttribute)
    );
}

function isTransformedConditionalAttribute(attribute) {
    return (
        attribute.type === 'PairAttribute' &&
        attribute.value.type === 'Expression' &&
        attribute.value.content.type === 'ConditionalExpression'
    );
}
