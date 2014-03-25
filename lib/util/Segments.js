var Class = require('ee-class'),
    EESoaRequest = require('ee-soa-request');

var Segments = {

    inherits: EESoaRequest.util.Collection

    , queriesCollection: function()
    {
        return !this.isEmpty() && this.last().queriesCollection();
    }

    , queriesResource: function()
    {
        return !this.queriesCollection();
    }

    , normalize: function()
    {
        var list                = new Segments(),
            requiredElements    = this.queriesCollection() ? 2 : 1;

        if(this.isEmpty())
        {
            return list;
        }

        return list.pushAll(this.peek(requiredElements));
    }
};

module.exports = new Class(Segments);