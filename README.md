# angular-applicationinsights

An implementation of Microsoft Application Insights as an AngularJS module.

## Installation

##### Via NPM

     npm i angular-applicationinsights

1. Run the above command from within your root project folder
2. Add a reference to the application insights script in your main app view, after the angularJS reference:
```HTML
<script src="/node_modules/angular-applicationinsights/node_modules/angular-local-storage/dist/angular-local-storage.min.js" />
<script src="/node_modules/angular-applicationinsights/build/angular-applicationinsights.min.js" />
```
3. Add 'ApplicationInsightsModule' to the list of modules required by your application.
4. Configure the provider during your application module's config phase:
```Javascript
myAmazingApp.config(function(applicationInsightsServiceProvider){
    applicationInsightsServiceProvider.configure('<PUT YOUR APPLICATION INSIGHTS KEY HERE', 'myAmazingApp');
})
```
5. Start using your application. In the default configuration the Application Insights module will automatically track view changes and $log events, sending the telemetry to Microsoft Application Insights.
