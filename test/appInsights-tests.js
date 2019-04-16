describe('Application Insights for Angular JS Provider', function(){
	
	var _appInsightsUrl = 'https://dc.services.visualstudio.com/v2/track';
	var _insights;
	var $httpBackend;
	var $log;
	var $exceptionHandler;
    var _http;
    var _offlineTrigger;

    var testKey = '1234567890';
    var testName = 'angularjs-appinsights-unittests';
    var testAutoPageView = false;

    beforeEach(module("$$ApplicationInsights-HttpRequestModule", function ($provide) {

        var mockHttp = function() {};
        mockHttp.prototype.send = function(options, successCallback, errorCallback) {
            
            _http(options)
                .then(function (response) {
                        // success
                        successCallback();
                    },
                    function (response) {
                        //failure
                        errorCallback(0);
                    });
        };


	    $provide.factory("$$applicationInsightsHttpRequestService", function() { return function() { return new mockHttp(); } });
	} ));


    beforeEach(module('ApplicationInsightsModule', function (applicationInsightsServiceProvider) {

        var options = {
            applicationName: testName,
            autoPageViewTracking: testAutoPageView
        };

        applicationInsightsServiceProvider.configure(testKey, options);

	}));

	beforeEach(inject(function (applicationInsightsService,$injector,$http) {
	    _insights = applicationInsightsService;
	    $httpBackend = $injector.get('$httpBackend');
	    $log = $injector.get('$log');
	    $log.reset();
	    $exceptionHandler = $injector.get('$exceptionHandler');
        _http = $http;
	    _offlineTrigger = jasmine.createSpyObj('applicationInsightsService', ['sendData']);
	    _offlineTrigger.sendData.and.returnValue(-1);
	}));
 
 	afterEach(function(){

			$httpBackend.verifyNoOutstandingExpectation();
      		$httpBackend.verifyNoOutstandingRequest();
 	});

	describe('Configuration Settings', function() {

	    it('Should remember the configured intrumentation key', function () {
	        expect(_insights.options.instrumentationKey).toEqual(testKey);
	    });

		it('Should remember the configured application name', function(){
      		expect(_insights.options.applicationName).toEqual(testName);
    	});

    	it('Should remember that automatic pageview tracking is disabled for tests', function(){
    	    expect(_insights.options.autoPageViewTracking).toEqual(testAutoPageView);
    	});
	});

	describe('Page view Tracking', function() {
        	 
	  it('Sent data should match expectications', inject(function (applicationInsightsService) {

		    applicationInsightsService.options.autoPageViewTracking = testAutoPageView;
			$httpBackend.resetExpectations();
			$httpBackend.expect('POST','https://dc.services.visualstudio.com/v2/track', function(json){
				var data = JSON.parse(json);

				expect(data.name).toEqual('Microsoft.ApplicationInsights.Pageview');
				expect(data.data.type).toEqual('Microsoft.ApplicationInsights.PageViewData');
				expect(data.data.item.ver).toEqual(1);
				expect(data.data.item.url).toEqual('http://www.somewhere.com/sometest/page');
				expect(data.data.item.properties.testprop).toEqual('testvalue');
				expect(data.data.item.measurements.metric1).toEqual(2345);
				expect(data.data.item.duration).toEqual(3456);

				return true;
			}, function(headers){
				expect(headers['Content-Type']).toEqual('application/json');				
				return headers['Content-Type'] == 'application/json';
			})
			.respond(200,'');


			_insights.trackPageView('/sometest/page','http://www.somewhere.com/sometest/page',{testprop:'testvalue'},{metric1:2345}, 3456);
			$httpBackend.flush();
 
		}));

	  it('Tracking sent on $locationChangeStart+$locationChangeSuccess', inject(function ($rootScope, applicationInsightsService) {
          
	      applicationInsightsService.options.autoPageViewTracking = true;
	      

	      $httpBackend.resetExpectations();
	      $httpBackend.expect('POST', 'https://dc.services.visualstudio.com/v2/track', function(json) {
	          var data = JSON.parse(json);
	          
	          expect(data.data.item.name).toEqual('angularjs-appinsights-unittests#http://server/');

	          return true;
	        })
	      .respond(200, '');

	      $httpBackend.flush();
	    }));
	});

	describe('Log Message Tracking', function(){

		it('Sent data should match expectications',function(){

			$httpBackend.expectPOST('https://dc.services.visualstudio.com/v2/track',function(json){
				var data = JSON.parse(json);
				//expect(data.length).toEqual(1);
				expect(data.name).toEqual('Microsoft.ApplicationInsights.Message');

				return true;
			}, function(headers){				
				return headers['Content-Type'] == 'application/json';
			})
			.respond(200,'');

			_insights.trackTraceMessage('this is a trace Message.');
			$httpBackend.flush();
 
		});


		it('Should send data to application insights when messages are written via $log service',function(){
			$httpBackend.expectPOST('https://dc.services.visualstudio.com/v2/track',function(json){
				var data = JSON.parse(json);
				//expect(data.length).toEqual(1);
				expect(data.name).toEqual('Microsoft.ApplicationInsights.Message');
				expect(data.data.item.message).toEqual('this is a message written via the $log serice');

				return true;
			}, function(headers){				
				return headers['Content-Type'] == 'application/json';
			})
			.respond(200,'');

			$log.debug('this is a message written via the $log serice');
			$httpBackend.flush();
		}); 
    });

    describe('Offline Request', function () {
        it('Should return -1 when app goes offline', function () {
            expect(_offlineTrigger.sendData()).toEqual(-1);
        });
    });

	describe('Custom Event Tracking', function(){

		it('Sent data should match expectications',function(){

			$httpBackend.expectPOST('https://dc.services.visualstudio.com/v2/track',function(json){
				var data = JSON.parse(json);
				//expect(data.length).toEqual(1);
				expect(data.name).toEqual('Microsoft.ApplicationInsights.Event');

				return true;
			}, function(headers){				
				return headers['Content-Type'] == 'application/json';
			})
			.respond(200,'');

			_insights.trackEvent('Some Test Event');
			$httpBackend.flush();
		});
		
		
		it('Common properties should be sent with custom events', function(){
			$httpBackend.expectPOST('https://dc.services.visualstudio.com/v2/track',function(json){
				var data = JSON.parse(json);
				//expect(data.length).toEqual(1);
				expect(data.name).toEqual('Microsoft.ApplicationInsights.Event');
				expect(data.data.item.properties.testName).toEqual('commonPropTest');


				return true;
			}, function(headers){				
				return headers['Content-Type'] == 'application/json';
			})
			.respond(200,'');
			
			_insights.setCommonProperties({testName:"commonPropTest"});
			_insights.trackEvent('some other test');
			$httpBackend.flush();
		});
	});

	describe('Custom Metric Tracking', function(){

		it('Sent data should match expectications',function(){

			$httpBackend.expectPOST('https://dc.services.visualstudio.com/v2/track',function(json){
				var data = JSON.parse(json);
				//expect(data.length).toEqual(1);
				expect(data.name).toEqual('Microsoft.ApplicationInsights.Metric');
				expect(data.data.item.properties.testProp).toEqual('testValue');
				expect(data.data.item.metrics[0].value).toEqual(2345);
				return true;
			}, function(headers){				
				return headers['Content-Type'] == 'application/json';
			})
			.respond(200,'');

			_insights.trackMetric('Test Metric', 2345, {testProp:'testValue'});
			$httpBackend.flush();
 
		});
	});
	
	

	describe('Exception/Crash Tracking', function(){

		it('Crashes should be sent to Application Insights',function(){

			$httpBackend.expectPOST('https://dc.services.visualstudio.com/v2/track',function(json){
				var data = JSON.parse(json);
				//expect(data.length).toEqual(1);

				expect(data.name).toEqual('Microsoft.ApplicationInsights.Exception');
				return true;
			}, function(headers){				
				return headers['Content-Type'] == 'application/json';
			})
			.respond(200,'');

			try
			{
				// cause an exception
			   1+z; // jshint ignore:line
			}
			catch(e){
				_insights.trackException(e);
			}

			$httpBackend.flush();
 
		});
	});

});