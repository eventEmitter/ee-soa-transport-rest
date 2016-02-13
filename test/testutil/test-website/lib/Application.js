"use strict";

var Class           = require('ee-class')
    , Types         = require('ee-types')
    , log           = require('ee-log')
    , SOAWebsite    = require('ee-soa-website');

var Application = {

      inherits: SOAWebsite

    , init: function initialize() {
        var moduleRoot = __dirname.substr(0, __dirname.lastIndexOf('/'));
        initialize.super.call(this, moduleRoot);
        this.middlewareLoaded();
        this.extensionsLoaded();
        this.filtersLoaded();
    }
};

module.exports = new Class(Application);