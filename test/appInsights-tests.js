describe('Application Insights for Angular JS Provider', function(){
	
	var _appInsightsUrl = "https://dc.services.visualstudio.com/v2/track";
	var _insights;
	var $httpBackend;

	beforeEach( module('LocalStorageModule','ApplicationInsightsModule', function(applicationInsightsServiceProvider){
    	applicationInsightsServiceProvider.configure('1234567890','angularjs-appinsights-unittests', false);

    }));

	beforeEach(inject(function(applicationInsightsService, $injector) { 
		_insights = applicationInsightsService;
		$httpBackend = $injector.get('$httpBackend');
	}));
 
 	afterEach(function(){

			$httpBackend.verifyNoOutstandingExpectation();
      		$httpBackend.verifyNoOutstandingRequest();
 	});

	describe("Configuration Settings", function(){

		it("Should remember the configured application name", function(){
      		expect(_insights.applicationName).to.equal('angularjs-appinsights-unittests');
    	});

    	it("Should remember that automatic pageview tracking is disabled for tests", function(){
    		expect(_insights.autoPageViewTracking).to.equal(false);
    	});
	});

	describe("Page view Tracking", function(){

		it("Sent data should match contract expectications",function(){

			$httpBackend.resetExpectations();
			$httpBackend.expect('POST','https://dc.services.visualstudio.com/v2/track',function(json){
				var data = JSON.parse(json);
				//expect(data.length).to.equal(1);
				expect(data.name).to.equal('Microsoft.ApplicationInsights.Pageview');

				return true;
			}, function(headers){
				expect(headers['Content-Type']).to.equal('application/json');				
				return headers['Content-Type'] == 'application/json';
			})
			.respond(200,"");


			_insights.trackPageView('/sometest/page');
			$httpBackend.flush();
 
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
 
		});
	});

	describe("Custom Event Tracking", function(){

		it("Sent data should match contract expectications",function(){

			$httpBackend.expectPOST('https://dc.services.visualstudio.com/v2/track',function(json){
				var data = JSON.parse(json);
				//expect(data.length).to.equal(1);
				expect(data.name).to.equal('Microsoft.ApplicationInsights.Event');

				return true;
			}, function(headers){				
				return headers['Content-Type'] == 'application/json';
			})
			.respond(200,"");

			_insights.trackEvent('Some Test Event');
			$httpBackend.flush();
		});
	});

	describe("Custom Metric Tracking", function(){

		it("Sent data should match contract expectications",function(){

			$httpBackend.expectPOST('https://dc.services.visualstudio.com/v2/track',function(json){
				var data = JSON.parse(json);
				//expect(data.length).to.equal(1);
				expect(data.name).to.equal('Microsoft.ApplicationInsights.Metric');

				return true;
			}, function(headers){				
				return headers['Content-Type'] == 'application/json';
			})
			.respond(200,"");

			_insights.trackMetric('Test Metric', 2345);
			$httpBackend.flush();
 
		});
	});

});