"use strict";

var Class = require('ee-class'),
    Types = require('ee-types'),
    SOARequest = require('ee-soa-request');

var Response = SOARequest.response.Response;

var HTTPResponseFactory = {

    _status: {}

    , init: function initialize() {
        this._initializeStatus();
    }

    , _initializeStatus: function() {
        var stat = new Response().status;

        this._status[stat.OK]       = 200;
        this._status[stat.CREATED]  = 201;

        this._status[stat.TARGET_MOVED]         = 301;
        this._status[stat.TARGET_FOUND]         = 302;
        this._status[stat.TARGET_NOT_MODIFIED]  = 304;
        this._status[stat.TARGET_NOT_FOUND]     = 404;
        this._status[stat.TARGET_GONE]          = 410;

        this._status[stat.ACCESS_MALFORMED]     = 400;
        this._status[stat.ACCESS_UNAUTHORIZED]  = 401;
        this._status[stat.ACCESS_FORBIDDEN]     = 403;
        this._status[stat.ACCESS_LIMIT_EXCEEDED]    = 429;

        this._status[stat.FORMAT_UNAVAILABLE]   = 406;
        this._status[stat.BODY_TOO_LARGE]       = 413;

        this._status[stat.INVALID_ACTION]       = 405;
        this._status[stat.INVALID_RANGE]        = 416;
        this._status[stat.INVALID_SELECTION]    = 460;
        this._status[stat.INVALID_FILTER]       = 461;
        this._status[stat.INVALID_ORDER]        = 462;
        this._status[stat.INVALID_API_VERSION]  = 463;

        this._status[stat.SERVICE_EXCEPTION]    = 500;
        this._status[stat.SERVICE_UNAVAILABLE]  = 503;
    }

    , createHTTPResponse: function(request, data, httpResponse, callback) {
        request.handle(this._createHandler(data, httpResponse, callback));
    }

    , _prepareContent: function(content) {
        return JSON.stringify(content);
    }

    , _prepareStatus: function(status){
        var stat = this._status[status];
        return stat;
    }

    , _createHandler: function(data, httpResponse, callback){
        var factory     = this
            , content   = this._prepareContent(data.content)
            , status    = this._prepareStatus(data.status);

        return {
            factory:    factory
            , content:  content
            , response: httpResponse
            , callback: callback

            , handleReadRequest: function(request) {
                this.callback.apply(null, [null, httpResponse, status, content]);
            }

            , handleCreateRequest: function(request) {
                this.callback.apply(null, [null, httpResponse, status, content]);
            }

            , handleWriteRequest: function(request) {
                this.callback.apply(null, [null, httpResponse, status, content]);
            }

            , handleUpdateRequest: function(request) {
                this.callback.apply(null, [null, httpResponse, status, content]);
            }

            , handleInfoRequest: function(request) {
                this.callback.apply(null, [null, httpResponse, status, content]);
            }

            , handleDeleteRequest: function(request) {
                this.callback.apply(null, [null, httpResponse, status, content]);
            }
        };
    }
};

module.exports = new Class(HTTPResponseFactory);