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

        	setFunctionName: function (v) {
            	this.method = String(v);
        	},

        	setFileName: function (v) {
            	this.fileName = String(v);
        	},

        	setLineNumber: function (v) {
            	if (!isNumber(v)) {
                	throw new TypeError('Line Number must be a Number');
            	}
            	this.line = Number(v);
        	},

        	setLevelNumber: function (v) {
            	if (!isNumber(v)) {
                	throw new TypeError('Level Number must be a Number');
            	}
            	this.level = Number(v);
        	},

    	};

    root.StackFrame = StackFrame;
 })(root);