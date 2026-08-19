# Milestones 300–304 — UI collaborator value bounds

This block tightens values returned by browser/runtime collaborators before popup or Settings code can retain, compare, or render them. It does not add request observation, page/content history, telemetry, identifiers, a Drop Ads backend, or new permissions.

## Milestone 300 — Canonical Settings subscription result identity

Settings subscription mutation replies now enforce the same identity ceilings already applied to configured subscriptions. Successful reply ids must be non-empty, at most 96 characters, and match the reviewed `[a-z0-9._-]` syntax. Optional titles must be non-blank and no longer than 120 characters. Existing exact descriptor-safe nested response schemas, success/failure exclusivity, optional `enabled`, and reviewed source enums remain intact.

Repository coverage: `tests/options-subscription-result-identity-v300.test.js`.

## Milestone 301 — Bounded generic Settings result strings

The recursively detached/frozen generic Settings result tree now caps every string at 16,384 characters, matching the existing network-rule value ceiling. This applies at the root and through nested objects/arrays while retaining the existing 32-fields-per-object, 128-array-entry, depth-8, and 512-value work limits, finite-number requirement, dense-array checks, cycle rejection, and descriptor-safe own-data traversal.

Repository coverage: `tests/options-generic-result-string-bound-v301.test.js`.

## Milestone 302 — Bounded popup active-tab URL snapshots

Popup active-tab snapshots reject browser-owned `url` strings over 16,384 characters before storing the detached tab view. The existing dense maximum of 16 tab candidates, first-result selection, non-negative safe-integer tab id requirement, own-data field checks, and null-prototype support are unchanged. URL scheme gating and domain normalization remain in `popup.js`; this boundary adds no browsing-history retention.

Repository coverage: `tests/popup-active-tab-url-bound-v302.test.js`.

## Milestone 303 — Canonical popup UI domain collections

Popup-consumed persisted/session domain collections must now already be canonical source-of-truth arrays: valid canonical domains, sorted, and duplicate-free. Uppercase/noncanonical, malformed, duplicate, or out-of-order values fail before UI use instead of being silently repaired at the collaborator edge. Existing dense 5,000-domain bounds, exact popup UI schemas, enabled/cookie-mode checks, session strict-shape normalization, and frozen detached output remain intact.

Repository coverage: `tests/popup-ui-domain-canonical-v303.test.js`.

## Milestone 304 — Documentation and exact-head release gate

`ROADMAP.md`, this milestone record, draft PR #7, and Issue #10 are synchronized through Milestone 304. PR #7 remains draft and Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate.

## Validation status

The regression files created in Milestones 300–303 are **repository coverage only**. No `npm ci`, `npm run check`, packaging, reproducibility verification, source qualification, qualification-record generation, Chromium execution, or Firefox execution is claimed from these connector-only changes. GitHub-hosted Actions runner allocation remains blocked by the account billing/spending-limit state; that is neither a product failure nor successful qualification.

Privacy invariants remain unchanged: no telemetry, analytics, browsing/request history, retained matched-rule statistics, DOM/page history, identifiers, cookie database access, custom Drop Ads backend, or new permissions.
