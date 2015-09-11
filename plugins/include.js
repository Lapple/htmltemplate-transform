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

    var blocks = {};

    function transform(node, isNested) {
        if (this.isLeaf) {
            return;
        }

        // On each include call a TMPL_BLOCK definition is created in the top
        // level scope which is then TMPL_INLINEd into the original location.
        // Block paths are hashed to avoid duplication.
        if (this.isRoot && !isNested) {
            this.state.parentFilePath = this.state.rootFilepath;

            this.after(function(root) {
                this.update(
                    Object.keys(blocks)
                        .map(function(id) {
                            return {
                                type: 'Tag',
                                name: 'TMPL_BLOCK',
                                attributes: [
                                    {
                                        type: 'SingleAttribute',
                                        name: id
                                    }
                                ],
                                content: blocks[id]
                            };
                        })
                        .concat(root)
                );

                blocks = {};
            });
        }

        if (tags.indexOf(node.name) !== -1) {
            var state = this.state;

            var filename = getPrimaryAttributeValue(node.attributes);
            var extname = path.extname(filename);

            if (extname !== '.inc' && extname !== '.tmpl') {
                return;
            }

            var include = resolvePath(node.name, state.parentFilePath, filename);

            var id = filepathAsBlockId(
                // Resolving the included filepath against root filepath to
                // have both human-readable output and disregard project
                // location.
                path.relative(path.dirname(state.rootFilepath), include)
            );

            var ast = parser.parse(
                fs.readFileSync(include, 'utf8'),
                state.parserOptions
            );

            var updated = traverse(ast).map(function(n) {
                this.state = assign({}, state, {
                    parentFilePath: include
                });

                transform.call(this, n, true);
            });

            blocks[id] = updated;

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
