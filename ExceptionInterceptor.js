/// <reference path="./Tools" />
// Exception interceptor
// Intercepts calls to the $exceptionHandler and sends them to Application insights as exception telemetry.
var ExceptionInterceptor = (function () {
    function ExceptionInterceptor($provide, tools) {
        var _this = this;
        this._tools = tools;
        this.errorOnHttpCall = false;
        this._interceptFunction = this._tools.noop;
        $provide.decorator('$exceptionHandler', ['$delegate', function ($delegate) {
                _this._origExceptionHandler = $delegate;
                return function (exception, cause) {
                    // track the call 
                    // ... only if there is no active issues/errors sending data over http, in order to prevent an infinite loop.
                    if (!_this.errorOnHttpCall) {
                        _this._interceptFunction(exception, cause);
                    }
                    // Call the original 
                    _this._origExceptionHandler(exception, cause);
                };
            }]);
    }
    ExceptionInterceptor.prototype.setInterceptFunction = function (func) {
        this._interceptFunction = func;
    };
    ExceptionInterceptor.prototype.getPrivateExceptionHanlder = function () {
        return this._tools.isNullOrUndefined(this._origExceptionHandler) ? this._tools.noop : this._origExceptionHandler;
    };
    return ExceptionInterceptor;
})();
//# sourceMappingURL=ExceptionInterceptor.js.map