var Class = require('ee-class');

var Segment = {
    name: null
    , value: null

    , queriesCollection: function()
    {
        return !this.queriesResource();
    }
    , queriesResource: function()
    {
        return this.hasValue();
    }
    , setName: function(name)
    {
        this.name = name;
        return this;
    }
    , getName: function()
    {
        return this.name;
    }
    , hasValue: function()
    {
        return this.value !== null;
    }
    , getValue: function()
    {
        return this.value;
    }
    , setValue: function(value)
    {
        this.value = value;
        return this;
    }
};

module.exports = new Class(Segment);