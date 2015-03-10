



angular-applicationinsights
===========================
[![npm version][npm-image]][npm-url] [![license][lic-image]][lic-url] [![Build Status][travisCI-image]][travisCI-url] [![Dependency Status][dep-image]][dep-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Code Climate][cc-image]][cc-url]

An implementation of Microsoft Application Insights as a 100% AngularJS module. This module does not utilize the offical Application Insights Javascript SDK, in order to avoid depending on global code outside of the AngularJS platform scope.

## Getting Started

##### Prerequisites

- A Microsoft Application Insights Instrumentation Key:
    - This can be obtained from https://portal.azure.com, and registering an Application Insights resource.
    - A guide based on the latest portal update : [Obtaining An Application Insights Instrumentation Key](http://kenhaines.net/getting-an-application-insights-instrumentation-key/) 


###Installation

####Via Package 

##### Bower
```
bower install angular-applicationinsights
```

##### NPM
```
npm i angular-applicationinsights
```

##### Nuget
```
Install-Package angular-applicationinsights
```

####From Source
```
> git clone https://github.com/khaines/angular-applicationinsights.git
> cd angular-applicationinsights
> npm install
> grunt
```
Note: the angular-applicationinsights.js file will be in the **build/** folder after running *grunt*.


###Setup

Add a reference to the *angular-applicationinsights.js* file in your main html file:
```HTML
   <!-- load angular and angular routes via CDN -->
   <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.3.10/angular.js"></script>
   <script src="https://ajax.googleapis.com/ajax/libs/angularjs/1.3.10/angular-route.js"></script>
	<!-- load application insights after the angular script, but before your main application module -->
   <script src="build/angular-applicationinsights.js"></script>
   <script language="javascript">
		var amazingApp = angular.module('amazingApp', ['ApplicationInsightsModule']);
   </script>
```
Configure the provider during your application module's config phase:
```Javascript
<script language="javascript">
	var amazingApp = angular.module('amazingApp', ['ApplicationInsightsModule']);

	amazingApp.config(function(applicationInsightsServiceProvider){
		var options = {applicationName:'amazingApp'};
		// Configuration options are described below 	 
        applicationInsightsServiceProvider.configure('<PUT YOUR APPLICATION INSIGHTS KEY HERE', options );
    });
 </script>
```
 Basic automatic telemetry will be gathered out of the box, but for a direct reference inject the _applicationInsightsService_ into your code:
```Javascript
	amazingApp.controller('mainController',['applicationInsightsService',function(applicationInsightsService){
	applicationInsightsService.trackEvent('An amazing Event happened');
}]);

```

###Configuration
The options object passed to the _**configure**( iKey, options )_  has a number of valid settings. Their names and default values are as follows:
```Javascript
var options = {
	// applicationName: used as a 'friendly name' prefix to url paths
	// ex: myAmazingapp/mainView
	applicationName:'',
	// autoPageViewTracking: enables the sending a event to Application Insights when 
	// ever the $locationChangeSuccess event is fired on the rootScope
	autoPageViewTracking: true,
	// autoLogTracking: enables the interception of calls to the $log service and have the trace 
	// data sent to Application Insights.
	autoLogTracking: true,
	// autoExceptionTracking: enables calls to the $exceptionHandler service, usually unhandled exceptions, to have the error and stack data sent to Application Insights.
	autoExceptionTracking: true,
	// sessionInactivityTimeout: The time (in milliseconds) that a user session can be inactive, before a new session will be created (on the next api call). Default is 30mins.
	sessionInactivityTimeout: 1800000
	};
	
```

## API Reference

#### trackEvent
Sends a custom event to Application Insights. 
```Javascript
// name(String) : Required - the name of the event to be shown in reports.
// properties (Hash) : Optional - a String/String hash object of properties to associate with this event.
// metrics (Hash) : Optional - a String/Number hash object of metrics to associate with this event.

 applicationInsightsService.trackEvent( name, properties, metrics );
```

#### trackException
Sends error data to Application Insights. 
```Javascript
// exception (Error) : Required - the error object to be processed.

 applicationInsightsService.trackException( exception );
```
Note: if the *autoTrackExceptions* option is enabled, this method will be called any time the **$exceptionHandler** is invoked.
```Javascript
	try
	{
		// z is undefined.
		1 + z;
	}
	catch(e)
	{
		// this will call trackException. Unhandled exceptions will be caught by angularJS and directed to the $exceptionHandler.
		$exceptionHandler(e);
	}
```

#### trackMetric
Sends a metric consisting of a name/value pair to Application Insights
```Javascript
// name(String) : Required - the name of the Metric.
// value (Number) : Required -  the value of the metric.
// properties (Hash) : Optional - a String/String hash object of properties to associate with this metric.


 applicationInsightsService.trackMetric( name, value, properties );
```


#### trackPageView
Sends telemetry data to Application Insights signifying a view change has occured.
```Javascript
// viewName (String) : Optional - the name of the Page/View to be shown in reports. Defaults to the url path, prefixed with the app name (ex: amazingApp/view2).
// url (String) : Optional - The full url to associate with this view. Defaults to $location.absUrl();
// properties (Hash) : Optional - a String/String hash object of properties to associate with this event.
// metrics (Hash) : Optional - a String/Number hash object of metrics to associate with this event.

 applicationInsightsService.trackPageView( viewName , url, properties, metrics );
```
This method is invoked automatically any time the **$locationChangeSuccess** event is fired, and the *autoTrackPageviews* configuration option is enabled.

#### trackTraceMessage
Sends a trace log message to Application Insights. 
```Javascript
// message (String) : Required - The log message to send to Application Insights.
// severity (String) : Optional - The message severity Level (debug,info,warn, error). Defaults to 'info'. 
// properties (Hash) : Optional - a String/String hash object of properties to associate with this event.

 applicationInsightsService.trackTraceMessage( message , severity , properties);
```
If the *autoLogTracking* option is enabled, trackTraceMessage will be called any time one of the **$log** service methods are called.
```Javascript
// trackTraceMessage will be invoked with a value of 'message' and 'info' as the parameters.
 $log.info('message');
```



[travisCI-image]: https://travis-ci.org/khaines/angular-applicationinsights.svg?branch=master&
[travisCI-url]: https://travis-ci.org/khaines/angular-applicationinsights
[coveralls-image]: https://coveralls.io/repos/khaines/angular-applicationinsights/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/r/khaines/angular-applicationinsights?branch=master
[npm-image]: https://img.shields.io/npm/v/angular-applicationinsights.svg
[npm-url]: https://www.npmjs.com/package/angular-applicationinsights
[lic-image]: http://img.shields.io/npm/l/angular-applicationinsights.svg
[lic-url]: LICENSE
[dep-image]: https://david-dm.org/khaines/angular-applicationinsights.svg
[dep-url]: https://david-dm.org/khaines/angular-applicationinsights
[cc-image]:https://codeclimate.com/github/khaines/angular-applicationinsights/badges/gpa.svg
[cc-url]:https://codeclimate.com/github/khaines/angular-applicationinsights    
