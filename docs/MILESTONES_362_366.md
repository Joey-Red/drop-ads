# Milestones 362–366 — Selector identity and cosmetic stylesheet work bounds

This block closes two content-side correctness/work-bound gaps without changing Drop Ads privacy, permissions, retention, or release policy. Connector-created regression files are repository coverage only and were not executed as local or browser validation here.

## Milestone 362 — Bind selector uniqueness to the selected element

Picker selector uniqueness no longer means merely “the query returned one node.” `selector-utils.js` now also requires that sole query result to be the exact selected element. A detached/racing target, hostile direct document collaborator, or wrong single match therefore fails closed instead of saving a selector for a different node.

Repository coverage: `tests/content-selector-target-identity-v362.test.js`.

## Milestone 363 — Require real element ancestry in selector sibling accounting

Selector ancestry now accepts `parentElement` only when it is an actual element node, and `nth-of-type()` counting ignores sibling-shaped non-elements. Existing bounds remain unchanged: numeric indexed traversal, at most 10,000 children inspected, at most five ancestor levels, and the 400-character selector ceiling.

Repository coverage: `tests/content-selector-real-element-siblings-v363.test.js`.

## Milestone 364 — Reject oversized stylesheet strings before UTF-8 allocation

Content cosmetic policy replies now reject stylesheet strings whose UTF-16 length already exceeds the existing 256 KiB stylesheet byte ceiling before invoking `TextEncoder`. The exact UTF-8 byte check remains authoritative afterward, so multibyte strings still receive the reviewed byte-accurate bound.

Repository coverage: `tests/content-cosmetic-stylesheet-preflight-v364.test.js`.

## Milestone 365 — Bound stylesheet selector parsing by declared count

Canonical cosmetic stylesheet validation no longer splits the entire stylesheet before checking the declared selector count. It scans `,\n` separators incrementally and materializes at most the existing 2,048 declared selector candidates. Missing or surplus separators fail before deduplication and selector grammar validation.

Repository coverage: `tests/content-cosmetic-stylesheet-count-parse-v365.test.js`.

## Milestone 366 — Documentation and exact-head gate synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized to this block. Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate. PR #7 remains draft; repository coverage is not represented as executed local/browser validation.

## Privacy/release invariants retained

- zero telemetry, analytics, browsing/request history, matched-element/page history, identifiers, or custom Drop Ads backend
- no new permissions or external runtime code
- no increase in selector, stylesheet, DOM-target, or page-content retention
- no claim that `npm ci`, `npm run check`, packaging, reproducibility, source qualification, or browser qualification was executed in this connector-only block
- any later source commit still invalidates earlier browser observations
