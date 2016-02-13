"use strict";
/**
 * Class that mocks the HTTP request,
 *
 */

var HTTPMockRequest = function(){

    this.headers =  {};
    this.payload =  null;
    this.method =  'GET';
    this.pathname =  '';


    this.getPathname =  function(){
        return this.pathname;
    };

    this.setPathname =  function(pathname){
        this.pathname = pathname;
        return this;
    };

    this.getMethod =  function(){
        return this.method;
    };

    this.setMethod =  function(method){
        this.method = method;
        return this;
    };

    this.getHeader =  function(key, parseheader){
        key = key.toLowerCase();
        parseheader = parseheader === true;
        return (key in this.headers) ? this.headers[key]  :  null;
    };

    this.hasHeader =  function(key, parseheader){
        return (key in this.headers);
    };

    this.setHeader =  function(key, header){
        if (key.toLowerCase() === 'accept-language') this.languages = header.map(function(h) {return h.key;})
        this.headers[key.toLowerCase()] = header;
        return this;
    };

    this.setFormdata =  function(data){
        this.payload = data;
        return this;
    };

    this.getForm =  function(callback){
        callback(null, this.payload);
    };
};

module.exports = HTTPMockRequest;