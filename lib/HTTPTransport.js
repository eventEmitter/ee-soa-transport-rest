(function() {
    'use strict';


    let EventEmitter        = require('ee-event-emitter');
    let Class               = require('ee-class');
    let Parser              = require('ee-rest-headers');
    let SOARequest          = require('ee-soa-request');
    let SOAResponse         = require('ee-soa-response');
    let FormDataCollector   = require('em-formdata-collector');
    let Templating          = require('ee-templates');
    let Rewrite             = require('ee-soa-transport-rewrite');
    let WebService          = require('ee-webservice');
    let SOATransport        = require('ee-soa-transport');
    let Types               = require('ee-types');
    let log                 = require('ee-log');
    let argv                = require('ee-argv');
    let debug               = argv.has('dev-rest');

    let factory             = require('./factory');
    let util                = require('./util');
    let visitor             = require('./visitor');
    let maps                = require('./maps');




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




        , _loadMiddlware: function(callback) {
            if (this.websites.length) {
                let environments = [];
                let rewrites = [];
                let promises = [];


                this.websites.forEach((website) => {

                    // process requests emitted by websited
                    website.on('request', (request, response) => {

                        // add the accestoken if present
                        if (website.token) request.accessTokens.push(website.token);

                        // propagate
                        this.emit('request', request, response);
                    });



                    // load the nunjucks envs
                    promises.push(new Promise((resolve, reject) => {
                        website.getNunjucksEnvironment((err, env) => {
                            if (err) reject(err);
                            else {
                                environments.push(new maps.MatchingMap(website.getDomains(), env));
                                resolve();
                            }
                        });
                    }));



                    // load the middlewares
                    promises.push(new Promise((resolve, reject) => {
                        website.getMiddleware((err, middlewares) => {
                            if (err) reject(err);
                            else {
                                middlewares.forEach((middleware) => {
                                    middleware.hostnames.forEach((hostname) => this.hostnames.push(hostname));
                                    this.webservice.use(middleware.hostnames, middleware.middleware);
                                });
                                resolve();
                            }
                        });
                    }));



                    // load the rewrite rules
                    promises.push(new Promise((resolve, reject) => {
                        website.getRewriteRules((err, rules) => {
                            if (err) reject(err);
                            else {
                                rewrites = rewrites.concat(rules);
                                resolve();
                            }
                        });
                    }));
                });


                Promise.all(promises).then(() => {
                    this._finishLoading(rewrites, environments, callback);
                }).catch(callback);
            }
            else this._finishLoading([], [], callback);
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
            this.webservice.use(hosts, function(request, response, next){
                response.setHeader('cache-control', 'no-transform');
                next();
            });
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
         * todo: add proper error handling
         * todo: implement streaming interface
         */
        , request: function(req, res, next){
            var   startTime     = Date.now()
                , response      = this._createEmptyResponse();

            response.language = req.language;

            this._createInternalRequest(req, function(err, request){
                if(err) {
                    if (debug) log.warn('bad request on «%s», took %s ms ...', req.pathname, Date.now()-startTime);
                    return res.send(400, err.message);
                }
                try {
                    request.validate();
                } catch (err) {
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
}) ();
