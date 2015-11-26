/// <reference path="typings/angularjs/angular.d.ts" />
/// <reference path="./Tools.ts" />
/// <reference path="./Storage.ts" />
/// <reference path="./TelemetryRequest.ts" />
/// <reference path="./StackParser.ts" />
/// <reference path="./LogInterceptor.ts" />
/// <reference path="./ExceptionInterceptor.ts" />
/// <reference path="./Options.ts" />

     class ApplicationInsights {

        private _localStorage: AppInsightsStorage;
        private _http: angular.IHttpService;
        private _locale: angular.ILocaleService;
        private _window: angular.IWindowService;
        private _location: angular.ILocationService;
        private _exceptionStackParser: StackParser;
        private _tools: Tools;
        private _log: any;
        private _exceptionHandler: any;

        private _logInterceptor: LogInterceptor;
        private _exceptionInterceptor: ExceptionInterceptor;
        private _sessionKey = '$$appInsights__session';
        private _options: Options;

        private _namespace = 'Microsoft.ApplicationInsights.';
        private _names = {
            pageViews: this._namespace + 'Pageview',
            traceMessage: this._namespace + 'Message',
            events: this._namespace + 'Event',
            metrics: this._namespace + 'Metric',
            exception: this._namespace + 'Exception'
        };
        private _types = {
            pageViews: this._namespace + 'PageviewData',
            traceMessage: this._namespace + 'MessageData',
            events: this._namespace + 'EventData',
            metrics: this._namespace + 'MetricData',
            exception: this._namespace + 'ExceptionData'
        };

        private _commonProperties: any;

        private _version = 'angular:0.2.6';
        private _analyticsServiceUrl = 'https://dc.services.visualstudio.com/v2/track';
        private _contentType = 'application/json';


        constructor(localStorage: AppInsightsStorage,
            $http: angular.IHttpService,
            $locale: angular.ILocaleService,
            $window: angular.IWindowService,
            $location: angular.ILocationService,
            exceptionStackParser: StackParser,
            tools: Tools,
            logInterceptor: LogInterceptor,
            exceptionInterceptor: ExceptionInterceptor,
            options: Options) {
            this._localStorage = localStorage;
            this._http = $http;
            this._locale = $locale;
            this._window = $window;
            this._location = $location;
            this._exceptionStackParser = exceptionStackParser;
            this._tools = tools;
            this._options = options;
            this._log = logInterceptor.getPrivateLoggingObject();
            this._exceptionHandler = exceptionInterceptor.getPrivateExceptionHanlder();


            // set traceTraceMessage as the intercept method of the log decorator
            if (this._options.autoLogTracking) {
                this._logInterceptor.setInterceptFunction(this.trackTraceMessage);
            }
            if (this._options.autoExceptionTracking) {
                this._exceptionInterceptor.setInterceptFunction(this.trackException);
            }

        }


        private getUUID() {
            const uuidKey = '$$appInsights__uuid';
            // see if there is already an id stored locally, if not generate a new value
            var uuid = this._localStorage.get(uuidKey);
            if (this._tools.isNullOrUndefined(uuid)) {
                uuid = this._tools.generateGUID();
                this._localStorage.set(uuidKey, uuid);
            }
            return uuid;
        }

        private makeNewSession() {
            // no existing session data
            var sessionData = {
                id: this._tools.generateGUID(),
                accessed: new Date().getTime()
            };
            this._localStorage.set(this._sessionKey, sessionData);
            return sessionData;
        }


        private getSessionID() {

            var sessionData = this._localStorage.get(this._sessionKey);

            if (this._tools.isNullOrUndefined(sessionData)) {

                // no existing session data
                sessionData = this.makeNewSession();
            } else {


                var lastAccessed = this._tools.isNullOrUndefined(sessionData.accessed) ? 0 : sessionData.accessed;
                var now = new Date().getTime();
                if ((now - lastAccessed > this._options.sessionInactivityTimeout)) {

                    // this session is expired, make a new one
                    sessionData = this.makeNewSession();
                } else {

                    // valid session, update the last access timestamp
                    sessionData.accessed = now;
                    this._localStorage.set(this._sessionKey, sessionData);
                }
            }

            return sessionData.id;
        }


        private validateMeasurements(measurements) {
            if (this._tools.isNullOrUndefined(measurements)) {
                return null;
            }

            if (!this._tools.isObject(measurements)) {
                this._log.warn('The value of the measurements parameter must be an object consisting of a string/number pairs.');
                return null;
            }

            var validatedMeasurements = {};
            for (var metricName in measurements) {
                if (this._tools.isNumber(measurements[metricName])) {
                    validatedMeasurements[metricName] = measurements[metricName];
                } else {
                    this._log.warn('The value of measurement ' + metricName + ' is not a number.');
                }
            }

            return validatedMeasurements;
        }


        private validateProperties(properties) {

            if (this._tools.isNullOrUndefined(properties)) {
                return null;
            }

            if (!this._tools.isObject(properties)) {
                this._log.warn('The value of the properties parameter must be an object consisting of a string/string pairs.');
                return null;
            }

            var validateProperties = {};
            for (var propName in properties) {
                var currentProp = properties[propName];
                if (!this._tools.isNullOrUndefined(currentProp) && !this._tools.isObject(currentProp) && !this._tools.isArray(currentProp)) {
                    validateProperties[propName] = currentProp;
                } else {
                    this._log.warn('The value of property ' + propName + ' could not be determined to be a string or number.');
                }
            }
            return validateProperties;
        }

        private validateSeverityLevel(level) {
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
                'debug', // Verbose
                'info', // Information
                'warn', // Warning
                'error' //Error
            ];
            var levelEnum = levels.indexOf(level);
            return levelEnum > -1 ? levelEnum : 0;
        }


        private sendData(data) {

            // bug # 24 : create a header object that filters out any default assigned header that will not be accepted by a browser's CORS check
            var headers = new TelemetryRequestHeaders();
            for (var header in <any>this._http.defaults.headers.common) {
                headers[header] = undefined;
            }

            for (var postHeader in <any>this._http.defaults.headers.post) {
                headers[postHeader] = undefined;
            }

            headers["Accept"] = this._contentType;
            headers['Content-Type'] = this._contentType;

            var request: TelemetryRequest =
            {
                method: 'POST',
                url: this._analyticsServiceUrl,
                headers: headers,
                data: data,
                // bugfix for issue# 18: disable credentials on CORS requests.
                withCredentials: false
            };

            try {
                this._http(request)
                    .success((data, status, headers, config) => {
                        ExceptionInterceptor.errorOnHttpCall = false;
                        // this callback will be called asynchronously
                        // when the response is available
                    })
                    .error((data, status, headers, config) => {
                        // called asynchronously if an error occurs
                        // or server returns response with an error status.
                        ExceptionInterceptor.errorOnHttpCall = true;
                    });
            } catch (e) {
                // supressing of exceptions on the initial http call in order to prevent infinate loops with the error interceptor.
            }
        }

        trackPageView(pageName, pageUrl, properties, measurements) {
            // TODO: consider possible overloads (no name or url but properties and measurements)

            var data = this.generateAppInsightsData(this._names.pageViews,
                this._types.pageViews,
                {
                    ver: 1,
                    url: this._tools.isNullOrUndefined(pageUrl) ? this._location.absUrl() : pageUrl,
                    name: this._tools.isNullOrUndefined(pageName) ? this._location.path() : pageName,
                    properties: this.validateProperties(properties),
                    measurements: this.validateMeasurements(measurements)
                });
            this.sendData(data);
        }

        trackEvent(eventName, properties, measurements) {
            var data = this.generateAppInsightsData(this._names.events,
                this._types.events,
                {
                    ver: 1,
                    name: eventName,
                    properties: this.validateProperties(properties),
                    measurements: this.validateMeasurements(measurements)
                });
            this.sendData(data);
        }

        trackTraceMessage(message, level, properties?) {
            if (this._tools.isNullOrUndefined(message) || !this._tools.isString(message)) {
                return;
            }

            var data = this.generateAppInsightsData(this._names.traceMessage,
                this._types.traceMessage,
                {
                    ver: 1,
                    message: message,
                    severityLevel: this.validateSeverityLevel(level),
                    properties: this.validateProperties(properties)
                });
            this.sendData(data);
        }

        trackMetric(name, value, properties) {
            var data = this.generateAppInsightsData(this._names.metrics,
                this._types.metrics,
                {
                    ver: 1,
                    metrics: [{ name: name, value: value }],
                    properties: this.validateProperties(properties)
                });
            this.sendData(data);
        }

        trackException(exception, cause) {
            if (this._tools.isNullOrUndefined(exception)) {
                return;
            }

            // parse the stack
            var parsedStack = this._exceptionStackParser.parse(exception);

            var data = this.generateAppInsightsData(this._names.exception,
                this._types.exception,
                {
                    ver: 1,
                    handledAt: 'Unhandled',
                    exceptions: [
                        {
                            typeName: exception.name,
                            message: exception.message,
                            stack: exception.stack,
                            parsedStack: parsedStack,
                            hasFullStack: !this._tools.isNullOrUndefined(parsedStack)
                        }
                    ]
                });
            this.sendData(data);
        }

        generateAppInsightsData(payloadName, payloadDataType, payloadData) {

            if (this._commonProperties) {
                payloadData.properties = payloadData.properties || {};
                this._tools.extend(payloadData.properties, this._commonProperties);
            }

            return {
                name: payloadName,
                time: new Date().toISOString(),
                ver: 1,
                iKey: this._options.instrumentationKey,
                user: { id: this.getUUID() },
                session: {
                    id: this.getSessionID()
                },
                operation: {
                    id: this._tools.generateGUID()
                },
                device: {
                    id: 'browser',
                    locale: this._locale.id,
                    resolution: this._window.screen.availWidth + 'x' + this._window.screen.availHeight
                },
                internal: {
                    sdkVersion: this._version
                },
                data: {
                    type: payloadDataType,
                    item: payloadData
                }
            };
        }

        setCommonProperties(data) {
            this.validateProperties(data);
            this._commonProperties = this._commonProperties || {};
            this._tools.extend(this._commonProperties, data);
        }
    }



