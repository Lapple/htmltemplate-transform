var os = require('os');

var position = {
    line: 1,
    column: 1
};

module.exports = {
    reset: function() {
        position = {
            line: 1,
            column: 1
        }
    },

    getCurrent: function() {
        return position;
    },

    track: function(s) {
        if (s && s.length > 0) {
            for (var i = 0; i < s.length; i++) {
                if (s[i] === os.EOL) {
                    position.column = 1;
                    position.line++;
                } else {
                    position.column++;
                }
            }
        }

        return s;
    },

    updateTo: function(position) {
        var i = 0,
            s = '';

        var current = this.getCurrent();

        for (i = current.line; i < position.line; i++) {
            s += this.track('\n');
        }

        for (i = current.column; i < position.column; i++) {
            s += this.track(' ');
        }

        return s;
    }
}
