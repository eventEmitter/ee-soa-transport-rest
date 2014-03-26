"use strict";

var Class = require('ee-class');

var SelectVisitor = {

    baseEntity: null,

    init: function initialize(baseEntity) {
        // initialize.parent();
        this.baseEntity = baseEntity
    }

    , getBaseEntity: function(){
        return this.baseEntity
    }

    , setBaseEntity: function(baseEntity){
        this.baseEntity = baseEntity
        return this;
    }

    , visitSelectStatement: function(node){
        var names = []
        for (var i = 0; i < node.length; i++) {
            names.push(node[i].accept(this));
        }
        return names;
    }

    , visitVariableNode: function(node){
        return this._getAndNormalizeNames(node);
    }

    , visitPropertyNode: function(node){
        return this._getAndNormalizeNames(node);
    }

    , _getAndNormalizeNames: function(node){
        var names = node.getNames().slice(0);
        if(names[0] === this.baseEntity){
            names.shift();
        }
        return names;
    }

};

module.exports = new Class(SelectVisitor);