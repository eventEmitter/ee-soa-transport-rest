#EE-SOA-Transport-Rest

Rest specific transport implementation

##Behavioral Notes
  1. Selects
  The select header models a projection on the queried resources.
    1.1 Empty selects are treated as a wildcard.
    1.2 Selections can consist of one or multiple accesses, e.g. `title`, `location.title` ... and do not need to specify
    the root resource.
    1.3 A select header entry that directly accesses the root entity and only the root entity e.g. `title`, is called a
    direct selection.
    1.4 A select header entry that accesses fields of a subresource related to the root resource consists of multiple
    segments and is called (and causes) a subselect (subrequest) e.g. `location.*`
    1.5 The asterisk is a wildcard too and means select all as in SQL.
    1.6 If there are direct selections, the subselect will also be tracked and added to the direct selections to preserve
    consistency
