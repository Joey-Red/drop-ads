# Milestones 982–991 — Cookie-banner action-context safety

This sequence adds a separate action-context safety layer on top of the existing bounded action-source identity checks. It remains top-frame-only, browser-local, fail-closed, and zero-retention. Repository tests, audits, and loopback fixtures are preflight/supporting evidence only; Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate.

## M982 — Secondary activation ancestry

`cookie-banner-action-context-safety.js` wraps the canonical action snapshot and rejects candidates nested inside labels, summaries, other controls, navigation carriers, or `role=button`/`role=link` ancestors. Composed ancestry is bounded to 16 steps and can cross open shadow hosts.

## M983 — Editable ancestor contexts

Candidates inside inherited `contenteditable` regions fail closed. Empty, `true`, and `plaintext-only` values are treated as editable; an encountered `contenteditable="false"` terminates inherited editing. The composed ancestor walk remains bounded.

## M984 — Editable action descendants

Candidate action subtrees are inspected with a 128-element ceiling. Explicitly editable descendants fail closed while ordinary non-editable spans/icons remain compatible.

## M985 — Editable accessible-name references

Existing bounded same-root `aria-labelledby` references receive an additional editable-tree check. At most four references and 256 attribute characters are accepted, with at most 64 elements inspected per referenced label tree.

## M986 — Popup-launch semantics

Controls with `aria-haspopup` fail closed unless the attribute is absent or exactly `false`. A reject-looking menu/listbox/tree/grid/dialog trigger is not treated as a one-shot consent rejection.

## M987 — Toggle semantics

Controls exposing `aria-pressed`, `aria-checked`, or switch/checkbox/radio/menuitemcheckbox/menuitemradio roles fail closed. Toggle/selection UI cannot masquerade as an automatic rejection action.

## M988 — Popover targets

Controls carrying `popovertarget` or `popovertargetaction` fail closed so disclosure/popover triggers are not automatically activated as rejection actions.

## M989 — Canonical audit extension

`tools/cookie-banner-hardening-audit.mjs` now reads the action-context layer, protects every M982–M988 invariant, requires the new regressions, enforces Firefox/Chromium script-order parity, and keeps the zero persistence/network/profile surface plus all older compatibility markers.

## M990 — Loopback action-context fixtures

`tools/cookie-banner-action-source-qualification-server.mjs` now includes isolated routes for label ancestry, editable ancestors/descendants/referenced labels, `aria-haspopup`, toggle semantics, and popover targets. Unsafe routes only expose local FAIL status if activated; the existing safe control remains the positive reject-mode control.

## M991 — Documentation and exact-head synchronization

The roadmap, exact-head action-source qualification guide, and Issue #10 qualification delta are synchronized to this sequence. No browser pass is claimed by repository work.

## Privacy boundary

The action-context layer retains no page text, DOM snapshots, accessible names, navigation/editing state, click outcomes, counts, timestamps, identifiers, language profile, analytics, or telemetry. It performs bounded transient inspection only and makes no network request.
