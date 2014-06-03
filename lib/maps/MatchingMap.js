"use strict";

var Class = require('ee-class');

var MatchingMap = new Class({

    _items: null
    , _obj: null
    , _pattern: null

    , init: function(items, obj) {
        this._obj       = obj;
        this._items     = {};
        this._pattern   = null;

        this._prepareItems(items);
    }

    , _prepareItems: function(items, env) {
        var patterns = [],
            len = items.length;

        for(var i=0;i<len;i++){
            var item = items[i];
            if(item.indexOf('*') > -1){
                // all except the star
                item = item.replace(/[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g, "\\$&");
                patterns.push(item.replace('*', '.*'));
            } else {
                this._items[item] = true;
            }
        }

        if(patterns.length) {
            this._pattern = new RegExp(patterns.join('|'), 'i');
        }
    }

    , get: function(key) {

        key = key.toString();
        if(this._items[key] === true){
            return this._obj;
        }
        if(this._pattern !== null && this._pattern.test(key)){
            this._items[key] = true;
            return this._obj;
        }
        return null;
    }

    , has: function(key) {
        return this.get(key) !== null;
    }
});

module.exports = MatchingMap;