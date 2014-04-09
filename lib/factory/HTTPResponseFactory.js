"use strict";

var Class = require('ee-class'),
    Types = require('ee-types');

var HTTPResponseFactory = {
    init: function initialize() {
        //initialize.parent();
    }
    , createHTTPResponse: function(request, data, httpResponse, callback) {
        request.handle(this._createHandler(data, httpResponse, callback));
    }

    , _prepareContent: function(content){

    }

    , _createHandler: function(data, httpResponse, callback){
        var factory = this;
        return {
            factory: factory
            , content: data
            , response: httpResponse
            , callback: callback

            , handleReadRequest: function(request) {
                this.callback.apply(null, [null, httpResponse, data.status, data.content]);
            }

            , handleCreateRequest: function(request) {

            }

            , handleWriteRequest: function(request) {

            }

            , handleUpdateRequest: function(request) {

            }

            , handleInfoRequest: function(request) {

            }

            , handleDeleteRequest: function(request) {

            }
        };
    }
};

module.exports = new Class(HTTPResponseFactory);