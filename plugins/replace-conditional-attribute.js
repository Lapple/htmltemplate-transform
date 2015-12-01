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

        if (node.type === 'ConditionalAttribute') {
            var transformedAttributes = {};
            var conditions = node.conditions.slice();

            if (node.otherwise) {
                conditions.push({
                    type: 'ConditionBranch',
                    content: node.otherwise
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

                    if (transformedAttributes[attributeName]) {
                        transformedAttributes[attributeName].value.content.alternate = expressionContent;
                    } else {
                        transformedAttributes[attributeName] = {
                            type: 'PairAttribute',
                            name: attributeName,
                            value: {
                                type: 'Expression',
                                content: expressionContent
                            }
                        };
                    }
                });
            });

            this.parent.post(function() {
                var parentNode = this.node;

                this.update(
                    parentNode.reduce(function(updatedAttributes, attribute) {
                        if (attribute === node) {
                            for (var attributeName in transformedAttributes) {
                                updatedAttributes.push(transformedAttributes[attributeName]);
                            }
                        } else {
                            updatedAttributes.push(attribute);
                        }

                        return updatedAttributes;
                    }, []),
                    true
                );
            });
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
