# Milestones 352–356 — Selector and picker boundary hardening

This block continues the exact-head content-script hardening work without changing Drop Ads privacy, permissions, persistence, or release readiness. The changes are repository coverage only until the documented exact-head preflight and real Chromium/Firefox qualification are run.

## Milestone 352 — Selector id and attribute signal containment

Selector construction no longer lets `id` or reviewed attribute signal lookup failures escape the picker path. `id` is read inside a containment boundary and remains subject to the existing string-only stable-token rules. `getAttribute` lookup and each reviewed attribute read (`data-testid`, `data-test`, `data-qa`, `role`, `type`) are best effort: missing, non-function, or throwing collaborators simply contribute no attribute signal. Object-like values are never string-coerced.

Repository coverage: `tests/content-selector-signal-traps-v352.test.js`.

## Milestone 353 — Bounded sibling traversal without iterator hooks

`nth-of-type()` construction no longer invokes a caller-controlled iterator on `parent.children`. Parent/children metadata is read inside containment boundaries, the child count must be a safe non-negative integer, and the existing **10,000 sibling** ceiling is enforced before traversal. Children are inspected by bounded numeric index and sibling tags reuse the non-coercive tag helper. Ordinary DOM ordering and detached-target behavior remain unchanged.

Repository coverage: `tests/content-selector-sibling-boundary-v353.test.js`.

## Milestone 354 — Root, ancestor, and document collaborator containment

The exported selector generator now contains target `nodeType` inspection and ancestor advancement through the shared safe parent helper. Document uniqueness checks contain `querySelectorAll` lookup/call/result-length failures and require an exact numeric one-match result; malformed collaborators are treated as non-unique. The existing **maximum depth 5** and **400-character selector** work ceiling are unchanged.

Repository coverage: `tests/content-selector-root-document-boundary-v354.test.js`.

## Milestone 355 — Picker geometry snapshot boundary

Picker highlight geometry is now admitted through a minimal internal snapshot helper. Target connectivity, `getBoundingClientRect` lookup/call, and `left`/`top`/`width`/`height` reads are contained. Geometry values must already be finite numbers and width/height must be positive; strings/objects are not numerically coerced. Invalid or trapped geometry hides the highlight rather than escaping the picker event path. Normal DOMRect positioning and the existing 1px display minimum remain intact.

Repository coverage: `tests/content-picker-geometry-v355.test.js`.

## Milestone 356 — Documentation and release-gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized through this block. PR #7 remains draft and Issue #10 remains the authoritative exact-head Chromium + Firefox release gate.

No `npm ci`, test execution, `npm run check`, packaging, release verification, reproducibility verification, source qualification, qualification-record generation, or browser execution is claimed by this connector-only block. GitHub-hosted Actions runner allocation remains externally blocked by the account billing/spending-limit state and is neither a pass nor a failure.

## Invariants preserved

- no telemetry, analytics, browsing/request history, matched-element history, page/DOM snapshots, identifiers, or custom Drop Ads backend
- no permission or manifest expansion
- no retained picker target/geometry history
- existing selector/picker work ceilings remain bounded
- local blocking and community contribution semantics are unchanged
- real Chromium + Firefox observations are still required on the exact final head before PR #7 can leave draft state
