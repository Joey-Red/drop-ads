# Milestones 367–368 — Regression alignment and exact-head resynchronization

These milestones contain release-preflight maintenance only. No production runtime behavior, permissions, privacy model, or retention policy changed after the M362–365 content hardening.

## Milestone 367 — Align legacy cosmetic policy regression with canonical stylesheet grammar

Static review found `tests/content-cosmetic-policy-response-v317.test.js` still encoded expectations from before the canonical cosmetic stylesheet serializer was enforced. The successful response fixture now uses the shipped `selector { display: none !important; }\n` form, and the old expectation that an arbitrary raw 256 KiB non-selector string should be accepted was removed. One-over stylesheet rejection plus exact response/detachment/getter/proxy checks remain.

This was repository test maintenance only. The test was not executed here.

## Milestone 368 — Documentation and exact-head release-gate resynchronization

Because the M367 regression-maintenance commit changed repository HEAD after the M366 synchronization, `ROADMAP.md`, draft PR #7, and Issue #10 are resynchronized to the new exact head. The M366 Issue #10 head comment is superseded for qualification purposes.

## Invariants retained

- zero telemetry, analytics, browsing/request history, matched-element/page history, identifiers, or custom Drop Ads backend
- no permission, external-code, or data-retention expansion
- PR #7 remains draft and Issue #10 remains the authoritative Chromium + Firefox qualification gate
- no `npm ci`, `npm run check`, packaging, reproducibility, source qualification, or browser qualification execution is claimed in this connector-only work
