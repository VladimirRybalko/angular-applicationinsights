describe('Application Insights for Angular JS Provider', function(){
	
	var _appInsightsUrl = "https://dc.services.visualstudio.com/v2/track";
	var _insights;
	var $httpBackend;

	beforeEach( module('LocalStorageModule','ApplicationInsightsModule', function(applicationInsightsServiceProvider){
    	applicationInsightsServiceProvider.configure('1234567890','angularjs-appinsights-unittests');

    }));

	beforeEach(inject(function(applicationInsightsService, _$httpBackend_) { 
		_insights = applicationInsightsService;
		$httpBackend = _$httpBackend_;
	}));
 

	describe("Configuration Settings", function(){

		it("Should remember the configured application name", function(){
      		expect(_insights.applicationName).to.equal('angularjs-appinsights-unittests');
    	});
	});

	describe("Page view Tracking", function(){

		it("Sent data should match contract expectications",function(){

			$httpBackend.expectPOST('https://dc.services.visualstudio.com/v2/track',function(json){
				var data = JSON.parse(json);
				//expect(data.length).to.equal(1);
				expect(data.name).to.equal('Microsoft.ApplicationInsights.Pageview');

				return true;
			}, function(headers){				
				return headers['Content-Type'] == 'application/json';
			})
			.respond(200,"");

			_insights.trackPageView('/sometest/page');
			$httpBackend.flush();

			$httpBackend.verifyNoOutstandingExpectation();
      		$httpBackend.verifyNoOutstandingRequest();
 
		});
	});

	describe("Log Message Tracking", function(){

		it("Sent data should match contract expectications",function(){

			$httpBackend.expectPOST('https://dc.services.visualstudio.com/v2/track',function(json){
				var data = JSON.parse(json);
				//expect(data.length).to.equal(1);
				expect(data.name).to.equal('Microsoft.ApplicationInsights.Message');

				return true;
			}, function(headers){				
				return headers['Content-Type'] == 'application/json';
			})
			.respond(200,"");

			_insights.trackTraceMessage('this is a trace Message.');
			$httpBackend.flush();

			$httpBackend.verifyNoOutstandingExpectation();
      		$httpBackend.verifyNoOutstandingRequest();
 
		});


	});



});