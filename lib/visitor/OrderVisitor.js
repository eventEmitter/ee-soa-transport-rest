"use strict";

var   Class = require('ee-class')
    , NormalizingVisitor = require('./NormalizingVisitor');

/**
 * todo: implement hierarchical ordering
 * @type OrderVisitor
 */
var OrderVisitor = module.exports = new Class({

    inherits: NormalizingVisitor

    , visitOrderStatement: function(nodes){
        var orderings = [];
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            orderings.push(node.accept(this));
        }

        return orderings;
    }

    , visitOrdering: function(node){
        return {
              name:         node.value.accept(this)
            , direction:    node.direction
        }
    }
    // todo: this is for compatibility reasons, but hopefully never used
    , visitActionNode: function(node){
        return [ node.name ]
    }

});