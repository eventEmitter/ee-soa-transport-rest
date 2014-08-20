"use strict";

var Class = require('ee-class')
    , Types = require('ee-types')
    , log = require('ee-log');

var OrList = module.exports = new Class({
    inherits: Array
    , init: function init(){
        init.super.call(this);
        this.type = 'or';
    }

    , isAnd: function(){
        return false;
    }

    , isOr: function(){
        return true;
    }
});