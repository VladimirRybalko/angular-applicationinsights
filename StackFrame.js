/// <reference path="./Tools" />
/*
* Stack parsing by the stacktracejs project @ https://github.com/stacktracejs/error-stack-parser
*/
var StackFrame = (function () {
    function StackFrame(functionName, args, fileName, lineNumber, columnNumber, level, tools) {
        this._tools = tools;
        if (!tools.isUndefined(functionName)) {
            this.setFunctionName(functionName);
        }
        if (!tools.isUndefined(columnNumber)) {
            this.setColumnNumber(columnNumber);
        }
        if (!tools.isUndefined(args)) {
            this.setArgs(args);
        }
        if (!tools.isUndefined(fileName)) {
            this.setFileName(fileName);
        }
        if (!tools.isUndefined(lineNumber)) {
            this.setLineNumber(lineNumber);
        }
        if (!tools.isUndefined(level)) {
            this.setLevelNumber(level);
        }
    }
    StackFrame.prototype.getFunctionName = function () {
        return this._method;
    };
    StackFrame.prototype.setFunctionName = function (v) {
        this._method = String(v);
    };
    StackFrame.prototype.getArgs = function () {
        return this._args;
    };
    StackFrame.prototype.setArgs = function (v) {
        if (Object.prototype.toString.call(v) !== '[object Array]') {
            throw new TypeError('Args must be an Array');
        }
        this._args = v;
    };
    // NOTE: Property name may be misleading as it includes the path,
    // but it somewhat mirrors V8's JavaScriptStackTraceApi
    // https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi and Gecko's
    // http://mxr.mozilla.org/mozilla-central/source/xpcom/base/nsIException.idl#14
    StackFrame.prototype.getFileName = function () {
        return this._fileName;
    };
    StackFrame.prototype.setFileName = function (v) {
        this._fileName = String(v);
    };
    StackFrame.prototype.getLineNumber = function () {
        return this._lineNumber;
    };
    StackFrame.prototype.setLineNumber = function (v) {
        if (!this._tools.isNumber(v)) {
            /* test-code */
            console.log('LineNumber is ' + v);
            /* end-test-code */
            this._lineNumber = undefined;
            return;
        }
        this._lineNumber = Number(v);
    };
    StackFrame.prototype.getColumnNumber = function () {
        return this._columnNumber;
    };
    StackFrame.prototype.setColumnNumber = function (v) {
        if (!this._tools.isNumber(v)) {
            this._columnNumber = undefined;
            return;
        }
        this._columnNumber = Number(v);
    };
    StackFrame.prototype.setLevelNumber = function (v) {
        if (!this._tools.isNumber(v)) {
            throw new TypeError('Level Number must be a Number');
        }
        this._level = Number(v);
    };
    StackFrame.prototype.toString = function () {
        var functionName = this.getFunctionName() || '{anonymous}';
        var args = '(' + (this.getArgs() || []).join(',') + ')';
        var fileName = this.getFileName() ? ('@' + this.getFileName()) : '';
        var lineNumber = this._tools.isNumber(this.getLineNumber()) ? (':' + this.getLineNumber()) : '';
        var columnNumber = this._tools.isNumber(this.getColumnNumber()) ? (':' + this.getColumnNumber()) : '';
        return functionName + args + fileName + lineNumber + columnNumber;
    };
    return StackFrame;
})();
//# sourceMappingURL=StackFrame.js.map