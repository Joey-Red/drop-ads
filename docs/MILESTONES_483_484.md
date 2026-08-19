# Milestones 483–484 — Settings generic-result key boundary

This block bounds caller-controlled object-key work inside the already bounded Settings generic-result response tree. It does not change the Firefox/Chromium architecture, reviewed permissions, policy semantics, or zero-retention privacy model.

Connector-created or connector-edited regression coverage in this block is repository coverage only and was **not executed as local/package/browser qualification** in this workflow.

## Milestone 483 — Bound generic-result object keys

Generic Settings runtime-result objects already cap structure at **32 fields per object / 128 array entries / depth 8 / 512 visited values** and strings at **16,384 characters**. Each own string key is now independently capped at **256 characters before recursive label/path construction**.

Keys containing C0 controls, DEL, U+2028, or U+2029 are rejected rather than truncated or normalized. The rejection message does not echo the unsafe key, keeping boundary diagnostics single-line. Prototype-looking strings such as `__proto__`, `constructor`, and `toString` remain valid ordinary data when they satisfy the text bound because successful snapshots are detached into null-prototype objects.

Focused coverage: `tests/options-generic-result-key-v483.test.js`.

## Milestone 484 — Documentation and exact-head release synchronization

`ROADMAP.md`, draft PR #7, and Issue #10 are synchronized after M483. Exact head identity is recorded only in the newest Issue #10 synchronization comment rather than hardcoded in this document or the PR body.

PR #7 remains draft until the same exact head passes the clean machine preflight/package/source-qualification sequence and real Chromium plus Firefox qualification described in Issue #10. Any source commit after browser observation invalidates those observations.

## Privacy and validation invariants

Nothing in M483–484 adds telemetry, analytics, browsing history, request history, retained matched-rule/blocked-request history, page/DOM history, identifiers, polling, a custom Drop Ads backend, new permissions, or retention expansion. No `npm ci`, `npm run check`, package/release/reproducibility/source-qualification command, Chromium run, or Firefox run is claimed as executed by this connector-only block.
