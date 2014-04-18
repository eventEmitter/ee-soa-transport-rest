"use strict";
/**
 * Class that mocks the HTTP request,
 *
 */

var Class = require('ee-class');

var HTTPMockRequest = {

    headers: {}
    , payload: null
    , method: 'GET'
    , pathname: ''


    , getPathname: function(){
        return this.pathname;
    }

    , setPathname: function(pathname){
        this.pathname = pathname;
        return this;
    }

    , getMethod: function(){
        return this.method;
    }

    , setMethod: function(method){
        this.method = method;
        return this;
    }

    , getHeader: function(key, parseheader){
        key = key.toLowerCase();
        parseheader = parseheader === true;
        return this.headers[key];
    }

    , setHeader: function(key, header){
        this.headers[key.toLowerCase()] = header;
        return this;
    }

    , setFormdata: function(data){
        this.payload = data;
        return this;
    }

    , getForm: function(callback){
        callback(null, this.payload);
    }





};

module.exports = new Class(HTTPMockRequest);