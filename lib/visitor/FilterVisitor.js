"use strict";
var request = require('ee-soa-request')
    , types = require('ee-types');
/**
 * [
 *      {
 *          event: {
 *              id: 10
 *              , operator: '>'
 *          }
 *          , venue: {
 *          address: {
 *              postalcode: [
 *                  { operator: '>', value: 4500 }
 *                  , {operator: '<', value: 5000 }
 *              ]
 *          }
 *      }
 * }
 */

var Class = require('ee-class');

var FilterVisitor = {

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

    , visitFilterStatement: function(nodes){
        this.namespaces = {};
        var filters = new request.filter.FilterCollection();
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            node.accept(this);
        }
        // todo: transform this to a filter collection;
        return this.namespaces;
    }
    , visitNodeCollection: function(nodes){
        var result = [];
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            result.push(node.accept(this))
        }
        return result;
    }
    , visitComparisonNode: function(node){

        var current = this.namespaces,
            names   = node.getProperty().accept(this),
            first   = names[0],
            value   = node.getValue();

        for (var i = 0; i < names.length-1; i++) {
            var name = names[i];
            if(!current[name]){
                current[name] = {};
            }
            current = current[name];
        }
        name = names[i];
        if(!current[name]){
            current[name] = [];
        }

        current[name].push({
            operator: node.getOperator()
            , value: value.accept(this)
        });
    }

    , visitActionNode: function(node){
        var parameters = node.getParameters().accept(this);
        return function(){
            return {
                name: node.getName()
                , parameters: parameters
            };
        };
    }

    , visitValueNode: function(node){
        return node.getValue();
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

module.exports = new Class(FilterVisitor);