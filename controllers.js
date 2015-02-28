var controllers = angular.module('controllers',[]);


controllers.controller('mainController',['$scope', function($scope){

$scope.message = "Main Page";

}]);

controllers.controller('page1Controller',['$scope', function($scope){

$scope.message = "Page 1";

}]);

controllers.controller('page2Controller',['$scope', function($scope){

$scope.message = "Page 2";

}]);