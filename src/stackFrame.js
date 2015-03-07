/*
* Stack parsing by the stacktracejs project @ https://github.com/stacktracejs/error-stack-parser
*/

/* test-code */
window.root = window.root || {};
window.root.angular = angular;
var root = window.root;

/* end-test-code */

(function(root){

        var isNumber = function(n){ return !isNaN(parseFloat(n)) && isFinite(n);};
        var isUndefined = root.angular.isUndefined;

    	function StackFrame(functionName, args, fileName, lineNumber, columnNumber, level) {
        	if (!isUndefined(functionName)) {
            	this.setFunctionName(functionName);
        	}
            if (!isUndefined(columnNumber)) {
                this.setColumnNumber(columnNumber);
            }
            if (!isUndefined(args)) {
                this.setArgs(args);
            }
        	if (!isUndefined(fileName)) {
            	this.setFileName(fileName);
        	}
        	if (!isUndefined(lineNumber)) {
            	this.setLineNumber(lineNumber);
        	}

        	if (!isUndefined(level)) {
            	this.setLevelNumber(level);
        	}
    	}

    	StackFrame.prototype = {

            getFunctionName: function () {
                return this.method;
            },
        	setFunctionName: function (v) {
            	this.method = String(v);
        	},
            getArgs: function () {
                return this.args;
            },
            setArgs: function (v) {
                if (Object.prototype.toString.call(v) !== '[object Array]') {
                    throw new TypeError('Args must be an Array');
                }
                this.args = v;
            },
            // NOTE: Property name may be misleading as it includes the path,
            // but it somewhat mirrors V8's JavaScriptStackTraceApi
            // https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi and Gecko's
            // http://mxr.mozilla.org/mozilla-central/source/xpcom/base/nsIException.idl#14
            getFileName: function () {
                return this.fileName;
            },
        	setFileName: function (v) {
            	this.fileName = String(v);
        	},
            getLineNumber: function () {
                return this.line;
            },
        	setLineNumber: function (v) {
            	if (!isNumber(v)) {
                    /* test-code */
                    console.log('LineNumber is '+v);
                    /* end-test-code */
                	this.line = undefined;
                    return;
            	}
            	this.line = Number(v);
        	},
            getColumnNumber: function () {
                 return this.columnNumber;
            },
            setColumnNumber: function (v) {
                 if (!isNumber(v)) {
                    this.columnNumber = undefined;
                    return;
                }
                this.columnNumber = Number(v);
            },
        	setLevelNumber: function (v) {
            	if (!isNumber(v)) {
                	throw new TypeError('Level Number must be a Number');
            	}
            	this.level = Number(v);
        	},
            toString: function() {
                var functionName = this.getFunctionName() || '{anonymous}';
                var args = '(' + (this.getArgs() || []).join(',') + ')';
                var fileName = this.getFileName() ? ('@' + this.getFileName()) : '';
                var lineNumber = isNumber(this.getLineNumber()) ? (':' + this.getLineNumber()) : '';
                var columnNumber = isNumber(this.getColumnNumber()) ? (':' + this.getColumnNumber()) : '';
                return functionName + args + fileName + lineNumber + columnNumber;
            }

    	};

    root.StackFrame = StackFrame;
 })(root);