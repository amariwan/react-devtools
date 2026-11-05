---
target_identity: "file:/Users/snow/dev/apps/web/react-devtools/packages/ui/src/shell/shell.tsx"
target_fingerprint: "sha256:a2131400a078fcbf59165e4e3e2618b34b3d1b83edb0357a77095143c96c53d3"
target_path: /Users/snow/dev/apps/web/react-devtools/packages/ui/src/shell/shell.tsx
timestamp: 2026-11-04T22-20-10Z
slug: packages-ui-src-shell-shell-tsx
---
Method: dual-agent (A: /root/design_review · B: /root/detector_review)

# DevTools UI critique — 2026-11-04

Target: packages/ui/src/shell/shell.tsx, live showcase at localhost:3000. Current dirty worktree, read-only review.

Design health: 24/40 (acceptable). Heuristics 1–10: 2, 3, 3, 3, 2, 2, 3, 2, 2, 2.

Specificity: the underlying route, component and runtime data are product-specific; the muted rail, generic cards and React-logo-centric Overview do not yet signal the Next.js diagnostic workflow.

Strengths: connected/health status is visible; panel headers/navigation are consistent; Pages search and Navigate actions are clear; keyboard tablist and shortcuts are present.

Priority issues:
1. P1 Mobile Components toolbar clips the filter at 440px and pushes Inspector below the long tree. Stack the controls and expose an Inspector switch.
2. P1 Overview Settings quick link dispatches `next-devtools:navigate` with `settings`, but shell navigation accepts only registered panel IDs; the action is ignored. Route it to the Settings state.
3. P1 Overview leads with logo, metrics, repository links and duplicate panel buttons instead of the current route and a clear first diagnostic action. Reorder around route, diagnostics and inspect.
4. P2 Mobile rail hides all text labels below 760px. Add the active panel name and a labeled overflow path.
5. P2 Components shows minified names and `Source: not recorded` without guidance; explain provenance and offer a next action.
6. P2 Network truncates repeated localhost URLs; show unique path or filename and reveal full URL in details.

Nielsen details: status 2, match 3, control 3, consistency 3, prevention 2, recognition 2, efficiency 3, minimalism 2, recovery 2, help 2. Cognitive load is moderate on desktop and high on mobile; first-timers must recall icon meanings, while expert users encounter minified tree entries. The connected state reassures, then source gaps lower confidence.

Detector: CLI 0 findings in `shell.tsx` and shell directory; live injection reported no anti-patterns. Manual visual and functional findings remain. tasteskill app inspector on the unopened showcase reported 0 findings and does not validate the dock; source lint reported 72 FAIL and 12 WARN, including many app-allowed borders, overlays and code monospace, so these are not treated as confirmed UI defects. Desktop 1707px and mobile 440px inspected in browser. The Next.js Date.now hydration error belongs to showcase content, outside this shell critique.

Suggested first pass: fix mobile Components, Settings action, then Overview task hierarchy. Validate at 440px and keyboard-only afterward.
