var assert = require('assert');
var assign = require('object-assign');

module.exports = function(options) {
    var loops = options.loopTags;

    assert(Array.isArray(loops), 'Expected options.loopTags to be an array of available loop tags.');

    var continuations = [];

    function isLoop(node) {
        return loops.indexOf(node.name) !== -1;
    }

    return function(node) {
        if (this.isLeaf) {
            return;
        }

        if (node.name === 'TMPL_CONTINUE') {
            var parents = this.parents;

            var closestLoopIndex = lastIndexOf(this.parents, function(parent) {
                return isLoop(parent.node);
            });

            var closestContentIndex = lastIndexOf(this.path, function(segment, index, path) {
                return (
                    (index >= 2 && path[index - 2] === 'otherwise') ||
                    (index >= 3 && path[index - 3] === 'conditions')
                );
            });

            var unreachableContentIndex = (
                closestContentIndex === -1 ?
                    -1 :
                    Number(this.path[closestContentIndex])
            );

            var continuation = parents
                .slice(closestLoopIndex)
                .reduceRight(function(acc, parent) {
                    var parentNode = parent.node;
                    var parentType = parentNode.type;
                    var rootCondition, precondition;

                    if (parentType === 'ConditionBranch' || parentType === 'AlternateConditionBranch') {
                        if (parentType === 'ConditionBranch') {
                            rootCondition = parent.parent.parent;
                            precondition = asExpression(parent.node.condition);

                            for (var i = (index(parent) - 1); i >= 0; i -= 1) {
                                precondition = binary(
                                    '&&',
                                    not(rootCondition.node.conditions[i].condition),
                                    precondition
                                );
                            }
                        } else {
                            rootCondition = parent.parent;
                            precondition = not(
                                rootCondition.node.conditions
                                    .map(function(branch) {
                                        return branch.condition;
                                    })
                                    .reduce(function(a, b) {
                                        return binary('||', asExpression(a), asExpression(b));
                                    })
                            );
                        }

                        acc.preconditions.push(precondition);
                        acc.index = index(rootCondition) + 1;

                        if (unreachableContentIndex !== -1) {
                            var contentParent = parents[closestContentIndex];

                            contentParent.update(
                                contentParent.node.slice(0, unreachableContentIndex)
                            );
                        }
                    }

                    return acc;
                }, {
                    index: -1,
                    preconditions: []
                });

            continuations.push(continuation);
        }

        if (isLoop(node)) {
            this.after(function() {
                var updated = continuations.reduceRight(function(content, continuation) {
                    return content
                        .slice(0, continuation.index)
                        .concat({
                            type: 'Condition',
                            name: 'TMPL_UNLESS',
                            conditions: [
                                {
                                    type: 'ConditionBranch',
                                    condition: continuation.preconditions.reduceRight(
                                        binary.bind(null, '&&')
                                    ),
                                    content: content.slice(continuation.index)
                                }
                            ]
                        });
                }, node.content);

                this.update(
                    assign({}, node, { content: updated }),
                    false
                );

                continuations = [];
            });
        }
    };
};

function asExpression(condition) {
    if (condition.type === 'SingleAttribute') {
        var identifier = '$' + condition.name;

        return {
            type: 'Expression',
            content: {
                type: 'Identifier',
                name: identifier
            },
            value: identifier,
            position: condition.position
        };
    } else {
        return condition;
    }
}

function binary(operator, a, b) {
    return {
        type: 'BinaryExpression',
        operator: operator,
        left: a,
        right: b
    };
}

function not(expression) {
    return {
        type: 'UnaryExpression',
        operator: '!',
        argument: expression,
        prefix: true
    };
}

function index(nodeContext) {
    return Number(last(nodeContext.path));
}

function last(list) {
    return list[list.length - 1];
}

function lastIndexOf(list, fn) {
    for (var i = (list.length - 1); i >= 0; i -= 1) {
        if (fn(list[i], i, list)) {
            return i;
        }
    }

    return -1;
}
