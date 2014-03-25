var Class = require('ee-class');

var Segment = {
    name: null
    , id: null
    , queriesCollection: function()
    {
        return !this.queriesResource();
    }
    , queriesResource: function()
    {
        return this.hasId();
    }
    , setName: function(name)
    {
        this.name = name;
        return this;
    }
    , getName: function()
    {
        return this.getName();
    }
    , hasId: function()
    {
        return this.id !== null;
    }
    , getId: function()
    {
        return this.id;
    }
    , setId: function(id)
    {
        this.id = id;
    }
};

module.exports = new Class(Segment);