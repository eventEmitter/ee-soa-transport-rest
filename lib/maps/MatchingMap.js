"use strict";

var Class = require('ee-class');

var MatchingMap = new Class({

    _items: {}
    , _obj: null
    , _pattern: null
    , _delimiter: '\.'

    , init: function(items, obj, delimiter){
        this._delimiter = (arguments.length > 2) ? delimiter : this._delimiter;
        this._obj       = obj;
        this._prepareItems(items);
    }

    , _prepareItems: function(items, env){
        var patterns = [],
            len = items.length;

        for(var i=0;i<len;i++){
            var item = items[i];
            if(item.indexOf('*') > -1){
                patterns.push('^'+item.replace('*', '[^'+this._delimiter+']+')+'$');
            } else {
                this._items[item] = true;
            }
        }

        this._pattern = new RegExp(patterns.join('|'), 'i');
    }

    , get: function(key){
        if(this._items.hasOwnProperty(key)){
            return this._obj;
        }
        if(this._pattern.test(key)){
            this._items[key] = true;
            return this._obj;
        }
        return null;
    }

    , has: function(key){
        return this.get(key) !== null;
    }
});

module.exports = MatchingMap;