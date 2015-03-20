"use strict";
var   Types     = require('ee-types')
    , Class     = require('ee-class');

var NormalizingVisitor = module.exports = new Class({

    baseEntity: null

    , init: function(entity){
        this.baseEntity = entity || '';
    }

    , setBaseEntity: function(entity){
        this.baseEntity = entity || '';
        return this;
    }

    , visitIdentifier: function(node){
        var names = [node.getName()].concat(node.accesses);
        if(node.getName().toLowerCase() === this.baseEntity.toLowerCase()){
            names.shift();
        }
        return names;
    }

    , pushAll: function(source, target){
        for(var i = 0, len=source.length; i<len;i++){
            target.push(source[i].accept(this));
        }
        if(target.length == 1) return target.shift();
        return target;
    }

    , visitCollection: function(collection){
        return collection.map(function(item){
            return item.accept(this);
        }.bind(this));
    }
});