var traverse = require('traverse');

var attributes = require('./attributes');

function handler() {
    if (!this.node) {
        return;
    }

    if (this.node.type === 'Condition') {
        var ifs = require('./if-statement')(this, transform);

        var alternate = ifs.alternate ? ('<TMPL_ELSE>' + ifs.alternate) : '';

        return '<TMPL_IF ' + ifs.test + '>' +
            ifs.consequent + alternate +
        '</TMPL_IF>';
    }

    if (this.node.type === 'Tag' || this.node.type === 'InvalidTag') {
        var tagOpen = '<' + this.node.name + attributes(this.node) + '>';

        if (this.node.content) {
            return this.update(
                tagOpen +
                    transform(this.node.content) +
                '</' + this.node.name + '>',
            true);
        }

        return this.update(
            tagOpen,
        true);
    }

    if (this.node.type === 'Text') {
        return this.update(this.node.content);
    }
}

function transform(ast) {
    return traverse(ast).map(handler).join('');
}

module.exports = function(ast) {
    return transform(ast);
};
