///<reference path="./Tools.ts" />
// $log interceptor .. will send log data to application insights, once app insights is 
// registered. $provide is only available in the config phase, so we need to setup
// the decorator before app insights is instantiated.
var LogInterceptor = (function () {
    function LogInterceptor($provide, angular, tools) {
        var _this = this;
        this._angular = angular;
        this._noop = this._angular.noop;
        // function to invoke ... initialized to noop
        this._interceptFuntion = this._noop;
        this._tools = tools;
        $provide.decorator('$log', ["$delegate", function ($delegate) {
                _this._debugFn = $delegate.debug;
                _this._infoFn = $delegate.info;
                _this._warnFn = $delegate.warn;
                _this._errorFn = $delegate.error;
                _this._logFn = $delegate.log;
                $delegate.debug = _this.delegator(_this._debugFn, 'debug');
                $delegate.info = _this.delegator(_this._infoFn, 'info');
                $delegate.warn = _this.delegator(_this._warnFn, 'warn');
                $delegate.error = _this.delegator(_this._errorFn, 'error');
                $delegate.log = _this.delegator(_this._logFn, 'log');
                return $delegate;
            }]);
    }
    LogInterceptor.prototype.setInterceptFunction = function (func) {
        this._interceptFuntion = func;
    };
    LogInterceptor.prototype.getPrivateLoggingObject = function () {
        return {
            debug: this._tools.isNullOrUndefined(this._debugFn) ? this._tools.noop : this._debugFn,
            info: this._tools.isNullOrUndefined(this._infoFn) ? this._tools.noop : this._infoFn,
            warn: this._tools.isNullOrUndefined(this._warnFn) ? this._tools.noop : this._warnFn,
            error: this._tools.isNullOrUndefined(this._errorFn) ? this._tools.noop : this._errorFn,
            log: this._tools.isNullOrUndefined(this._logFn) ? this._tools.noop : this._logFn
        };
    };
    LogInterceptor.prototype.delegator = function (orignalFn, level) {
        return function () {
            var args = [].slice.call(arguments);
            // track the call
            this._interceptFunction(args[0], level);
            // Call the original 
            orignalFn.apply(null, args);
        };
    };
    return LogInterceptor;
})();
//# sourceMappingURL=LogInterceptor.js.map