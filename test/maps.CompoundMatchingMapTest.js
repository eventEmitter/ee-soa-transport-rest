var assert  = require('assert'),
    maps    = require('../lib/maps');

var content = {};

var domainmap   = new maps.MatchingMap(['*.domain.*', '*.domain-name.*', 'domain.com'], content),
    pathmap     = new maps.MatchingMap(['/some/path/*', '/home'], content, '\/'),
    compound    = new maps.CompoundMatchingMap([domainmap, pathmap]);


describe('CompoundMatchingMap', function(){
    describe('has', function(){

        it('returns true for simple patterns', function(){
            assert(compound.has('/home'));
            assert(compound.has('domain.com'));
        });

        it('returns true for wildcarded patterns', function(){
            assert(compound.has('/some/path/10'));
            assert(compound.has('sub.domain.fr'));
        });

        it('returns false for missing patterns', function(){
            assert(!compound.has('/'));
            assert(!compound.has('domain.ch'));
        });

    });

    describe('get', function(){
        it('returns the object for simple patterns', function(){
            assert(compound.get('/home') === content);
        });

        it('returns the object for wildcarded patterns', function(){
            assert(compound.get('sub.domain.fr') === content);
        });

        it('returns null for missing patterns', function(){
            assert(compound.get('/') === null);
        });
    });
});