"use strict";

var EventEmitter        = require('ee-event-emitter'),
    Class               = require('ee-class'),
    Parser              = require('ee-rest-headers'),
    SOARequest          = require('ee-soa-request'),
    SOAResponse         = require('ee-soa-response'),
    FormDataCollector   = require('em-formdata-collector'),
    Templating          = require('ee-templates'),
    Rewrite             = require('ee-soa-transport-rewrite'),
    WebService          = require('ee-webservice'),
    SOATransport        = require('ee-soa-transport'),

    factory         = require('./factory'),
    util            = require('./util'),
    visitor         = require('./visitor'),
    maps            = require('./maps');

/**
 * Every middleware has to implement the request method.
 * todo: bind the middlewares to the correct urls
 * @type HTTPTransport
 */
var HTTPTransport = {

    inherits:           SOATransport

    , webservice:       null
    , isLoaded:         false

    , requestFactory:   null
    , responseFactory:  null

    , websites:         null

    , init: function initialize (webservice, websites){
        initialize.super.call(this, 'rest');

        this.webservice = (webservice instanceof WebService) ? webservice : new WebService(webservice);

        this.requestFactory     = new factory.HTTPRequestFactory();
        this.responseFactory    = new factory.HTTPResponseFactory();
        this.websites           = websites || [];
    }

    , listen: function(callback){
        this.webservice.listen(callback);
    }

    , onLoad: function(callback) {

        if (this.isLoaded) {
            return callback();
        }
        this.once('load', callback);
    }

    /**
     * Let external users add their own webservice middleware
     */
    , use: function(module) {
        if('isWebsite' in module && module.isWebsite()){
            this.websites.push(module);
        } else {
            this.webservice.use(module);
        }
    }

    /**
     * todo: add proper error handling
     * @param callback
     */
    , useTransport: function(){
        // load other middleware
        this._loadMiddlware(function(error){
            if(error){
                return this.emit('load', error);
            }
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
            var len = this.websites.length,
                counter = 0,
                environments = [],
                rewrites = [];

            if(len == 0){
                return this._finishLoading([], [], callback);
            }

            for(var i=0; i<len; i++){
                var current = this.websites[i];

                current.on('load', function(err){
                    if(err){
                       return callback(err, null);
                    }

                    current.getNunjucksEnvironment(function(err, env){
                        if(err){
                            return callback(err, null);
                        }
                        var map = new maps.MatchingMap(current.getDomains(), env);
                        environments.push(map);
                        current.getMiddleware(function(err, middleware){
                            if(err){
                                return callback(err, null);
                            }
                            var len = middleware.length;
                            for (var j = 0; j < len; j++) {
                                var ware = middleware[j];
                                this.webservice.use(ware.middleware);
                            }
                            current.getRewriteRules(function(err, rules){
                                if(err){
                                    return callback(err, null);
                                }
                                rewrites = rewrites.concat(rules);
                            });
                        }.bind(this));
                        if(++counter == len){
                            this._finishLoading(rewrites, environments, callback);
                        }
                    }.bind(this));
                }.bind(this));
            }

            callback();
        } catch(err){
            callback(err);
        }
    }

    , _finishLoading: function(rewrites, environments, callback){
        this.webservice.use(new FormDataCollector());

        var loader = new Rewrite.loader.InMemoryLoader(rewrites, 'domain');
        this.webservice.use(new Rewrite.Middleware(loader));
        this.webservice.use(new Parser.Middleware());

        var templating = new Templating(new maps.CompoundMatchingMap(environments));
        this.webservice.use(templating);
        this.webservice.use(this);

        this.isLoaded = true;
        this.emit('load');
        callback();
    }

    , _createInternalRequest: function(req, callback){
        this.requestFactory.createUnifiedRequest(req, callback);
    }

    , _createInternalResponse: function(request, data, response){

    }

    , _createEmptyResponse: function(){
        return new SOAResponse();
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
            response.on('end', function(status, content) {
                this._createHTTPResponse(request, {status:status, content:content}, res);
            }.bind(this));

            this.emit('request', request, response);
        }.bind(this));
    }
};

module.exports = new Class(HTTPTransport);