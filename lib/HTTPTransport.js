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
    EEAsync             = require('ee-async'),
    Types               = require('ee-types'),
    log                 = require('ee-log'),
    argv                = require('ee-argv'),
    debug               = argv.has('dev-rest'),

    factory         = require('./factory'),
    util            = require('./util'),
    visitor         = require('./visitor'),
    maps            = require('./maps');

/**
 * Transport implementation for HTTP requests.
 */
var HTTPTransport = module.exports = new Class({

      inherits:         SOATransport

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

    /**
     * This method is for testing and allows you to test the full stack by inserting a Request/Response pair as specified
     * in ee-webserver.
     */
    , testRequest: function(request, response){
        this.webservice.handleRequest(request, response);
    }

    /**
     * Wrapper method, not triggered automatically for testing purposes
     * @param callback
     */
    , listen: function(callback){
        this.webservice.listen(callback);
    }

    /**
     * Register the main loading callback.
     * @param callback
     */
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
        if(Types.function(module['isWebsite']) && module.isWebsite()) {
            this.websites.push(module);
        } else {
            this.webservice.use(module);
        }
    }

    /**
     * Triggers the loading of all middlewares, call it to activate the transport.
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
             * todo: add a listener which listens to the templating middleware and passes requests generated there
             */
            var len = this.websites.length,
                environments    = [],
                rewrites        = [];

            if(len == 0){
                return this._finishLoading([], [], callback);
            }

            var websitesWaiter = EEAsync.waiter(function(err){
                    if(err){
                        return callback(err);
                    }
                    this._finishLoading(rewrites, environments, callback);
                }.bind(this))

                , nunjucksWaiter    = EEAsync.waiter(websitesWaiter())
                , middlewaresWaiter = EEAsync.waiter(websitesWaiter())
                , rewritesWaiter    = EEAsync.waiter(websitesWaiter());

            this.websites.forEach(function(current){

                current.on('request', function(request, response){
                    this.emit('request', request, response);
                }.bind(this));

                var nunjuckWaiter = nunjucksWaiter();
                current.getNunjucksEnvironment(function(err, env){

                    if(err) return nunjuckWaiter(err);

                    var map = new maps.MatchingMap(current.getDomains(), env);
                    environments.push(map);
                    nunjuckWaiter();
                });

                var middlewareWaiter = middlewaresWaiter();
                current.getMiddleware(function(err, middlewares){

                    if(err) return middlewareWaiter(err);

                    middlewares.forEach(function(middleware){
                        this.webservice.use(middleware.hostnames, middleware.middleware);
                    }.bind(this));

                    middlewareWaiter();
                }.bind(this));

                var rewriteWaiter = rewritesWaiter();
                current.getRewriteRules(function(err, rules){

                    if(err) return rewriteWaiter(err);

                    rewrites = rewrites.concat(rules);
                    rewriteWaiter();
                });
            }.bind(this));

            callback();
        } catch(err){
            callback(err);
        }
    }

    , _finishLoading: function(rewrites, environments, callback){
        this.webservice.use('*', new FormDataCollector());

        var loader = new Rewrite.loader.InMemoryLoader(rewrites, 'domain');
        this.webservice.use('*', new Rewrite.Middleware(loader));
        this.webservice.use('*', new Parser.Middleware());

        var map         = new maps.CompoundMatchingMap(environments);
        var templating  = new Templating(map);

        this.webservice.use('*', templating);
        this.webservice.use('*', this);

        this.isLoaded = true;
        this.emit('load');
        callback();
    }

    , _createInternalRequest: function(req, callback){
        this.requestFactory.createUnifiedRequest(req, callback);
    }

    , _createEmptyResponse: function(){
        return new SOAResponse();
    }
    /**
     * todo: add a dev flag to determine which message to send
     * @private
     */
    , sendErrorResponse: function(req, res, err, start){
        if (debug) log.warn('bad request on «%s», took %s ms ...', req.pathname, Date.now()-start);
        res.send(400, err.message);
    }
    /**
     * Emit a request event and pass the transformed internal request/response objects.
     *
     * todo: implement streaming interface
     */
    , request: function(req, res, next){
        var   startTime     = Date.now()
            , response      = this._createEmptyResponse();

        response.language = req.language;

        this._createInternalRequest(req, function(err, request){
            if(err) return this.sendErrorResponse(req, res, err, startTime);

            try {
                // validate the request
                request.validate();
                // bind the listener for the response
                response.on('end', function(status, content) {
                    if (debug) log.info('request on «%s» took %s ms ...', req.pathname, Date.now()-startTime);
                    this.responseFactory.sendHTTPResponse(status, req.language, request, response, content, res);
                }.bind(this));

                this.emit('request', request, response);
            } catch (err) {
                this.sendErrorResponse(req, res, err, startTime);
            }
        }.bind(this));
    }
});