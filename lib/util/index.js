var Segments    = require('./Segments'),
    Segment     = require('./Segment');

module.exports.Segments = Segments;
module.exports.Segment  = Segment;

function createSegment(segments) {

    var   len   = segments.length
        , pairs = new Segments();

    if(len === 0) return pairs;

    for(var i=0;i<len; i+=2){
        var   name = segments[i]
            , value = segments[i+1] || null;

        pairs.push(new Segment(name, value));
    }

    return pairs;
}

module.exports.createSegments = function createSegments(path)
{
    var segments    = path.split('/').filter(function(element){
        return element !== '';
    });
    return createSegment(segments, new Segments());
};