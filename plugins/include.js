var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var assert = require('assert');

var assign = require('object-assign');
var traverse = require('traverse');
var parser = require('htmltemplate-parser');

function inline(options) {
    var tags = options.includeTags;
    var resolvePath = options.resolvePath;
    var hashTemplateFileName = options.hashTemplateFileName || hash;

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

            var include = resolvePath(node.name, state.rootFilepath, filename);
            var id = hashTemplateFileName(include);

            var ast = parser.parse(
                fs.readFileSync(include, 'utf8'),
                state.parserOptions
            );

            var updated = traverse(ast).map(function(n) {
                this.state = assign({}, state, {
                    rootFilepath: include
                });

                transform.call(this, n, true);
            });

            blocks[id] = updated;

            this.update({
                type: 'Tag',
                name: 'TMPL_INLINE',
                attributes: [
                    {
                        type: 'SingleAttribute',
                        name: id
                    }
                ]
            });
        }
    }

    return transform;
}

function getPrimaryAttributeValue(attributes) {
    var primary = attributes.filter(function(attribute) {
        return (
            attribute.type === 'SingleAttribute' ||
            (
                attribute.type === 'PairAttribute' &&
                attribute.name === 'name'
            )
        );
    })[0];

    if (primary) {
        return primary.value || primary.name;
    } else {
        return null;
    }
}

function hash(string) {
    return 'block_' + crypto.createHash('md5').update(string).digest('hex');
}

module.exports = inline;
