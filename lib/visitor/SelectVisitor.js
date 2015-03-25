"use strict";

var   Class = require('ee-class')
    , log   = require('ee-log')
    , Types = require('ee-types');

var SelectVisitor = module.exports = new Class({

    baseEntity: null,

    init: function initialize(baseEntity) {
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

    , visitSelectStatement: function(node){

        var items = node.reduce(function(collected, selectItem){
            collected.push(selectItem.accept(this));
            return collected;
        }.bind(this), []);

        return this.reduceSelections(items);
    }

    , visitSelectItem: function(node){

        var   aggregate = {};

        aggregate.isAlias    = node.isAlias();
        aggregate.property   = node.property.accept(this);

        if(node.isAlias()){
            aggregate.function         = node.aggregation.accept(this);
        }

        return aggregate;
    }

    , visitActionNode: function(node){
        return {
              name          : node.getName()
            , parameters    : node.getParameters().accept(this)
        };
    }

    , visitNodeCollection : function(collection){
        return collection.map(function(item){
            return item.accept(this);
        }.bind(this));
    }

    , visitValueNode : function(node){
        return node.value;
    }

    , visitVariableNode: function(node){
        return this.visitPropertyNode(node);
    }

    , visitPropertyNode: function(node){
        return this._getAndNormalizeNames(node);
    }

    , _getAndNormalizeNames: function(node){
        var names = node.getNames().slice(0);

        if(names[0] === this.baseEntity) names.shift();
        names._isColumn = true;

        return names;
    }

    , _ensureSubselectsAt: function(index, result){

        if(!result.subselects){
            result.subselects = {};
        }

        if(!result.subselects[index]){
            result.subselects[index] = [];
        }

        return result.subselects[index];

    }

    , _createFieldEntry: function(item, target, currentName){
        if(!item.isAlias){
            target.push(currentName);
        } else {
            target.push({
                  alias             : currentName
                , functionName      : item.function.name
                , functionParameters: item.function.parameters
                , isAlias           : true
            });
        }
        return target;
    }

    , _ensureSelectionEntry: function(item, target, currentName){
        if(Types.undefined(target[currentName])){
            target[currentName] = [];
        }
        target[currentName].push(item);
    }

    , _reduceSelections: function(selections, level){

        var   currentFields       = []
            , currentSubselectMap = {}
            , remainingSelections = {};

        selections.forEach(function(item){

            var   len           = item.property.length
                , currentName   = item.property[level];

            // lowest level of the current item
            if(len === level + 1){
                this._createFieldEntry(item, currentFields, currentName);
            } else {
                this._ensureSelectionEntry(item, remainingSelections, currentName);
            }

        }, this);

        Object.keys(remainingSelections).forEach(function(key){
            currentSubselectMap[key] = this._reduceSelections(remainingSelections[key], level + 1);
        }, this);


        return { fields : currentFields, subselects : currentSubselectMap };
    }

    , reduceSelections: function(selections){

        if(!selections) return [];

        return this._reduceSelections(selections, 0, {});
    }

});