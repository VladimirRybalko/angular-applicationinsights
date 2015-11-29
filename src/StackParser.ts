/// <reference path="./Tools.ts" />
/// <reference path="./StackFrame.ts" />
class StackParser {
    /*
        * Stack parsing by the stacktracejs project @ https://github.com/stacktracejs/error-stack-parser
        */

    private static firefoxSafariStackRegexp = /\S+\:\d+/;
    private static chromeIeStackRegexp = /\s+at /;

    /**
        * Given an Error object, extract the most information from it.
        * @param error {Error}
        * @return Array[StackFrame]
        */
    static parse(error) {
        if (typeof error.stacktrace !== "undefined" || typeof error["opera#sourceloc"] !== "undefined") {
            return StackParser.parseOpera(error);
        } else if (error.stack && error.stack.match(StackParser.chromeIeStackRegexp)) {
            return StackParser.parseChromeOrInternetExplorer(error);
        } else if (error.stack && error.stack.match(StackParser.firefoxSafariStackRegexp)) {
            return StackParser.parseFireFoxOrSafari(error);
        } else {
            return null;
        }
    }

    /**
        * Separate line and column numbers from a URL-like string.
        * @param urlLike String
        * @return Array[String]
        */
    private static extractLocation(urlLike) {
        // Guard against strings like "(native)"
        if (urlLike.indexOf(":") === -1) {
            return [];
        }

        var locationParts = urlLike.split(":");
        var lastNumber = locationParts.pop();
        var possibleNumber = locationParts[locationParts.length - 1];
        if (!isNaN(parseFloat(possibleNumber)) && isFinite(possibleNumber)) {
            var lineNumber = locationParts.pop();
            return [locationParts.join(":"), lineNumber, lastNumber];
        } else {
            return [locationParts.join(":"), lastNumber, undefined];
        }
    }

    private static parseChromeOrInternetExplorer(error) {
        var level = 0;
        return error.stack.split("\n").slice(1).map((line) => {
            var tokens = line.replace(/^\s+/, "").split(/\s+/).slice(1);
            var locationParts = tokens[0] !== undefined ? this.extractLocation(tokens.pop().replace(/[\(\)\s]/g, "")) : ["unknown", "unknown", "unknown"];
            var functionName = (!tokens[0] || tokens[0] === "Anonymous") ? "unknown" : tokens[0];
            return new StackFrame(functionName, undefined, locationParts[0], locationParts[1], locationParts[2], level++);
        }, this);
    }

    private static parseFireFoxOrSafari(error) {
        var level = 0;
        return error.stack.split("\n").filter((line) => {
            return !!line.match(StackParser.firefoxSafariStackRegexp);
        }, this).map((line) => {
            var tokens = line.split("@");
            var locationParts = this.extractLocation(tokens.pop());
            var functionName = tokens.shift() || "unknown";
            return new StackFrame(functionName, undefined, locationParts[0], locationParts[1], locationParts[2], level++);
        }, this);
    }

    private static parseOpera(e) {
        if (!e.stacktrace || (e.message.indexOf("\n") > -1 &&
            e.message.split("\n").length > e.stacktrace.split("\n").length)) {
            return this.parseOpera9(e);
        } else if (!e.stack) {
            return this.parseOpera10(e);
        } else {
            return this.parseOpera11(e);
        }
    }

    private static parseOpera9(e) {
        const lineRe = /Line (\d+).*script (?:in )?(\S+)/i;
        const lines = e.message.split("\n");
        const result = [];
        for (var i = 2, len = lines.length; i < len; i += 2) {
            const match = lineRe.exec(lines[i]);
            if (match) {
                let level = 0;
                result.push(new StackFrame(undefined, undefined, match[2], match[1], undefined, level++));
            }
        }

        return result;
    }

    private static parseOpera10(e) {
        const lineRe = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
        const lines = e.stacktrace.split("\n");
        const result = [];
        for (var i = 0, len = lines.length; i < len; i += 2) {
            const match = lineRe.exec(lines[i]);
            if (match) {
                let level = 0;
                result.push(new StackFrame(match[3] || undefined, undefined, match[2], match[1], undefined, level++));
            }
        }

        return result;
    }

    // Opera 10.65+ Error.stack very similar to FF/Safari
    private static parseOpera11(error) {
        var level = 0;
        return error.stack.split("\n").filter((line) => {
            return !!line.match(StackParser.firefoxSafariStackRegexp) &&
                !line.match(/^Error created at/);
        }, this).map((line) => {
            var tokens = line.split("@");
            var locationParts = StackParser.extractLocation(tokens.pop());
            var functionCall = (tokens.shift() || "");
            var functionName = functionCall
                .replace(/<anonymous function(: (\w+))?>/, "$2")
                .replace(/\([^\)]*\)/g, "") || undefined;
            var argsRaw: string;
            if (functionCall.match(/\(([^\)]*)\)/)) {
                argsRaw = functionCall.replace(/^[^\(]+\(([^\)]*)\)$/, "$1");
            }
            var args = (argsRaw === undefined || argsRaw === "[arguments not available]") ? undefined : argsRaw ? argsRaw.split(",") : "";
            return new StackFrame(functionName, args, locationParts[0], locationParts[1], locationParts[2], level++);
        }, this);
    }

}