var utils   = require('../lib/util'),
    assert  = require('assert');

var Segment = utils.Segment,
    Segments = utils.Segments;

describe("util.Segments", function() {

    describe("initial test", function(){
        var segments = new Segments();

        it("should be empty", function(){
            assert(segments.isEmpty());
        });

        it("should neither query a resource nor a collection", function(){
            assert(!segments.queriesCollection());
            assert(!segments.queriesResource());
        });
    });

    describe("#queriesCollection", function(){
        var segments = new Segments();

        it("should return false if last segment queries a resource", function(){

            var segment = new Segment()
                                .setName('test')
                                .setValue(10);
            segments.push(segment);

            assert(!segments.isEmpty());
            assert(!segment.queriesCollection());
            assert(!segments.queriesCollection());
        });


        it("should return true if last segment queries a collection", function(){
            var segment = new Segment()
                    .setName('test');
            segments.push(segment);

            assert(!segments.isEmpty());
            assert(segment.queriesCollection());
            assert(segments.queriesCollection());
        });
    });

    describe("#queriesResource", function(){
        var segments = new Segments();

        it("should return true if last segment queries a resource", function(){

            var segment = new Segment()
                .setName('test')
                .setValue(10);
            segments.push(segment);

            assert(!segments.isEmpty());
            assert(segment.queriesResource());
            assert(segments.queriesResource());
        });


        it("should return false if last segment queries a collection", function(){
            var segment = new Segment()
                .setName('test');
            segments.push(segment);

            assert(!segments.isEmpty());
            assert(segment.queriesCollection());
            assert(!segments.queriesResource());
        });
    });

});