/**
 * todo: add dependencies to ee-soa-request and ee-rest-headers
 * @type {exports}
 */
var HTTPTransport   = require('./lib/HTTPTransport');
var websites        = [];
var transport       = new HTTPTransport({port:8080, interface: 5 }, websites);

transport.on('loading_error', function(err){
    console.log(err);
});

transport.on('request', function(request, response) {
    // hook in your service here!
    response.send(response.status.OK, {message: 'Yaaay'});
});

transport.onLoad(function() {
    transport.listen();
});

transport.useTransport();