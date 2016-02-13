(function() {
    'use strict';

    var Class       = require('ee-class'),
        SOARequest  = require('ee-soa-request'),
        Parser      = require('ee-rest-headers'),
        log         = require('ee-log'),
        utils       = require('util'),


        visitor     = require('../visitor'),
        util        = require('../util');

    /**
     * todo: refactor the request factory to support non numerical ids
     */
    var HTTPRequestFactory = module.exports = new Class({

        /**
         * Extracts the languages header from the original request.
         *
         * @param original request
         * @returns {Array|*}
         * @private
         */
        _getLanguages: function(original) {
            // returns the ordered list of request languages (makes also use
            // of languages passed vie url e.g. (/de/..))
            return original.languages;
        }

        /**
         * Extracts all accepts headers from the original request.
         *
         * @param original request
         * @returns SOARequest.request.FormatCollection
         * @private
         */
        , _getFormats: function(original) {
            var formats             = original.getHeader('accept', true),
                formatCollection    = new SOARequest.request.FormatCollection();

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

        , _getAuthentication: function(original) {
            var auth = original.getHeader('authorization'),
                template = {type: null, value: null};


            if(auth){
                var elements = auth.split(' ').filter(function(element){
                    return element !== '';
                });
                template.type = elements.shift();
                if(elements.length > 0){
                    template.value = elements.join(' ');
                }
            }

            return template;
        }

        /**
         * Extracts the content language header (language of the payload).
         *
         * @param original request
         * @returns {*}
         * @private
         */
        , _getContentLanguage: function(original) {
            return original.getHeader('content-language');
        }

        /**
         * Returns the api-version header of the original request.
         *
         * @param original
         * @returns String
         * @private
         */
        , _getApiVersion: function(original) {
            return original.getHeader('api-version');
        }

        /**
         * Returns the specified range parameter and transforms it into an int array.
         * [from, to]
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

        , _getParameters: function(original){
            return original.rewriteParameters || {};
        }

        /**
         * Returns the meta header of the original request.
         *
         * @param original
         * @returns String
         * @private
         */
        , _getMeta: function(original) {
            return original.hasHeader('meta') && original.getHeader('meta').trim().length ? original.getHeader('meta').trim().split(',').map(v => v.trim()).filter(v => !!v) : null;
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

            // a fucking hack. i'm sorry, but i was in desperate need for it :(
            // i needed to have acces to cookie data
            if (original.extraData) request.extraData = original.extraData;

            request.setCollection(base.getName());
            request.setResourceId(base.getValue());

            request.setLanguages(this._getLanguages(original));
            request.setFormats(this._getFormats(original));
            request.setContentType(this._getContentType(original));
            request.setVersion(this._getApiVersion(original));
            request.setParameters(this._getParameters(original));
            request.setMeta(this._getMeta(original));

            // TODO: remove after authorization-management is done
            if (original.tenant) request.tenant = original.tenant;

            var ranges = this._getRange(original);
            request.setRange(ranges[0], ranges[1]);

            var auth = this._getAuthentication(original);
            request.setRequestToken(auth.type, auth.value);

            // add the websites accesstoken if available
            if (original.accessToken) request.accessTokens.push(original.accessToken);
            if (auth.value) request.accessTokens.push(auth.value);

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
        , _getFormData: function(request, original, cb) {
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
         * Takes the selections generated by the parsing middleware and applies them to the request.
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

            if(subselects){
                for(var collection in subselects){

                    var subrequest = request.populateRequest(new SOARequest.request.ReadRequest());
                        subrequest.setCollection(collection);
                        subrequest.setResourceId(null);
                        // recursively process subrequests
                        this._applySelections(subrequest, selections.subselects[collection])

                        subrequests.push(subrequest);
                }
            }

            return request.setSubRequests(subrequests);
        }

        , _setupSelects: function(base, request, original){

            var selectHeader = original.getHeader('Select', true);

            if(selectHeader){

                var selectVisitor   = new visitor.SelectVisitor(base.getName()),
                    selections      = selectHeader.accept(selectVisitor);


                this._applySelections(request, selections);
            }
        }

        , _setupFilters: function(base, request, original) {

            var filterHeader = original.getHeader('Filter', true);

            if(filterHeader) {

                var filterVisitor   = new visitor.FilterVisitor(base.getName()),
                    filters         = filterHeader.accept(filterVisitor);

                request.setFilters(filters);
            }
        }

        , _setupOrder: function(base, request, original){

            var orderHeader = original.getHeader('Order', true);

            if(orderHeader){

                var orderVisitor    = new visitor.OrderVisitor(base.getName()),
                    order           = orderHeader.accept(orderVisitor),
                    len             = order.length,
                    orderings       = {};

                for(var i=0; i<len; i++){
                    var current = order[i];
                    this._appendOrder(orderings, current.name, current.direction);
                }

                request.setOrder(orderings);
            }
        }

        , _appendOrder: function(orderings, names, direction){
            if(names.length == 1){
                orderings[names.shift()] = direction;
                return orderings;
            }
            var   lastname = names.shift()
                , appendTo = orderings[lastname] || {};
            orderings[lastname] = this._appendOrder(appendTo, names, direction);
            return orderings;
        }

        , createFromGet: function(original, segments, cb) {

            var request  = new SOARequest.request.ReadRequest(),
                base = segments.last() || new util.Segment(),
                len = segments.length,
                filters;

            this._setupBaseData(base, request, original);

            try { // all the parsed headers!
                this._setupSelects(base, request, original);
                this._setupFilters(base, request, original);
                this._setupOrder(base, request, original);
            } catch(err){
                return cb(err, null);
            }

            filters = request.getFilters();

            if(base.queriesCollection() && len > 1){
               var related = segments[len-2];
               filters[related.getName()] = {
                   id: [ { operator: '=', value: related.getValue() } ]
               };
            }

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

        , _setupRelatedTo: function(request, segments){
            var base    = segments.last(),
                len     = segments.length;

            if(base.queriesResource() && segments.length > 1){ //event/5/venue/6
                var related = segments[len-2];
                request.setRelatedTo(related.getName(), related.getValue());
            }
        }

        , _createRequestWithPayload: function(request, original, segments, cb){
            var base = segments.last(),
                len = segments.length;

            this._setupBaseData(base, request, original);
            try {
                this._setupSelects(base, request, original);
            } catch(err) {
                return cb(err, null);
            }

            request.setContentLanguage(this._getContentLanguage(original));

            this._setupRelatedTo(request, segments);
            this._getFormData(request, original, cb);
        }

        , createFromDelete:  function(original, segments, cb) {
            var request = new SOARequest.request.DeleteRequest(),
                base = segments.last();

            this._setupBaseData(base, request, original);
            this._setupSelects(base, request, original);
            this._setupRelatedTo(request, segments);

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
              GET:      'createFromGet'
            , POST:     'createFromPost'
            , PUT:      'createFromPut'
            , DELETE:   'createFromDelete'
            , PATCH:    'createFromPatch'
            , OPTIONS:  'createFromOptions'
            , HEAD:     'createFromHead'
        }
    });
})();
