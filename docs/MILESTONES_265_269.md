# Milestones 265–269 — Rule and cache boundary hardening

This block continues the same privacy-first hostile-input model. The changes below add repository regression coverage but are **not represented as executed local, package, or browser validation**.

## Milestone 265 — Detached canonical network-rule fields

`normalizeRule()` now snapshots required `kind` / `value` and optional `resourceTypes` through the shared own-enumerable-data boundary after exact schema admission. Caller getters and normal Proxy `get` traps are not used during semantic normalization. The existing 16-entry resource-type ceiling and domain/URL/pattern canonicalization remain unchanged.

## Milestone 266 — Safe bounded cache policy count vectors

v4/v5 cache integrity-count vectors now require four non-negative safe integers. Each component and the combined total must stay within the existing 300,000 raw policy-item ceiling before decoded lengths are compared. Cache versioning and exact count-match semantics are unchanged.

## Milestone 267 — Dense direct cache encoder arrays

Direct `encodeRulePack()` / `encodeCosmeticPack()` inputs now pass through the shared normal-dense-array snapshot before iteration. Sparse/accessor/custom-prototype/extra-property arrays fail before candidate processing, while the existing non-array empty fallback and 300,000-item ceiling remain intact.

## Milestone 268 — Dense legacy cache policy arrays

Legacy `block`, `allow`, `cosmeticHide`, and `cosmeticAllow` arrays are detached during cache-entry admission before work counting or migration. Valid legacy entries still migrate into the current v5 representation; malformed array metadata/accessors fail closed without getter execution.

## Milestone 269 — Documentation and release-gate synchronization

`ROADMAP.md` and draft PR #7 are synchronized through this block. Issue #10 remains the authoritative exact-head Chromium + Firefox release gate. No qualification checkbox is satisfied by connector-created repository changes.

## Preserved invariants

- no telemetry, analytics, browsing/request history, retained match history, page/DOM history, identifiers, or custom Drop Ads backend
- Firefox and Chromium continue sharing the reviewed source line
- no cache format-version change and no expansion of reviewed permissions
- existing raw/cache/network limits and fail-closed policy remain unchanged
- tests added in Milestones 265–269 are repository coverage only; `npm ci`, `npm run check`, packaging, reproducibility/source qualification, and real-browser behavior have not been executed or claimed here
