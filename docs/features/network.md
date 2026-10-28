# Network

The Network runtime records browser-observable resource timing metadata with a
bounded buffer, explicit start/stop/clear controls, URL search, initiator
filtering, expandable timing details, sanitized JSON export, and
credential/query redaction. When the browser exposes `responseStatus` on a
resource entry, the HTTP status is retained and displayed as optional metadata.
It covers browser resources and supported same-origin `PerformanceObserver`
data.

It does not claim visibility into request methods, server-side fetches, database
calls, request bodies, cookies, authorization headers, or all Next internal
requests. Those require separate, explicit instrumentation and privacy policy.
