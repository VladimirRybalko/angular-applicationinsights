/// <reference path="typings/angularjs/angular.d.ts" />
var Tools = (function () {
    function Tools(angular) {
        Tools.isDefined = angular.isDefined,
            Tools.isUndefined = angular.isUndefined,
            Tools.isObject = angular.isObject,
            Tools.isArray = angular.isArray,
            Tools.isString = angular.isString,
            Tools.extend = angular.extend,
            Tools.toJson = angular.toJson,
            Tools.fromJson = angular.fromJson,
            Tools.forEach = angular.forEach,
            Tools.copy = angular.copy,
            Tools.noop = angular.noop; // jshint ignore:line
    }
    Tools.isNullOrUndefined = function (val) {
        return Tools.isUndefined(val) || val === null;
    };
    Tools.isNumber = function (n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };
    Tools.generateGuid = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.
            replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
    return Tools;
}());
/// <reference path="./Tools.ts" />
/*
* Storage is heavily based on the angular storage module by Gregory Pike (https://github.com/grevory/angular-local-storage)
*/
var AppInsightsStorage = (function () {
    function AppInsightsStorage(settings) {
        var _this = this;
        this._config = Tools.extend(AppInsightsStorage.defaultConfig, settings);
        this._self = this._config;
        this._prefix = this._config.prefix;
        this._cookie = this._config.cookie;
        this._notify = this._config.notify;
        this._storageType = this._config.storageType;
        this._$rootScope = this._config.rootScope;
        this._$window = this._config.window;
        this._$document = this._config.document;
        this._$parse = this._config.parse;
        // When Angular's $document is not available
        if (!this._$document) {
            this._$document = document;
        }
        else if (this._$document[0]) {
            this._$document = this._$document[0];
        }
        // If there is a prefix set in the config lets use that with an appended period for readability
        if (this._prefix.substr(-1) !== ".") {
            this._prefix = !!this._prefix ? this._prefix + "." : "";
        }
        this._deriveQualifiedKey = function (key) {
            return _this._prefix + key;
        };
    }
    // Test if string is only contains numbers
    // e.g '1' => true, "'1'" => true
    AppInsightsStorage.prototype.isStringNumber = function (num) {
        return /^-?\d+\.?\d*$/.test(num.replace(/["']/g, ""));
    };
    AppInsightsStorage.prototype.browserSupportsLocalStorage = function () {
        try {
            var supported = (this._storageType in this._$window && this._$window[this._storageType] !== null);
            // When Safari (OS X or iOS) is in private browsing mode, it appears as though localStorage
            // is available, but trying to call .setItem throws an exception.
            //
            // "QUOTA_EXCEEDED_ERR: DOM Exception 22: An attempt was made to add something to storage
            // that exceeded the quota."
            var key = this._deriveQualifiedKey("__" + Math.round(Math.random() * 1e7));
            if (supported) {
                this._webStorage = this._$window[this._storageType];
                this._webStorage.setItem(key, "");
                this._webStorage.removeItem(key);
            }
            return supported;
        }
        catch (e) {
            this._storageType = "cookie";
            this._$rootScope.$broadcast("AngularAppInsights.Storage.notification.error", e.message);
            return false;
        }
    };
    // Checks the browser to see if cookies are supported
    AppInsightsStorage.prototype.browserSupportsCookies = function () {
        try {
            return this._$window.navigator.cookieEnabled ||
                ("cookie" in this._$document && (this._$document.cookie.length > 0 ||
                    (this._$document.cookie = "test").indexOf.call(this._$document.cookie, "test") > -1));
        }
        catch (e) {
            this._$rootScope.$broadcast("AngularAppInsights.Storage.notification.error", e.message);
            return false;
        }
    };
    // Directly adds a value to cookies
    // Typically used as a fallback is local storage is not available in the browser
    // Example use: localStorageService.cookie.add('library','angular');
    AppInsightsStorage.prototype.addToCookies = function (key, value) {
        if (Tools.isUndefined(value)) {
            return false;
        }
        else if (Tools.isArray(value) || Tools.isObject(value)) {
            value = Tools.toJson(value);
        }
        if (!this.browserSupportsCookies) {
            this._$rootScope.$broadcast("AngularAppInsights.Storage.notification.error", "COOKIES_NOT_SUPPORTED");
            return false;
        }
        try {
            var expiry = "", expiryDate = new Date(), cookieDomain = "";
            if (value === null) {
                // Mark that the cookie has expired one day ago
                expiryDate.setTime(expiryDate.getTime() + (-1 * 24 * 60 * 60 * 1000));
                expiry = "; expires=" + expiryDate.toUTCString();
                value = "";
            }
            else if (this._cookie.expiry !== 0) {
                expiryDate.setTime(expiryDate.getTime() + (this._cookie.expiry * 24 * 60 * 60 * 1000));
                expiry = "; expires=" + expiryDate.toUTCString();
            }
            if (!!key) {
                var cookiePath = "; path=" + this._cookie.path;
                if (this._cookie.domain) {
                    cookieDomain = "; domain=" + this._cookie.domain;
                }
                this._$document.cookie = this._deriveQualifiedKey(key) + "=" + encodeURIComponent(value) + expiry + cookiePath + cookieDomain;
            }
        }
        catch (e) {
            this._$rootScope.$broadcast("AngularAppInsights.Storage.notification.error", e.message);
            return false;
        }
        return true;
    };
    // Directly get a value from a cookie
    // Example use: localStorageService.cookie.get('library'); // returns 'angular'
    AppInsightsStorage.prototype.getFromCookies = function (key) {
        if (!this.browserSupportsCookies) {
            this._$rootScope.$broadcast("AngularAppInsights.Storage.notification.error", "COOKIES_NOT_SUPPORTED");
            return false;
        }
        var cookies = this._$document.cookie && this._$document.cookie.split(";") || [];
        for (var i = 0; i < cookies.length; i++) {
            var thisCookie = cookies[i];
            while (thisCookie.charAt(0) === " ") {
                thisCookie = thisCookie.substring(1, thisCookie.length);
            }
            if (thisCookie.indexOf(this._deriveQualifiedKey(key) + "=") === 0) {
                var storedValues = decodeURIComponent(thisCookie.substring(this._prefix.length + key.length + 1, thisCookie.length));
                try {
                    var obj = JSON.parse(storedValues);
                    return Tools.fromJson(obj);
                }
                catch (e) {
                    return storedValues;
                }
            }
        }
        return null;
    };
    // Directly adds a value to local storage
    // If local storage is not available in the browser use cookies
    // Example use: localStorageService.add('library','angular');
    AppInsightsStorage.prototype.addToLocalStorage = function (key, value) {
        // Let's convert undefined values to null to get the value consistent
        if (Tools.isUndefined(value)) {
            value = null;
        }
        else if (Tools.isObject(value) || Tools.isArray(value) || Tools.isNumber(+value || value)) {
            value = Tools.toJson(value);
        }
        // If this browser does not support local storage use cookies
        if (!this.browserSupportsLocalStorage() || this._self.storageType === "cookie") {
            if (!this.browserSupportsLocalStorage()) {
                this._$rootScope.$broadcast("AngularAppInsights.Storage.notification.warning", "LOCAL_STORAGE_NOT_SUPPORTED");
            }
            if (this._notify.setItem) {
                this._$rootScope.$broadcast("AngularAppInsights.Storage.notification.setitem", { key: key, newvalue: value, storageType: "cookie" });
            }
            return this.addToCookies(key, value);
        }
        try {
            if (Tools.isObject(value) || Tools.isArray(value)) {
                value = Tools.toJson(value);
            }
            if (this._webStorage) {
                this._webStorage.setItem(this._deriveQualifiedKey(key), value);
            }
            if (this._notify.setItem) {
                this._$rootScope.$broadcast("AngularAppInsights.Storage.notification.setitem", { key: key, newvalue: value, storageType: this._self.storageType });
            }
        }
        catch (e) {
            this._$rootScope.$broadcast("AngularAppInsights.Storage.notification.error", e.message);
            return this.addToCookies(key, value);
        }
        return true;
    };
    // Directly get a value from local storage
    // Example use: localStorageService.get('library'); // returns 'angular'
    AppInsightsStorage.prototype.getFromLocalStorage = function (key) {
        if (!this.browserSupportsLocalStorage() || this._self.storageType === "cookie") {
            if (!this.browserSupportsLocalStorage()) {
                this._$rootScope.$broadcast("AngularAppInsights.Storage.notification.warning", "LOCAL_STORAGE_NOT_SUPPORTED");
            }
            return this.getFromCookies(key);
        }
        var item = this._webStorage ? this._webStorage.getItem(this._deriveQualifiedKey(key)) : null;
        // angular.toJson will convert null to 'null', so a proper conversion is needed
        // FIXME not a perfect solution, since a valid 'null' string can't be stored
        if (!item || item === "null") {
            return null;
        }
        if (item.charAt(0) === "{" || item.charAt(0) === "[" || this.isStringNumber(item)) {
            return Tools.fromJson(item);
        }
        return item;
    };
    AppInsightsStorage.prototype.getStorageType = function () {
        return this._storageType;
    };
    AppInsightsStorage.prototype.isSupported = function () {
        return this.browserSupportsLocalStorage();
    };
    AppInsightsStorage.prototype.set = function (key, value) {
        return this.addToLocalStorage(key, value);
    };
    AppInsightsStorage.prototype.get = function (key) {
        return this.getFromLocalStorage(key);
    };
    AppInsightsStorage.prototype.deriveKey = function (key) {
        return this._deriveQualifiedKey(key);
    };
    AppInsightsStorage.prototype.isCookiesSupported = function () {
        return this.browserSupportsCookies();
    };
    AppInsightsStorage.prototype.setCookie = function (key, value) {
        this.addToCookies(key, value);
    };
    AppInsightsStorage.prototype.getCookie = function (key) {
        return this.getFromCookies(key);
    };
    AppInsightsStorage.defaultConfig = {
        // You should set a prefix to avoid overwriting any local storage variables from the rest of your app
        // e.g. localStorageServiceProvider.setPrefix('youAppName');
        // With provider you can use config as this:
        // myApp.config(function (localStorageServiceProvider) {
        //    localStorageServiceProvider.prefix = 'yourAppName';
        // });
        prefix: "ls",
        // You could change web storage type localstorage or sessionStorage
        storageType: "localStorage",
        // Cookie options (usually in case of fallback)
        // expiry = Number of days before cookies expire // 0 = Does not expire
        // path = The web path the cookie represents
        cookie: {
            expiry: 30,
            path: "/"
        },
        // Send signals for each of the following actions?
        notify: {
            setItem: true,
            removeItem: false
        }
    };
    return AppInsightsStorage;
}());
/// <reference path="typings/angularjs/angular.d.ts" />
/// <reference path="./Tools.ts" />
var TelemetryRequest = (function () {
    function TelemetryRequest() {
    }
    return TelemetryRequest;
}());
var TelemetryRequestHeaders = (function () {
    function TelemetryRequestHeaders() {
    }
    return TelemetryRequestHeaders;
}());
/// <reference path="./Tools.ts" />
/*
* Stack parsing by the stacktracejs project @ https://github.com/stacktracejs/error-stack-parser
*/
var StackFrame = (function () {
    function StackFrame(functionName, args, fileName, lineNumber, columnNumber, level) {
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
    StackFrame.prototype.setFunctionName = function (v) {
        this.method = String(v);
    };
    //private getArgs() {
    //    return this.args;
    //}
    StackFrame.prototype.setArgs = function (v) {
        if (Object.prototype.toString.call(v) !== '[object Array]') {
            throw new TypeError('Args must be an Array');
        }
        this.args = v;
    };
    //private getFileName() {
    //    return this.fileName;
    //}
    StackFrame.prototype.setFileName = function (v) {
        this.fileName = String(v);
    };
    //private getLineNumber() {
    //    return this.lineNumber;
    //}
    StackFrame.prototype.setLineNumber = function (v) {
        if (!Tools.isNumber(v)) {

            this.line = undefined;
            return;
        }
        this.line = Number(v);
    };
    //private getColumnNumber() {
    //    return this.columnNumber;
    //}
    StackFrame.prototype.setColumnNumber = function (v) {
        if (!Tools.isNumber(v)) {
            this.columnNumber = undefined;
            return;
        }
        this.columnNumber = Number(v);
    };
    StackFrame.prototype.setLevelNumber = function (v) {
        if (!Tools.isNumber(v)) {
            throw new TypeError('Level Number must be a Number');
        }
        this.level = Number(v);
    };
    StackFrame.prototype.toString = function () {
        var functionName = this.method || '{anonymous}';
        var args = '(' + (this.args || []).join(',') + ')';
        var fileName = this.fileName ? ('@' + this.fileName) : '';
        var lineNumber = Tools.isNumber(this.line) ? (':' + this.line) : '';
        var columnNumber = Tools.isNumber(this.columnNumber) ? (':' + this.columnNumber) : '';
        return functionName + args + fileName + lineNumber + columnNumber;
    };
    return StackFrame;
}());
/// <reference path="./Tools.ts" />
/// <reference path="./StackFrame.ts" />
var StackParser = (function () {
    function StackParser() {
    }
    /**
        * Given an Error object, extract the most information from it.
        * @param error {Error}
        * @return Array[StackFrame]
        */
    StackParser.parse = function (error) {
        if (typeof error.stacktrace !== "undefined" || typeof error["opera#sourceloc"] !== "undefined") {
            return StackParser.parseOpera(error);
        }
        else if (error.stack && error.stack.match(StackParser.chromeIeStackRegexp)) {
            return StackParser.parseChromeOrInternetExplorer(error);
        }
        else if (error.stack && error.stack.match(StackParser.firefoxSafariStackRegexp)) {
            return StackParser.parseFireFoxOrSafari(error);
        }
        else {
            return null;
        }
    };
    /**
        * Separate line and column numbers from a URL-like string.
        * @param urlLike String
        * @return Array[String]
        */
    StackParser.extractLocation = function (urlLike) {
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
        }
        else {
            return [locationParts.join(":"), lastNumber, undefined];
        }
    };
    StackParser.parseChromeOrInternetExplorer = function (error) {
        var _this = this;
        var level = 0;
        return error.stack.split("\n").slice(1).map(function (line) {
            var tokens = line.replace(/^\s+/, "").split(/\s+/).slice(1);
            var locationParts = tokens[0] !== undefined ? _this.extractLocation(tokens.pop().replace(/[\(\)\s]/g, "")) : ["unknown", "unknown", "unknown"];
            var functionName = (!tokens[0] || tokens[0] === "Anonymous") ? "unknown" : tokens[0];
            return new StackFrame(functionName, undefined, locationParts[0], locationParts[1], locationParts[2], level++);
        }, this);
    };
    StackParser.parseFireFoxOrSafari = function (error) {
        var _this = this;
        var level = 0;
        return error.stack.split("\n").filter(function (line) {
            return !!line.match(StackParser.firefoxSafariStackRegexp);
        }, this).map(function (line) {
            var tokens = line.split("@");
            var locationParts = _this.extractLocation(tokens.pop());
            var functionName = tokens.shift() || "unknown";
            return new StackFrame(functionName, undefined, locationParts[0], locationParts[1], locationParts[2], level++);
        }, this);
    };
    StackParser.parseOpera = function (e) {
        if (!e.stacktrace || (e.message.indexOf("\n") > -1 &&
            e.message.split("\n").length > e.stacktrace.split("\n").length)) {
            return this.parseOpera9(e);
        }
        else if (!e.stack) {
            return this.parseOpera10(e);
        }
        else {
            return this.parseOpera11(e);
        }
    };
    StackParser.parseOpera9 = function (e) {
        var lineRe = /Line (\d+).*script (?:in )?(\S+)/i;
        var lines = e.message.split("\n");
        var result = [];
        for (var i = 2, len = lines.length; i < len; i += 2) {
            var match = lineRe.exec(lines[i]);
            if (match) {
                var level = 0;
                result.push(new StackFrame(undefined, undefined, match[2], match[1], undefined, level++));
            }
        }
        return result;
    };
    StackParser.parseOpera10 = function (e) {
        var lineRe = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
        var lines = e.stacktrace.split("\n");
        var result = [];
        for (var i = 0, len = lines.length; i < len; i += 2) {
            var match = lineRe.exec(lines[i]);
            if (match) {
                var level = 0;
                result.push(new StackFrame(match[3] || undefined, undefined, match[2], match[1], undefined, level++));
            }
        }
        return result;
    };
    // Opera 10.65+ Error.stack very similar to FF/Safari
    StackParser.parseOpera11 = function (error) {
        var level = 0;
        return error.stack.split("\n").filter(function (line) {
            return !!line.match(StackParser.firefoxSafariStackRegexp) &&
                !line.match(/^Error created at/);
        }, this).map(function (line) {
            var tokens = line.split("@");
            var locationParts = StackParser.extractLocation(tokens.pop());
            var functionCall = (tokens.shift() || "");
            var functionName = functionCall
                .replace(/<anonymous function(: (\w+))?>/, "$2")
                .replace(/\([^\)]*\)/g, "") || undefined;
            var argsRaw;
            if (functionCall.match(/\(([^\)]*)\)/)) {
                argsRaw = functionCall.replace(/^[^\(]+\(([^\)]*)\)$/, "$1");
            }
            var args = (argsRaw === undefined || argsRaw === "[arguments not available]") ? undefined : argsRaw ? argsRaw.split(",") : "";
            return new StackFrame(functionName, args, locationParts[0], locationParts[1], locationParts[2], level++);
        }, this);
    };
    /*
        * Stack parsing by the stacktracejs project @ https://github.com/stacktracejs/error-stack-parser
        */
    StackParser.firefoxSafariStackRegexp = /\S+\:\d+/;
    StackParser.chromeIeStackRegexp = /\s+at /;
    return StackParser;
}());
///<reference path="./Tools.ts" />
// $log interceptor .. will send log data to application insights, once app insights is 
// registered. $provide is only available in the config phase, so we need to setup
// the decorator before app insights is instantiated.
var LogInterceptor = (function () {
    function LogInterceptor($provide, angular) {
        var _this = this;
        this._angular = angular;
        this._noop = this._angular.noop;
        // function to invoke ... initialized to noop
        LogInterceptor.interceptFuntion = this._noop;
        $provide.decorator('$log', [
            "$delegate", function ($delegate) {
                _this._debugFn = $delegate.debug;
                _this._infoFn = $delegate.info;
                _this._warnFn = $delegate.warn;
                _this._errorFn = $delegate.error;
                _this._logFn = $delegate.log;
                $delegate.debug = angular.extend(_this.delegator(_this._debugFn, 'debug'), _this._debugFn);
                $delegate.info = angular.extend(_this.delegator(_this._infoFn, 'info'), _this._infoFn);
                $delegate.warn = angular.extend(_this.delegator(_this._warnFn, 'warn'), _this._warnFn);
                $delegate.error = angular.extend(_this.delegator(_this._errorFn, 'error'), _this._errorFn);
                $delegate.log = angular.extend(_this.delegator(_this._logFn, 'log'), _this._logFn);
                return $delegate;
            }
        ]);
    }
    LogInterceptor.prototype.setInterceptFunction = function (func) {
        LogInterceptor.interceptFuntion = func;
    };
    LogInterceptor.prototype.getPrivateLoggingObject = function () {
        return {
            debug: Tools.isNullOrUndefined(this._debugFn) ? Tools.noop : this._debugFn,
            info: Tools.isNullOrUndefined(this._infoFn) ? Tools.noop : this._infoFn,
            warn: Tools.isNullOrUndefined(this._warnFn) ? Tools.noop : this._warnFn,
            error: Tools.isNullOrUndefined(this._errorFn) ? Tools.noop : this._errorFn,
            log: Tools.isNullOrUndefined(this._logFn) ? Tools.noop : this._logFn
        };
    };
    LogInterceptor.prototype.delegator = function (originalFn, level) {
        var interceptingFn = function () {
            var args = [].slice.call(arguments);
            // track the call
            var message = args.join(' ');
            LogInterceptor.interceptFuntion(message, level);
            // Call the original 
            originalFn.apply(null, args);
        };
        for (var n in originalFn) {
            interceptingFn[n] = originalFn[n];
        }
        return interceptingFn;
    };
    return LogInterceptor;
}());
/// <reference path="./Tools.ts" />
// Exception interceptor
// Intercepts calls to the $exceptionHandler and sends them to Application insights as exception telemetry.
var ExceptionInterceptor = (function () {
    function ExceptionInterceptor($provide) {
        var _this = this;
        ExceptionInterceptor.errorOnHttpCall = false;
        this._interceptFunction = Tools.noop;
        $provide.decorator('$exceptionHandler', [
            '$delegate', function ($delegate) {
                _this._origExceptionHandler = $delegate;
                return function (exception) {
                    // track the call 
                    // ... only if there is no active issues/errors sending data over http, in order to prevent an infinite loop.
                    if (!ExceptionInterceptor.errorOnHttpCall) {
                        _this._interceptFunction(exception);
                    }
                    // Call the original 
                    _this._origExceptionHandler(exception);
                };
            }
        ]);
    }
    ExceptionInterceptor.prototype.setInterceptFunction = function (func) {
        this._interceptFunction = func;
    };
    ExceptionInterceptor.prototype.getPrivateExceptionHanlder = function () {
        return Tools.isNullOrUndefined(this._origExceptionHandler) ? Tools.noop : this._origExceptionHandler;
    };
    return ExceptionInterceptor;
}());
var Options = (function () {
    function Options() {
        this.applicationName = '';
        this.autoPageViewTracking = true;
        this.autoStateChangeTracking = false;
        this.autoLogTracking = true;
        this.autoExceptionTracking = true;
        this.sessionInactivityTimeout = 1800000;
        this.instrumentationKey = '';
        this.developerMode = false;
        this.properties = {};
    }
    return Options;
}());
var HttpRequest = (function () {
    function HttpRequest() {
    }
    HttpRequest.prototype.send = function (options, onSuccessCallback, onErrorCallback) {
        var request = new XMLHttpRequest();
        request.onerror = function (e) {
            onErrorCallback(0);
        };
        request.onload = function (e) {
            if (request.status == 200) {
                // success!
                onSuccessCallback();
            }
            else {
                onErrorCallback(request.status);
            }
        };
        request.open(options.method, options.url, true);
        for (var header in options.headers) {
            request.setRequestHeader(header, options.headers[header]);
        }
        request.send(JSON.stringify(options.data));
    };
    return HttpRequest;
}());
var HttpRequestOptions = (function () {
    function HttpRequestOptions() {
    }
    return HttpRequestOptions;
}());
/// <reference path="typings/angularjs/angular.d.ts" />
/// <reference path="./Tools.ts" />
/// <reference path="./Storage.ts" />
/// <reference path="./TelemetryRequest.ts" />
/// <reference path="./StackParser.ts" />
/// <reference path="./LogInterceptor.ts" />
/// <reference path="./ExceptionInterceptor.ts" />
/// <reference path="./Options.ts" />
/// <reference path="./HTTPRequest.ts" />
var ApplicationInsights = (function () {
    function ApplicationInsights(localStorage, $locale, $window, $location, logInterceptor, exceptionInterceptor, httpRequestFactory, options) {
        var _this = this;
        this._sessionKey = "$$appInsights__session";
        this._userKey = "$$appInsights__uuid";
        this._deviceKey = "$$appInsights__device";
        this._deviceTypeKey = "$$appInsights__device__type";
        this._version = "angular:0.3.0";
        this._analyticsServiceUrl = "https://dc.services.visualstudio.com/v2/track";
        this._contentType = "application/json";
        this._localStorage = localStorage;
        this._locale = $locale;
        this._window = $window;
        this._location = $location;
        this._httpRequestFactory = httpRequestFactory;
        this.options = options;
        this._log = logInterceptor.getPrivateLoggingObject();
        this._exceptionHandler = exceptionInterceptor.getPrivateExceptionHanlder();
        this._logInterceptor = logInterceptor;
        this._exceptionInterceptor = exceptionInterceptor;
        // set traceTraceMessage as the intercept method of the log decorator
        if (this.options.autoLogTracking) {
            this._logInterceptor.setInterceptFunction(function (message, level, properties) { return _this.trackTraceMessage(message, level, properties); });
        }
        if (this.options.autoExceptionTracking) {
            this._exceptionInterceptor.setInterceptFunction(function (exception, exceptionProperties) { return _this.trackException(exception, exceptionProperties); });
        }
    }
    ApplicationInsights.prototype.getUserId = function () {
        // see if there is already an id stored locally, if not generate a new value
        var uuid = this._localStorage.get(this._userKey);
        if (Tools.isNullOrUndefined(uuid)) {
            uuid = Tools.generateGuid();
            this._localStorage.set(this._userKey, uuid);
        }
        return uuid;
    };
    ApplicationInsights.prototype.setUserId = function (userId) {
        this._localStorage.set(this._userKey, userId);
    };
    ApplicationInsights.prototype.getDeviceId = function () {
        var id = this._localStorage.get(this._deviceKey);
        if (Tools.isNullOrUndefined(id)) {
            id = Tools.generateGuid();
            this._localStorage.set(this._deviceKey, id);
        }
        return id;
    };
    ApplicationInsights.prototype.getDeviceType = function () {
        var type = this._localStorage.get(this._deviceTypeKey);
        if (Tools.isNullOrUndefined(type)) {
            type = "Browser";
        }
        return type;
    };
    ApplicationInsights.prototype.setDeviceInfo = function (id, type) {
        this._localStorage.set(this._deviceKey, id);
        this._localStorage.set(this._deviceTypeKey, type);
    };
    ApplicationInsights.prototype.getOperationId = function () {
        var uuidKey = "$$appInsights__operationid";
        var uuid = Tools.generateGuid();
        this._localStorage.set(uuidKey, uuid);
        return uuid;
    };
    ApplicationInsights.prototype.getStoredOperationId = function () {
        var uuidKey = "$$appInsights__operationid";
        var uuid = this._localStorage.get(uuidKey);
        if (Tools.isNullOrUndefined(uuid)) {
            uuid = this.getOperationId();
        }
        return uuid;
    };
    ApplicationInsights.prototype.makeNewSession = function (sessionId) {
        // no existing session data
        var sessionData = {
            id: sessionId || Tools.generateGuid(),
            accessed: new Date().getTime()
        };
        this._localStorage.set(this._sessionKey, sessionData);
        return sessionData;
    };
    ApplicationInsights.prototype.getSessionId = function () {
        var sessionData = this._localStorage.get(this._sessionKey);
        if (Tools.isNullOrUndefined(sessionData)) {
            // no existing session data
            sessionData = this.makeNewSession(null);
        }
        else {
            var lastAccessed = Tools.isNullOrUndefined(sessionData.accessed) ? 0 : sessionData.accessed;
            var now = new Date().getTime();
            if ((now - lastAccessed > this.options.sessionInactivityTimeout)) {
                // this session is expired, make a new one
                sessionData = this.makeNewSession(null);
            }
            else {
                // valid session, update the last access timestamp
                sessionData.accessed = now;
                this._localStorage.set(this._sessionKey, sessionData);
            }
        }
        return sessionData.id;
    };
    ApplicationInsights.prototype.validateMeasurements = function (measurements) {
        if (Tools.isNullOrUndefined(measurements)) {
            return null;
        }
        if (!Tools.isObject(measurements)) {
            this._log.warn("The value of the measurements parameter must be an object consisting of a string/number pairs.");
            return null;
        }
        var validatedMeasurements = {};
        for (var metricName in measurements) {
            if (Tools.isNumber(measurements[metricName])) {
                validatedMeasurements[metricName] = measurements[metricName];
            }
            else {
                this._log.warn("The value of measurement " + metricName + " is not a number.");
            }
        }
        return validatedMeasurements;
    };
    ApplicationInsights.prototype.validateProperties = function (properties) {
        if (Tools.isNullOrUndefined(properties)) {
            return null;
        }
        if (!Tools.isObject(properties)) {
            this._log.warn("The value of the properties parameter must be an object consisting of a string/string pairs.");
            return null;
        }
        var validateProperties = {};
        for (var propName in properties) {
            var currentProp = properties[propName];
            if (!Tools.isNullOrUndefined(currentProp) && !Tools.isObject(currentProp) && !Tools.isArray(currentProp)) {
                validateProperties[propName] = currentProp;
            }
            else {
                this._log.warn("The value of property " + propName + " could not be determined to be a string or number.");
            }
        }
        return validateProperties;
    };
    ApplicationInsights.prototype.validateDuration = function (duration) {
        if (Tools.isNullOrUndefined(duration)) {
            return null;
        }
        if (!Tools.isNumber(duration) || duration < 0) {
            this._log.warn("The value of the durations parameter must be a positive number");
            return null;
        }
        return duration;
    };
    ApplicationInsights.prototype.validateSeverityLevel = function (level) {
        // https://github.com/Microsoft/ApplicationInsights-JS/blob/7bbf8b7a3b4e3610cefb31e9d61765a2897dcb3b/JavaScript/JavaScriptSDK/Contracts/Generated/SeverityLevel.ts
        /*
         export enum SeverityLevel
         {
            Verbose = 0,
            Information = 1,
            Warning = 2,
            Error = 3,
            Critical = 4,
         }

         We need to map the angular $log levels to these for app insights
         */
        var levels = [
            "debug",
            "info",
            "warn",
            "error" //Error
        ];
        var levelEnum = levels.indexOf(level);
        return levelEnum > -1 ? levelEnum : 0;
    };
    ApplicationInsights.prototype.sendData = function (data) {
        if (this.options.developerMode) {
            console.log(data);
            return;
        }
        var request = this._httpRequestFactory();
        var headers = {};
        headers["Accept"] = this._contentType; // jshint ignore:line
        headers["Content-Type"] = this._contentType;
        var options = {
            method: "POST",
            url: this._analyticsServiceUrl,
            headers: headers,
            data: data,
        };
        try {
            request.send(options, function () {
                ExceptionInterceptor.errorOnHttpCall = false;
                // this callback will be called asynchronously
                // when the response is available
            }, function (statusCode) {
                // called asynchronously if an error occurs
                // or server returns response with an error status.
                ExceptionInterceptor.errorOnHttpCall = true;
            });
        }
        catch (e) {
        }
    };
    ApplicationInsights.prototype.trackPageView = function (pageName, pageUrl, properties, measurements, duration) {
        var data = this.generateAppInsightsData(ApplicationInsights.names.pageViews, ApplicationInsights.types.pageViews, {
            ver: 1,
            url: Tools.isNullOrUndefined(pageUrl) ? this._location.absUrl() : pageUrl,
            name: Tools.isNullOrUndefined(pageName) ? this._location.path() : pageName,
            properties: this.validateProperties(properties),
            measurements: this.validateMeasurements(measurements),
            duration: this.validateDuration(duration)
        });
        this.sendData(data);
    };
    ApplicationInsights.prototype.trackEvent = function (eventName, properties, measurements) {
        var data = this.generateAppInsightsData(ApplicationInsights.names.events, ApplicationInsights.types.events, {
            ver: 1,
            name: eventName,
            properties: this.validateProperties(properties),
            measurements: this.validateMeasurements(measurements)
        });
        this.sendData(data);
    };
    ApplicationInsights.prototype.trackTraceMessage = function (message, level, properties) {
        if (Tools.isNullOrUndefined(message) || !Tools.isString(message)) {
            return;
        }
        if (this.options.properties) {
            properties = properties || {};
            Tools.extend(properties, this.options.properties);
        }
        var data = this.generateAppInsightsData(ApplicationInsights.names.traceMessage, ApplicationInsights.types.traceMessage, {
            ver: 1,
            message: message,
            severityLevel: this.validateSeverityLevel(level),
            properties: this.validateProperties(properties)
        });
        this.sendData(data);
    };
    ApplicationInsights.prototype.trackMetric = function (name, value, properties) {
        if (this.options.properties) {
            properties = properties || {};
            Tools.extend(properties, this.options.properties);
        }
        var data = this.generateAppInsightsData(ApplicationInsights.names.metrics, ApplicationInsights.types.metrics, {
            ver: 1,
            metrics: [{ name: name, value: value }],
            properties: this.validateProperties(properties)
        });
        this.sendData(data);
    };
    ApplicationInsights.prototype.trackException = function (exception, exceptionProperties) {
        if (Tools.isNullOrUndefined(exception)) {
            return;
        }
        // parse the stack
        var parsedStack = StackParser.parse(exception);
        var properties = {};
        Tools.copy(this.options.properties, properties);
        if (exceptionProperties) {
            exceptionProperties = exceptionProperties || {};
            Tools.extend(properties, exceptionProperties);
        }
        var data = this.generateAppInsightsData(ApplicationInsights.names.exception, ApplicationInsights.types.exception, {
            ver: 1,
            handledAt: "Unhandled",
            exceptions: [
                {
                    typeName: exception.name || "Unhandled",
                    message: exception.message || "Unhandled",
                    stack: exception.stack || "Unhandled",
                    parsedStack: parsedStack,
                    hasFullStack: !Tools.isNullOrUndefined(parsedStack)
                }
            ],
            properties: properties
        });
        this.sendData(data);
    };
    ApplicationInsights.prototype.defineUser = function (userId) {
        this.setUserId(userId);
    };
    ApplicationInsights.prototype.defineSession = function (sessionId) {
        this.makeNewSession(sessionId);
    };
    ApplicationInsights.prototype.defineDevice = function (id, type) {
        this.setDeviceInfo(id, type);
    };
    ApplicationInsights.prototype.generateAppInsightsData = function (payloadName, payloadDataType, payloadData) {
        if (this._commonProperties) {
            payloadData.properties = payloadData.properties || {};
            Tools.extend(payloadData.properties, this._commonProperties);
        }
        return {
            name: payloadName,
            time: new Date().toISOString(),
            ver: 1,
            iKey: this.options.instrumentationKey,
            user: {
                id: this.getUserId(),
                type: "User"
            },
            session: {
                id: this.getSessionId()
            },
            operation: {
                id: payloadName === ApplicationInsights.names.pageViews ? this.getOperationId() : this.getStoredOperationId()
            },
            device: {
                id: this.getDeviceId(),
                locale: this._locale.id,
                resolution: this._window.screen.availWidth + "x" + this._window.screen.availHeight,
                type: this.getDeviceType()
            },
            internal: {
                sdkVersion: this._version
            },
            data: {
                type: payloadDataType,
                item: payloadData
            }
        };
    };
    ApplicationInsights.prototype.setCommonProperties = function (data) {
        this.validateProperties(data);
        this._commonProperties = this._commonProperties || {};
        Tools.extend(this._commonProperties, data);
    };
    ApplicationInsights.namespace = "Microsoft.ApplicationInsights.";
    ApplicationInsights.names = {
        pageViews: ApplicationInsights.namespace + "Pageview",
        traceMessage: ApplicationInsights.namespace + "Message",
        events: ApplicationInsights.namespace + "Event",
        metrics: ApplicationInsights.namespace + "Metric",
        exception: ApplicationInsights.namespace + "Exception"
    };
    ApplicationInsights.types = {
        pageViews: ApplicationInsights.namespace + "PageViewData",
        traceMessage: ApplicationInsights.namespace + "MessageData",
        events: ApplicationInsights.namespace + "EventData",
        metrics: ApplicationInsights.namespace + "MetricData",
        exception: ApplicationInsights.namespace + "ExceptionData"
    };
    return ApplicationInsights;
}());
/// <reference path="./ApplicationInsights.ts" />
var httpRequestService = angular.module("$$ApplicationInsights-HttpRequestModule", []);
httpRequestService.factory("$$applicationInsightsHttpRequestService", function () {
    return function () { return new HttpRequest(); };
});
// Application Insights Module
var angularAppInsights = angular.module("ApplicationInsightsModule", ["$$ApplicationInsights-HttpRequestModule"]);
var logInterceptor;
var exceptionInterceptor;
var tools = new Tools(angular);
// setup some features that can only be done during the configure pass
angularAppInsights.config([
    "$provide", "$httpProvider",
    function ($provide, $httpProvider) {
        logInterceptor = new LogInterceptor($provide, angular);
        exceptionInterceptor = new ExceptionInterceptor($provide);
        if ($httpProvider && $httpProvider.interceptors) {
            $httpProvider.interceptors.push('ApplicationInsightsInterceptor');
        }
    }
]);
angularAppInsights.provider("applicationInsightsService", function () { return new AppInsightsProvider(); });
// the run block sets up automatic page view tracking
angularAppInsights.run([
    "$rootScope", "$location", "applicationInsightsService",
    function ($rootScope, $location, applicationInsightsService) {
        var locationChangeStartOn;
        var stateChangeStartOn;
        $rootScope.$on("$locationChangeStart", function () {
            if (applicationInsightsService.options.autoPageViewTracking && !applicationInsightsService.options.autoStateChangeTracking) {
                locationChangeStartOn = (new Date()).getTime();
            }
        });
        $rootScope.$on("$locationChangeSuccess", function (e, view) {
            if (applicationInsightsService.options.autoPageViewTracking && !applicationInsightsService.options.autoStateChangeTracking) {
                var duration = (new Date()).getTime() - locationChangeStartOn;
                var name = applicationInsightsService.options.applicationName + $location.path();
                var properties = applicationInsightsService.options.properties;
                if (view) {
                    name += "#" + view;
                }
                applicationInsightsService.trackPageView(name, null, properties, null, duration);
            }
        });
        $rootScope.$on("$stateChangeStart", function () {
            if (applicationInsightsService.options.autoPageViewTracking && applicationInsightsService.options.autoStateChangeTracking) {
                stateChangeStartOn = (new Date()).getTime();
            }
        });
        $rootScope.$on("$stateChangeSuccess", function () {
            if (applicationInsightsService.options.autoPageViewTracking && applicationInsightsService.options.autoStateChangeTracking) {
                var duration = (new Date()).getTime() - stateChangeStartOn;
                var name = applicationInsightsService.options.applicationName + $location.path();
                var properties = applicationInsightsService.options.properties;
                applicationInsightsService.trackPageView(name, null, properties, null, duration);
            }
        });
    }
]);
angularAppInsights.factory('ApplicationInsightsInterceptor', ['applicationInsightsService', '$q', function (applicationInsightsService, $q) {
        return {
            request: function (config) {
                if (config) {
                    config.headers = config.headers || {};
                    config.headers['x-ms-request-root-id'] = applicationInsightsService.getStoredOperationId();
                    config.headers['x-ms-request-id'] = applicationInsightsService.getUserId();
                    return config;
                }
            }
        };
    }]);
var AppInsightsProvider = (function () {
    function AppInsightsProvider() {
        var _this = this;
        // configuration properties for the provider
        this._options = new Options();
        this.$get = ["$locale", "$window", "$location", "$rootScope", "$parse", "$document", "$$applicationInsightsHttpRequestService", function ($locale, $window, $location, $rootScope, $parse, $document, $$applicationInsightsHttpRequestService) {
                // get a reference of storage
                var storage = new AppInsightsStorage({
                    window: $window,
                    rootScope: $rootScope,
                    document: $document,
                    parse: $parse
                });
                return new ApplicationInsights(storage, $locale, $window, $location, logInterceptor, exceptionInterceptor, $$applicationInsightsHttpRequestService, _this._options);
            }
        ];
    }
    AppInsightsProvider.prototype.configure = function (instrumentationKey, options) {
        Tools.extend(this._options, options);
        this._options.instrumentationKey = instrumentationKey;
    }; // invoked when the provider is run
    return AppInsightsProvider;
}());
//# sourceMappingURL=angular-applicationinsights.js.map