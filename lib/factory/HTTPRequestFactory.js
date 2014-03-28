var Class       = require('ee-class'),
    SOARequest  = require('ee-soa-request'),
    Parser      = require('ee-rest-headers'),


    visitor     = require('../visitor'),
    util        = require('../util');


var HTTPRequestFactory = module.exports = new Class({

    _getLanguages: function(original) {
        var languages = original.getHeader('accept-language', true);
        return languages.map(function(current){
            return current.key;
        });
    }

    , _getFormats: function(original) {
        var formats             = original.getHeader('accept', true),
            formatCollection    = SOARequest.request.FormatCollection();

        return formatCollection.pushAll(formats.map(function(current){
            return new SOARequest.request.Format(current.key, current.value);
        }));
    }

    /**
     * Extracts the content type from the http request.
     *
     * Strips out additional header parameters ( after ;), removes whitespaces
     * and splits the content-type into type/subtype
     *
     * @param original http request
     * @returns ee-soa-request.request.Format
     * @private
     */
    , _getContentType: function(original) {
        var contentType = original.getHeader('content-type');
        if(contentType){
            contentType = contentType.split(';').shift().trim().split('/');
            return new SOARequest.request.Format(type[0], type[1]);
        }
        return contentType;
    }

    , _getApiVersion: function(original) {
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

    , _setupBaseData: function(base, request, original) {

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

    , _getFormData: function(request, original, cb){

        if(method == 'post' || method == 'put' || method == 'patch'){
            original.getForm(function(data){
                request.setContent(data);
                cb(request);
            });
        }
    }
    , _reduceSelections: function(fields){
        if(!fields){
            return [];
        }

        fields.sort(function(a, b){
            return a.length - b.length;
        });

        var result = {
            },
        // since the fields are ordered now, and there are fields with length 1, they must be at the beginning
            hasDirectSelections = fields[0].length == 1;

        for (var i = 0; i < fields.length; i++) {
            var field = fields[i],
                len = field.length,
                name = field[0];


        }

        return result;
    }
    , _setupSelects: function(base, request, original){
        var selectHeader = original.getHeader('Select');
        if(selectHeader){
            /**
             * todo: catch parse errors ... but where...!
             * todo: create a registry for visitors to avoid extensive object instantiation
             */
            var node            = Parser.parseSelect(selectHeader),
                selectVisitor   = new visitor.SelectVisitor(base.getName()),
                selections      = node.accept(selectVisitor),
                fields          = [],
                hasDirectSelections = false;

            // order the selections by their size
            // this allows us to detect if we need subselects in one pass
            fields = this._reduceSelections(selections);
            request.setFields(fields);
        }
    }
    , createFromGet: function(original, segments, cb) {

        // event/5/venue
        // event
        // event/5
        var request  = new SOARequest.request.ReadRequest(),
            base = segments.last();

        if(base.queriesCollection() && segments.length > 1){ // ...event/5/venue
            // attach a filter that loads venues belonging to event 5
        }

        this._setupBaseData(base, request, original);
        this._setupSelects(base, request, original);

        // process filters
        // process ordering
        cb(request);
    }

    , createFromPost:  function(request, segments, cb) {

        var req,
            base = segments.last(); // a post goes always to a collection or to a mapping!

        if(base.queriesResource() && segments.length > 1){ // event/5/venue/6
            // create a relationship
            // check if the segment before also queries a resource
        }

        cb(req)
    }

    , createFromPut: function(request, segments, cb) {
        var req,
            base = segments.last(); // a post goes always to a collection or to a mapping!

        if(base.queriesResource() && segments.length > 1){ // event/5/venue/6
            // create a relationship
            // check if the segment before also queries a resource
        }

        cb(req)
    }

    , createFromPatch: function(request, segments, cb) {
        var req,
            base = segments.last(); // a post goes always to a collection or to a mapping!

        if(base.queriesResource() && segments.length > 1){ // event/5/venue/6
            // create a relationship
            // check if the segment before also queries a resource
        }

        cb(req)
    }

    , createFromDelete:  function(request, segments, cb) {
        var req,
            base = segments.last()

        cb(req)
    }

    , createFromOptions: function(request, segments, cb) {
        var req,
            base = segments.last()

        cb(req)
    }

    , createFromHead: function(request, segments, cb) {
        var req,
            base = segments.last()

        cb(req)
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