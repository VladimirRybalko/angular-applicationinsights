/// <reference path="./Tools" />
var ExceptionInterceptor = (function () {
    function ExceptionInterceptor($provide, tools) {
        var _this = this;
        this._tools = tools;
        this.errorOnHttpCall = false;
        this._interceptFunction = this._tools.noop;
        $provide.decorator('$exceptionHandler', ['$delegate', function ($delegate) {
                _this._origExceptionHandler = $delegate;
                return function (exception, cause) {
                    if (!_this.errorOnHttpCall) {
                        _this._interceptFunction(exception, cause);
                    }
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