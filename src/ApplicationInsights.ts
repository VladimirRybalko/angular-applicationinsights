/// <reference path="typings/angularjs/angular.d.ts" />
/// <reference path="./Tools.ts" />
/// <reference path="./Storage.ts" />
/// <reference path="./TelemetryRequest.ts" />
/// <reference path="./StackParser.ts" />
/// <reference path="./LogInterceptor.ts" />
/// <reference path="./ExceptionInterceptor.ts" />
/// <reference path="./Options.ts" />
/// <reference path="./HTTPRequest.ts" />
class ApplicationInsights {

    private _localStorage: AppInsightsStorage;
    private _locale: angular.ILocaleService;
    private _window: angular.IWindowService;
    private _location: angular.ILocationService;
    private _httpRequestFactory:()=>IHttpRequest;

    private _log: any;
    private _exceptionHandler: any;

    private _logInterceptor: LogInterceptor;
    private _exceptionInterceptor: ExceptionInterceptor;
    private _sessionKey = "$$appInsights__session";
    options: Options;

    private static namespace = "Microsoft.ApplicationInsights.";
    private static names = {
        pageViews: ApplicationInsights.namespace + "Pageview",
        traceMessage: ApplicationInsights.namespace + "Message",
        events: ApplicationInsights.namespace + "Event",
        metrics: ApplicationInsights.namespace + "Metric",
        exception: ApplicationInsights.namespace + "Exception"
    };
    private static types = {
        pageViews: ApplicationInsights.namespace + "PageViewData",
        traceMessage: ApplicationInsights.namespace + "MessageData",
        events: ApplicationInsights.namespace + "EventData",
        metrics: ApplicationInsights.namespace + "MetricData",
        exception: ApplicationInsights.namespace + "ExceptionData"
    };

    private _commonProperties: any;

    private _version = "angular:0.2.8";
    private _analyticsServiceUrl = "https://dc.services.visualstudio.com/v2/track";
    private _contentType = "application/json";


    constructor(localStorage: AppInsightsStorage,
        $locale: angular.ILocaleService,
        $window: angular.IWindowService,
        $location: angular.ILocationService,
        logInterceptor: LogInterceptor,
        exceptionInterceptor: ExceptionInterceptor,
        httpRequestFactory:()=>IHttpRequest,
        options: Options) {

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
            this._logInterceptor.setInterceptFunction((message, level, properties?) => this.trackTraceMessage(message, level, properties));
        }
        if (this.options.autoExceptionTracking) {
            this._exceptionInterceptor.setInterceptFunction((exception, cause) => this.trackException(exception, cause));
        }

    }


    private getUniqueId() {
        const uuidKey = "$$appInsights__uuid";
        // see if there is already an id stored locally, if not generate a new value
        var uuid = this._localStorage.get(uuidKey);
        if (Tools.isNullOrUndefined(uuid)) {
            uuid = Tools.generateGuid();
            this._localStorage.set(uuidKey, uuid);
        }
        return uuid;
    }

    private makeNewSession() {
        // no existing session data
        var sessionData = {
            id: Tools.generateGuid(),
            accessed: new Date().getTime()
        };
        this._localStorage.set(this._sessionKey, sessionData);
        return sessionData;
    }


    private getSessionId() {

        var sessionData = this._localStorage.get(this._sessionKey);

        if (Tools.isNullOrUndefined(sessionData)) {

            // no existing session data
            sessionData = this.makeNewSession();
        } else {


            var lastAccessed = Tools.isNullOrUndefined(sessionData.accessed) ? 0 : sessionData.accessed;
            var now = new Date().getTime();
            if ((now - lastAccessed > this.options.sessionInactivityTimeout)) {

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
        if (Tools.isNullOrUndefined(measurements)) {
            return null;
        }

        if (!Tools.isObject(measurements)) {
            this._log.warn("The value of the measurements parameter must be an object consisting of a string/number pairs.");
            return null;
        }

        var validatedMeasurements = {};
        for (let metricName in measurements) {
            if (Tools.isNumber(measurements[metricName])) {
                validatedMeasurements[metricName] = measurements[metricName];
            } else {
                this._log.warn(`The value of measurement ${metricName} is not a number.`);
            }
        }

        return validatedMeasurements;
    }


    private validateProperties(properties) {

        if (Tools.isNullOrUndefined(properties)) {
            return null;
        }

        if (!Tools.isObject(properties)) {
            this._log.warn("The value of the properties parameter must be an object consisting of a string/string pairs.");
            return null;
        }

        var validateProperties = {};
        for (let propName in properties) {
            var currentProp = properties[propName];
            if (!Tools.isNullOrUndefined(currentProp) && !Tools.isObject(currentProp) && !Tools.isArray(currentProp)) {
                validateProperties[propName] = currentProp;
            } else {
                this._log.warn(`The value of property ${propName} could not be determined to be a string or number.`);
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
        const levels = [
            "debug", // Verbose
            "info", // Information
            "warn", // Warning
            "error" //Error
        ];
        var levelEnum = levels.indexOf(level);
        return levelEnum > -1 ? levelEnum : 0;
    }


    private sendData(data) {

        var request = this._httpRequestFactory();

        var headers = {};
        headers["Accept"] = this._contentType; // jshint ignore:line
        headers["Content-Type"] = this._contentType;
         var options: HttpRequestOptions = {
            method: "POST",
            url: this._analyticsServiceUrl,
            headers: headers,
            data: data,
        };
        try {
           request.send(options,
                () => {
                    ExceptionInterceptor.errorOnHttpCall = false;
                    // this callback will be called asynchronously
                    // when the response is available
                },
                (statusCode) => {
                    // called asynchronously if an error occurs
                    // or server returns response with an error status.
                    ExceptionInterceptor.errorOnHttpCall = true;
                });
        } catch (e) {
            // supressing of exceptions on the initial http call in order to prevent infinate loops with the error interceptor.
        }
    }

    trackPageView(pageName?, pageUrl?, properties?, measurements?) {
        // TODO: consider possible overloads (no name or url but properties and measurements)
        const data = this.generateAppInsightsData(ApplicationInsights.names.pageViews,
            ApplicationInsights.types.pageViews,
            {
                ver: 1,
                url: Tools.isNullOrUndefined(pageUrl) ? this._location.absUrl() : pageUrl,
                name: Tools.isNullOrUndefined(pageName) ? this._location.path() : pageName,
                properties: this.validateProperties(properties),
                measurements: this.validateMeasurements(measurements)
            });
        this.sendData(data);
    }

    trackEvent(eventName, properties, measurements) {
        const data = this.generateAppInsightsData(ApplicationInsights.names.events,
            ApplicationInsights.types.events,
            {
                ver: 1,
                name: eventName,
                properties: this.validateProperties(properties),
                measurements: this.validateMeasurements(measurements)
            });
        this.sendData(data);
    }

    trackTraceMessage(message, level, properties?) {
        if (Tools.isNullOrUndefined(message) || !Tools.isString(message)) {
            return;
        }
        const data = this.generateAppInsightsData(ApplicationInsights.names.traceMessage,
            ApplicationInsights.types.traceMessage,
            {
                ver: 1,
                message: message,
                severityLevel: this.validateSeverityLevel(level),
                properties: this.validateProperties(properties)
            });
        this.sendData(data);
    }

    trackMetric(name, value, properties) {
        const data = this.generateAppInsightsData(ApplicationInsights.names.metrics,
            ApplicationInsights.types.metrics,
            {
                ver: 1,
                metrics: [{ name: name, value: value }],
                properties: this.validateProperties(properties)
            });
        this.sendData(data);
    }

    trackException(exception, cause) {
        if (Tools.isNullOrUndefined(exception)) {
            return;
        }

        // parse the stack
        const parsedStack = StackParser.parse(exception);
        const data = this.generateAppInsightsData(ApplicationInsights.names.exception,
            ApplicationInsights.types.exception,
            {
                ver: 1,
                handledAt: "Unhandled",
                exceptions: [
                    {
                        typeName: exception.name,
                        message: exception.message,
                        stack: exception.stack,
                        parsedStack: parsedStack,
                        hasFullStack: !Tools.isNullOrUndefined(parsedStack)
                    }
                ]
            });
        this.sendData(data);
    }

    private generateAppInsightsData(payloadName, payloadDataType, payloadData) {

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
                id: this.getUniqueId(),
                type: "User"
            },
            session: {
                id: this.getSessionId()
            },
            operation: {
                id: Tools.generateGuid()
            },
            device: {
                id: "browser",
                locale: this._locale.id,
                resolution: this._window.screen.availWidth + "x" + this._window.screen.availHeight,
                type: "Browser"
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
        Tools.extend(this._commonProperties, data);
    }
}