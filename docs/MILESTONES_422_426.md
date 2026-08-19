# Milestones 422–426 — Core and context boundary completion

This block closes direct compiler, context-click, personal-domain, and country-policy boundary gaps without changing permissions, policy precedence, the serverless architecture, or the zero-telemetry/zero-history retention model. Connector-created or edited regression coverage is repository coverage only and was not executed as local/package/browser qualification in this workflow.

## Milestone 422 — Complete rule compiler descriptor-safe state and option reads

Rule compiler relevant-policy admission contains revoked-Proxy/prototype failures and detaches relevant fields through shared own-data reads. `compileRules.excludedInitiatorDomains` and `compileManagedRules.maxDynamicRules` are read from descriptor-safe validated option fields instead of caller-controlled normal property access. Existing DNR budgeting, precedence, personal/recovery reserve, resource-type, disabled-site, and cookie behavior remain unchanged.

Coverage: `tests/rules-compiler-descriptor-v422.test.js`.

## Milestone 423 — Snapshot context-menu block input once

Context feedback detaches the supported menu id, selected target URL, and optional frame id from one descriptor-safe click snapshot. Both the local rule candidate and retained cleanup target are derived from that same snapshot; the clicked tab id is likewise read once through the safe own-data boundary. Malformed or type-confused click fields fail before pending publication. Existing default/domain/exact menu semantics, URL normalization, committed-state recovery, and the **128 pending** ceiling remain unchanged.

Coverage: `tests/context-feedback-click-snapshot-v423.test.js`.

## Milestone 424 — Require primitive booleans for direct personal-domain flags

Direct `setDomainFlag(values, domain, present)` and `setSiteDisabled(sites, domain, disabled)` calls require primitive booleans before domain normalization or collection work. Truthy strings/numbers, boxed booleans, objects, arrays, and conversion hooks cannot silently choose add/remove semantics. The existing **5,000-domain** ceiling, compatibility non-array fallback, canonical sort/dedupe behavior, and true-add/false-remove semantics remain unchanged.

Coverage: `tests/personal-domain-flag-boolean-v421.test.js` (historical filename retained).

## Milestone 425 — Contain country-policy revoked-Proxy array-kind checks

Country-policy collection admission contains `Array.isArray()` failures before compatibility/dense-array handling. Ordinary non-arrays keep the reviewed empty fallback while revoked collection proxies fail deterministically. Parsed country-label inspection contains the same array-kind failure and returns the existing safe `null` fallback. The **10,000-candidate** ceiling and country-rule semantics remain unchanged.

Coverage: `tests/country-policy-revoked-proxy-v402.test.js` (historical filename retained).

## Milestone 426 — Documentation and exact-head release-gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through this block. PR #7 remains draft and Issue #10 remains the authoritative exact-head Chromium + Firefox release gate. Connector-only repository edits do not constitute `npm ci`, repository test execution, package/release verification, reproducibility verification, source qualification, qualification-record generation, or browser qualification. Any source commit after real browser observation invalidates that observation.

## Privacy invariants

No milestone in this block introduces telemetry, analytics, browsing/request history, retained blocked-request or matched-element history, page/DOM capture, user/device identifiers, cookie-database access, a custom Drop Ads backend, new permissions, or executable remote code.
