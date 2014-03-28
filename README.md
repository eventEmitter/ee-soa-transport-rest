#EE-SOA-Transport-Rest

Rest specific transport implementation

##Notes
  1. Do we need to leave the original field of a sub request in its parent? So does:
    URL: /event/5
    SELECT: venue.*

    leave the venue selection in