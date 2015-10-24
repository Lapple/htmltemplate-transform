var assign = require('object-assign');

var TERMINATION_TAGS = ['TMPL_CONTINUE', 'TMPL_BREAK'];

module.exports = function() {
    return function(node) {
        if (this.isLeaf) {
            return;
        }

        var content = node.content;

        if (content) {
            for (var i = 0, len = content.length; i < len; i += 1) {
                if (TERMINATION_TAGS.indexOf(content[i].name) !== -1) {
                    this.update(
                        assign(
                            {},
                            node,
                            { content: content.slice(0, i + 1) }
                        )
                    );
                }
            }
        }
    };
};
