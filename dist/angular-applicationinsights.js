// Code here will be linted with JSHint.
/* jshint ignore:start */
(function(angular){
	var root = {};
	root.angular = angular;
// Code here will be ignored by JSHint.
/* jshint ignore:end */
/*
* Stack parsing by the stacktracejs project @ https://github.com/stacktracejs/error-stack-parser
*/



(function(root){

        var isNumber = function(n){ return !isNaN(parseFloat(n)) && isFinite(n);};
        var isUndefined = root.angular.isUndefined;

    	function StackFrame(functionName, args, fileName, lineNumber, columnNumber, level) {
        	if (!isUndefined(functionName)) {
            	this.setFunctionName(functionName);
        	}
            if (!isUndefined(columnNumber)) {
                this.setColumnNumber(columnNumber);
            }
            if (!isUndefined(args)) {
                this.setArgs(args);
            }
        	if (!isUndefined(fileName)) {
            	this.setFileName(fileName);
        	}
        	if (!isUndefined(lineNumber)) {
            	this.setLineNumber(lineNumber);
        	}

        	if (!isUndefined(level)) {
            	this.setLevelNumber(level);
        	}
    	}

    	StackFrame.prototype = {

            getFunctionName: function () {
                return this.method;
            },
        	setFunctionName: function (v) {
            	this.method = String(v);
        	},
            getArgs: function () {
                return this.args;
            },
            setArgs: function (v) {
                if (Object.prototype.toString.call(v) !== '[object Array]') {
                    throw new TypeError('Args must be an Array');
                }
                this.args = v;
            },
            // NOTE: Property name may be misleading as it includes the path,
            // but it somewhat mirrors V8's JavaScriptStackTraceApi
            // https://code.google.com/p/v8/wiki/JavaScriptStackTraceApi and Gecko's
            // http://mxr.mozilla.org/mozilla-central/source/xpcom/base/nsIException.idl#14
            getFileName: function () {
                return this.fileName;
            },
        	setFileName: function (v) {
            	this.fileName = String(v);
        	},
            getLineNumber: function () {
                return this.line;
            },
        	setLineNumber: function (v) {
            	if (!isNumber(v)) {

                	this.line = undefined;
                    return;
            	}
            	this.line = Number(v);
        	},
            getColumnNumber: function () {
                 return this.columnNumber;
            },
            setColumnNumber: function (v) {
                 if (!isNumber(v)) {
                    this.columnNumber = undefined;
                    return;
                }
                this.columnNumber = Number(v);
            },
        	setLevelNumber: function (v) {
            	if (!isNumber(v)) {
                	throw new TypeError('Level Number must be a Number');
            	}
            	this.level = Number(v);
        	},
            toString: function() {
                var functionName = this.getFunctionName() || '{anonymous}';
                var args = '(' + (this.getArgs() || []).join(',') + ')';
                var fileName = this.getFileName() ? ('@' + this.getFileName()) : '';
                var lineNumber = isNumber(this.getLineNumber()) ? (':' + this.getLineNumber()) : '';
                var columnNumber = isNumber(this.getColumnNumber()) ? (':' + this.getColumnNumber()) : '';
                return functionName + args + fileName + lineNumber + columnNumber;
            }

    	};

    root.StackFrame = StackFrame;
 })(root);
/*
* Stack parsing by the stacktracejs project @ https://github.com/stacktracejs/error-stack-parser
*/



(function(root){

	var StackFrame = root.StackFrame;

  	var FIREFOX_SAFARI_STACK_REGEXP = /\S+\:\d+/;
    var CHROME_IE_STACK_REGEXP = /\s+at /;
	var exceptionStackParser =  {
        /**
         * Given an Error object, extract the most information from it.
         * @param error {Error}
         * @return Array[StackFrame]
         */
        parse: function ErrorStackParser$$parse(error) {
            if (typeof error.stacktrace !== 'undefined' || typeof error['opera#sourceloc'] !== 'undefined') {
                return this.parseOpera(error);
            } else if (error.stack && error.stack.match(CHROME_IE_STACK_REGEXP)) {
                return this.parseV8OrIE(error);
            } else if (error.stack && error.stack.match(FIREFOX_SAFARI_STACK_REGEXP)) {
                return this.parseFFOrSafari(error);
            } else {
                return null;
            }
        },

        /**
         * Separate line and column numbers from a URL-like string.
         * @param urlLike String
         * @return Array[String]
         */
        extractLocation: function ErrorStackParser$$extractLocation(urlLike) {
            // Guard against strings like "(native)"
            if (urlLike.indexOf(':') === -1) {
                return [];
            }

            var locationParts = urlLike.split(':');
            var lastNumber = locationParts.pop();
            var possibleNumber = locationParts[locationParts.length - 1];
            if (!isNaN(parseFloat(possibleNumber)) && isFinite(possibleNumber)) {
                var lineNumber = locationParts.pop();
                return [locationParts.join(':'), lineNumber, lastNumber];
            } else {
                return [locationParts.join(':'), lastNumber, undefined];
            }
        },

        parseV8OrIE: function ErrorStackParser$$parseV8OrIE(error) {
        	var level =0;
            return error.stack.split('\n').slice(1).map(function (line) {
                var tokens = line.replace(/^\s+/, '').split(/\s+/).slice(1);
                var locationParts = this.extractLocation(tokens.pop().replace(/[\(\)\s]/g, ''));
                var functionName = (!tokens[0] || tokens[0] === 'Anonymous') ? undefined : tokens[0];
                return new StackFrame(functionName, undefined, locationParts[0], locationParts[1], locationParts[2], level++);
            }, this);
        },

        parseFFOrSafari: function ErrorStackParser$$parseFFOrSafari(error) {
        	var level=0;
            return error.stack.split('\n').filter(function (line) {
                return !!line.match(FIREFOX_SAFARI_STACK_REGEXP);
            }, this).map(function (line) {
                var tokens = line.split('@');
                var locationParts = this.extractLocation(tokens.pop());
                var functionName = tokens.shift() || undefined;
                return new StackFrame(functionName, undefined, locationParts[0], locationParts[1], locationParts[2], level++);
            }, this);
        },

        parseOpera: function ErrorStackParser$$parseOpera(e) {
            if (!e.stacktrace || (e.message.indexOf('\n') > -1 &&
                e.message.split('\n').length > e.stacktrace.split('\n').length)) {
                return this.parseOpera9(e);
            } else if (!e.stack) {
                return this.parseOpera10(e);
            } else {
                return this.parseOpera11(e);
            }
        },

        parseOpera9: function ErrorStackParser$$parseOpera9(e) {
            var lineRE = /Line (\d+).*script (?:in )?(\S+)/i;
            var lines = e.message.split('\n');
            var result = [];
            var level =0;
            for (var i = 2, len = lines.length; i < len; i += 2) {
                var match = lineRE.exec(lines[i]);
                if (match) {
                    result.push(new StackFrame(undefined, undefined, match[2], match[1], undefined, level++));
                }
            }

            return result;
        },

        parseOpera10: function ErrorStackParser$$parseOpera10(e) {
            var lineRE = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
            var lines = e.stacktrace.split('\n');
            var result = [];
            var level =0;
            for (var i = 0, len = lines.length; i < len; i += 2) {
                var match = lineRE.exec(lines[i]);
                if (match) {
                    result.push(new StackFrame(match[3] || undefined, undefined, match[2], match[1], undefined, level++));
                }
            }

            return result;
        },

        // Opera 10.65+ Error.stack very similar to FF/Safari
        parseOpera11: function ErrorStackParser$$parseOpera11(error) {
            var level =0;
            return error.stack.split('\n').filter(function (line) {
                return !!line.match(FIREFOX_SAFARI_STACK_REGEXP) &&
                    !line.match(/^Error created at/);
            }, this).map(function (line) {
                var tokens = line.split('@');
                var locationParts = this.extractLocation(tokens.pop());
                var functionCall = (tokens.shift() || '');
                var functionName = functionCall
                        .replace(/<anonymous function(: (\w+))?>/, '$2')
                        .replace(/\([^\)]*\)/g, '') || undefined;
                var argsRaw;
                if (functionCall.match(/\(([^\)]*)\)/)) {
                    argsRaw = functionCall.replace(/^[^\(]+\(([^\)]*)\)$/, '$1');
                }
                var args = (argsRaw === undefined || argsRaw === '[arguments not available]') ? undefined : argsRaw.split(',');
                return new StackFrame(functionName, args, locationParts[0], locationParts[1], locationParts[2],level++);
            }, this);
        }
    };

    root.errorStackParser = exceptionStackParser;

})(root);
/*
* Storage is heavily based on the angular storage module by Gregory Pike (https://github.com/grevory/angular-local-storage)
*/


(function ( root, angular) {
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


// Test if string is only contains numbers
// e.g '1' => true, "'1'" => true
function isStringNumber(num) {
  return  /^-?\d+\.?\d*$/.test(num.replace(/["']/g, ''));
}


  var defaultConfig ={
  // You should set a prefix to avoid overwriting any local storage variables from the rest of your app
  // e.g. localStorageServiceProvider.setPrefix('youAppName');
  // With provider you can use config as this:
  // myApp.config(function (localStorageServiceProvider) {
  //    localStorageServiceProvider.prefix = 'yourAppName';
  // });
    prefix : 'ls',

  // You could change web storage type localstorage or sessionStorage
    storageType : 'localStorage',

  // Cookie options (usually in case of fallback)
  // expiry = Number of days before cookies expire // 0 = Does not expire
  // path = The web path the cookie represents
    cookie : {
      expiry: 30,
      path: '/'
    },

  // Send signals for each of the following actions?
    notify : {
      setItem: true,
      removeItem: false
    }
  };

 

  root.storage = function(settings) {

    var config = extend(defaultConfig, settings);
    var self = config;
    var prefix = config.prefix;
    var cookie = config.cookie;
    var notify = config.notify;
    var storageType = config.storageType;
    var webStorage;
    var $rootScope = config.rootScope;
    var $window = config.window;
    var $document = config.document;
    var $parse = config.parse;


    // When Angular's $document is not available
    if (!$document) {
      $document = document;
    } else if ($document[0]) {
      $document = $document[0];
    }

    // If there is a prefix set in the config lets use that with an appended period for readability
    if (prefix.substr(-1) !== '.') {
      prefix = !!prefix ? prefix + '.' : '';
    }
    var deriveQualifiedKey = function(key) {
      return prefix + key;
    };
    // Checks the browser to see if local storage is supported
    var browserSupportsLocalStorage = (function () {
      try {
        var supported = (storageType in $window && $window[storageType] !== null);

        // When Safari (OS X or iOS) is in private browsing mode, it appears as though localStorage
        // is available, but trying to call .setItem throws an exception.
        //
        // "QUOTA_EXCEEDED_ERR: DOM Exception 22: An attempt was made to add something to storage
        // that exceeded the quota."
        var key = deriveQualifiedKey('__' + Math.round(Math.random() * 1e7));
        if (supported) {
          webStorage = $window[storageType];
          webStorage.setItem(key, '');
          webStorage.removeItem(key);
        }

        return supported;
      } catch (e) {
        storageType = 'cookie';
        $rootScope.$broadcast('LocalStorageModule.notification.error', e.message);
        return false;
      }
    }());



    // Directly adds a value to local storage
    // If local storage is not available in the browser use cookies
    // Example use: localStorageService.add('library','angular');
    var addToLocalStorage = function (key, value) {
      // Let's convert undefined values to null to get the value consistent
      if (isUndefined(value)) {
        value = null;
      } else if (isObject(value) || isArray(value) || isNumber(+value || value)) {
        value = toJson(value);
      }

      // If this browser does not support local storage use cookies
      if (!browserSupportsLocalStorage || self.storageType === 'cookie') {
        if (!browserSupportsLocalStorage) {
            $rootScope.$broadcast('LocalStorageModule.notification.warning', 'LOCAL_STORAGE_NOT_SUPPORTED');
        }

        if (notify.setItem) {
          $rootScope.$broadcast('LocalStorageModule.notification.setitem', {key: key, newvalue: value, storageType: 'cookie'});
        }
        return addToCookies(key, value);
      }

      try {
        if (isObject(value) || isArray(value)) {
          value = toJson(value);
        }
        if (webStorage) {
          webStorage.setItem(deriveQualifiedKey(key), value);
        }
        if (notify.setItem) {
          $rootScope.$broadcast('LocalStorageModule.notification.setitem', {key: key, newvalue: value, storageType: self.storageType});
        }
      } catch (e) {
        $rootScope.$broadcast('LocalStorageModule.notification.error', e.message);
        return addToCookies(key, value);
      }
      return true;
    };

    // Directly get a value from local storage
    // Example use: localStorageService.get('library'); // returns 'angular'
    var getFromLocalStorage = function (key) {

      if (!browserSupportsLocalStorage || self.storageType === 'cookie') {
        if (!browserSupportsLocalStorage) {
          $rootScope.$broadcast('LocalStorageModule.notification.warning','LOCAL_STORAGE_NOT_SUPPORTED');
        }

        return getFromCookies(key);
      }

      var item = webStorage ? webStorage.getItem(deriveQualifiedKey(key)) : null;
      // angular.toJson will convert null to 'null', so a proper conversion is needed
      // FIXME not a perfect solution, since a valid 'null' string can't be stored
      if (!item || item === 'null') {
        return null;
      }

      if (item.charAt(0) === "{" || item.charAt(0) === "[" || isStringNumber(item)) {
        return fromJson(item);
      }

      return item;
    };

    // Checks the browser to see if cookies are supported
    var browserSupportsCookies = (function() {
      try {
        return $window.navigator.cookieEnabled ||
          ("cookie" in $document && ($document.cookie.length > 0 ||
          ($document.cookie = "test").indexOf.call($document.cookie, "test") > -1));
      } catch (e) {
          $rootScope.$broadcast('LocalStorageModule.notification.error', e.message);
          return false;
      }
    }());

    // Directly adds a value to cookies
    // Typically used as a fallback is local storage is not available in the browser
    // Example use: localStorageService.cookie.add('library','angular');
    var addToCookies = function (key, value) {

      if (isUndefined(value)) {
        return false;
      } else if(isArray(value) || isObject(value)) {
        value = toJson(value);
      }

      if (!browserSupportsCookies) {
        $rootScope.$broadcast('LocalStorageModule.notification.error', 'COOKIES_NOT_SUPPORTED');
        return false;
      }

      try {
        var expiry = '',
            expiryDate = new Date(),
            cookieDomain = '';

        if (value === null) {
          // Mark that the cookie has expired one day ago
          expiryDate.setTime(expiryDate.getTime() + (-1 * 24 * 60 * 60 * 1000));
          expiry = "; expires=" + expiryDate.toGMTString();
          value = '';
        } else if (cookie.expiry !== 0) {
          expiryDate.setTime(expiryDate.getTime() + (cookie.expiry * 24 * 60 * 60 * 1000));
          expiry = "; expires=" + expiryDate.toGMTString();
        }
        if (!!key) {
          var cookiePath = "; path=" + cookie.path;
          if(cookie.domain){
            cookieDomain = "; domain=" + cookie.domain;
          }
          $document.cookie = deriveQualifiedKey(key) + "=" + encodeURIComponent(value) + expiry + cookiePath + cookieDomain;
        }
      } catch (e) {
        $rootScope.$broadcast('LocalStorageModule.notification.error',e.message);
        return false;
      }
      return true;
    };

    // Directly get a value from a cookie
    // Example use: localStorageService.cookie.get('library'); // returns 'angular'
    var getFromCookies = function (key) {
      if (!browserSupportsCookies) {
        $rootScope.$broadcast('LocalStorageModule.notification.error', 'COOKIES_NOT_SUPPORTED');
        return false;
      }

      var cookies = $document.cookie && $document.cookie.split(';') || [];
      for(var i=0; i < cookies.length; i++) {
        var thisCookie = cookies[i];
        while (thisCookie.charAt(0) === ' ') {
          thisCookie = thisCookie.substring(1,thisCookie.length);
        }
        if (thisCookie.indexOf(deriveQualifiedKey(key) + '=') === 0) {
          var storedValues = decodeURIComponent(thisCookie.substring(prefix.length + key.length + 1, thisCookie.length));
          try{
            var obj = JSON.parse(storedValues);
            return fromJson(obj);
          }catch(e){
            return storedValues;
          }
        }
      }
      return null;
    };

    var getStorageType = function() {
      return storageType;
    };


    return {
      isSupported: browserSupportsLocalStorage,
      getStorageType: getStorageType,
      set: addToLocalStorage,
      get: getFromLocalStorage,
      deriveKey: deriveQualifiedKey,
      cookie: {
        isSupported: browserSupportsCookies,
        set: addToCookies,
        get: getFromCookies
      }
    };
  };

})( root, window.angular );
/*
 *  angular-applicationinsights
 *	An angularJS module for using Microsoft Application Insights
 *  https://github.com/khaines/angular-applicationinsights
 */



(function (angular, errorStackParser, localStorage) {
/*jshint globalstrict:true*/
'use strict';

	
	var _version='angular:0.2.3';
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

			var sendData = function(data){
				var request = {
					method: 'POST',
					url:_analyticsServiceUrl,
					headers: {
						'Content-Type': _contentType
					},
					data:data
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
												severity: level,
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
				'autoPageViewTracking': _options.autoPageViewTracking
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

// Code here will be linted with JSHint.
/* jshint ignore:start */
})(window.angular);
// Code here will be ignored by JSHint.
/* jshint ignore:end */