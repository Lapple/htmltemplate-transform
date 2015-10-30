var traverse = require('traverse');

var attributes = require('./attributes');

var position = require('./position');

var perlExpression = require('./perl-expression');

var t = position.track;

function handler() {
    if (!this.node) {
        return;
    }

    if (this.node.type === 'Expression') {
        return this.update(perlExpression(this.node), true);
    }

    if (this.node.type === 'Identifier') {
        return this.update(t(this.node.name), true);
    }

    if (this.node.type === 'Literal') {
        return this.update(t('"') + t(this.node.value) + t('"'), true);
    }

    if (this.node.type === 'Comment') {
        return this.update(
            t(this.node.stringEntities.char) + t(this.node.content)
        , true);
    }

    if (this.node.type === 'Condition') {
        return this.update(
            require('./if-statement')(this.node, transform),
        true);
    }

    if (this.node.type === 'Tag' || this.node.type === 'InvalidTag') {
        var tagOpen = t('<') + t(this.node.name) + attributes(this.node, transform) + t('>');

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
    position.reset();

    return transform(ast);
};
