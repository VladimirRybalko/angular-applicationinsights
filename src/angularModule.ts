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
	var _tools = new Tools(angular);
	var _stackParser = new StackParser(_tools);
	
	// setup some features that can only be done during the configure pass
	angularAppInsights.config(['$provide',function ($provide) {
    	 _logInterceptor = new LogInterceptor($provide, angular, _tools);
    	 _exceptionInterceptor = new ExceptionInterceptor($provide,_tools);
	}]);

	angularAppInsights.provider('applicationInsightsService', function() {
		// configuration properties for the provider
		var _instrumentationKey= '';
		var _options = new Options();
		

		this.configure = function(instrumentationKey, applicationName, enableAutoPageViewTracking){
			if(_tools.isString(applicationName)){
				_instrumentationKey = instrumentationKey;
				_options.applicationName = applicationName;
				_options.autoPageViewTracking = _tools.isNullOrUndefined(enableAutoPageViewTracking) ? true : enableAutoPageViewTracking;
			}
			else
			{
				_tools.extend(_options, applicationName);
				_instrumentationKey = instrumentationKey;
			}
		};
		
		

		// invoked when the provider is run
		this.$get = ['$http', '$locale','$window','$location','$rootScope','$parse','$document', function($http, $locale, $window, $location,$rootScope,$parse,$document){

				// get a reference of storage
				var storage = new AppInsightsStorage({
											window: $window,
											rootScope: $rootScope,
											document: $document,
											parse: $parse
											}, _tools);

				return new ApplicationInsights(storage, $http, $locale, $window, $location, _stackParser,_tools, _logInterceptor,_exceptionInterceptor, _options);
		}];


	
});




