// ui.js


var analyticsDemo = angular.module('appAnalyticsDemo', ['ngRoute','controllers', 'ApplicationInsightsModule']);

analyticsDemo.config(function(applicationInsightsServiceProvider){
    applicationInsightsServiceProvider.configure('60e02de5-021f-42a7-8695-c14df5fb7d08', {
                                                                                            applicationName:'analyticsDemo',
                                                                                            autoLogTracking:true,
                                                                                            autoPageViewTracking:true,
                                                                                            autoExceptionTracking:true
                                                                                        });
})


// configure our routes
    analyticsDemo.config(function($routeProvider, $locationProvider) {
        $routeProvider

            .when('/', {
                templateUrl : 'views/main.html',
                controller  : 'mainController'
            })
            .when('/page1', {
                templateUrl : 'views/page1.html',
                controller  : 'page1Controller'
            })

            .when('/page2', {
                templateUrl : 'views/page2.html',
                controller  : 'page2Controller'
            });
    }); 


analyticsDemo.run(function($http) {
  $http.defaults.headers.common.Authorization = 'Basic YmVlcDpib29w'
});