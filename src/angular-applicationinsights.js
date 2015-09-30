/*
 *  angular-applicationinsights
 *	An angularJS module for using Microsoft Application Insights
 *  https://github.com/khaines/angular-applicationinsights
 */

 /* test-code */
window.root = window.root || {};
window.root.angular = angular;
var root = window.root;
/* end-test-code */

(function (angular, errorStackParser, localStorage) {
/*jshint globalstrict:true*/
'use strict';

	
	var _version='angular:0.2.6';
	var _analyticsServiceUrl = 'https://dc.services.visualstudio.com/v2/track';

	var isDefined = angular.isDefined,
  		isUndefined = angular.isUndefined,
  		isNumber = function(n){ return !isNaN(parseFloat(n)) && isFinite(n);}, // angular's version only matches the type.
  		isObject = angular.isObject,
  		isArray = angular.isArray,
  		isString = angular.isString,
  		extend = angular.extend,
  		toJson = angular.toJson,
  		fromJson = angular.fromJson,
  		forEach = angular.forEach,
  		noop = angular.noop;

  	var	isNullOrUndefined = function(val) {
    	return isUndefined(val) || val === null; 
	};

	var _errorOnHttpCall = false;


	var generateGUID = function(){
        var value = [];
        var digits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
            value[i] = digits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        value[8] = value[13] = value[18] = value[23] = "-";
        value[14] = "4";
        value[19] = digits.substr((value[19] & 0x3) | 0x8, 1);  
        return value.join("");
	};


	// $log interceptor .. will send log data to application insights, once app insights is 
	// registered. $provide is only available in the config phase, so we need to setup
	// the decorator before app insights is instantiated.
	function LogInterceptor($provide){
		// original functions
		var debugFn,infoFn,warnFn,errorFn,logFn;

		// function to invoke ... initialized to noop
		var interceptFunction = noop;


		this.setInterceptFunction = function(func){
			interceptFunction = func;
		};

		this.getPrivateLoggingObject = function(){
			return {
				debug: isNullOrUndefined(debugFn) ? noop : debugFn,
				info: isNullOrUndefined(infoFn) ? noop : infoFn,
				warn: isNullOrUndefined(warnFn) ? noop : warnFn,
				error: isNullOrUndefined(errorFn) ? noop : errorFn,
				log: isNullOrUndefined(logFn) ? noop : logFn
			};
		};

		var delegator = function(orignalFn, level){
			return function( ){
				var args    = [].slice.call(arguments);
                  // track the call
                  interceptFunction(args[0],level);
                  // Call the original 
                  orignalFn.apply(null, args);
			};
		};

		$provide.decorator( '$log', [ "$delegate", function( $delegate )
        {
                debugFn = $delegate.debug;
 				infoFn = $delegate.info;
 				warnFn = $delegate.warn;
 				errorFn = $delegate.error;
 				logFn = $delegate.log;

                $delegate.debug = delegator(debugFn, 'debug');
                $delegate.info = delegator(infoFn, 'info');
                $delegate.warn = delegator(warnFn, 'warn');
                $delegate.error = delegator(errorFn,'error');
                $delegate.log = delegator(logFn,'log');
 
                return $delegate;
        }]);

	}

	// Exception interceptor
	// Intercepts calls to the $exceptionHandler and sends them to Application insights as exception telemetry.
	function ExceptionInterceptor($provide){

		var origExceptionHandler;

		var interceptFunction = noop;

		this.setInterceptFunction = function(func){
			interceptFunction = func;
		};

		this.getPrivateExceptionHanlder = function(){
			return isNullOrUndefined(origExceptionHandler) ? noop: origExceptionHandler;
		};

		$provide.decorator('$exceptionHandler',['$delegate',function($delegate){
				origExceptionHandler = $delegate;
				return function(exception, cause){
				  // track the call 
				  // ... only if there is no active issues/errors sending data over http, in order to prevent an infinite loop.
				  if(!_errorOnHttpCall){
				    interceptFunction(exception,cause);
				  }
                  // Call the original 
                  origExceptionHandler(exception,cause);		
				};
		}]);

	}

	var _logInterceptor, _exceptionInterceptor;


	// Application Insights Module
	var angularAppInsights = angular.module('ApplicationInsightsModule', []);

	// setup some features that can only be done during the configure pass
	angularAppInsights.config(['$provide',function ($provide) {
    	 _logInterceptor = new LogInterceptor($provide);
    	 _exceptionInterceptor = new ExceptionInterceptor($provide);
	}]);

	angularAppInsights.provider('applicationInsightsService', function() {
		// configuration properties for the provider
		var _instrumentationKey= '';
		var _options = {
			applicationName : '',
			autoPageViewTracking: true,
			autoLogTracking: true,
			autoExceptionTracking: true,
			sessionInactivityTimeout: 1800000
		};
		

		this.configure = function(instrumentationKey, applicationName, enableAutoPageViewTracking){
			if(isString(applicationName)){
				_instrumentationKey = instrumentationKey;
				_options.applicationName = applicationName;
				_options.autoPageViewTracking = isNullOrUndefined(enableAutoPageViewTracking) ? true : enableAutoPageViewTracking;
			}
			else
			{
				extend(_options, applicationName);
				_instrumentationKey = instrumentationKey;
			}
		};


		// invoked when the provider is run
		this.$get = ['$http', '$locale','$window','$location','$rootScope','$parse','$document', function($http, $locale, $window, $location,$rootScope,$parse,$document){

				// get a reference of storage
				var storage = localStorage({
											window: $window,
											rootScope: $rootScope,
											document: $document,
											parse: $parse
											});

				return new ApplicationInsights(storage, $http, $locale, $window, $location, errorStackParser);
		}];


		// Application Insights implementation
		function ApplicationInsights(localStorage, $http, $locale, $window, $location, exceptionStackParser){
			
			var _log = _logInterceptor.getPrivateLoggingObject(); // so we can log output without causing a recursive loop.
			var _exceptionHandler = _exceptionInterceptor.getPrivateExceptionHanlder();
			var _contentType = 'application/json';
			var _namespace = 'Microsoft.ApplicationInsights.';
			var _names = {
  				pageViews: _namespace+'Pageview',
  				traceMessage: _namespace +'Message',
  				events: _namespace +'Event',
  				metrics: _namespace +'Metric',
  				exception: _namespace + 'Exception'
  			};
  			var _types ={
  				pageViews: _namespace+'PageviewData',
  				traceMessage: _namespace+'MessageData',
  				events: _namespace +'EventData',
  				metrics: _namespace +'MetricData',
  				exception: _namespace +'ExceptionData'
  			};
			var _commonProperties;

			var getUUID = function(){
				var uuidKey = '$$appInsights__uuid';
				// see if there is already an id stored locally, if not generate a new value
				var uuid =  localStorage.get(uuidKey);
				if(isNullOrUndefined(uuid)){
					uuid = generateGUID();
					localStorage.set(uuidKey, uuid);
				}
				return uuid;
			};

			var sessionKey = '$$appInsights__session';
			var makeNewSession = function(){
				// no existing session data
					var sessionData = {
						id:generateGUID(),
						accessed: new Date().getTime()
					};
					localStorage.set(sessionKey,sessionData);
					return sessionData;
			};

			var getSessionID = function(){
			
				var sessionData = localStorage.get(sessionKey);
			
				if(isNullOrUndefined(sessionData)){
		
					// no existing session data
					sessionData = makeNewSession();
				}
				else
				{
			
		
					var lastAccessed = isNullOrUndefined(sessionData.accessed) ? 0 : sessionData.accessed;
					var now = new Date().getTime();
					if(( now - lastAccessed > _options.sessionInactivityTimeout))
					{

						// this session is expired, make a new one
						sessionData = makeNewSession();
					}
					else
					{

						// valid session, update the last access timestamp
						sessionData.accessed = now;
						localStorage.set(sessionKey, sessionData);
					}
				}

				return sessionData.id;
			};

			var validateMeasurements = function(measurements)
			{
				if(isNullOrUndefined(measurements)){
					return null;
				}

				if(!isObject(measurements)){
					_log.warn('The value of the measurements parameter must be an object consisting of a string/number pairs.');
					return null;
				}

				var validatedMeasurements={};
				for(var metricName in measurements){
					if( isNumber(measurements[metricName])){
						validatedMeasurements[metricName] = measurements[metricName];
					}
					else
					{
						_log.warn('The value of measurement '+metricName+' is not a number.');
					}
				}

				return validatedMeasurements;
			};

			var validateProperties = function(properties){

				if(isNullOrUndefined(properties)){
					return null;
				}
				
				if(!isObject(properties)){
					_log.warn('The value of the properties parameter must be an object consisting of a string/string pairs.');
					return null;
				}

				var validateProperties={};
				for(var propName in properties){
					var currentProp = properties[propName];
					if(!isNullOrUndefined(currentProp) && !isObject(currentProp) && !isArray(currentProp)){
						validateProperties[propName] = currentProp;
					}
					else{
						_log.warn('The value of property '+propName+' could not be determined to be a string or number.');
					}
				}
				return validateProperties;
			};

			var validateSeverityLevel = function (level) {
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
                    'info',  // Information
                    'warn',  // Warning
                    'error'  //Error
                ];
                var levelEnum = levels.indexOf(level);
                return levelEnum > -1 ? levelEnum : 0;
            };

			var sendData = function(data){

				// bug # 24 : create a header object that filters out any default assigned header that will not be accepted by a browser's CORS check
				var headers = {};
				for(var header in $http.defaults.headers.common){
					headers[header] = undefined;
				}

				for(var postHeader in $http.defaults.headers.post){
					headers[postHeader] = undefined;
				}

				headers.Accept = _contentType;
				headers['Content-Type'] = _contentType;

				var request = {
					method: 'POST',
					url:_analyticsServiceUrl,
					headers: headers,
					data:data,
					// bugfix for issue# 18: disable credentials on CORS requests.
					withCredentials: false 
				};

				try{
					$http(request)
						 .success(function(data, status, headers, config) {
						 	_errorOnHttpCall = false;
    						// this callback will be called asynchronously
    						// when the response is available
  						})
 						 .error(function(data, status, headers, config) {
    						// called asynchronously if an error occurs
    						// or server returns response with an error status.
    						_errorOnHttpCall = true;
  						});
 				}
 				catch(e){
 					// supressing of exceptions on the initial http call in order to prevent infinate loops with the error interceptor.
 				}
			};

			var trackPageView = function(pageName, pageUrl, properties, measurements){
				// TODO: consider possible overloads (no name or url but properties and measurements)

				var data = generateAppInsightsData(_names.pageViews, 
											_types.pageViews,
											{
												ver: 1,
												url: isNullOrUndefined(pageUrl) ? $location.absUrl() : pageUrl,
												name: isNullOrUndefined(pageName) ? $location.path() : pageName,
												properties: validateProperties(properties),
												measurements: validateMeasurements(measurements) 
											});
				sendData(data);
			};

			var trackEvent = function(eventName, properties, measurements){
				var data = generateAppInsightsData(_names.events,
											_types.events,
											{
												ver:1,
												name:eventName,
												properties: validateProperties(properties),
												measurements: validateMeasurements(measurements)
											});
				sendData(data);
			};

			var trackTraceMessage = function(message, level, properties){
				if(isNullOrUndefined(message) || !isString(message)){
					return;
				}

				var data = generateAppInsightsData(_names.traceMessage, 
											_types.traceMessage,
											{
												ver: 1,
												message: message,
												severityLevel: validateSeverityLevel(level),
												properties: validateProperties(properties)
											});
				sendData(data);
			};

			var trackMetric = function(name, value, properties){
				var data = generateAppInsightsData(_names.metrics, 
												_types.metrics,
												{
													ver: 1,
													metrics: [{name:name,value:value}],
													properties: validateProperties(properties)
												});
				sendData(data);
			};

			var trackException = function(exception, cause){
				if(isNullOrUndefined(exception)){
					return;
				}

				// parse the stack
				var parsedStack = exceptionStackParser.parse(exception);

				var data = generateAppInsightsData(_names.exception,
													_types.exception,
													{
														ver:1,
														handledAt:'Unhandled',
														exceptions:[{
																typeName: exception.name,
																message: exception.message,
																stack: exception.stack,
																parsedStack: parsedStack,
																hasFullStack: !isNullOrUndefined(parsedStack)
															}]
													});
				sendData(data);
			};

			var generateAppInsightsData = function(payloadName, payloadDataType, payloadData){
				
				if (_commonProperties) {
					payloadData.properties = payloadData.properties || {}; 
					extend(payloadData.properties, _commonProperties); 
				} 

				return {
					name: payloadName,
					time: new Date().toISOString(),
					ver: 1,
					iKey: _instrumentationKey,
					user: {id: getUUID()},
					session: {
						id: getSessionID()
					},
					operation: {
						id: generateGUID()
					},
					device: {
						id: 'browser',
						locale: $locale.id,
						resolution: $window.screen.availWidth +'x'+ $window.screen.availHeight
					},
					internal: {
						sdkVersion: _version
					},
					data:{
						type: payloadDataType,
						item: payloadData
					}
				};
			};
			
			var setCommonProperties = function (data) {
				validateProperties(data);
				_commonProperties = _commonProperties || {};
				extend(_commonProperties, data);
			};

			// set traceTraceMessage as the intercept method of the log decorator
			if(_options.autoLogTracking){
				_logInterceptor.setInterceptFunction(trackTraceMessage);
			}
			if(_options.autoExceptionTracking){
				_exceptionInterceptor.setInterceptFunction(trackException);
			}

			// public api surface
			return {
				'trackPageView': trackPageView,
				'trackTraceMessage': trackTraceMessage,
				'trackEvent': trackEvent,
				'trackMetric': trackMetric,
				'trackException' : trackException,
				'applicationName': _options.applicationName,
				'autoPageViewTracking': _options.autoPageViewTracking,
				'setCommonProperties': setCommonProperties
			};

		}
	})
	// the run block sets up automatic page view tracking
	.run(['$rootScope', '$location', 'applicationInsightsService', function($rootScope,$location,applicationInsightsService){
        $rootScope.$on('$locationChangeSuccess', function() {
           	
           		if(applicationInsightsService.autoPageViewTracking){
                	applicationInsightsService.trackPageView(applicationInsightsService.applicationName + $location.path());
 				}
        });
     }]);

})( root.angular, root.errorStackParser, root.storage );
