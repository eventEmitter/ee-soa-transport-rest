var Class = require('ee-class');

var Segment = module.exports = new Class({

      name: null
    , value: null

    , init: function(name, value){
        this.name   = name || null;
        this.value  = value || null;
    }

    , queriesCollection: function() {
        return !this.queriesResource();
    }

    , queriesResource: function() {
        return this.hasValue();
    }

    , setName: function(name) {
        this.name = name;
        return this;
    }

    , getName: function() {
        return this.name;
    }

    , hasValue: function() {
        return this.value !== null;
    }

    , getValue: function() {
        return this.value;
    }

    , setValue: function(value) {
        this.value = value;
        return this;
    }

    , isNumber: function() {
        return !isNaN(parseInt(this.value)) && isFinite(this.value);
    }
});