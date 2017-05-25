/// <reference path="./ApplicationInsights.ts" />
declare var angular: angular.IAngularStatic;

var httpRequestService = angular.module("$$ApplicationInsights-HttpRequestModule", []);
httpRequestService.factory("$$applicationInsightsHttpRequestService", () => {
    return () => new HttpRequest();
});


// Application Insights Module
var angularAppInsights = angular.module("ApplicationInsightsModule", ["$$ApplicationInsights-HttpRequestModule"]);
var logInterceptor: LogInterceptor;
var exceptionInterceptor: ExceptionInterceptor;
var tools = new Tools(angular);

// setup some features that can only be done during the configure pass
angularAppInsights.config([
    "$provide", "$httpProvider",
    ($provide, $httpProvider) => {
        logInterceptor = new LogInterceptor($provide, angular);
        exceptionInterceptor = new ExceptionInterceptor($provide);
        if ($httpProvider && $httpProvider.interceptors) {
            $httpProvider.interceptors.push('ApplicationInsightsInterceptor');
        }
    }
]);

angularAppInsights.provider("applicationInsightsService", () => new AppInsightsProvider());

// the run block sets up automatic page view tracking
angularAppInsights.run([
    "$rootScope", "$location", "applicationInsightsService",
    ($rootScope, $location, applicationInsightsService: ApplicationInsights) => {
        var locationChangeStartOn: number;
        var stateChangeStartOn: number;

        $rootScope.$on("$locationChangeStart", () => {

            if (applicationInsightsService.options.autoPageViewTracking && !applicationInsightsService.options.autoStateChangeTracking) {
                locationChangeStartOn = (new Date()).getTime();
            }
        });

        $rootScope.$on("$locationChangeSuccess", (e, view) => {

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
                
        $rootScope.$on("$stateChangeStart", () => {

            if (applicationInsightsService.options.autoPageViewTracking && applicationInsightsService.options.autoStateChangeTracking) {
                stateChangeStartOn = (new Date()).getTime();
            }
        });

        $rootScope.$on("$stateChangeSuccess", () => {

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

class AppInsightsProvider implements angular.IServiceProvider {
    // configuration properties for the provider
    private _options = new Options();

    configure(instrumentationKey, options) {

        Tools.extend(this._options, options);
        this._options.instrumentationKey = instrumentationKey;

    } // invoked when the provider is run
    $get = ["$locale", "$window", "$location", "$rootScope", "$parse", "$document", "$$applicationInsightsHttpRequestService", ($locale, $window, $location, $rootScope, $parse, $document, $$applicationInsightsHttpRequestService) => {

        // get a reference of storage
        var storage = new AppInsightsStorage({
            window: $window,
            rootScope: $rootScope,
            document: $document,
            parse: $parse
        });

        return new ApplicationInsights(storage, $locale, $window, $location, logInterceptor, exceptionInterceptor, $$applicationInsightsHttpRequestService, this._options);
    }
    ];
}