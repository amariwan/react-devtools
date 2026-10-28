# Next.js Router and Pages

`withNextDevtools` discovers App Router files at config time and injects a
development-only route-file payload. The Pages panel combines this static route
tree with a client route runtime that observes history and `popstate` changes.
Monorepos and custom hosts can provide trusted `projectRoot` and `appRoot`
options to avoid relying on the process working directory.
Route rows can also show static `server`/`client` execution metadata inferred
from the route file directive/default, without claiming live RSC state. The
Pages panel supports bounded route search and navigation for discovered static
patterns; dynamic patterns expose explicit parameter fields, require values for
normal/catch-all segments, and allow optional catch-all segments to navigate to
their base path without a value.

Static route structure and live client location are separate data sources.
Dynamic, catch-all, parallel, grouped, and intercepting segments are parsed by
the route scanner. Server redirects, transition errors, and live server render
metadata remain follow-up capabilities.
