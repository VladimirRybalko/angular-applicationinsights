/// <reference path="typings/angularjs/angular.d.ts" />


class Tools {

    private _angular: angular.IAngularStatic;
    static isDefined: (val: any) => boolean;
    static isUndefined: (val: any) => boolean;
    static isObject: (val: any) => boolean;
    static isArray: (val: any) => boolean;
    static isString: (val: any) => boolean;
    static extend: (destination: any, ...sources: any[]) => any;
    static toJson: (obj: any, pretty?: boolean) => string;
    static fromJson: (obj: string) => any;
    static forEach;
    static noop: (...args: any[]) => void;

    constructor(angular: angular.IAngularStatic) {


        Tools.isDefined = angular.isDefined,
            Tools.isUndefined = angular.isUndefined,
            Tools.isObject = angular.isObject,
            Tools.isArray = angular.isArray,
            Tools.isString = angular.isString,
            Tools.extend = angular.extend,
            Tools.toJson = angular.toJson,
            Tools.fromJson = angular.fromJson,
            Tools.forEach = angular.forEach,
            Tools.noop = angular.noop; // jshint ignore:line
    }

    static isNullOrUndefined(val) {
        return Tools.isUndefined(val) || val === null;
    }

    static isNumber(n: any) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    static generateGuid() {
        const value = [];
        const digits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
            value[i] = digits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        value[8] = value[13] = value[18] = value[23] = "-";
        value[14] = "4";
        value[19] = digits.substr((value[19] & 0x3) | 0x8, 1);
        return value.join("");
    }


}