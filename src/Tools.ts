/// <reference path="typings/angularjs/angular.d.ts" />


class Tools {

    private _angular: angular.IAngularStatic;
    static isDefined: (val: any) => boolean;
    static isUndefined: (val: any) => boolean;
    static isObject: (val: any) => boolean;
    static isArray: (val: any) => boolean;
    static isString: (val: any) => boolean;
    static extend: (destination: any, ...sources: any[]) => any;
    static copy: (source: any, destination: any) => any;
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
            Tools.copy = angular.copy,
            Tools.noop = angular.noop; // jshint ignore:line
    }

    static isNullOrUndefined(val) {
        return Tools.isUndefined(val) || val === null;
    }

    static isNumber(n: any) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    static generateGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.
            replace(/[xy]/g, c => {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
    }
}