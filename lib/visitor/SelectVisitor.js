"use strict";

var   Class                 = require('ee-class')
    , log                   = require('ee-log')
    , NormalizingVisitor    = require('./NormalizingVisitor');

var SelectVisitor = module.exports = new Class({

    inherits: NormalizingVisitor

    , visitSelectStatement: function(node){
        var names = [];
        for (var i = 0; i < node.length; i++) {
            names.push(node[i].accept(this));
        }
        return this._reduceSelections(names);
    }

    , _reduceSelections: function(fields){

        var result = {
              fields: []
            , subselects: []
        };

        if(!fields) return result;

        // sort the accesses by length e.g. (address.*).length = 2
        fields.sort(function(a, b){
            return a.length - b.length;
        });

        // root contains the fields that directly access the entity
        // we use an object and its keys to avoid duplicates
        var   root = {}
            // since we ordered the selections before, fields of length = 1 must be at the beginning
            , hasDirectSelections = fields[0].length == 1
            , rootFields;


        for (var i = 0; i < fields.length; i++) {
            var field = fields[i],
                len = field.length,
                name = field[0];

            if(len==1) {
                root[name] = true;
            } else {
                if(hasDirectSelections){
                    root[name] = true;
                }

                result.subselects = result.subselects || {};

                if(!result.subselects[name]){
                    result.subselects[name] = [];
                }

                result.subselects[name].push(field.slice(-(len-1)));
            }
        }

        for (var name in result.subselects) {
            result.subselects[name] = this._reduceSelections(result.subselects[name]);
        }
        // write back the directly accessed fields or set a wildcard
        rootFields = Object.keys(root);
        result.fields = rootFields.length > 0 ? rootFields : ['*'];
        return result;
    }

});