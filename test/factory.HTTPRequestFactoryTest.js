var assert          = require('assert');

var testUtil        = require('./testutil')
    , MockRequest   = testUtil.HTTPMockRequest
    , MockResponse  = testUtil.HTTPMockResponse

    , factories         = require('../lib/factory')
    , SOARequestHeaders = require('ee-rest-headers')
    , log               = require('ee-log');

var GetRequest = new MockRequest()
    .setMethod('GET')
    .setPathname('/event/10')
    .setHeader('Accept', [{key:'Application', value:'JSON'}])
    .setHeader('Authorization', ' ee-simple aSupercomplexToken ')
    .setHeader('Accept-language', [{key:'en'}, {key:'de'}])
    .setHeader('Api-Version', '2.0')
    .setHeader('Range', '10-20');

var GetRequestNonNumericId = new MockRequest()
    .setMethod('GET')
    .setPathname('/event/10/shoppingcart/adlskdfj2343')
    .setHeader('Accept', [{key:'Application', value:'JSON'}])
    .setHeader('Authorization', ' ee-simple aSupercomplexToken ')
    .setHeader('Accept-language', [{key:'en'}, {key:'de'}])
    .setHeader('Api-Version', '2.0')
    .setHeader('Range', '10-20');

var GetRequestCollection = new MockRequest()
    .setMethod('GET')
    .setPathname('/event')
    .setHeader('Authorization', ' ee-simple token with whitespace')
    .setHeader('Accept', [{key:'Application', value:'JSON'}])
    .setHeader('Accept-language', [{key:'en'}, {key:'de'}])
    .setHeader('Api-Version', '2.0');

var GetRequestComplex = new MockRequest()
    .setMethod('GET')
    .setPathname('/event')
    .setHeader('Accept', [{key:'Application', value:'JSON'}])
    .setHeader('Accept-language', [{key:'en'}, {key:'de'}])
    .setHeader('Api-Version', '2.0')
    .setHeader('Filter', 'location.address.postalcode > 4500, location.address.postalcode < 4500, deleted = null')
    .setHeader('Select', 'modified = dateForm("m"), deleted, location.address , location.name, location.image.first , promoter.name, location.rating = avg(event.location.cluster.rating, true, [100, 10])');

var DeleteRequestRelated = new MockRequest()
    .setMethod('DELETE')
    .setPathname('/event/10/image/5')
    .setHeader('Accept-language', [{key:'en'}, {key:'de'}])
    .setHeader('Accept', [{key:'Application', value:'JSON'}]);

describe('HTTPRequestFactory', function(){
    var factory = new factories.HTTPRequestFactory();

    describe('#createUnifiedRequest', function(){
        describe('on GET', function(){
            factory.createUnifiedRequest(GetRequest, function(err, request){

                it('should not create an error', function(){
                    assert(err === null);
                });

                it('should have a collection', function(){
                    assert.equal('event', request.getCollection());
                });

                it('should have a resource id', function(){
                    assert.equal('10', request.getResourceId());
                });

                it('and should therefore query a resource', function(){
                    assert(!request.queriesCollection());
                });

                it('should accept the right format', function(){
                    assert(request.acceptsFormat('application', 'json'));
                });

                it('should not accept the wrong format', function(){
                    assert(!request.acceptsFormat('text', 'html'));
                });

                it('should accept the right language', function(){
                    assert(request.acceptsLanguage('en'));
                    assert(request.acceptsLanguage('de'));
                });

                it('should not accept the wrong language', function(){
                    assert(!request.acceptsLanguage('fr'));
                });

                it('should have an api version', function(){
                    assert.equal('2.0', request.getVersion());
                });

                it('should have a range', function(){
                    assert(request.hasRange());
                });

                it('with upper bound', function(){
                    assert.equal(10, request.getRange().from);
                });

                it('and lower bound', function(){
                    assert.equal(20, request.getRange().to);
                });

                it('should have authorization set if present', function(){
                    assert.equal('ee-simple', request.getRequestToken().type);
                    assert.equal('aSupercomplexToken', request.getRequestToken().value);
                });

            });
        });

        describe('on GET collection', function(){
            var request;
            it('should not generate an error', function(done){
                factory.createUnifiedRequest(GetRequestCollection, function(err, req){
                    assert(!err);
                    request = req;
                    done(err);
                });
            });


            it('should not have a resource id', function(){
                assert(!request.hasResourceId());
            });

            it('should therefore query a collection', function(){
                assert(request.queriesCollection());
            });

            it('should concatenate access tokens containing whitespace', function(){
                assert(request.hasRequestToken());
                assert.equal('token with whitespace', request.getRequestToken().value);
            });
        });

        describe('on GET complex (with filters, selects and ordering), depends on the the request middleware', function(){

            var request;
            // use this as a guard!
            it('should not generate an error', function(done){
                new SOARequestHeaders.Middleware().request(GetRequestComplex, null, function() {
                    factory.createUnifiedRequest(GetRequestComplex, function (err, req) {
                        assert(!err);
                        request = req;
                        done(err);
                    });
                })
            });

            it('should generate fields containing aggregate functions', function(){

                var fields = request.getFields();

                assert.strictEqual('deleted', fields[1]);

                assert.equal('modified' , fields[0].alias);
                assert.equal('dateForm' , fields[0].functionName);
                assert.deepEqual(['m']  , fields[0].functionParameters);
                assert.strictEqual(true , fields[0].isAlias);

            });

            it('should have filters', function(){
                assert(request.hasFilters());
            });

            it('should have subrequests', function(){

                assert(request.hasSubRequests());

                var subrequests = request.getSubRequests();


                assert.equal(2          , subrequests.length);
                assert.equal('location' , subrequests[0].collection);

            });

            it('should generate selections with aggregate functions on subrequests', function(){

                var   subrequests = request.getSubRequests()
                    , locationSub = subrequests[0]
                    , fields      = locationSub.getFields();

                assert(locationSub);
                assert.strictEqual('address'    , fields[0]);
                assert.strictEqual('name'       , fields[1]);

                assert.equal('rating'   , fields[2].alias);
                assert.equal('avg'      , fields[2].functionName);
                assert(fields[2].functionParameters[0]._isColumn);

            });
        });

        describe('on GET whit non numerical IDs', function(){

            factory.createUnifiedRequest(GetRequestNonNumericId, function(err, request){
                it('should have a resource id', function(){
                    assert(!request.queriesCollection());
                    assert.equal('adlskdfj2343', request.getResourceId());
                });
            });

        });

        describe('on DELETE related', function(){

            var error, req;
            it('should have a resource id', function(done){
                factory.createUnifiedRequest(DeleteRequestRelated, function(err, request){
                    error   = err;
                    req     = request;

                    assert(request.hasResourceId());
                    done();
                });
            });

            it('should set a related to', function(){
                assert(req.hasRelatedTo());
                assert.deepEqual({model:'event',id:'10'}, req.getRelatedTo());
                assert.equal('image', req.getCollection());
                assert.equal(5, req.getResourceId());
            });
        });
    });
});