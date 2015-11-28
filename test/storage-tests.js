describe('Application Insights for Angular JS Storage Tests', function () {

    var storage;
    var tools;

    beforeEach(inject(function ($window, $document, $rootScope, $parse) {


        tools = new Tools(angular);
        storage = new AppInsightsStorage({
            window: $window,
            rootScope: $rootScope,
            document: $document,
            parse: $parse
        }, tools);

    }));

    it('Can determine if localStorage is supported', function () {
        expect(storage.isSupported()).toEqual(true);
    });

    it('Can determine if cookies are supported', function () {
        expect(storage.isCookiesSupported()).toEqual(true);
    });

    it('Should say that the storage type is localStorage', function () {
        expect(storage.getStorageType()).toEqual('localStorage');
    });

    it('Should write a value to localStorage without error, and read it back out', function () {
        var value = "mary had a little lamb";
        expect(storage.set('testkey', value)).toEqual(true);
        var actualValue = storage.get('testkey');
        console.log(actualValue);
        expect(actualValue).toEqual(value);
    });


    it('Should write a value to cookies without error, and read it back out', function () {
        var value = "his fleece was white as snow";
        storage.setCookie('testkey', value);
        var actualValue = storage.getCookie('testkey');

        expect(actualValue).toEqual(value);
    });
});