"use strict";

var EventEmitter = require('ee-event-emitter');

/**
 * Every middleware has to implement the request method.
 * @type HTTPTransport
 */
var HTTPTransport = {

    inherits:       EventEmitter
    , webservice:   null
    , isLoaded:     false

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

    // let external users add their own webservice middleware
    , use: function(module){
        this.webservice.use(module);
    }

    /**
     * todo: add proper error handling
     * @param callback
     */
    , useTransport: function(callback){
        // oad other middleware
        this._loadMiddlware(function(error){
            if(error){

            }
            this.webservice.use(this);
            this.emit('load');
        }.bind(this));
    }


    , _loadMiddlware: function(callback){
        //this.webservice.use(new TemplaingEngine());
        callback();
    }

    , _createInternalRequest: function(req){

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
     * @param req
     * @param res
     * @param next
     */
    , request: function(req, res, next){
        console.log(req);
        console.log(req.pathname);
        //this.emit('request', new InternalRequest(), new InternalReponse(), next);
    }
};

module.exports = new Class(HTTPTransport);