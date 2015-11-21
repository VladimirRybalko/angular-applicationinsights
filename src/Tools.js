var Tools = (function () {
    function Tools(angular) {
        this.isDefined = angular.isDefined,
            this.isUndefined = angular.isUndefined,
            this.isObject = angular.isObject,
            this.isArray = angular.isArray,
            this.isString = angular.isString,
            this.extend = angular.extend,
            this.toJson = angular.toJson,
            this.fromJson = angular.fromJson,
            this.forEach = angular.forEach,
            this.noop = angular.noop;
    }
    Tools.prototype.isNullOrUndefined = function (val) {
        return this.isUndefined(val) || val === null;
    };
    Tools.prototype.isNumber = function (n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };
    Tools.prototype.generateGUID = function () {
        var value = [];
        var digits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
            value[i] = digits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        value[8] = value[13] = value[18] = value[23] = "-";
        value[14] = "4";
        value[19] = digits.substr((value[19] & 0x3) | 0x8, 1);
        return value.join("");
    };
    return Tools;
})();
//# sourceMappingURL=Tools.js.map