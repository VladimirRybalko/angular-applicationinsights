 class Tools{
	
	private _angular:any;
	isDefined;
	isUndefined:(val:any)=>boolean;
	isObject;
	isArray;
	isString;
	extend;
	toJson;
	fromJson;
	forEach;
	noop;
	constructor(angular:any){
		
	
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
	
  	isNullOrUndefined(val) {
    	return this.isUndefined(val) || val === null; 
	}
	
	isNumber(n:any){ 
		return !isNaN(parseFloat(n)) && isFinite(n);
	}
	
	generateGUID(){
        var value = [];
        var digits = "0123456789abcdef";
        for (var i = 0; i < 36; i++) {
            value[i] = digits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        value[8] = value[13] = value[18] = value[23] = "-";
        value[14] = "4";
        value[19] = digits.substr((value[19] & 0x3) | 0x8, 1);  
        return value.join("");
	}

	
}
