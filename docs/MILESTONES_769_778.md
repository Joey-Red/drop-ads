# Milestones 769–778 — Settings policy guidance and navigation semantics

This block improves Settings form semantics, operational guidance, dynamic subscription naming, and keyboard orientation without changing blocking precedence, permissions, retention, or the real-browser release gate.

## M769 — Reject empty primary policy submissions natively

- Personal block, personal allow, and cookie-exception inputs are native `required` controls.
- Non-empty policy validation remains owned by existing normalizers/runtime policy paths.
- Added `src/options/ui-semantics.js` as a small local Settings semantics enhancement surface.

## M770 — Connect Settings actions to the policy lists they change

- Add/refresh actions expose `aria-controls` for their resulting policy lists.

## M771 — Associate personal policy forms with their guidance

- Personal block/allow inputs and submit actions now retain their live error descriptions and also reference section guidance.

## M772 — Associate list and cookie controls with operational guidance

- Filter-list controls include list-operation guidance alongside refresh/error feedback.
- Cookie controls include hard-mode/recovery guidance alongside transaction feedback.

## M773 — Associate country and cosmetic controls with policy guidance

- Country controls include the suffix-policy/non-GeoIP explanation.
- Cosmetic controls include the local-only/no-page-history explanation.

## M774 — Label backup actions from visible content

- Backup actions derive their accessible group name from the visible section heading.
- Both backup guidance paragraphs are associated with the group and controls without replacing status/error feedback.

## M775 — Give dynamic subscription toggles distinct accessible names

- Rendered subscription enable checkboxes include the subscription title in their accessible name.
- A list-scoped MutationObserver reapplies names after local rerenders and disconnects on pagehide.
- No browsing/request activity or navigation history is retained.

## M776 — Mark the active Settings jump destination

- The section navigator uses `aria-current=location` for the current in-page fragment.
- The marker is derived only from current fragment state and is not persisted.

## M777 — Move focus to Settings jump destinations

- Activating a section jump moves programmatic focus to the visible section heading while keeping native fragment navigation.
- Destination headings use `tabindex=-1` and an explicit focus outline, including forced-colors support.

## M778 — Extend the executable Settings accessibility gate

- `tools/settings-accessibility-audit.mjs` now protects M769–M777 invariants and regression files.
- Added `tests/settings-accessibility-audit-v778.test.js`.
- ROADMAP advances to M779; Issue #10 remains the authoritative exact-head Chromium + Firefox browser gate.

## Validation status

All implementation, tests, audit changes, and documentation in this block were authored through the GitHub connector. They were not executed locally or in Chromium/Firefox during this work. No test, audit, packaging, or browser qualification pass is claimed.

No telemetry, analytics, browsing/request history, retained statistics, identifiers, page/DOM history, polling, or owned Drop Ads backend behavior was added.
