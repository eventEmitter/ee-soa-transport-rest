var   assert    = require('assert')
    , log       = require('ee-log')
    , Class     = require('ee-class')
    , Webserver = require('ee-webserver');

process.env.testRunner = true;

var HTTPTransport   = require('../lib/HTTPTransport');

var   testUtil      = require('./testutil')
    , TestWebsite   = testUtil.MockWebsite;

process.env.EE_ENV_TESTING = true;

var Err = new Class({

    inherits: Error
});

function getOptions(){
    return {
          host: 'test.local'
        , headers: {
              "accept-language":  'de'
            , "accept":           'text/html;q=1'
            , "api-version":      1
        }
        , remoteAddress: '127.0.0.2'
        , url: '/'
        , method: 'GET'
    };
}

describe('HTTPTransport', function() {

    var   transport     = new HTTPTransport({interface: 5, port:'8080'})
        , listener200   = function(request, response){
            response.send(response.statusCodes.OK, {test: 'succeeded'});
        }
        , listener404   = function(request, response){
            response.send(response.statusCodes.TARGET_NOT_FOUND, new Error('Not Found'));
        }
        , listener500   = function(request, response){
            response.send(response.statusCodes.SERVICE_EXCEPTION, new Error('Uh ah'));
        };

        transport.on('request', listener200);
        transport.use(new TestWebsite());

    describe('Null Path Requests', function(){

        var   options       = getOptions()
            , mockRequest   = new Webserver.testing.MockRequest(options)
            , testRequest   = new Webserver.Request({request: mockRequest})

            , responseOptions = {}
            , mockResponse  = new Webserver.testing.MockResponse(responseOptions)
            , testResponse  = new Webserver.Response({request: testRequest, response: mockResponse});

        it("should load without errors", function(done){
            transport.onLoad(done);
            transport.useTransport();
        });

        var responseData;
        it("should apply all the rewrites", function(done){
            mockResponse.on('end', function(data){
                try {
                    assert.equal(testRequest.pathname, '/null');
                    assert.equal(testRequest.getHeader('api-version'), 1);
                    assert.equal(testRequest.template.resolve(), 'index.nunjucks.html');

                    responseData = data.toString();
                    done();
                } catch(err){
                    done(err);
                }
            });

            transport.testRequest(testRequest, testResponse);
        });

        it("should render the response and add appropriate headers", function(){
            assert.equal(mockResponse.status, 200);
            assert.equal(mockResponse.headers['content-type'], 'text/html; charset=utf-8');
            assert.equal(responseData, '<h1>Test Nullpath de</h1>');
        });

        it("should add a cache control header", function(){
            assert.equal(mockResponse.headers['cache-control'], 'no-transform');
        });
    });

    describe('Api Requests HTML', function(){
        // now we simulate requests to an api, therefore we need different rewrites
        var options     = getOptions();
            options.url = '/api/';

        var   mockRequest   = new Webserver.testing.MockRequest(options)
            , testRequest   = new Webserver.Request({request: mockRequest})

            , responseOptions = {}
            , mockResponse  = new Webserver.testing.MockResponse(responseOptions)
            , testResponse  = new Webserver.Response({request: testRequest, response: mockResponse});

        it("should load without errors", function(done){
            transport.onLoad(done);
            transport.useTransport();
        });

        var responseData;
        it("should apply all the rewrites", function(done){
            mockResponse.on('end', function(data){
                try {
                    assert.equal(testRequest.pathname, '/api/');
                    assert.equal(testRequest.getHeader('api-version'), 1);
                    assert.equal(testRequest.template.resolve(), 'index.api.nunjucks.html');

                    responseData = data.toString();
                    done();
                } catch(err){
                    done(err);
                }
            });

            transport.testRequest(testRequest, testResponse);
        });

        it("should render the response and add appropriate headers", function(){
            assert.equal(mockResponse.status, 200);
            assert.equal(mockResponse.headers['content-type'], 'text/html; charset=utf-8');
            assert.equal(responseData, '<h1>Test: succeeded</h1>');
        });


    });

    describe('Api Requests JSON', function(){
        // now we simulate requests to an api, therefore we need different rewrites
        var options     = getOptions();
        options.url = '/api/';
        options.headers.accept = 'application/json;q=1';

        var   mockRequest   = new Webserver.testing.MockRequest(options)
            , testRequest   = new Webserver.Request({request: mockRequest})

            , responseOptions = {}
            , mockResponse  = new Webserver.testing.MockResponse(responseOptions)
            , testResponse  = new Webserver.Response({request: testRequest, response: mockResponse});

        it("should load without errors", function(done){
            transport.onLoad(done);
            transport.useTransport();
        });

        it("should render the response and add appropriate headers", function(done){
            mockResponse.on('end', function(data){
                try {
                    assert.equal('{"test":"succeeded"}', data.toString());
                    assert.equal(this.headers['content-type'], 'application/json; charset=utf-8');
                    done();
                } catch(err){
                    done(err);
                }
            }.bind(mockResponse));
            transport.testRequest(testRequest, testResponse);
        });
    });

    describe('Order Headers Test', function(){
        // now we simulate requests to an api, therefore we need different rewrites
        var options     = getOptions();
        options.url     = '/api/';
        options.headers.accept = 'application/json;q=1';
        options.headers.order = 'thing.id, category.location.title DESC, category.location.postalcode';

        var   mockRequest   = new Webserver.testing.MockRequest(options)
            , testRequest   = new Webserver.Request({request: mockRequest})

            , responseOptions = {}
            , mockResponse  = new Webserver.testing.MockResponse(responseOptions)
            , testResponse  = new Webserver.Response({
                                          request: testRequest
                                        , response: mockResponse
                                    });

        it("should load without errors", function(done){
            transport.onLoad(done);
            transport.useTransport();
        });

        it("should parse the order headers", function(done){
            transport.off('request');
            transport.on('request', function(req, response){
                var order = {
                    thing: {
                        id: "ASC"
                    }
                    , category: {
                        location: {
                            title: "DESC"
                            , postalcode: "ASC"
                        }
                    }
                };

                assert.deepEqual(order, req.getOrder());
                done();
            });
            transport.testRequest(testRequest, testResponse);
        });

        it("shoud parse the order headers consistent", function(done){
            transport.off('request');
            transport.on('request', function(req, response){
                var order = {
                    thing: {
                        id: "ASC"
                    }
                    , category: {
                        location: {
                            title: "DESC"
                            , postalcode: "ASC"
                        }
                    }
                };

                assert.deepEqual(order, req.getOrder());
                done();
            });
            transport.testRequest(testRequest, testResponse);
         });
    });

    describe('Select Headers Test', function(){

        var options     = getOptions();
        options.url     = '/api/';
        options.headers.accept = 'application/json;q=1';
        options.headers.filter = 'eventData.artist.id!=null';
        options.headers.select = 'thing.id, location.title, location.city.postalcode, id, version';

        var   mockRequest   = new Webserver.testing.MockRequest(options)
            , testRequest   = new Webserver.Request({request: mockRequest})

            , responseOptions = {}
            , mockResponse  = new Webserver.testing.MockResponse(responseOptions)
            , testResponse  = new Webserver.Response({
                request: testRequest
                , response: mockResponse
            });

        it("should load without errors", function(done){
            transport.onLoad(done);
            transport.useTransport();
        });

        it("should parse the select headers", function(done){
            transport.off('request');
            transport.on('request', function(req, res){

                assert(req.hasSubRequests());

                //var   subrequests   = req.getSubRequests()
                   // , firstLevel    = subrequests[0];

                //assert.equal(firstLevel.getCollection(), 'thing');

                done();
            });
            transport.testRequest(testRequest, testResponse);
        });

    });

    describe('Status dependent content rendering', function(){

        var options     = getOptions();
        options.url     = '/api/';

        var   mockRequest   = new Webserver.testing.MockRequest(options)
            , testRequest   = new Webserver.Request({request: mockRequest})

            , responseOptions = {}
            , mockResponse  = new Webserver.testing.MockResponse(responseOptions)
            , testResponse  = new Webserver.Response({
                  request: testRequest
                , response: mockResponse
            });

        it("should load without errors", function(done){
            transport.onLoad(done);
            transport.useTransport();
        });

        it("should render the template set to the current status", function(done){
            transport.off('request');
            transport.on('request', listener404);
            mockResponse.on('end', function(data){
                try {
                    assert.equal('<h1>Uhh ohh: Not Found</h1>', data.toString());
                    assert.equal(this.headers['content-type'], 'text/html; charset=utf-8');
                    done();
                } catch(err){
                    done(err);
                }
            }.bind(mockResponse));
            transport.testRequest(testRequest, testResponse);
        });
    });

    describe('Status dependent content rendering when requesting an unknown url', function(){

        var options     = getOptions();
        options.url     = '/undefinedEndPoint/';

        var   mockRequest   = new Webserver.testing.MockRequest(options)
            , testRequest   = new Webserver.Request({request: mockRequest})

            , responseOptions = {}
            , mockResponse  = new Webserver.testing.MockResponse(responseOptions)
            , testResponse  = new Webserver.Response({
                request: testRequest
                , response: mockResponse
            });

        it("should load without errors", function(done){
            transport.onLoad(done);
            transport.useTransport();
        });

        it("should render the default template attached to the corresponding error state in the rewrite rules", function(done){
            transport.off('request');
            transport.on('request', listener404);
            mockResponse.on('end', function(data){
                try {
                    assert.equal('<h1>Uhh ohh: Not Found</h1>', data.toString());
                    assert.equal(this.headers['content-type'], 'text/html; charset=utf-8');
                    done();
                } catch(err){
                    done(err);
                }
            }.bind(mockResponse));
            transport.testRequest(testRequest, testResponse);
        });
    });

    describe('Status dependent content rendering falling back to a default template', function(){

        var options     = getOptions();
        options.url     = '/undefinedEndPoint/';

        var   mockRequest   = new Webserver.testing.MockRequest(options)
            , testRequest   = new Webserver.Request({request: mockRequest})

            , responseOptions = {}
            , mockResponse  = new Webserver.testing.MockResponse(responseOptions)
            , testResponse  = new Webserver.Response({
                  request: testRequest
                , response: mockResponse
            });

        it("should load without errors", function(done){
            transport.onLoad(done);
            transport.useTransport();
        });

        it("should render the default template attached to the corresponding error state in the rewrite rules", function(done){
            transport.off('request');
            transport.on('request', listener500);
            mockResponse.on('end', function(data){
                try {
                    assert.equal('<h1>You Broke the internet!!</h1>', data.toString());
                    assert.equal(this.headers['content-type'], 'text/html; charset=utf-8');
                    done();
                } catch(err){
                    done(err);
                }
            }.bind(mockResponse));
            transport.testRequest(testRequest, testResponse);
        });
    });
});