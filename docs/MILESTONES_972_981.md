# Milestones 972–981 — Cookie-banner action identity hardening

This sequence extends the privacy-minimal cookie-banner rejection runtime without changing the zero-telemetry invariant. All action/page/accessibility text is transient. Repository tests, audits, and loopback fixtures are supporting preflight evidence only; Issue #10 remains the authoritative exact-head Chromium + Firefox runtime qualification gate.

## M972 — Direct channel agreement

Input button `value` and `aria-label` are independently bounded and, when both are present, must normalize to the same exact action identity. A preferred direct channel can no longer hide an oversized or contradictory secondary channel.

## M973 — Referenced-label descendant safety

Each `aria-labelledby` label target receives a bounded element walk in addition to the existing same-root/text bounds. Nested interactive controls, links, Drop Ads-owned descendants, or over-budget label trees fail closed.

## M974 — Drop Ads-owned action descendants

Candidate page action subtrees are bounded and cannot derive visible action identity from descendants owned by Drop Ads or the picker UI.

## M975 — Nested interactive action descendants

Otherwise eligible page actions fail closed when their bounded subtree contains nested anchors, buttons, form controls, summary elements, or `role=button`/`role=link` descendants. Ordinary non-interactive spans/icons remain compatible.

## M976 — Hidden action text

`hidden`, `inert`, and `aria-hidden="true"` descendants may remain when they are empty/decorative, but hidden non-whitespace naming text or over-budget hidden text fails closed. Hidden-only reject text cannot become automatic action identity.

## M977 — Invisible/bidi action formatting

Direct, visible, and referenced naming sources reject zero-width/BOM and bidi embedding/override/isolate controls before canonical normalization can erase them.

## M978 — Bounded unsupported-script refusal

After bounded NFKD folding and combining-mark removal, surviving non-ASCII Unicode letters/numbers cause the action to fail closed. This prevents mixed-script semantic suffixes from disappearing into an exact reviewed ASCII reject label. Reviewed Latin diacritics remain supported; Unicode work is raw-length/fold-length bounded and does not inspect browser locale.

## M979 — Canonical audit extension

`tools/cookie-banner-hardening-audit.mjs` now protects the M972–M978 invariants, regression files, Unicode-work ordering, manifest parity, and existing privacy/network prohibitions while preserving earlier canonical compatibility markers and `npm run check` wiring.

## M980 — Loopback qualification expansion

`tools/cookie-banner-action-source-qualification-server.mjs` now includes isolated routes for direct-channel conflicts, unsafe referenced-label descendants, Drop Ads-owned/nested-interactive descendants, hidden-only text, invisible formatting, and mixed-script labels. The server remains loopback-only, GET/HEAD-only, bounded, external-request free, and observation-free.

## M981 — Documentation and exact-head synchronization

`docs/COOKIE_BANNER_ACTION_SOURCE_QUALIFICATION.md`, `ROADMAP.md`, and Issue #10 are synchronized with M972–M981. The exact-head browser gate must verify the safe control still activates in reject mode, all unsafe identity routes remain untouched, off mode leaves every action untouched, and no action/page/accessibility/language data is retained.

## Privacy and release boundary

Nothing in M972–M981 adds telemetry, analytics, browsing/request history, action-name history, DOM/page snapshots, language profiling, retained click/banner outcomes, timestamps, identifiers, an owned Drop Ads backend, or external qualification traffic. Connector-created repository changes were not executed here as real-browser observations; no Chromium or Firefox pass is claimed by these milestones.
