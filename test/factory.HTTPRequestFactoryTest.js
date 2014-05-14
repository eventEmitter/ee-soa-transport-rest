var assert          = require('assert');

var MockRequest     = require('./testutil/HTTPMockRequest')
    , MockResponse  = require('./testutil/HTTPMockResponse')
    , factories     = require('../lib/factory')
    , SOARequestHeaders = require('ee-rest-headers');

var GetRequest = new MockRequest()
    .setMethod('GET')
    .setPathname('/event/10')
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
    .setHeader('Filter', 'location.address.postalcode > 4500, location.address.postalcode < 4500, deleted = null');

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
            factory.createUnifiedRequest(GetRequestCollection, function(err, request){

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
        });

        describe('on GET complex (with filters, selects and ordering), depends on the the request middleware', function(){
            new SOARequestHeaders.Middleware().request(GetRequestComplex, null, function(){
                factory.createUnifiedRequest(GetRequestComplex, function(err, request){
                    it('should have filters', function(){
                        assert(request.hasFilters());
                    });
                });
            });
        });
    });
});