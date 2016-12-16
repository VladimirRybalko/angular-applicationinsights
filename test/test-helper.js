// Polyfill for old browsers
// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
if (!Array.isArray) {
    Array.isArray = function(arg) {
        return Object.prototype.toString.call(arg) === '[object Array]';
    };
}

beforeEach(function() {
    jasmine.addMatchers({
        toMatchStackFrame: function(){
            return { compare: function(actual, expected) {
            //var actual = this.actual;
                var message = '';
                if (actual.method !== expected[0]) {
                    message += 'expected functionName: ' + actual.method + ' to equal ' + expected[0] + '\n';
                }
                if (Array.isArray(actual.args) && Array.isArray(expected[1])) {
                    if (actual.args.join() !== expected[1].join()) {
                        message += 'expected args: ' + actual.args + ' to equal ' + expected[1] + '\n';
                    }
                } else if (actual.args !== expected[1]) {
                    message += 'expected args: ' + actual.args + ' to equal ' + expected[1] + '\n';
                }
                if (actual.fileName !== expected[2]) {
                    message += 'expected fileName: ' + actual.fileName + ' to equal ' + expected[2] + '\n';
                }
                if (actual.line !== expected[3]) {
                    message += 'expected line: ' + actual.line + ' to equal ' + expected[3] + '\n';
                }
                if (actual.columnNumber !== expected[4]) {
                    message += 'expected columnNumber: ' + actual.columnNumber + ' to equal ' + expected[4] + '\n';
                }

                return {
                    pass: message === '' ? true:false,
                    message: message
                };
            }
        };
    }});
});