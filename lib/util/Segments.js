var Class           = require('ee-class'),
    EESoaRequest    = require('ee-soa-request');

var Segments = {

    inherits: EESoaRequest.util.Collection

    , queriesCollection: function() {
        return !this.isEmpty() && this.last().queriesCollection();
    }

    , queriesResource: function() {
        return !this.isEmpty() && this.last().queriesResource();
    }
};

module.exports = new Class(Segments);