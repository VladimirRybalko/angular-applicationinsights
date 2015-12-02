interface IHttpRequest {
    send(options: HttpRequestOptions, onSuccessCallback: () => void, onErrorCallback: (statusCode: number) => void);
}


class HttpRequest implements IHttpRequest {
   
    send(options: HttpRequestOptions, onSuccessCallback:()=>void, onErrorCallback:(statusCode:number)=>void) {
        var request = new XMLHttpRequest();
       
        request.onerror = function(e) {
            onErrorCallback(0);
        }
        request.onload = function(e) {
            if (request.status == 200) {
                // success!
                onSuccessCallback();
            } else {
                onErrorCallback(request.status);
            }
                
        }
        
        request.open(options.method, options.url, true);
        for (var header in options.headers) {
            request.setRequestHeader(header, options.headers[header]);
        }
        request.send(JSON.stringify(options.data));

    }

}



class HttpRequestOptions {
    method: string;
    url: string;
    headers: any;
    data: any;
}