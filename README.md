# HTMLTemplate transformations

![TravisCI](https://travis-ci.org/Lapple/htmltemplate-transform.svg)

Pluggable transforms for HTML::Template.

## Installation

    npm install htmltemplate-transform

## Usage

```js
var path = require('path');
var transform = require('htmltemplate-transform');

// Plugin that inlines external template files into parent.
var include = require('htmltemplate-transform/plugins/include');

// Plugin that expands dot notation into a series of property accessors.
var jpath = require('htmltemplate-transform/plugins/jpath');

var templateFile = path.join(__dirname, 'template.tmpl');

var ast = transform(templateFile)
    .using(
        include({
            includeTags: ['TMPL_INCLUDE'],
            resolvePath: function(tagname, from, to) {
                return path.resolve(path.dirname(from), to);
            }
        })
    )
    .using(jpath()) // Plugins can be chained.
    .toAST();

console.log(ast);
```
