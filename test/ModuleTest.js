var   assert            = require('assert')
    , SOATransportRest  = require('../.');

describe('ee-soa-transport-rest', function(){

    it('should expose the transport and the factory', function(){

        assert(SOATransportRest);
        assert(SOATransportRest.factory);

    });

});