/// <reference path="./Tools.ts" />


    // Exception interceptor
    // Intercepts calls to the $exceptionHandler and sends them to Application insights as exception telemetry.
    class ExceptionInterceptor {

        private _origExceptionHandler;
        private _interceptFunction;
        private _tools: Tools;

       static errorOnHttpCall: boolean;

        setInterceptFunction(func) {
            this._interceptFunction = func;
        }

        getPrivateExceptionHanlder() {
            return this._tools.isNullOrUndefined(this._origExceptionHandler) ? this._tools.noop : this._origExceptionHandler;
        }

        constructor($provide: any, tools: Tools) {

            this._tools = tools;
            ExceptionInterceptor.errorOnHttpCall = false;

            this._interceptFunction = this._tools.noop;

            $provide.decorator('$exceptionHandler', [
                '$delegate', ($delegate) => {
                    this._origExceptionHandler = $delegate;
                    return (exception, cause) => {
                        // track the call 
                        // ... only if there is no active issues/errors sending data over http, in order to prevent an infinite loop.
                        if (!ExceptionInterceptor.errorOnHttpCall) {
                            this._interceptFunction(exception, cause);
                        }
                        // Call the original 
                        this._origExceptionHandler(exception, cause);
                    };
                }
            ]);
        }

    }
