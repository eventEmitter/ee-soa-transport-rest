"use strict";
/**
 * Class that mocks the HTTP request,
 *
 */

var Class = require('ee-class');

var HTTPMockResponse = {
    send: function(){
    }
};

module.exports = new Class(HTTPMockResponse);