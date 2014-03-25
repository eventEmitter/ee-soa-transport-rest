var Class   = require('ee-class'),
    url     = require('url'),
    util    = require('../util');

var HTTPRequestFactory = module.exports = new Class({
    createFromGet: function(resources, headers, cb)
    {
        /**
         * 1.   if(resources.length > 1)
         *          create sub requests
         * 2.   create a request and nest them
         * 3.   a request is able to validate itself and throw an error
         * 4.   the controller invokes the validation and transforms the unified error into a protocol specific error message
         *      e.g. into a malformed request error for http
         *      request is valid and create an error message
         */
        cb();
    }

    , createFromPost: function(resources, headers)
    {

    }

    , createFromPut: function(resources, headers)
    {

    }

    , createFromDelete: function(resources, headers)
    {

    }

    , createFromPatch: function(resources, headers)
    {

    }

    , createFromOptions: function(resources, headers)
    {

    }

    , createFromHead: function(resources, headers)
    {

    }

    , createUnifiedRequest: function(request, cb)
    {
        this._dispatch(request, cb);
    }

    , getBaseRequestSegments: function(request){
        return util.createSegments(request.pathname);
    }

    , createUnifiedHeaders: function(request, cb)
    {

    }

    , _dispatch:            function(request, cb)
    {
        var method = request.method.toUpperCase();
        if(method in this._factoryMap){
            // @todo: first unify the headers by mapping the headers to internal names
            var headers = {},
                fn = this[this._factoryMap[method]];
            fn.call(this, this.getBaseRequestSegments(request), headers, cb);
            return;
        }
        // @todo: create an error response
        cb(new Error('Invalid request method!'), null);
    }

    , _factoryMap: {
        GET:        'createFromGet'
        , POST:     'createFromPost'
        , PUT:      'createFromPut'
        , DELETE:   'createFromDelete'
        , PATCH:    'createFromPatch'
        , OPTIONS:  'createFromOptions'
        , HEAD:     'createFromHead'
    }
});
