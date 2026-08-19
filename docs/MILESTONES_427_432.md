# Milestones 427–432 — Subscription, remote-response, and direct-input boundaries

This block follows the canonical M422–426 core/context boundary block and hardens subscription/cache compatibility, remote fetch response admission, community eligibility, guarded runtime events, and direct personal-rule input work without changing Drop Ads permissions, blocking precedence, or privacy model. Connector-created or connector-edited regression coverage described here is repository coverage only and was not executed as local/package/browser qualification in this work stream.

## Milestone 427 — Contain subscription collection array-kind traps

Direct subscription collection admission contains revoked/throwing `Array.isArray()` failures. Ordinary non-array persisted inputs retain the reviewed empty-collection compatibility fallback, while revoked array-kind values fail deterministically before normalization work. Cached network/cosmetic append helpers contain the same failure class so malformed decoded collections contribute no policy instead of escaping merge. Existing **128-subscription**, cache provenance/storage, remote-rule safety, and precedence semantics remain unchanged.

## Milestone 428 — Snapshot remote-list response metadata before body admission

Remote-list download admission snapshots response `ok`, `redirected`, `status`, and the headers collaborator before body parsing. Native `Response` / `Headers` objects use reviewed prototype descriptors; injected plain objects use own-data descriptor reads. `Headers.get` is captured and bound once, and Content-Type / Content-Length are read only through that captured function. Accessor/proxy/type-confused metadata fails closed before consuming the body. Redirect rejection, non-list media rejection, strict UTF-8 handling, and the existing **5,000,000-byte** download ceiling remain unchanged.

Focused repository coverage is retained under historical response-metadata regression filenames.

## Milestone 429 — Make community eligibility predicate fail closed

`isCommunityCandidateEligible()` treats malformed direct candidates as ineligible instead of allowing normalization failures to escape. Malformed, revoked, accessor-backed, or type-confused inputs return `false` without coercion. Valid unscoped public domain/exact-URL candidates remain eligible; resource-scoped, pattern, unsupported, and unsafe/private candidates remain ineligible or are rejected by the existing command-style submission boundary. Community contribution remains optional and independent from successful local blocking.

Focused repository coverage is retained under the historical community-eligibility fail-closed regression filename.

## Milestone 430 — Capture guarded runtime `onMessage` collaborator once

`createMessageGuardedApi()` captures the raw runtime object and its `onMessage` event once during guard creation. Transactional listener add/remove uses only that captured event, so later runtime namespace mutation cannot register on one event and remove from another. Duplicate-add suppression, synchronous callback correctness, inert retained wrappers after removal failure, group fallthrough, exact message validation, and `rejectUnknown` behavior remain unchanged.

Focused repository coverage is retained under the historical message-guard event-capture regression filename.

## Milestone 431 — Bound raw personal-rule input before trimming

Direct `ruleFromUserInput()` enforces exported `MAX_PERSONAL_RULE_INPUT_CHARS = 2 × MAX_NETWORK_RULE_VALUE_CHARS` before `trim()`. This bounds work on huge whitespace-padded input while preserving ordinary surrounding-whitespace compatibility. The canonical **16,384-character** network value ceiling remains authoritative after trimming/normalization, and input remains primitive-string-only with existing domain-vs-HTTP(S) classification.

Focused repository coverage is retained in `tests/personal-rule-input-preflight-v425.test.js` as a historical filename; its assertions are synchronized to this behavior.

## Milestone 432 — Documentation and exact-head release-gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through this block. PR #7 remains draft and Issue #10 remains the authoritative exact-head Chromium + Firefox release gate. Repository coverage is preflight only and cannot substitute for a clean exact-head package/source verification sequence plus real-browser observations on the same generated package hashes.

## Privacy and product invariants retained

- no telemetry, analytics, browsing/request history, retained matched-rule/request statistics, page/DOM history, identifiers, or custom Drop Ads backend
- no permission expansion or remote executable-code path
- network precedence remains **personal allow > personal block > shared allow > shared block**
- cosmetic precedence remains **personal allow > personal hide > shared allow > shared hide**
- third-party cookie protection, hard all-cookie mode, site/session recovery, transactional list activation, and last-known-good behavior remain unchanged
- optional GitHub contribution remains off by default and independent from successful local blocking
