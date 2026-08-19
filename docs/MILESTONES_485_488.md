# Milestones 485–488 — Settings stale-completion ordering

This block follows the canonical M483–484 Settings generic-result key boundary and prevents older asynchronous committed-state reads from overwriting newer Settings views. It preserves direct-control usability, existing live-sync coalescing, bounded error handling, and the no-polling privacy model. Historical regression filename suffixes reflect overlapping concurrent numbering and are retained as repository evidence. Connector-created or connector-edited coverage described here was **not executed locally, packaged, or browser-qualified**.

## Milestone 485 — Cosmetic committed-render generation safety

Every Cosmetic Settings committed-state render receives a monotonically increasing generation before `loadState()`. Only the newest generation may replace the hide/allow rule lists or count as a successful post-mutation refresh. A slower older completion returns `false` without overwriting the newer committed view or triggering focus follow-up.

Coverage: `tests/options-cosmetic-render-generation-v476.test.js`.

## Milestone 486 — Country committed-render generation safety

Country Settings applies the same generation rule. Only the newest asynchronous `loadState()` completion may update `latestState`, replace country rows, schedule personal-list relabeling, or count as a successful refresh. Stale completions are no-ops while render-queue recovery, still-connected control restoration, focus behavior, and relabel semantics remain unchanged.

Coverage: `tests/options-country-render-generation-v477.test.js`.

## Milestone 487 — Protection-action committed-refresh generation safety

Protection action-count live synchronization assigns a monotonically increasing generation to each committed-preference read. Only the newest read may publish checkbox or refresh-error state. Beginning a direct checkbox mutation invalidates already-started live refreshes, and a live completion observed while a mutation is active is ignored. Initial load, mutation recovery, unsupported-browser degradation, browser-owned aggregate semantics, and zero request observation/retention remain unchanged.

Coverage: `tests/options-action-count-refresh-generation-v478.test.js`.

## Milestone 488 — Documentation and exact-head release-gate synchronization

This milestone records M485–487, reconciles their temporary historical suffixes with the canonical ROADMAP sequence, synchronizes draft PR #7 without hardcoding the branch head in PR metadata, reconciles obsolete parallel synchronization tracking, and records the resulting exact branch head on Issue #10.

PR #7 remains draft and Issue #10 remains open until the clean exact-head machine preflight and real Chromium plus Firefox matrix are completed against the same generated package hashes. No `npm ci`, `npm run check`, package/release verification, reproducibility check, source qualification, qualification-record generation, Chromium run, or Firefox run is claimed by this connector-only block. GitHub-hosted Actions runner allocation remains externally blocked by the account billing/spending-limit state; that is neither product failure nor successful qualification.

These milestones add no telemetry, analytics, browsing/request history, retained matched-rule/element/page history, identifiers, polling, custom backend, new permissions, remote executable code, or retention expansion.
