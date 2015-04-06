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
 * Every middleware has to implement the request method.
 * @type HTTPTransport
 */
var HTTPTransport = module.exports = new Class({

      inherits:           SOATransport

    , webservice:       null
    , isLoaded:         false

    , requestFactory:   null
    , responseFactory:  null

    , websites:         null

    , init: function initialize (webservice, websites){
        initialize.super.call(this, 'rest');

        this.webservice = (webservice instanceof WebService) ? webservice : new WebService(webservice);

        // collection of all domains this middleware is used on
        this.hostnames = [];
        if (process.env.testRunner) this.hostnames.push('*');

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
        if(Types.function(module['isWebsite']) && module.isWebsite()) {
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

    /**
     * Todo: move the callbacks out of the try / catch block
     * @param callback
     * @returns {*}
     * @private
     */
    , _loadMiddlware: function(callback){
        try {
            /**
             * todo: create a loader that loads from all the passed websites
             * todo: add a listener which listens to the templating middleware and passes requests generated there
             */
            var len = this.websites.length,
                environments    = [],
                rewrites        = [];

            if(len == 0) return this._finishLoading([], [], callback);

            var websitesWaiter = EEAsync.waiter(function(err){
                    if(err) return callback(err);
                    this._finishLoading(rewrites, environments, callback);
                }.bind(this))

                , nunjucksWaiter    = EEAsync.waiter(websitesWaiter())
                , middlewaresWaiter = EEAsync.waiter(websitesWaiter())
                , rewritesWaiter    = EEAsync.waiter(websitesWaiter());

            this.websites.forEach(function(current){

                // listen to the request on the websites
                current.on('request', function(request, response){
                    this.emit('request', request, response);
                }.bind(this));

                var nunjuckWaiter = nunjucksWaiter();
                current.getNunjucksEnvironment(function(err, env){

                    if(err){
                        return nunjuckWaiter(err);
                    }
                    var map = new maps.MatchingMap(current.getDomains(), env);
                    environments.push(map);
                    nunjuckWaiter();
                });

                var middlewareWaiter = middlewaresWaiter();
                current.getMiddleware(function(err, middlewares){
                    if(err){
                        return middlewareWaiter(err);
                    }

                    middlewares.forEach(function(middleware){
                        // store all hostnames, so we know to which domains we need attach ourselves
                        middleware.hostnames.forEach(function(hostname) {
                            this.hostnames.push(hostname);
                        }.bind(this));

                        this.webservice.use(middleware.hostnames, middleware.middleware);
                    }.bind(this));

                    middlewareWaiter();
                }.bind(this));

                var rewriteWaiter = rewritesWaiter();
                current.getRewriteRules(function(err, rules){
                    if(err){
                        return rewriteWaiter(err);
                    }
                    rewrites = rewrites.concat(rules);
                    rewriteWaiter();
                });
            }.bind(this));
        } catch(err){
            log(err);
            return callback(err);
        }
    }

    , _finishLoading: function(rewrites, environments, callback) {
        var   map   = {}
            , hosts = [];

        // we should not add middlewares twice per domain ...
        this.hostnames.forEach(function(hostname) {
            if (!map[hostname]) {
                map[hostname] = true;
                hosts.push(hostname);
            }
        }.bind(this));

        this.webservice.use(hosts, new FormDataCollector());

        var loader = new Rewrite.loader.InMemoryLoader(rewrites, 'domain');
        this.webservice.use(hosts, new Rewrite.Middleware(loader));
        this.webservice.use(hosts, new Parser.Middleware());

        var map         = new maps.CompoundMatchingMap(environments);
        var templating  = new Templating(map);

        this.webservice.use(hosts, templating);
        this.webservice.use(hosts, this);

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
     * todo: add proper error handling, there are others than the expected errors that get caught!!
     * todo: implement streaming interface
     */
    , request: function(req, res, next){

        var   startTime     = Date.now()
            , response      = this._createEmptyResponse();

        response.language = req.language;
        this._createInternalRequest(req, function(err, request){
            if(err) {
                log(err);
                if (debug) log.warn('bad request on «%s», took %s ms ...', req.pathname, Date.now()-startTime);
                return res.send(400, err.message);
            }
            try {
                request.validate();
            } catch (err) {
                log(err);
                if (debug) log.warn('bad request on «%s», took %s ms ...', req.pathname, Date.now()-startTime);
                return res.send(400, err.message);
            }
            // as soon as someone has ended the response stream
            // or did call the send method, we send it back to the client
            response.on('end', function(status, content) {
                //this._createHTTPResponse(request, {status:status, content:content}, res);
                if (debug) log.warn('request on «%s» took % ms ...', req.pathname, Date.now()-startTime);
                this.responseFactory.sendHTTPResponse(status, req.language, request, response, content, res);
            }.bind(this));


            this.emit('request', request, response);
        }.bind(this));
    }
});