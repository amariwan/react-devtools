# UI design system

React DevTools uses a compact, semantic design system for its shell and plugin
panels. The interface is optimized for inspection work inside a docked panel:
clear hierarchy, stable controls, readable technical values, and minimal chrome.

## Styling

- Use Tailwind CSS v4 with the `devtools:` prefix for `packages/ui` and plugin
  components.
- Build shared controls from `packages/ui/src/components/ui/` and composites
  from `packages/ui/src/components/`. Keep plugin styling aligned with these
  primitives rather than adding local CSS.
- `packages/ui/src/css/devtools.css` is the source stylesheet. The build
  generates `packages/ui/src/css/devtools-css.generated.ts`; never edit the
  generated file directly.
- Keep raw CSS for semantic token declarations, Shadow DOM integration, and
  shared accessibility or motion rules. Prefer classes for component layout
  and state.
- Use inline styles only when values are runtime data, such as graph palette
  colors, picker coordinates, or progress width.

## Semantic tokens

CSS custom properties are scoped to the DevTools Shadow DOM host. Components
consume them through Tailwind semantic utilities so light and dark themes share
the same component markup.

| Role | CSS variable | Use |
| --- | --- | --- |
| Main surface | `--background` | Dock and panel canvas |
| Raised surface | `--card` | Inspector groups and stable content regions |
| Overlay surface | `--popover` | Menus, dialogs, and floating controls |
| Main text | `--foreground` | Primary labels and technical values |
| Secondary text | `--muted-foreground` | Descriptions and supporting metadata |
| Main accent | `--primary` | Active navigation, focus, and primary actions |
| Selection surface | `--accent` | Hover and selected row backgrounds |
| Destructive state | `--destructive` | Errors and destructive actions |
| Status | `--success`, `--warning`, `--info` | Runtime health and diagnostics |
| Dividers | `--border`, `--input` | Panel boundaries and control outlines |
| Focus | `--ring` | Keyboard focus indicators |

The matching public TypeScript token values and geometry helpers live in
`packages/ui/src/helpers/tokens.ts`. Keep the light and dark public token
contracts synchronized with the CSS theme values; status components should use
semantic status classes instead of embedding colors.

## Themes

- Theme values are `light`, `dark`, or the user preference `system`.
- The shell resolves `system` against `prefers-color-scheme` and applies the
  effective theme as `data-theme` on the DevTools wrapper and Shadow DOM host.
- Theme changes must not affect the inspected application document.
- Add component colors through semantic variables, not theme-specific utility
  colors. Verify both themes when changing tokens or shared components.

## Density and interaction

- Keep controls compact enough for a narrow dock while preserving readable
  labels and practical hit targets.
- Prefer Lucide icons for frequent actions and navigation. Icon-only controls
  need an accessible name and a tooltip or adjacent context where needed.
- Use the shared button, input, select, dialog, tooltip, and status primitives
  for consistent focus, disabled, selected, and error states.
- Respect reduced motion. Motion should communicate a state change and should
  not delay inspection workflows.

## Token changes

When changing a semantic color or geometry value:

1. Update both light and dark themes in `packages/ui/src/css/devtools.css`.
2. Update the exported TypeScript token values in
   `packages/ui/src/helpers/tokens.ts` when the public value changes.
3. Update token tests and inspect representative light and dark screenshots.
4. Rebuild `@next-devtools/ui` so the generated Shadow DOM stylesheet matches
   the source.
