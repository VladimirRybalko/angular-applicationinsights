(function (window,angular) {
/*jshint globalstrict:true*/
'use strict';

	var isDefined = angular.isDefined,
  		isUndefined = angular.isUndefined,
  		isNumber = angular.isNumber,
  		isObject = angular.isObject,
  		isArray = angular.isArray,
  		extend = angular.extend,
  		toJson = angular.toJson,
  		fromJson = angular.fromJson;


	var angularAppInsights = angular.module('ApplicationInsightsModule', ['LocalStorageModule']);

	// configure the local storage module 
	angularAppInsights.config(function (localStorageServiceProvider) {
  		localStorageServiceProvider
   		 .setPrefix('appInsights')
    	 .setStorageCookie(0,'/')
    	 // since we can't use $location in the config phase, we're forced to use a hard window reference.
    	 .setStorageCookieDomain('.'+window.location);
	});


	angularAppInsights.provider('applicationInsightsService', function() {
		// configuration properties for the provider
		var _instrumentationKey = '';
		this.configure = function(instrumentationKey){
			_instrumentationKey = instrumentationKey;
		}


		// invoked when the provider is run
		this.$get = ['localStorageService', '$http', function(localStorageService,$http){

		}];



		// Application Insights implimentation
		function ApplicationInsights(localStorage, $http){

			var version='angular-0.0.1';

			var trackPageView = function(pageUrl, dimensions, metrics){

			}

			var trackEvent = function(eventName, dimensions, metrics){

			}

			var trackMetric = function(metricName, value, dimensions){

			}

			var trackTraceMessage = function(message);


			// public api surface
			return {
				'trackPageView': trackPageView,
				'trackEvent': trackEvent,
				'trackMetric': trackMetric,
				'trackTraceMessage': trackTraceMessage
			}

		}
	});





})( window, window.angular );
