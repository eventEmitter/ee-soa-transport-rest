"use strict";

var EventEmitter        = require('ee-event-emitter'),
    Class               = require('ee-class'),
    Parser              = require('ee-rest-headers'),
    SOARequest          = require('ee-soa-request'),
    FormDataCollector   = require('em-formdata-collector'),
    Templating          = require('ee-templates'),
    Rewrite             = require('ee-soa-transport-rewrite'),
    WebService          = require('ee-webservice'),

    factory         = require('./factory'),
    util            = require('./util'),
    visitor         = require('./visitor');

var loader = new Rewrite.loader.InMemoryLoader(
    [
        {domain: 'test1.com',   name: 'ensure',   field: 'range', value: '1-10'},
        {domain: 'test1.com',   name: 'append',   field: 'filter', value: ', deleted=null' },
        //{domain: 'test1.com',   name: 'override', field: 'select', value: '*' },
        {domain: 'test2.com',   name: 'alias',    field: '', value: 'rewritten.com' },
        {domain: 'rewritten.com', name: 'ensure', field: 'range', value: '1-20'},
        {domain: 'rewritten.com', name: 'append', field: 'filter', value: 'deleted!=null'},
        {domain: 'rewritten.com', name: 'extend', field: '', value: 'rewrite.test.local'},
        {domain: 'test2.com',   name: 'append', field: 'filter', value: ', nonsense' },
        {domain: 'rewrite.test.local', name: 'template',   field: 'range', value: 'index.html'},
        //{domain: 'rewrite.test.local', name: 'override', field: 'select', value: '*' },
        {domain: 'rewrite.test.local', name: 'ensure',   field: 'api-version', value: '1'}
    ]
    , 'domain');
/**
 * Every middleware has to implement the request method.
 * todo loader will not be necessary anymore, since rewrite rules will be saved in the websites
 * @type HTTPTransport
 */
var HTTPTransport = {

    inherits:           EventEmitter

    , webservice:       null
    , isLoaded:         false

    , requestFactory:   null
    , responseFactory:  null

    , websites:         null

    , init: function initialize (webservice, websites){
        this.webservice         = webservice;
        if('port' in webservice && 'interface' in webservice) {
            this.webservice = new WebService(webservice);
        }
        this.requestFactory     = new factory.HTTPRequestFactory();
        this.responseFactory    = new factory.HTTPResponseFactory();
        this.websites           = websites;
    }

    , listen: function(callback){
        this.webservice.listen(callback);
    }

    , onLoad: function(callback){
        if (this.isLoaded){
            return callback();
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
        try {

            /**
             * todo: create a loader that loads from all the passed websites
             * todo: pass the websites to the templating middleware
             * todo: add a listener which listens to the templating middleware and passes requests generated there
             */

            this.webservice.use(new FormDataCollector());
            this.webservice.use(new Rewrite.Middleware(loader));
            this.webservice.use(new Parser.Middleware());

            var templating = new Templating();
            this.webservice.use(templating);

            callback();
        } catch(err){
            callback(err);
        }
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
    }

    /**
     * Emit a request event and pass the transformed internal request/response objects.
     *
     * todo: add proper error handling
     * todo: implement streaming interface
     */
    , request: function(req, res, next){
        var response = this._createEmptyResponse();
        this._createInternalRequest(req, function(err, request){
            if(err) {
                return res.send(400, err.message);
            }

            try {
                request.validate();
            } catch (err) {
                return res.send(400, err.message);
            }

            // as soon as someone has ended the response stream
            // or did call the send method, we send it back to the client
            response.on('end', function(data) {
                this._createHTTPResponse(request, data, res);
            }.bind(this));
            /** todo: create a send event */
            response.on('send', function(data) {
                this._createHTTPResponse(request, data, res);
            }.bind(this));

            this.emit('request', request, response);
        }.bind(this));
    }
};

module.exports = new Class(HTTPTransport);