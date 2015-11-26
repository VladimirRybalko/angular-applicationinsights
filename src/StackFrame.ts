/// <reference path="./Tools.ts" />

/*
* Stack parsing by the stacktracejs project @ https://github.com/stacktracejs/error-stack-parser
*/

     class StackFrame {

        private _tools: Tools;

        private _method;
        private _args;
        private _fileName;
        private _lineNumber;
        private _columnNumber;
        private _level;


        constructor(functionName, args, fileName, lineNumber, columnNumber, level, tools: Tools) {
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

        getFunctionName() {
            return this._method;
        }


        setFunctionName(v) {
            this._method = String(v);
        }

        getArgs() {
            return this._args;
        }

        setArgs(v) {
            if (Object.prototype.toString.call(v) !== '[object Array]') {
                throw new TypeError('Args must be an Array');
            }
            this._args = v;
        }

        // NOTE: Property name may be misleading as it includes the path,
        // but it somewhat mirrors V8's JavaScriptStackTraceApi
        // https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi and Gecko's
        // http://mxr.mozilla.org/mozilla-central/source/xpcom/base/nsIException.idl#14
        getFileName() {
            return this._fileName;
        }

        setFileName(v) {
            this._fileName = String(v);
        }

        getLineNumber() {
            return this._lineNumber;
        }

        setLineNumber(v) {
            if (!this._tools.isNumber(v)) {
                /* test-code */
                console.log('LineNumber is ' + v);
                /* end-test-code */
                this._lineNumber = undefined;
                return;
            }
            this._lineNumber = Number(v);
        }

        getColumnNumber() {
            return this._columnNumber;
        }

        setColumnNumber(v) {
            if (!this._tools.isNumber(v)) {
                this._columnNumber = undefined;
                return;
            }
            this._columnNumber = Number(v);
        }

        setLevelNumber(v) {
            if (!this._tools.isNumber(v)) {
                throw new TypeError('Level Number must be a Number');
            }
            this._level = Number(v);
        }

        toString() {
            var functionName = this.getFunctionName() || '{anonymous}';
            var args = '(' + (this.getArgs() || []).join(',') + ')';
            var fileName = this.getFileName() ? ('@' + this.getFileName()) : '';
            var lineNumber = this._tools.isNumber(this.getLineNumber()) ? (':' + this.getLineNumber()) : '';
            var columnNumber = this._tools.isNumber(this.getColumnNumber()) ? (':' + this.getColumnNumber()) : '';
            return functionName + args + fileName + lineNumber + columnNumber;
        }

    }
