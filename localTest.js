var //Cornercard  = require('cornercard-frontend'),
    log         = require('ee-log');
/**
 * @type {exports}
 */
var HTTPTransport   = require('./lib/HTTPTransport');
var websites        = [];
var transport       = new HTTPTransport({port:8080, interface: 5 }, []);

transport.on('load', function(err){
    console.log(err);
});

transport.on('request', function(request, response) {
    log(request);
    response.send(response.statusCodes.OK, {message: 'Yaaay'});
});

transport.onLoad(function(err) {
    transport.listen();
});

transport.useTransport();