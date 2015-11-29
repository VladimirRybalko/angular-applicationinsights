/// <reference path="./Tools.ts" />

/*
* Stack parsing by the stacktracejs project @ https://github.com/stacktracejs/error-stack-parser
*/

class StackFrame {

    private _tools: Tools;

    method;
    args;
    fileName;
    lineNumber;
    columnNumber;
    level;


    constructor(functionName, args, fileName, lineNumber, columnNumber, level) {

        if (!Tools.isUndefined(functionName)) {
            this.setFunctionName(functionName);
        }
        if (!Tools.isUndefined(columnNumber)) {
            this.setColumnNumber(columnNumber);
        }
        if (!Tools.isUndefined(args)) {
            this.setArgs(args);
        }
        if (!Tools.isUndefined(fileName)) {
            this.setFileName(fileName);
        }
        if (!Tools.isUndefined(lineNumber)) {
            this.setLineNumber(lineNumber);
        }

        if (!Tools.isUndefined(level)) {
            this.setLevelNumber(level);
        }
    }

    //// NOTE: Property name may be misleading as it includes the path,
    //// but it somewhat mirrors V8's JavaScriptStackTraceApi
    //// https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi and Gecko's
    //// http://mxr.mozilla.org/mozilla-central/source/xpcom/base/nsIException.idl#14

    //private getFunctionName() {
    //    return this.method;
    //}


    private setFunctionName(v) {
        this.method = String(v);
    }

    //private getArgs() {
    //    return this.args;
    //}

    private setArgs(v) {
        if (Object.prototype.toString.call(v) !== '[object Array]') {
            throw new TypeError('Args must be an Array');
        }
        this.args = v;
    }

   
    //private getFileName() {
    //    return this.fileName;
    //}

    private setFileName(v) {
        this.fileName = String(v);
    }

    //private getLineNumber() {
    //    return this.lineNumber;
    //}

    private setLineNumber(v) {
        if (!Tools.isNumber(v)) {
            /* test-code */
            console.log('LineNumber is ' + v);
            /* end-test-code */
            this.lineNumber = undefined;
            return;
        }
        this.lineNumber = Number(v);
    }

    //private getColumnNumber() {
    //    return this.columnNumber;
    //}

    private setColumnNumber(v) {
        if (!Tools.isNumber(v)) {
            this.columnNumber = undefined;
            return;
        }
        this.columnNumber = Number(v);
    }

    private setLevelNumber(v) {
        if (!Tools.isNumber(v)) {
            throw new TypeError('Level Number must be a Number');
        }
        this.level = Number(v);
    }

    toString() {
        var functionName = this.method || '{anonymous}';
        var args = '(' + (this.args || []).join(',') + ')';
        var fileName = this.fileName ? ('@' + this.fileName) : '';
        var lineNumber = Tools.isNumber(this.lineNumber) ? (':' + this.lineNumber) : '';
        var columnNumber = Tools.isNumber(this.columnNumber) ? (':' + this.columnNumber) : '';
        return functionName + args + fileName + lineNumber + columnNumber;
    }

}
