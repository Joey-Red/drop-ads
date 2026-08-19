# Milestones 285–289 — UI collaborator boundary completion

This block finishes the current popup/Settings collaborator hardening pass without changing blocking policy, permissions, privacy guarantees, or the manual cross-browser release gate.

## Milestone 285 — Exact Settings personal-rule result boundary

The shared Settings runtime response boundary now detaches successful generic result objects before UI use instead of returning background-owned objects directly. Generic results must be ordinary or null-prototype own-data objects, contain no symbol/accessor fields, and stay within a small explicit field-count admission bound.

Personal-rule mutation results receive a stricter schema when `communitySubmission` is present:

- exact fields: `field`, `changed`, `rule`, `communitySubmission`
- `field` is `personalBlock` or `personalAllow`
- `changed` is a real boolean
- community state is one of `not-requested`, `not-eligible`, `prepared`, or `failed`
- the UI receives only the detached `communitySubmission` value it actually consumes

This preserves optional community preparation as a post-local-commit status only; it does not change eligibility or submission defaults.

## Milestone 286 — Country Settings collaborator boundary

`src/options/country.js` now uses the shared Settings boundary for both runtime replies and storage-change relevance. Country add/remove operations no longer inspect `response.ok`, `response.error`, or `response.result` directly, and the storage listener no longer indexes the browser-owned `changes` object.

Country TLD normalization, Navigation-only / All-resources behavior, rule replacement, local-only policy, status copy, and keyboard focus behavior are unchanged.

## Milestone 287 — Cosmetic Settings collaborator boundary

`src/options/cosmetics.js` now uses the same shared response and storage-change boundaries. Cosmetic add/remove operations do not dereference runtime reply fields directly, and relevant persisted-state changes are recognized through the trap-safe own-data helper.

Internal-mutation suppression, render coalescing, focus recovery, local cosmetic precedence, and rule semantics are unchanged.

## Milestone 288 — UI collaborator regression audit

The existing `ui-audit` preflight now checks the shipped popup, main Settings, Country Settings, and Cosmetic Settings sources for the reviewed collaborator discipline. It rejects:

- direct `response.ok`, `response.error`, or `response.result` access, including optional chaining
- direct persisted-state storage-change indexing through `changes[STORAGE_KEY]` or its optional-chain form on Settings surfaces
- removal of the popup or Settings boundary helper wiring

The checks are intentionally narrow to the browser-collaborator surfaces under review rather than imposing a broad syntax ban.

## Milestone 289 — Documentation and release-gate synchronization

The roadmap and draft PR are synchronized through this hardening block, and Issue #10 remains the authoritative exact-head Chromium + Firefox release gate.

The regression files added for Milestones 285–289 are **repository coverage only**. They were created through the GitHub connector and were not executed locally or in a browser in this work session. No claim is made that `npm ci`, `npm run check`, packaging, reproducibility, source qualification, Chromium, or Firefox validation passed on this head.

## Privacy and product invariants retained

Milestones 285–289 add no telemetry, analytics, browsing/request history, retained statistics, page/DOM history, identifiers, custom backend, new permissions, remote executable code, or hidden submission behavior. Automatic community preparation remains OFF by default, and local blocking remains independent of optional contribution preparation.
