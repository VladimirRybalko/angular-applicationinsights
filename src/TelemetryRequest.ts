/// <reference path="typings/angularjs/angular.d.ts" />
/// <reference path="./Tools.ts" />
class TelemetryRequest implements angular.IRequestConfig {
    method: string;
    url: string;
    headers: TelemetryRequestHeaders;
    data: string;
    // bugfix for issue# 18: disable credentials on CORS requests.
    withCredentials: boolean;

}


class TelemetryRequestHeaders implements angular.IHttpRequestConfigHeaders {
    [requestType: string]: string | (() => string);

    common: string | (() => string);
    get: string | (() => string);
    post: string | (() => string);
    put: string | (() => string);
    patch: string | (() => string);
}