var Class       = require('ee-class'),
    SOARequest  = require('ee-soa-request'),
    Parser      = require('ee-rest-headers'),
    utils       = require('util'),


    visitor     = require('../visitor'),
    util        = require('../util');

/**
 * todo: create proper error handling
 */
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
     * and splits the content-type into type/subtype.
     *
     * @param original http request
     * @returns ee-soa-request.request.Format
     * @private
     */
    , _getContentType: function(original) {
        var contentType = original.getHeader('content-type');
        if(contentType){
            // Content-Type: type/subtype; param=p1, param=p2
            var type = contentType.split(';').shift().trim().split('/');
            return new SOARequest.request.Format(type[0], type[1]);
        }
        return contentType;
    }

    , _getContentLanguage: function(original) {
        return original.getHeader('content-language');
    }

    /**
     * Returns the api-version header of the original request.
     * @param original
     * @returns String
     * @private
     */
    , _getApiVersion: function(original) {
        return original.getHeader('api-version');
    }

    /**
     * Returns the specified range parameter [from, to] from the original request.
     *
     * @param original
     * @returns Array
     * @private
     */
    , _getRange: function(original){
        var range = original.getHeader('range');
        if(range){
            var fromTo = range.split('-');
            return fromTo.map(function(current){
                return parseInt(current);
            });
        }
        return [null, null];
    }

    /**
     * Sets up base data of a request (if present).
     *
     * Base request data are:
     *  - the queried collection
     *  - the resource id
     *  - the languages
     *  - the formats (accept header)
     *  - the content type
     *  - the api version
     *  - the range
     *
     * @param base {Segment}
     * @param request {ee-soa-request.request.Request}
     * @param original {ee-webservice.Request}
     * @returns {ee-soa-request.request.Request}
     * @private
     */
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
    /**
     * Extracts formdata, requires the middleware to process the form data.
     *
     * @param request
     * @param original
     * @param cb
     * @private
     */
    , _getFormData: function(request, original, cb){
        if('getForm' in original){
            original.getForm(function(data){
                request.setContent(data);
                cb(null, request);
            });
        } else {
            cb(null, request);
        }
    }

    /**
     * Reduces the select headers to a processable format.
     *
     * The format of the response is as follows, where the subselects are of the same format.
     * {
     *  fields: [],
     *  subselects:  {
     *      'entity': response
     *  }
     * }
     *
     * @param fields
     * @returns {fields: [], subselects: {}}
     * @private
     */
    , _reduceSelections: function(fields){
        if(!fields){
            return [];
        }

        // sort the accesses by length e.g. (address.*).length = 2
        fields.sort(function(a, b){
            return a.length - b.length;
        });

        // root contains the fields that directly access the entity
        // we use an object and its keys to avoid duplicates
        var root = {}
            , result = {
                fields: null,
                subselects: null
            }
            // since we ordered the selections before, fields of length = 1 must be at the beginning
            , hasDirectSelections = fields[0].length == 1
            , rootFields;

        for (var i = 0; i < fields.length; i++) {
            var field = fields[i],
                len = field.length,
                name = field[0];

            if(len==1) {
                root[name] = true;
            } else {
                if(hasDirectSelections){
                    root[name] = true;
                }

                result.subselects = result.subselects || {};

                if(!result.subselects[name]){
                    result.subselects[name] = [];
                }

                result.subselects[name].push(field.slice(-(len-1)));
            }
        }

        for (var name in result.subselects) {
            result.subselects[name] = this._reduceSelections(result.subselects[name]);
        }

        // write back the directly accessed fields or set a wildcard
        rootFields = Object.keys(root);
        result.fields = rootFields.length > 0 ? rootFields : ['*'];
        return result;
    }

    /**
     * Takes the selections generated by {#_reduceSelections()} and applies them to the request.
     *
     * @param request
     * @param selections
     * @returns {*}
     * @private
     */
    , _applySelections: function(request, selections){

        var subrequests = [],
            subselects  = selections.subselects;

        request.setFields(selections.fields);
        if(selections.subselects){
            for(var collection in selections.subselects){
                var subrequest = request.populateRequest(new SOARequest.request.ReadRequest());
                    subrequest  .setCollection(collection)
                                .setResourceId(null);
                    this._applySelections(subrequest, selections.subselects[collection])
                    subrequests.push(subrequest);
            }
        }
        return request.setSubRequests(subrequests);
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
                reduction       = {};

            reduction = this._reduceSelections(selections);
            this._applySelections(request, reduction);
        }
    }

    , _setupFilters: function(base, request, original) {
        var filterHeader = original.getHeader('Filter');
        if(filterHeader) {
            var node            = Parser.parseFilter(filterHeader),
                filterVisitor   = new visitor.FilterVisitor(base.getName()),
                filters         = node.accept(filterVisitor);
            request.setFilters(filters);
        }
    }

    , _setupOrder: function(base, request, original){
        var orderHeader = original.getHeader('Order');
        if(orderHeader){
            var node            = Parser.parseOrder(orderHeader),
                orderVisitor    = new visitor.OrderVisitor(base.getName()),
                order           = node.accept(orderVisitor);

            request.setOrder(order);
        }
    }


    , createFromGet: function(original, segments, cb) {

        // event/5/venue
        // event
        // event/5
        var request  = new SOARequest.request.ReadRequest(),
            base = segments.last(),
            len = segments.length,
            filters;

        this._setupBaseData(base, request, original);
        try {
            this._setupSelects(base, request, original);
        } catch(err){
            err.message = "Invalid Select Header Syntax";
            cb(err, null);
        }
        try {
            this._setupFilters(base, request, original);
        } catch ( err ){
            err.message = "Invalid Filter Header Syntax";
            cb(err, null);
        }

        filters = request.getFilters();
        if(base.queriesCollection() && len > 1){ // ...event/5/venue
           var related = segments[len-2];
           filters[related.getName()] = {
               id: [ { operator: '=', value: related.getValue() } ]
           };
        }

        this._setupOrder(base, request, original);
        cb(null, request);
    }

    , createFromPost:  function(original, segments, cb) {

        var request = new SOARequest.request.CreateRequest();
        this._createRequestWithPayload(request, original, segments, cb);
    }

    , createFromPut: function(original, segments, cb) {

        var request = new SOARequest.request.WriteRequest();
        this._createRequestWithPayload(request, original, segments, cb);
    }

    , createFromPatch: function(original, segments, cb) {

        var request = new SOARequest.request.UpdateRequest();
        this._createRequestWithPayload(request, original, segments, cb);
    }

    , _createRequestWithPayload: function(request, original, segments, cb){
        var base = segments.last(),
            len = segments.length;

        this._setupBaseData(base, request, original);
        this._setupSelects(base, request, original);

        request.setContentLanguage(this._getContentLanguage(original));

        if(base.queriesResource() && segments.length > 1){ // event/5/venue/6
            var related = segments[len-2];
            request.setRelatedTo(related.getName(), related.getValue());
        }
        this._getFormData(request, original, cb);
    }

    , createFromDelete:  function(original, segments, cb) {
        var request = new SOARequest.request.DeleteRequest(),
            base = segments.last();

        this._setupBaseData(base, request, original);
        this._setupSelects(base, request, original);

        cb(null, request);
    }

    , createFromOptions: function(original, segments, cb) {
        var request = new SOARequest.request.OptionsRequest(),
            base = segments.last();

        this._setupBaseData(base, request, original);

        cb(null, request);
    }

    , createFromHead: function(original, segments, cb) {
        var request = new SOARequest.request.InfoRequest(),
            base = segments.last();

        this._setupBaseData(base, request, original);

        cb(null, request);
    }

    , createUnifiedRequest: function(request, cb) {
        this._dispatch(request, cb);
    }

    , getBaseRequestSegments: function(request) {
        return util.createSegments(request.pathname);
    }

    , _dispatch: function(request, cb) {
        var method = request.method.toUpperCase();
        if(method in this._factoryMap){
            var fn = this[this._factoryMap[method]];
            fn.call(this, request, this.getBaseRequestSegments(request), cb);
            return;
        }
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