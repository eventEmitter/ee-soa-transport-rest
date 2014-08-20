"use strict";

var Class = require('ee-class')
    , Types = require('ee-types')
    , log = require('ee-log');

var AndList = module.exports = new Class({
    inherits: Array
    , init: function init(){
        init.super.call(this);
        this.type = 'and';
    }

    , isAnd: function(){
        return true;
    }

    , isOr: function(){
        return false;
    }
});