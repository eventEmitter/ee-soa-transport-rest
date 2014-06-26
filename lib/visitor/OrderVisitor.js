"use strict";
var request = require('ee-soa-request')
    , types = require('ee-types');

var Class = require('ee-class');
/**
 * todo: implement hierarchical ordering
 * @type OrderVisitor
 */
var OrderVisitor = {

    baseEntity: null
    , namespaces: {}

    , init: function initialize(baseEntity) {
        // initialize.parent();
        this.baseEntity = baseEntity
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
        return { name: [ node.getName() ], direction: node.getTags().shift() || "ASC" };
    }

    , visitPropertyNode: function(node){
        var names = this._getAndNormalizeNames(node);
        return { name: names, direction: node.getTags().shift() || "ASC" };
    }

    , _getAndNormalizeNames: function(node){
        var names = node.getNames().slice(0);
        if(names[0] === this.baseEntity){
            names.shift(this.baseEntity);
        }
        return names;
    }

};

module.exports = new Class(OrderVisitor);