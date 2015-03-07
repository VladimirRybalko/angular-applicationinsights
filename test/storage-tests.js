	describe('Application Insights for Angular JS Storage Tests', function(){

		var storage;


		beforeEach(inject(function($window,$document,$rootScope,$parse){

		 storage = window.root.storage({
											window: $window,
											rootScope: $rootScope,
											document: $document,
											parse: $parse
											});
	
		}));

		it('Can determine if localStorage is supported', function(){
			expect(storage.isSupported).toEqual(true);
		});

		it('Can determine if cookies are supported', function(){
			expect(storage.cookie.isSupported).toEqual(true);
		});

		it('Should say that the storage type is localStorage', function(){
			expect(storage.getStorageType()).toEqual('localStorage');
		});

		it('Should write a value to localStorage without error, and read it back out', function(){
			var value = "mary had a little lamb";
			storage.set('testkey', value);
			var actualValue =  storage.get('testkey');

			expect(actualValue).toEqual(value);
		});


		it('Should write a value to cookies without error, and read it back out', function(){
			var value = "his fleece was white as snow";
			storage.cookie.set('testkey', value);
			var actualValue =  storage.cookie.get('testkey');

			expect(actualValue).toEqual(value);
		});
});