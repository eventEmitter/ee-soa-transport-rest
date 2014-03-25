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

var service = new WebService({host: 'localhost', port:20000, interface: WebService.IF_ANY }),
    transport = new HTTPTransport(service);

    transport.useTransport();

service.listen(function(){
    console.log('what');
});