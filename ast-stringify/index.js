var traverse = require('traverse');

var attributes = require('./attributes');

var position = require('./position');

var t = position.track;

function handler() {
    if (!this.node) {
        return;
    }

    if (this.node.type === 'Condition') {
        var ifs = require('./if-statement')(this, transform);

        var alternate = ifs.alternate ? ('<TMPL_ELSE>' + ifs.alternate) : '';

        return this.update(
            t('<TMPL_IF ') + t(ifs.test) + t('>') +
                ifs.consequent + alternate +
            t('</TMPL_IF>'),
        true);
    }

    if (this.node.type === 'Tag' || this.node.type === 'InvalidTag') {
        var tagOpen = t('<') + t(this.node.name) + attributes(this.node) + t('>');

        if (this.node.content) {
            return this.update(
                tagOpen +
                    transform(this.node.content) +
                t('</') + t(this.node.name) + t('>'),
            true);
        }

        return this.update(
            tagOpen,
        true);
    }

    if (this.node.type === 'Text') {
        return this.update(t(this.node.content));
    }
}

function transform(ast) {
    return traverse(ast).map(handler).join('');
}

module.exports = function(ast) {
    return transform(ast);
};
