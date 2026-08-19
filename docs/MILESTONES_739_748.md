# Milestones 739–748 — Settings accessibility and resilient presentation

This block hardens the human-facing Settings and popup surfaces without changing blocking semantics, permissions, privacy retention, or the real-browser qualification gate.

## M739 — Label Settings landmarks and dynamic policy lists

- Added an explicitly labelled Settings main landmark.
- Added labelled major Settings section landmarks.
- Added stable accessible names for dynamic policy lists.

## M740 — Make Settings feedback regions explicitly atomic

- Dynamic success/progress regions use polite atomic announcements.
- Error regions remain alerts and explicitly announce atomically.

## M741 — Enforce full-size Settings action targets

- Compact remove and secondary actions retain a 44px minimum target height.
- Checkbox label rows retain a 44px minimum activation target.

## M742 — Support forced-colors Settings presentation

- Added a forced-colors contract for borders, muted text, errors, overridden policy, and keyboard focus.
- Presentation remains understandable without relying on custom color alone.

## M743 — Harden Settings reflow for zoom and narrow viewports

- Flexible rows wrap before horizontal clipping.
- Controls and dynamic-list children may shrink within their containers.
- Very narrow/high-zoom layouts stack basic input rows into full-width controls.

## M744 — Make Settings text resilient to long localized and user values

- Headings, labels, buttons, hints, rule notes, subscription titles, and URLs may emergency-wrap.
- User policy values remain visible rather than being visually truncated.

## M745 — Make Settings reduced-motion behavior future-proof

- Reduced-motion preference suppresses smooth scrolling, future animations, and future transitions.
- No animation was added.

## M746 — Honor increased-contrast Settings preferences

- Increased-contrast preference removes muted-opacity cues and strengthens boundaries and override markers.
- Error emphasis does not depend on color alone.

## M747 — Preserve full site identity and target size in the popup

- Popup toggle rows retain a 44px minimum activation target.
- Long hostnames wrap instead of using ellipsis truncation.
- Popup guidance and status text can emergency-wrap.

## M748 — Add executable Settings accessibility gate

- Added `tools/settings-accessibility-audit.mjs` covering the M739–M747 source invariants and regression files.
- Wired `settings-accessibility-audit` into `npm run check`, therefore into `qualify:preflight`.
- Added `tests/settings-accessibility-audit-v748.test.js` to protect package-script/check wiring.

## Validation status

These changes and regressions were authored through the GitHub connector. They were not executed locally or in Chromium/Firefox during this work. Issue #10 remains the authoritative exact-head real-browser qualification gate.

No telemetry, analytics, request/browsing history, page/DOM history, retained statistics, identifiers, polling, or owned Drop Ads backend behavior was added.
