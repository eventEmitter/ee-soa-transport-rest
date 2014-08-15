"use strict";
var   Types     = require('ee-types')
    , Class     = require('ee-class')

    , OrList    = require('./OrList')
    , AndList   = require('./AndList')
    , NormalizingVisitor = require('./NormalizingVisitor');

var FilterVisitor = module.exports = new Class({

      inherits: NormalizingVisitor
    , baseEntity: null

    , setBaseEntity: function(entity){
        this.baseEntity = entity || '';
        return this;
    }

    , visitFilterStatement: function(node){
        return this.pushAll(node, new OrList());
    }

    , visitSequence: function(node){
        return this.pushAll(node, new AndList());
    }

    , visitChoice: function(node){
        return this.pushAll(node, new OrList());
    }

    , visitComparison: function(node){
        var comp = {
            fields:       node.identifier.accept(this)
            , function:     node.comparator
            , value:        node.value.accept(this)
        };

        if(Types.function(comp.value)){
            var info = comp.value();
            comp.function   = info.name;
            comp.value      = info.parameters;
        }

        return comp;
    }

    , visitActionNode: function(node){
        return function(){
            return {
                name:         node.getName()
                , parameters:   node.parameters
            }
        }
    }

    , visitValueNode: function(node){
        return node.value;
    }

});