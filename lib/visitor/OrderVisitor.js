"use strict";

var   Types = require('ee-types')
    , Class = require('ee-class')
    , log   = require('ee-log');
/**
 * todo: implement hierarchical ordering
 * @type OrderVisitor
 */
var OrderVisitor = module.exports = new Class({

      baseEntity : null
    , namespaces : null

    , init: function initialize(baseEntity) {
        this.baseEntity = baseEntity;
        this.namespaces = {};
    }

    , getBaseEntity: function(){
        return this.baseEntity
    }

    , setBaseEntity: function(baseEntity){
        this.baseEntity = baseEntity;
        return this;
    }

    /**
     * @param nodes
     * @returns {Array}
     */
    , visitOrderStatement: function(nodes){
        var orderings = [];
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            orderings.push(node.accept(this));
        }

        return orderings;
    }

    , visitVariableNode: function(node){
        return { name: [ node.getName() ], direction: node.getTags()[0] || "ASC" };
    }

    , visitPropertyNode: function(node){
        var names = this._getAndNormalizeNames(node);
        return { name: names, direction: node.getTags()[0] || "ASC" };
    }

    , _getAndNormalizeNames: function(node){
        var names = node.getNames().slice(0);
        if(names[0] === this.baseEntity){
            names.shift(this.baseEntity);
        }
        return names;
    }

});