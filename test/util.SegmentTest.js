var utils   = require('../lib/util'),
    assert  = require('assert');

var Segment = utils.Segment;

describe("util.Segment", function() {

    describe("#setName/#getName", function(){
        var segment = new Segment();

        it("should set the name property", function(){
            segment.setName("Test");
            assert(segment.name === "Test");
        });

        it("should return the name", function(){
            assert(segment.getName() === "Test");
        });
    });

    describe("#setValue/#getValue", function(){
        var segment = new Segment();

        it("should set the value", function(){
            segment.setValue(10);
            assert(segment.value === 10);
        });

        it("should return the value", function(){
            assert(segment.getValue() === 10);
        });
    });

    describe("#queriesCollection", function(){
        var segment = new Segment();

        it("should return true if no value is set", function(){
            assert(segment.queriesCollection());
        });

        it("should return false if a value is set", function(){
            segment.setValue(10);
            assert(!segment.queriesCollection());
        });
    });

    describe("#queriesResource", function(){
        var segment = new Segment();

        it("should return false if no value is set", function(){
            assert(!segment.queriesResource());
        });

        it("should return true if a value is set", function(){
            segment.setValue(10);
            assert(segment.queriesResource());
        });
    });
});