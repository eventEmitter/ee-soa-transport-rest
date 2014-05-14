"use strict";

var EventEmitter    = require('ee-event-emitter'),
    Class           = require('ee-class'),
    Parser          = require('ee-rest-headers'),
    SOARequest      = require('ee-soa-request'),
    FormDataCollector = require('em-formdata-collector'),
    Templating      = require('ee-templates'),

    factory         = require('./factory'),
    util            = require('./util'),
    visitor         = require('./visitor');

/**
 * Every middleware has to implement the request method.
 * @type HTTPTransport
 */
var HTTPTransport = {

    inherits:           EventEmitter
    , webservice:       null
    , isLoaded:         false
    , requestFactory:   null
    , responseFactory:  null

    /**
     * todo: make it possible to set the service from outside -> IOC
     */
    , init: function initialize (webservice){
        this.webservice         = webservice;
        this.requestFactory     = new factory.HTTPRequestFactory();
        this.responseFactory    = new factory.HTTPResponseFactory();
    }

    , onLoad: function(callback){
        if (this.isLoaded){
            callback();
            return;
        }
        this.once('load', callback);
    }

    /**
     * Let external users add their own webservice middleware
     */
    , use: function(module){
        this.webservice.use(module);
    }

    /**
     * todo: add proper error handling
     * @param callback
     */
    , useTransport: function(){
        // load other middleware
        this._loadMiddlware(function(error){
            if(error){
                this.emit('loading_error', error);
            }
            this.webservice.use(this);
            this.isLoaded = true;
            this.emit('load');
        }.bind(this));
        return this;
    }


    , _loadMiddlware: function(callback){
        // hook in the form data collector
        this.webservice.use(new FormDataCollector());
        this.webservice.use(new Parser.Middleware());
        this.webservice.use(new Templating());

        callback();
    }

    , _createInternalRequest: function(req, callback){
        this.requestFactory.createUnifiedRequest(req, callback);
    }

    , _createInternalResponse: function(request, data, response){

    }

    , _createEmptyResponse: function(){
        return new SOARequest.response.Response();
    }
    /**
     * todo: create error messages for failing rendering
     * @param request
     * @param responseData
     * @param httpResponse
     * @private
     */
    , _createHTTPResponse: function(request, responseData, httpResponse){
        this.responseFactory.createHTTPResponse(request, responseData, httpResponse, function(err, response, status, content){
            response.send(status, content);
        });

        // Hook in the factory here...
        // create a double dispatch on the request
        // --------------------------------------------------------
        // COLLECTIONS
        // --------------------------------------------------------
        // GET:
        // --------------------------------------------------------
        //  - Accept-Ranges
        //  - Content-Range
        //  - Content-Length
        //  - Date
        //  - * Content-Language
        // POST:
        //  - Content-Language
        //  - Content-Length
        //  - Date
        //  - Location
        // --------------------------------------------------------
        // RESOURCES
        // --------------------------------------------------------
        // GET:
        // --------------------------------------------------------
        // - Content-Length
        // - Date
        // - * Content-Language
        // --------------------------------------------------------
        // DELETE:
        // --------------------------------------------------------
        // - Content-Length
        // - Date
        // - * Content-Language
        // --------------------------------------------------------
        // PUT/PATCH:
        // --------------------------------------------------------
        // - Content-Language
        // - Content-Length
        // - Date
        // - Location
        // --------------------------------------------------------
        // OPTIONS:
        // --------------------------------------------------------
        // - Content-Type
        // - Date
        // - Allow
        // - Accept-Ranges
        // - Accept-Select
        // - Accept-Order
        // - Accept-Filter
    }

    /**
     * Emit a request event and pass the transformed internal request/response objects.
     *
     *
     * todo: add proper error handling
     * @param req
     * @param res
     * @param next
     */
    , request: function(req, res, next){

        var response = this._createEmptyResponse();
        this._createInternalRequest(req, function(err, request){
            if(err) {
                res.send(400, err.message);
                return;
            }
            try {
                request.validate();
            } catch (err) {
                res.send(400, err.message);
                return;
            }

            // as soon as someone has ended the response stream
            // or did call the send method, we send it back to the client
            response.on('end', function(data) {
                this._createHTTPResponse(request, data, res);
            }.bind(this));

            this.emit('request', request, response);
        }.bind(this));
    }
};

module.exports = new Class(HTTPTransport);