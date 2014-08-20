"use strict";

var Class       = require('ee-class'),
    Types       = require('ee-types'),
    SOARequest  = require('ee-soa-request'),
    SOAResponse = require('ee-soa-response');

var Response    = SOAResponse;

var HTTPResponseFactory = {

    _status: {}

    , init: function initialize() {
        this._initializeStatus();
    }

    , _initializeStatus: function() {
        var stat = Response.statusCodes;

        this._status[stat.OK]       = 200;
        this._status[stat.CREATED]  = 201;

        this._status[stat.TARGET_MOVED]         = 301;
        this._status[stat.TARGET_FOUND]         = 302;
        this._status[stat.TARGET_NOT_MODIFIED]  = 304;
        this._status[stat.TARGET_NOT_FOUND]     = 404;
        this._status[stat.TARGET_GONE]          = 410;

        this._status[stat.CONFLICT]             = 409;

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

    , _sendHTTPResponse: function(httpResponse, internalResponse, callback) {
        internalResponse.status     = this._prepareStatus(internalResponse.status);
        httpResponse.render(internalResponse, callback);
    }

    , sendHTTPResponse: function(status, language, request, response, data, httpResponse){
        if(status === Response.statusCodes.ACCESS_UNAUTHORIZED){
            httpResponse.setHeader('WWW-Authenticate', 'ee-simple');
        }
        // prevent google from stripping out our custom headers
        httpResponse.setHeader('Cache-Control', 'no-transform');

        var httpStatus = this._prepareStatus(status);
        httpResponse.render(httpStatus, language, response.headers, data, function(err){});
    }

    , _prepareStatus: function(status){
        var stat = this._status[status];
        return stat;
    }
};

module.exports = new Class(HTTPResponseFactory);