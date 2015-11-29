///<reference path="./Tools.ts" />


    // $log interceptor .. will send log data to application insights, once app insights is 
    // registered. $provide is only available in the config phase, so we need to setup
    // the decorator before app insights is instantiated.
     class LogInterceptor {

        private _debugFn: any;
        private _infoFn: any;
        private _warnFn: any;
        private _errorFn: any;
        private _logFn: any;
        static interceptFuntion: any;
        private _angular: any;
        private _noop: any;
        
        constructor($provide: any, angular: any) {
            this._angular = angular;
            this._noop = this._angular.noop;

            // function to invoke ... initialized to noop
            LogInterceptor.interceptFuntion = this._noop;


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
            LogInterceptor.interceptFuntion = func;
        }

        getPrivateLoggingObject() {
            return {
                debug: Tools.isNullOrUndefined(this._debugFn) ? Tools.noop : this._debugFn,
                info: Tools.isNullOrUndefined(this._infoFn) ? Tools.noop : this._infoFn,
                warn: Tools.isNullOrUndefined(this._warnFn) ? Tools.noop : this._warnFn,
                error: Tools.isNullOrUndefined(this._errorFn) ? Tools.noop : this._errorFn,
                log: Tools.isNullOrUndefined(this._logFn) ? Tools.noop : this._logFn
            };
        }

        delegator(orignalFn, level) {
            return function() {
                var args = [].slice.call(arguments);
                // track the call
                LogInterceptor.interceptFuntion(args[0], level);
                // Call the original 
                orignalFn.apply(null, args);
            };
        }


    }
