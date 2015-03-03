
angular-applicationinsights
===========================
[![npm version][npm-image]][npm-url] [![license][lic-image]][lic-url] [![Build Status][travisCI-image]][travisCI-url] [![Dependency Status][dep-image]][dep-url] [![Coverage Status][coveralls-image]][coveralls-url]

An implementation of Microsoft Application Insights as a 100% AngularJS module. This module does not utilize the offical Application Insights Javascript SDK, in order to avoid depending on global code outside of the AngularJS platform scope.

## Getting Started

##### Prerequisites

- A Microsoft Application Insights Instrumentation Key:
    - This can be obtained from https://portal.azure.com, and registering an Application Insights resource.
    - A tutorial on how to do this can be found @ http://azure.microsoft.com/en-us/documentation/articles/app-insights-web-track-usage/ . Depending on the version of the documentation the Instrumentation Key may also be referred to as 'iKey'. 


##### Via Bower
```
bower install angular-applicationinsights
```

##### Via NPM

     npm i angular-applicationinsights

1. Install the module either from bower, NPM or take the script from the git repository. If using the module directly from the repository, make sure to also get Grevory's angular-local-storage module (https://github.com/grevory/angular-local-storage). 
2. Add a reference to the application insights script in your main app view, after the angularJS reference. The path to this file and the angular-local-storage dependency will depend on how you downloaded the script file. 
3. Add 'ApplicationInsightsModule' to the list of modules required by your application.
4. Configure the provider during your application module's config phase:
    
    ```Javascript
    myAmazingApp.config(function(applicationInsightsServiceProvider){
        applicationInsightsServiceProvider.configure('<PUT YOUR APPLICATION INSIGHTS KEY HERE', 'myAmazingApp');
    })
    ```
5. Start using your application. In the default configuration the Application Insights module will automatically track view changes and $log events, sending the telemetry to Microsoft Application Insights.


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
    
