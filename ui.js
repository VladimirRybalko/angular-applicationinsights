// ui.js


var analyticsDemo = angular.module('appAnalyticsDemo', ['ngRoute','LocalStorageModule','controllers']);


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
