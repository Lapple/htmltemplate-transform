var fs = require('fs');
var path = require('path');
var assert = require('assert');

var assign = require('object-assign');
var traverse = require('traverse');
var parser = require('htmltemplate-parser');

function inline(options) {
    var tags = options.includeTags;
    var resolvePath = options.resolvePath;

    assert(Array.isArray(tags), 'Expected options.includeTags to be an array of available include tags.');
    assert.equal(typeof resolvePath, 'function', 'Expected options.resolvePath to be a function.');

    var blocks = [];

    function transform(node, isNested) {
        if (this.isLeaf) {
            return;
        }

        var state = this.state;

        // On each include call a TMPL_BLOCK definition is created in the top
        // level scope which is then TMPL_INLINEd into the original location.
        // Block paths are namespaced to avoid duplication.
        if (this.isRoot && !isNested) {
            state.parentFilePath = state.rootFilepath;

            this.after(function(root) {
                var uniqueBlocks = deduplicate(blocks, function(block) {
                    return block.id;
                });

                this.update(
                    uniqueBlocks
                        .map(function(block) {
                            return {
                                type: 'Tag',
                                name: 'TMPL_BLOCK',
                                attributes: [
                                    {
                                        type: 'SingleAttribute',
                                        name: block.id
                                    }
                                ],
                                content: block.content
                            };
                        })
                        .concat(root)
                );

                blocks = [];
            });
        }

        if (isBlockTag(node)) {
            this.after(function() {
                var blockName = getPrimaryAttributeValue(node.attributes);

                var id = filepathAsBlockId(
                    getLocalBlockIdentifier(blockName, state.parentFilePath, state.rootFilepath)
                );

                blocks.push({
                    id: id,
                    content: node.content
                });

                this.update({
                    type: 'Text',
                    content: '',
                    position: node.position
                });
            });
        }

        if (tags.indexOf(node.name) !== -1) {
            var blockName = getPrimaryAttributeValue(node.attributes);
            var filepath = resolvePath(node.name, state.parentFilePath, blockName);
            var extname = path.extname(filepath);

            var isFileInclude = (
                extname === '.inc' ||
                extname === '.tmpl'
            );

            var id = filepathAsBlockId(
                // Resolving the included filepath against root filepath to
                // have both human-readable output and disregard project
                // location.
                isFileInclude ?
                    path.relative(path.dirname(state.rootFilepath), filepath) :
                    // Local TMPL_BLOCK calls are namespaced and renamed to
                    // `%blockname.local` for a safer deduplication.
                    getLocalBlockIdentifier(blockName, state.parentFilePath, state.rootFilepath)
            );

            if (isFileInclude) {
                blocks.push({
                    id: id,
                    content: getFileBlockContent(filepath, state, transform)
                });
            }

            var attributes = node.attributes.map(function(attribute) {
                if (isPrimaryAttribute(attribute)) {
                    return {
                        type: 'SingleAttribute',
                        name: id
                    };
                } else {
                    return attribute;
                }
            });

            this.update({
                type: 'Tag',
                name: 'TMPL_INLINE',
                attributes: attributes
            });
        }
    }

    return transform;

    function getFileBlockContent(filepath, state, transform) {
        var ast = parser.parse(
            fs.readFileSync(filepath, 'utf8'),
            state.parserOptions
        );

        return traverse(ast).map(function(n) {
            this.state = assign({}, state, {
                parentFilePath: filepath
            });

            transform.call(this, n, true);
        });
    }
}

function getLocalBlockIdentifier(name, parentFilePath, rootFilepath) {
    return path.join(
        path.relative(path.dirname(rootFilepath), parentFilePath),
        name + '.local'
    );
}

function deduplicate(array, predicate) {
    var seen = {};

    return array.filter(function(item, index) {
        var value = predicate(item, index);

        if (value in seen) {
            return false;
        } else {
            seen[value] = true;
            return true;
        }
    });
}

function isBlockTag(node) {
    return (
        node.type === 'Tag' &&
        node.name === 'TMPL_BLOCK'
    );
}

function isPrimaryAttribute(attribute) {
    return (
        attribute.type === 'SingleAttribute' ||
        (
            attribute.type === 'PairAttribute' &&
            attribute.name === 'name'
        )
    );
}

function getPrimaryAttributeValue(attributes) {
    var primary = attributes.filter(isPrimaryAttribute)[0];

    if (primary) {
        return primary.value || primary.name;
    } else {
        return null;
    }
}

function filepathAsBlockId(string) {
    return string.replace(/[^a-zA-Z0-9_]/g, '_');
}

module.exports = inline;
