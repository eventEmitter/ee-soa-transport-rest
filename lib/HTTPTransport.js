"use strict";

var EventEmitter    = require('ee-event-emitter'),
    Class           = require('ee-class'),
    Parser          = require('ee-rest-headers'),
    SOARequest      = require('ee-soa-request'),
    FormDataCollector = require('em-formdata-collector'),

    factory         = require('./factory'),
    util            = require('./util'),
    visitor         = require('./visitor');

/**
 * Every middleware has to implement the request method.
 * @type HTTPTransport
 */
var HTTPTransport = {

    inherits:       EventEmitter
    , webservice:   null
    , isLoaded:     false
    , factory:      null

    /**
     * todo: make it possible to set the service from outside -> IOC
     */
    , init: function initialize (webservice){
        // currently not necessary, but probably in the future
        if('parent' in initialize){
            initialize.parent();
        }

        this.webservice = webservice || new WebService();
        this.factory = new factory.HTTPRequestFactory();
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
        callback();
    }

    , _createInternalRequest: function(req, callback){
        return this.factory.createUnifiedRequest(req, function(internal){
            callback(internal);
        });
    }

    , _createInternalResponse: function(res){

    }
    /* implement this only as stub since we're currently
     * not supporting outgoing http requests
    , request: function(){

    }*/


    /**
     * Emit a request event and pass the transformed internal request/response objects.
     *
     *
     * todo: add response
     * @param req
     * @param res
     * @param next
     */
    , request: function(req, res, next){
        this._createInternalRequest(req, function(request){
            console.log(request);
            this.emit('request', request);
        }.bind(this));
    }
};

module.exports = new Class(HTTPTransport);