



angular-applicationinsights
===========================
[![npm version][npm-image]][npm-url] [![license][lic-image]][lic-url] [![Build Status][travisCI-image]][travisCI-url] [![Dependency Status][dep-image]][dep-url] [![Coverage Status][coveralls-image]][coveralls-url] [![Code Climate][cc-image]][cc-url]

An implementation of Microsoft Application Insights as a 100% AngularJS module. This module does not utilize the offical Application Insights Javascript SDK, in order to avoid depending on global code outside of the AngularJS platform scope.

## Getting Started

##### Prerequisites

- A Microsoft Application Insights Instrumentation Key:
    - This can be obtained from https://portal.azure.com, and registering an Application Insights resource.
    - From the AppInsights Wiki : [Getting an Application Insights Instrumentation Key](https://github.com/Microsoft/AppInsights-Home/wiki#getting-an-application-insights-instrumentation-key) 


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
		var amazingApp = angular.module('amazingApp', ['ApplicationsInsightsModule']);
   </script>
```
Configure the provider during your application module's config phase:
```Javascript
<script language="javascript">
	var amazingApp = angular.module('amazingApp', ['ApplicationsInsightsModule']);

	amazingApp.config(function(applicationInsightsServiceProvider){
		var options = {applicationName:'amazingApp'};
		// Configuration options are described below 	 
        applicationInsightsServiceProvider.configure('<PUT YOUR APPLICATION INSIGHTS KEY HERE', options );
    })
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

#### trackPageView
Emits a telemetry event signifying a page or view change has occured. In the default configuration of this module this event is sent automatically when $locationChangeSuccess event is fired.
##### Parameters
*    pageName: String - (Optional) A friendly name for the page to be shown the Application Insights Portal. Default is the url path.

#### trackTraceMessage
Sends a log event message to Application Insights. This method can be called explicitly, but the Application Insights module extends the $log service, so that messages using the $log service will be sent to Application Insights.
##### Parameters
*   message: String - (Required) Log message to record to the server.
   
#### trackEvent
Sends a custom event to Application Insights. 
##### Parameters
*   eventName: String - (Required) The name of the event.

#### trackMetric
Sends a metric consisting of a name/value pair to Application Insights
##### Parameters
*   metricName: String - (Required) The name of the metric.
*   value: Numeric - (Required) A number representing the value of the metric.


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
