# Pick Element and Open in Editor

Pick Element resolves a DOM element through React Grab when available and falls
back to Fiber debug source or an explicit `data-ndt-source` attribute. Every
result carries an evidence origin: `react-grab`, `fiber-definition`,
`compile-attribute`, or `unavailable`. The UI must distinguish unavailable
metadata from an exact usage location and now carries an explicit role:
React Grab/compile attributes are `element-usage`, Fiber is
`component-definition`, and unavailable evidence is `unknown`. A Fiber
definition location is not silently presented as JSX usage.

Open in Editor is a host action. The browser sends a path and location, while
trusted roots and editor executable mappings stay server-side. The action is
development-only, origin-checked, canonicalized, and tested against traversal,
symlink, invalid editor, and client-root override cases.
