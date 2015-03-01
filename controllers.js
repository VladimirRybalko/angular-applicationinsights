var controllers = angular.module('controllers',['ApplicationInsightsModule']);


controllers.controller('mainController',['$scope','applicationInsightsService', function($scope,applicationInsightsService){

$scope.message = "Main Page";
applicationInsightsService.trackPageView();

}]);

controllers.controller('page1Controller',['$scope','applicationInsightsService', function($scope,applicationInsightsService){

$scope.message = "Page 1";
applicationInsightsService.trackPageView();
}]);

controllers.controller('page2Controller',['$scope','applicationInsightsService', function($scope,applicationInsightsService){

$scope.message = "Page 2";
applicationInsightsService.trackPageView();
}]);