var controllers = angular.module('controllers',['ApplicationInsightsModule']);


controllers.controller('mainController',['$scope','applicationInsightsService', function($scope,applicationInsightsService){

$scope.pageTitle = "Application Insights Demo - Main";
$scope.message = "Main Page";


}]);

controllers.controller('page1Controller',['$scope','applicationInsightsService', function($scope,applicationInsightsService){

$scope.pageTitle = "Application Insights Demo - Page 1";
$scope.message = "Page 1";

}]);

controllers.controller('page2Controller',['$scope','applicationInsightsService', function($scope,applicationInsightsService){

$scope.pageTitle = "Application Insights Demo - Page 2";
$scope.message = "Page 2";
}]);