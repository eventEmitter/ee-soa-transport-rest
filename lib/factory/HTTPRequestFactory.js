var Class       = require('ee-class'),
    SOARequest  = require('ee-soa-request'),
    Parser      = require('ee-rest-headers'),


    visitor     = require('../visitor'),
    util        = require('../util');


var HTTPRequestFactory = module.exports = new Class({

    _getLanguages: function(original){
        var languages = original.getHeader('accept-language', true);
        return languages.map(function(current){
            return current.key;
        });
    }

    , _getFormats: function(original){
        var formats             = original.getHeader('accept', true),
            formatCollection    = SOARequest.request.FormatCollection();

        return formatCollection.pushAll(formats.map(function(current){
            return new SOARequest.request.Format(current.key, current.value);
        }));
    }

    , _getContentType: function(original){
        var contentType = original.getHeader('content-type');
        if(contentType){
            contentType = contentType.split(';').shift().trim().split('/');
            return new SOARequest.request.Format(type[0], type[1]);
        }
        return contentType;
    }

    , _getApiVersion: function(original){
        return original.getHeader('api-version');
    }

    , _getRange: function(original){
        var range = original.getHeader('range');
        if(range){
            var fromTo = range.split('-');
            return fromTo.map(function(current){
                return parseInt(current);
            });
        }
        return [null, null]
    }

    , _setupBaseData: function(base, request, segments, original){
        request.setCollection(base.getName());
        request.setResourceId(base.getValue());

        request.setLanguages(this._getLanguages(original));
        request.setFormats(this._getFormats(original));
        request.setContentType(this._getContentType(original));
        request.setVersion(this._getApiVersion(original));

        var ranges = this._getRange(original);
        request.setRange(ranges[0], ranges[1]);

        return request;
    }


    , createFromGet: function(request, segments, cb)
    {
        // to take the first segment is wrong!
        // todo fix that
        var req     = this._setupBaseData(  segments.first(),
                                            new SOARequest.request.ReadRequest(),
                                            segments,
                                            request);


        var selectHeader = request.getHeader('Select');
        if(selectHeader){
            /**
             * todo: catch parse errors!
             * todo: create a registry for visitors to avoid extensive object instantiation
             * @type {*}
             */
            var node            = Parser.parseSelect(selectHeader),
                selectVisitor   = new visitor.SelectVisitor('event'),
                fields          = node.accept(selectVisitor);

            for (var i = 0; i < fields.length; i++) {
                var field = fields[i];
                if(field.length>2){
                    // now we need a sub request
                }
            }
            req.setFields(fields);
        }

        //todo process remaining segments

        cb(req);
    }

    , createFromPost: function(resources, headers)
    {
        /**
         * todo does the sub request receive the controller name?
         */
        if(method == 'post' || method == 'put' || method == 'patch'){
            req.getForm(function(data){
                req.setContent(data);
            });
        }
        console.log(req);
        return [path, method];
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

    , _dispatch:            function(request, cb)
    {
        var method = request.method.toUpperCase();
        if(method in this._factoryMap){
            var fn = this[this._factoryMap[method]];
            fn.call(this, request, this.getBaseRequestSegments(request), cb);
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
