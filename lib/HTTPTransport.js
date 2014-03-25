"use strict";

var EventEmitter    = require('ee-event-emitter'),
    Class           = require('ee-class'),
    Parser          = require('ee-rest-headers'),

    factory         = require('./factory'),
    util            = require('./util');


var Request = new Class({

    _segments: null
    , _request: null

    , get segments(){
        if(!this._segments){
            this._segments = util.createSegments(this._request.pathname);
        }
        return this._segments;
    }

    , get languages(){
        return [this._request.language];
    }

    , init: function initialize(request){
        this._request = request;
    }
});

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
        this.webservice = webservice;
    }

    , onLoad: function(callback){
        if (this.isLoaded){
            callback();
            return;
        }
        this.once('load', callback);
    }

    /*
     * Let external users add their own webservice middleware
     * todo: why should this be part of the transport? Set the service from outside!
     */
    , use: function(module){
        this.webservice.use(module);
    }

    /**
     * todo: add proper error handling
     * @param callback
     */
    , useTransport: function(){
        // oad other middleware
        this._loadMiddlware(function(error){
            if(error){
                callback(error);
                return;
            }
            this.webservice.use(this);
            this.isLoaded = true;
            this.emit('load');
        }.bind(this));
        return this;
    }


    , _loadMiddlware: function(callback){
        //this.webservice.use(new TemplaingEngine());
        callback();
    }

    , _createInternalRequest: function(req){
        var path = req.pathname,        // the query path
            method = req.method,        // the method in lowercase
            language = req.language;    // currently only one language

        console.log(Parser.parseFilter(req.getHeader('Filter')));
        var request = new Request(req);
        console.log(req.getHeader('accept-language', true));
        console.log(request.languages);
        return [path, method];
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
     *
     * @param req
     * @param res
     * @param next
     */
    , request: function(req, res, next){
        console.log(this._createInternalRequest(req));

        //this.emit('request', new InternalRequest(), new InternalReponse(), next);
    }
};

module.exports = new Class(HTTPTransport);