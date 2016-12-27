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

                    $delegate.debug = angular.extend(this.delegator(this._debugFn, 'debug'), this._debugFn);
                    $delegate.info = angular.extend(this.delegator(this._infoFn, 'info'), this._infoFn);
                    $delegate.warn = angular.extend(this.delegator(this._warnFn, 'warn'), this._warnFn);
                    $delegate.error = angular.extend(this.delegator(this._errorFn, 'error'), this._errorFn);
                    $delegate.log = angular.extend(this.delegator(this._logFn, 'log'), this._logFn);

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

        delegator(originalFn, level) {
     
            var interceptingFn = function () {
                var args = [].slice.call(arguments);
                // track the call
                var message = args.join(' ');
                LogInterceptor.interceptFuntion(message, level);
                // Call the original 
                originalFn.apply(null, args);
            };
            
            for(var n in originalFn){
            
                interceptingFn[n] = originalFn[n];
            }
            
            return interceptingFn;
        }

    }
