# Milestones 336–340 — Content helper boundaries

This block closes several direct content-helper trust gaps without changing blocker behavior, permissions, or the privacy model.

## Milestone 336 — String-only bounded CSS escaping

The exported `DropAdsSelectorUtils.cssEscape()` helper no longer applies `String(...)` to arbitrary direct caller input. It now accepts strings only and rejects raw input above the existing **400-character selector work ceiling** before code-point iteration.

Valid leading-digit, second-digit-after-hyphen, punctuation/control, and astral-Unicode escaping behavior remains unchanged. Normal picker selector tokens are already strings and bounded before this helper is reached.

Repository coverage: `tests/content-selector-css-escape-boundary-v336.test.js`.

## Milestone 337 — Non-coercive context-cleanup tag classification

`cleanupKindForTag()` now classifies strings only. Non-string, revoked-Proxy, or custom-conversion direct inputs take the existing conservative `element` fallback without invoking caller conversion hooks.

The reviewed image/media/frame/object/link mappings remain case-insensitive for valid string tag names. DOM removal semantics are unchanged.

Repository coverage: `tests/content-context-cleanup-tag-v337.test.js`.

## Milestone 338 — Bounded comparable URL inputs

`normalizeComparableUrl()` now requires both the candidate value and base URL to be non-empty strings no longer than the existing **16,384-character context/network URL ceiling** before invoking the URL parser. Objects, revoked proxies, and custom conversion hooks are not coerced.

Valid HTTP(S)-only canonicalization, relative resolution, and fragment removal remain unchanged.

Repository coverage: `tests/content-context-cleanup-url-v338.test.js`.

## Milestone 339 — Exact remembered context-target status records

`rememberedTargetStatus()` now snapshots only an ordinary/null-prototype exact `{element,url,capturedAt}` record through enumerable own data descriptors. Prototype/own-key/descriptor/revoked-Proxy failures and accessors fail closed without execution.

Remembered URLs stay within the **16,384-character** ceiling. Capture/supplied clock values must be finite non-negative numbers, a clock preceding capture fails closed, and the existing **10-second** target lifetime remains authoritative. Connection and live-URL inspection failures are contained while normal browser elements preserve the existing match/mismatch/expired/detached/changed behavior.

Repository coverage: `tests/content-context-target-status-v339.test.js`.

## Milestone 340 — Documentation and exact-head gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through this block. Issue #10 remains the authoritative real Chromium + Firefox qualification gate; exact-head comments supersede its legacy static implementation-head line without rewriting the historical browser checklist.

## Validation status

The M336–339 regression files are **repository coverage only**. No `npm ci`, `npm run check`, packaging/release verification, reproducibility run, source qualification, or browser qualification was executed or claimed by this connector-only milestone block.

GitHub-hosted Actions runner allocation remains unavailable while the account billing/spending-limit condition prevents a hosted runner from starting. That external condition is neither a product failure nor successful qualification.

## Privacy and release invariants

These milestones add no telemetry, analytics, browsing/request history, matched-element history, identifiers, cookie database access, custom backend, new permission, or remote-code path. PR #7 remains draft and Issue #10 remains open until real exact-head Chromium and Firefox observations are recorded against the generated artifacts.
