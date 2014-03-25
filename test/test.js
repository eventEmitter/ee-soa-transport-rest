//mocha test file
var fs = require('fs'),
    log = require('ee-log');

var ignoreFilesStartingWith = '_';


fs.readdir('.', function(err, files){
   if(err){
       log.warning('Not able to read the testdirectory.');
       return;
   }
   var len = files.length;
   for(var i = 0; i< len; i++){
        var file = files[i];
        if(file.slice(0, ignoreFilesStartingWith.length) !== ignoreFilesStartingWith){
            require(files[i]);
        }
   }
});