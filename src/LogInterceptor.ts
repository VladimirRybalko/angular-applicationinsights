///<reference path="./Tools.ts" />

module AngularAppInsights {
    // $log interceptor .. will send log data to application insights, once app insights is 
    // registered. $provide is only available in the config phase, so we need to setup
    // the decorator before app insights is instantiated.
    class LogInterceptor {

        private _debugFn: any;
        private _infoFn: any;
        private _warnFn: any;
        private _errorFn: any;
        private _logFn: any;
        private _interceptFuntion: any;
        private _angular: any;
        private _noop: any;
        private _tools: Tools;

        constructor($provide: any, angular: any, tools: Tools) {
            this._angular = angular;
            this._noop = this._angular.noop;

            // function to invoke ... initialized to noop
            this._interceptFuntion = this._noop;

            this._tools = tools;


            $provide.decorator('$log', [
                "$delegate", ($delegate: any) => {
                    this._debugFn = $delegate.debug;
                    this._infoFn = $delegate.info;
                    this._warnFn = $delegate.warn;
                    this._errorFn = $delegate.error;
                    this._logFn = $delegate.log;

                    $delegate.debug = this.delegator(this._debugFn, 'debug');
                    $delegate.info = this.delegator(this._infoFn, 'info');
                    $delegate.warn = this.delegator(this._warnFn, 'warn');
                    $delegate.error = this.delegator(this._errorFn, 'error');
                    $delegate.log = this.delegator(this._logFn, 'log');

                    return $delegate;
                }
            ]);
        }


        setInterceptFunction(func: (message: any, level: string) => void) {
            this._interceptFuntion = func;
        }

        getPrivateLoggingObject() {
            return {
                debug: this._tools.isNullOrUndefined(this._debugFn) ? this._tools.noop : this._debugFn,
                info: this._tools.isNullOrUndefined(this._infoFn) ? this._tools.noop : this._infoFn,
                warn: this._tools.isNullOrUndefined(this._warnFn) ? this._tools.noop : this._warnFn,
                error: this._tools.isNullOrUndefined(this._errorFn) ? this._tools.noop : this._errorFn,
                log: this._tools.isNullOrUndefined(this._logFn) ? this._tools.noop : this._logFn
            };
        }

        delegator(orignalFn, level) {
            return function() {
                var args = [].slice.call(arguments);
                // track the call
                this._interceptFunction(args[0], level);
                // Call the original 
                orignalFn.apply(null, args);
            };
        }


    }
}