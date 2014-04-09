/**
 * todo: add dependencies to ee-soa-request and ee-rest-headers
 * @type {exports}
 */

var WebService = require('ee-webservice'),
    HTTPTransport = require('./lib/HTTPTransport');

function showPropertiesOf(instance){
    for(var property in instance){
        var buffer = property;
        if(typeof instance[property] === 'function'){
            buffer += '()';
        }
        console.log(buffer);
    }
}
var service = new WebService({port:20000, interface: WebService.IF_ANY }),
    transport = new HTTPTransport(service);

transport.onLoad(function(){
    transport.on('request', function(request, response){
        response.send(200, {});
    });
    service.listen();
});
transport.useTransport();