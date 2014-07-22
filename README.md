#EE-SOA-Transport-Rest

Rest specific transport implementation which converts a HTTP request to the internal request format (@see ee-soa-request)

##Behavioral Notes

The behavior of the transport has to be described a little better.

###URL Segments

###HTTP Methods

###Headers

##URL Handling - Update
While path segments were only paired if the id was numeric, the new implementation supports non numerical ids. This
implies some new rules for the url handling:

  1. Queries a resource if the amount of segments is even
  2. Queries a collection if the amount of segments is odd
  3. Segments of the path are paired together e.g. `/language/fr/event/10` results in `language: 'fr', event: 10` (the
    internal data structure is a flat list, not a dictionary).