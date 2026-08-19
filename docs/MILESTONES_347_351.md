# Milestones 347–351 — Content helper boundary completion

These milestones continue content-script hardening without changing Drop Ads privacy, permissions, retention, blocking precedence, or release-gate requirements. Connector-created regression files are repository coverage only and are **not** represented as executed local/browser validation.

## Milestone 347 — Picker session TTL and option-failure boundary

`src/content/picker.js` now caps direct `createPickerSessionTimer()` TTL values at the reviewed production picker lifetime of **120,000 ms**. The exact maximum remains valid; zero, fractional, negative, or over-limit values fail before timer scheduling.

Picker timer option metadata and descriptor traps now map to deterministic validation failures without inspecting properties on the caught value. Exact plain own-data options, timer collaborator validation, and generation-safe arm/cancel behavior remain unchanged.

Repository coverage: `tests/content-picker-ttl-bound-v347.test.js`.

## Milestone 348 — Own-only content message schema lookup

`src/content/message-contract.js` now resolves the expected content-message schema through the existing own-data field boundary rather than normal object indexing. Inherited `Object.prototype` names such as `toString`, `constructor`, and `__proto__` are treated exactly like unknown message types and return `null` instead of escaping the fail-closed path.

The reviewed `start-element-picker`, `cosmetic-refresh`, and `cleanup-context-target` schemas, detached exact-envelope validation, and target URL bounds remain unchanged.

Repository coverage: `tests/content-message-schema-own-lookup-v348.test.js`.

## Milestone 349 — Non-coercive placeholder dimensions

Context-cleanup placeholder sizing now accepts only finite numeric width/height values. Object/string values are not passed through `Number()` or conversion hooks. Bounding-rect and individual width/height read failures are contained.

The existing sizing behavior remains: values below 1 px are ignored, useful fractional dimensions are rounded up, and each dimension is capped at **4,096 px**. Placeholder creation remains best effort, transparent, noninteractive, and contains DOM construction failures.

Repository coverage: `tests/content-context-placeholder-dimension-v349.test.js`.

## Milestone 350 — Exported cleanup-element trap containment

The exported `cleanupElement()` boundary now contains target identity/state reads, active-element/focus inspection, media pause inspection, placeholder construction, and replace/remove method lookup/calls.

Revoked or trapped targets fail closed as `target-missing`; unusable removal paths return `target-not-removable`. Focus blur and media pause remain best-effort and cannot prevent otherwise safe cleanup. Normal kind classification, placeholder replacement, and fallback removal semantics remain intact.

Repository coverage: `tests/content-context-cleanup-element-traps-v350.test.js`.

## Milestone 351 — Documentation and release-gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through this block. The resulting exact branch head remains subject to the same clean preflight, deterministic packaging/source qualification, and real Chromium + Firefox browser matrix as every prior hardening block.

No `npm ci`, `npm run check`, packaging, reproducibility, source qualification, qualification-record generation, or browser execution is claimed by these connector-only changes. PR #7 remains draft and Issue #10 remains the authoritative exact-head release gate.
