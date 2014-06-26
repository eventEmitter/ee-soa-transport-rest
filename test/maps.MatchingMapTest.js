var assert  = require('assert'),
    maps    = require('../lib/maps');

var content = {};

var domainmap       = new maps.MatchingMap(['*.domain.*', '*.domain-name.*', 'domain.com'], content),
    pathmap         = new maps.MatchingMap(['/some/path/*', '/home'], content),
    regexfree       = new maps.MatchingMap(['domain.com', 'domain.de'], content);


describe('MatchingMap', function(){
    describe('has', function(){

        it('returns true for simple patterns', function() {
            assert(pathmap.has('/home'));
            assert(domainmap.has('domain.com'));
            assert(regexfree.has('domain.com'));
        });

        it('returns true for wildcarded patterns', function() {
            assert(pathmap.has('/some/path/10'));
            assert(domainmap.has('sub.domain.fr'));
        });

        it('returns false for missing patterns', function() {
            assert(!pathmap.has('/'));
            assert(!domainmap.has('domain.ch'));
            assert(!regexfree.has('domain.ch'));
        });

    });

    describe('get', function(){
        it('returns the object for simple patterns', function() {
            assert(pathmap.get('/home') === content);
        });

        it('returns the object for wildcarded patterns', function() {
            assert(domainmap.get('sub.domain.fr') === content);
        });

        it('returns null for missing patterns', function() {
            assert(pathmap.get('/') === null);
        });
    });
});