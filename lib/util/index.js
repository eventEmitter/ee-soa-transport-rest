var Segments    = require('./Segments'),
    Segment     = require('./Segment');

module.exports.Segments = Segments;
module.exports.Segment  = Segment;

function isNumber(n)
{
    return !isNaN(parseInt(n)) && isFinite(n);
}

function createSegment(segments, _pairs)
{
    var pair = new Segment(),
        first = null,
        second = null;

    _pairs = _pairs || [];
    if(segments.length === 0){
        return _pairs;
    }

    if(segments.length === 1){
        _pairs.push(pair.setName(segments.shift()));
        return _pairs;
    }

    pair.setName(segments.shift());
    if(isNumber(segments[0])) {
        pair.setId(segments.shift());
    }
    _pairs.push(pair);
    return createSegment(segments, _pairs);
}

module.exports.createSegments = function createSegments(path)
{
    var segments    = path.split('/').filter(function(element){
        return element !== '';
    });
    return createSegment(segments, new Segments());
};