# Milestones 331–335 — Content mutation and page-safety boundaries

This block tightens the content-side trust boundary around cosmetic mutation replies and picker/page collaborators without changing blocking semantics, permissions, or the privacy model.

## Milestone 331 — Canonical cosmetic selectors in picker mutation replies

`src/content/message-contract.js` now requires the nested cosmetic mutation result rule to carry a selector that is already in the same reviewed declarative form accepted by the core cosmetic normalizer. Content does not trim, repair, or reinterpret a malformed reply.

The returned selector must be non-empty and already trimmed, at most **512 characters**, printable ASCII, declaration-free, and outside the existing unsupported procedural/scriptlet/external-resource syntax classes. Both `changed: true` and `changed: false` remain valid because duplicate additions intentionally return the canonical existing rule.

Repository coverage: `tests/content-cosmetic-mutation-selector-v331.test.js`.

## Milestone 332 — Canonical cosmetic scope arrays in picker mutation replies

Optional `domains` and `excludedDomains` in the returned cosmetic rule now have to be canonical rather than merely bounded strings. The existing **64-domain / 253-character-domain** limits and dense normal-array requirement remain in force.

When present, scope arrays must be non-empty, sorted, and duplicate-free. Each entry must already be a trimmed lowercase canonical HTTP-host representation compatible with the core domain normalizer, including canonical `localhost`, IPv4, and punycode forms. Empty canonical scopes remain represented by omission of the optional field.

Repository coverage: `tests/content-cosmetic-mutation-scopes-v332.test.js`. The earlier M323 fixture was updated only to provide the standard `URL` collaborator used by the new canonical-domain check.

## Milestone 333 — Bounded picker composed-path ownership inspection

The element picker no longer calls `event.composedPath?.().includes(...)` directly. It now resolves the inherited `composedPath` function through bounded data-descriptor prototype inspection, rejects own overrides/accessors, captures the callable before invocation, contains invocation/metadata failures, and reads returned path entries through own data descriptors.

Ownership inspection is capped at **8 prototype levels** and **256 composed-path entries**. Malformed, sparse, accessor-backed, oversized, throwing, or revoked inputs fail closed to “not owned by picker” instead of escaping the event handler. Normal closed-shadow picker ownership and selection/cancel/save lifecycle are unchanged.

Repository coverage: `tests/content-picker-event-path-v333.test.js`.

## Milestone 334 — Non-coercive cosmetic local/private hostname classification

`isLocalOrPrivatePageHostname()` now accepts strings only. Non-string direct inputs fail safe as local/private without invoking `String()`, `toString`, `valueOf`, or `Symbol.toPrimitive`. The private IPv4 helper likewise consumes only a string.

Canonical string behavior remains unchanged for localhost/local/home.arpa names, reviewed private/special IPv4 ranges, local/private/multicast IPv6 ranges, and public hostnames. Normal remote-cosmetic and page-policy paths already provide canonical strings.

Repository coverage: `tests/cosmetic-local-host-noncoercive-v334.test.js`.

## Milestone 335 — Documentation and exact-head gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through this block. Issue #10 remains the authoritative real Chromium + Firefox qualification gate. Its full historical checklist is preserved intact; the latest exact-head gate comment is the authoritative moving implementation-head record and explicitly supersedes the legacy static head line retained in the issue body.

## Validation status

The regression files above are **repository coverage only**. No `npm ci`, `npm run check`, packaging/release verification, reproducibility run, source qualification, or browser qualification was executed or claimed by this connector-only milestone block.

GitHub-hosted Actions runner allocation remains unavailable while the account billing/spending-limit condition prevents a hosted runner from starting. That external condition is neither a product failure nor successful qualification.

## Privacy and release invariants

These milestones add no telemetry, analytics, browsing/request history, matched-element history, identifiers, cookie database access, custom backend, new permission, or remote-code path. PR #7 remains draft and Issue #10 remains open until real exact-head Chromium and Firefox observations are recorded against the generated artifacts.
