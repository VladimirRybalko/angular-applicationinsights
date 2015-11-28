/// <reference path="./ApplicationInsights.ts" />
/// <reference path="typings/angularjs/angular.d.ts" />
/// <reference path="./Tools.ts" />
/// <reference path="./Storage.ts" />
/// <reference path="./TelemetryRequest.ts" />
/// <reference path="./StackParser.ts" />
/// <reference path="./LogInterceptor.ts" />
/// <reference path="./ExceptionInterceptor.ts" />
/// <reference path="./Options.ts" />

	declare var angular:angular.IAngularStatic;
	
	// Application Insights Module
	var angularAppInsights = angular.module('ApplicationInsightsModule', []);
	var _logInterceptor:LogInterceptor;
	var _exceptionInterceptor:ExceptionInterceptor;
	var tools =new Tools(angular);
	var _stackParser = new StackParser();
	
	// setup some features that can only be done during the configure pass
	angularAppInsights.config(['$provide',$provide => {
	    _logInterceptor = new LogInterceptor($provide, angular);
	    _exceptionInterceptor = new ExceptionInterceptor($provide);
	}]);

    angularAppInsights.provider('applicationInsightsService', () => new AppInsightsProvider());

    // the run block sets up automatic page view tracking
    angularAppInsights.run(['$rootScope', '$location', 'applicationInsightsService', ($rootScope, $location, applicationInsightsService: ApplicationInsights) => {
        $rootScope.$on('$locationChangeSuccess', () => {

            if (applicationInsightsService.options.autoPageViewTracking) {
                applicationInsightsService.trackPageView(applicationInsightsService.options.applicationName + $location.path());
            }
        });
    }]);



    class AppInsightsProvider implements angular.IServiceProvider
        {
        // configuration properties for the provider
        private _options = new Options();

        configure(instrumentationKey, applicationName, enableAutoPageViewTracking) {
            if (Tools.isString(applicationName)) {
                this._options.instrumentationKey = instrumentationKey;
                this._options.applicationName = applicationName;
                this._options.autoPageViewTracking = Tools.isNullOrUndefined(enableAutoPageViewTracking) ? true : enableAutoPageViewTracking;
            }
            else {
                Tools.extend(this._options, applicationName);
                this._options.instrumentationKey = instrumentationKey;
            }
        } // invoked when the provider is run
        $get = ['$http', '$locale', '$window', '$location', '$rootScope', '$parse', '$document', ($http, $locale, $window, $location, $rootScope, $parse, $document) => {

            // get a reference of storage
            var storage = new AppInsightsStorage({
                window: $window,
                rootScope: $rootScope,
                document: $document,
                parse: $parse
            });

            return new ApplicationInsights(storage, $http, $locale, $window, $location, _stackParser, _logInterceptor, _exceptionInterceptor, this._options);
        }];



    }
	    
	




