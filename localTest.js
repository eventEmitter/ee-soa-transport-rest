/**
 * todo: add dependencies to ee-soa-request and ee-rest-headers
 * @type {exports}
 */
var WebService      = require('ee-webservice'),
    HTTPTransport   = require('./lib/HTTPTransport');

function showPropertiesOf(instance){
    for(var property in instance){
        var buffer = property;
        if(typeof instance[property] === 'function'){
            buffer += '()';
        }
        console.log(buffer);
    }
}

var service     = new WebService({port:8080, interface: 5 }),
    transport   = new HTTPTransport(service);

transport.on('loading_error', function(err){
    console.log(err);
});

transport.onLoad(function() {
    transport.on('request', function(request, response) {
        console.log(request);
        response.send(response.status.TARGET_NOT_FOUND, {});
    });
    console.log("halo");
    service.listen(function(){
        console.log("listening");
    });
});

transport.useTransport();