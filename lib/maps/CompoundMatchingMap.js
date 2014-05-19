"use strict";

var Class = require('ee-class');

var CompoundMatchingMap = new Class({
    _items: []
    , init: function(items){
        this._items = items;
    }

    , get: function(key){
        var len = this._items.length;
        for (var i = 0; i < len; i++) {
            var obj = this._items[i];
            if(obj.has(key)){
                return obj.get(key);
            }
        }
        return null;
    }

    , has: function(key){
        return this._items.some(function(current){
            return current.has(key);
        });
    }
});

module.exports = CompoundMatchingMap;