var assert = require('assert');
var assign = require('object-assign');

module.exports = function(options) {
    var loops = options.loopTags;

    assert(Array.isArray(loops), 'Expected options.loopTags to be an array of available loop tags.');

    var id = idGenerator('b_l___br');
    var breaks = [];

    return function(node) {
        if (this.isLeaf) {
            return;
        }

        // Content node that might contain TMPL_BREAK.
        if (Array.isArray(node)) {
            var breakIndex = findIndex(node, function(n) {
                return n.name === 'TMPL_BREAK';
            });

            if (breakIndex !== -1) {
                var breakId = id();
                var updatedContent = node.slice(0, breakIndex);

                breaks.push(breakId);
                updatedContent.push(
                    {
                        type: 'Tag',
                        name: 'TMPL_ASSIGN',
                        attributes: [
                            {
                                type: 'SingleAttribute',
                                name: breakId,
                                value: null,
                                position: node[breakIndex].position
                            },
                            {
                                type: 'Expression',
                                content: {
                                    type: 'Literal',
                                    value: 1
                                }
                            }
                        ]
                    },
                    {
                        type: 'Tag',
                        name: 'TMPL_CONTINUE'
                    }
                );

                this.update(updatedContent);
            }
        } else if (loops.indexOf(node.name) !== -1) {
            this.post(function() {
                if (breaks.length > 0) {
                    var updatedContent = [
                        {
                            type: 'Condition',
                            name: 'TMPL_IF',
                            conditions: [
                                {
                                    type: 'ConditionBranch',
                                    condition: {
                                        type: 'Expression',
                                        content: breaks
                                            .map(function(breakId) {
                                                return {
                                                    type: 'UnaryExpression',
                                                    operator: '!',
                                                    argument: {
                                                        type: 'Identifier',
                                                        name: '$' + breakId
                                                    },
                                                    prefix: true
                                                };
                                            })
                                            .reduce(function(a, b) {
                                                return {
                                                    type: 'BinaryExpression',
                                                    left: a,
                                                    operator: '&&',
                                                    right: b
                                                };
                                            })
                                    },
                                    content: node.content
                                }
                            ],
                            otherwise: null
                        }
                    ];

                    breaks = [];
                    this.update(
                        assign({}, node, { content: updatedContent }),
                        true
                    );
                }
            });
        }
    };
};

function findIndex(list, predicate) {
    for (var i = 0, len = list.length; i < len; i += 1) {
        if (predicate(list[i])) {
            return i;
        }
    }

    return -1;
}

function idGenerator(prefix) {
    var counter = 0;

    return function() {
        return prefix + counter++;
    };
}
