# Plugin system

Plugins declare a manifest and register panels, inspectors, commands, settings,
timeline layers, and disposers through `PluginContext`.

Contract-tested guarantees:

- setup failures roll back owned resources;
- stale unregister handles cannot remove newer registrations;
- suspension cleans resources and reactivation runs setup again;
- disposal is idempotent and owned resources are removed;
- optional state plugins use detection followed by `on-start`, because their
  integrations are not host capability descriptors.

`on-demand` and `on-capability` remain supported, but every new plugin using
them must provide a reachable activation path and a test proving it. An
`on-capability` plugin without `requiredCapabilities` is marked as an explicit
registration error instead of remaining silently registered. Manifest metadata
is not an authorization boundary.
