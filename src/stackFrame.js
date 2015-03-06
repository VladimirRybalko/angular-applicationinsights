/*
* Stack parsing by the stacktracejs project @ https://github.com/stacktracejs/error-stack-parser
*/

(function(root){

     var isNumber = function(n){ return !isNaN(parseFloat(n)) && isFinite(n);};

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

    root.Stackframe = StackFrame;
 })(root);