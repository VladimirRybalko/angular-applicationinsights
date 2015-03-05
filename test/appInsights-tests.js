describe('Application Insights for Angular JS Provider', function(){
	
	var _appInsightsUrl = 'https://dc.services.visualstudio.com/v2/track';
	var _insights;
	var $httpBackend;
	var $log;
	var $exceptionHandler;
	beforeEach( module('LocalStorageModule','ApplicationInsightsModule', function(applicationInsightsServiceProvider){
    	applicationInsightsServiceProvider.configure('1234567890','angularjs-appinsights-unittests', false);

    }));

	beforeEach(inject(function(applicationInsightsService, $injector) { 
		_insights = applicationInsightsService;
		$httpBackend = $injector.get('$httpBackend');
		$log = $injector.get('$log');
		$log.reset();
		$exceptionHandler = $injector.get('$exceptionHandler');
	}));
 
 	afterEach(function(){

			$httpBackend.verifyNoOutstandingExpectation();
      		$httpBackend.verifyNoOutstandingRequest();
 	});

	describe('Configuration Settings', function(){

		it('Should remember the configured application name', function(){
      		expect(_insights.applicationName).to.equal('angularjs-appinsights-unittests');
    	});

    	it('Should remember that automatic pageview tracking is disabled for tests', function(){
    		expect(_insights.autoPageViewTracking).to.equal(false);
    	});
	});

	describe('Page view Tracking', function(){

		it('Sent data should match expectications',function(){

			$httpBackend.resetExpectations();
			$httpBackend.expect('POST','https://dc.services.visualstudio.com/v2/track',function(json){
				var data = JSON.parse(json);

				//expect(data.length).to.equal(1);
				expect(data.name).to.equal('Microsoft.ApplicationInsights.Pageview');
				expect(data.data.type).to.equal('Microsoft.ApplicationInsights.PageviewData');
				expect(data.data.item.ver).to.equal(1);
				expect(data.data.item.url).to.equal('http://www.somewhere.com/sometest/page');
				expect(data.data.item.properties.testprop).to.equal('testvalue');
				expect(data.data.item.measurements.metric1).to.equal(2345);


				return true;
			}, function(headers){
				expect(headers['Content-Type']).to.equal('application/json');				
				return headers['Content-Type'] == 'application/json';
			})
			.respond(200,'');


			_insights.trackPageView('/sometest/page','http://www.somewhere.com/sometest/page',{testprop:'testvalue'},{metric1:2345});
			$httpBackend.flush();
 
		});
	});

	describe('Log Message Tracking', function(){

		it('Sent data should match expectications',function(){

			$httpBackend.expectPOST('https://dc.services.visualstudio.com/v2/track',function(json){
				var data = JSON.parse(json);
				//expect(data.length).to.equal(1);
				expect(data.name).to.equal('Microsoft.ApplicationInsights.Message');

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
				//expect(data.length).to.equal(1);
				expect(data.name).to.equal('Microsoft.ApplicationInsights.Message');
				expect(data.data.item.message).to.equal('this is a message written via the $log serice');

				return true;
			}, function(headers){				
				return headers['Content-Type'] == 'application/json';
			})
			.respond(200,'');

			$log.debug('this is a message written via the $log serice');
			$httpBackend.flush();
		}); 
	});

	describe('Custom Event Tracking', function(){

		it('Sent data should match expectications',function(){

			$httpBackend.expectPOST('https://dc.services.visualstudio.com/v2/track',function(json){
				var data = JSON.parse(json);
				//expect(data.length).to.equal(1);
				expect(data.name).to.equal('Microsoft.ApplicationInsights.Event');

				return true;
			}, function(headers){				
				return headers['Content-Type'] == 'application/json';
			})
			.respond(200,'');

			_insights.trackEvent('Some Test Event');
			$httpBackend.flush();
		});
	});

	describe('Custom Metric Tracking', function(){

		it('Sent data should match expectications',function(){

			$httpBackend.expectPOST('https://dc.services.visualstudio.com/v2/track',function(json){
				var data = JSON.parse(json);
				//expect(data.length).to.equal(1);
				expect(data.name).to.equal('Microsoft.ApplicationInsights.Metric');
				expect(data.data.item.properties.testProp).to.equal('testValue');
				expect(data.data.item.metrics[0].value).to.equal(2345);
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
				//expect(data.length).to.equal(1);

				expect(data.name).to.equal('Microsoft.ApplicationInsights.Exception');
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