var controllers = angular.module('controllers',['ApplicationInsightsModule']);


controllers.controller('mainController',['$scope','applicationInsightsService', '$log', function($scope,applicationInsightsService, $log){

$scope.pageTitle = "Application Insights Demo - Main";
$scope.message = "Main Page";

$log.debug('main page loaded');

}]);

controllers.controller('page1Controller',['$scope','applicationInsightsService', function($scope,applicationInsightsService){

var loadedTime = new Date().getTime();
var timesclicked =0;
$scope.pageTitle = "Application Insights Demo - Page 1";
$scope.message = "Page 1";
$scope.clicked = function(){
	applicationInsightsService.trackEvent("button clicked",{'color':'gray'},{'times clicked': ++timesclicked});

	var clickedTime = new Date().getTime();
	applicationInsightsService.trackMetric('Button Click Delay', clickedTime- loadedTime);
	loadedTime = new Date().getTime();
}



}]);

controllers.controller('page2Controller',['$scope','applicationInsightsService', function($scope,applicationInsightsService){

$scope.pageTitle = "Application Insights Demo - Page 2";
$scope.message = "Page 2";
$scope.clicked = function (){

	1 + z;
}
}]);