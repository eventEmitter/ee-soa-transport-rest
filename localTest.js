var Cornercard = require('cornercard-frontend');
/**
 * @type {exports}
 */
var HTTPTransport   = require('./lib/HTTPTransport');
var websites        = [];
var transport       = new HTTPTransport({port:8080, interface: 5 }, [new Cornercard()]);

transport.on('loading_error', function(err){
    console.log(err);
});

transport.on('request', function(request, response) {
    response.send(response.statusCodes.OK, {message: 'Yaaay'});
});

transport.onLoad(function(err) {
    transport.listen();
});

transport.useTransport();