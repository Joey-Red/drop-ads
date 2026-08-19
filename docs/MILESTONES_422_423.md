# Milestones 422–423 — Core and context lifecycle completion

This follow-on block extends the canonical M417–421 background lifecycle work without changing Drop Ads privacy, permissions, blocking precedence, list sources, or retention behavior. Connector-created/edited regression coverage remains repository coverage only and was **not executed as local/package/browser qualification** in this workflow.

## Milestone 422 — Background-core ownership and click snapshot integrity

The background core now owns stable identities for every install/startup/context-menu/alarm/message/storage listener registered by `start()`. Listener installation is transactional, exact event collaborators are retained for teardown, and an idempotent `dispose()` marks the runtime inert before best-effort removal. A disposed runtime cannot be restarted, while repeated `start()` remains idempotent before disposal. Browser-retained stale callbacks are inert because every handler checks disposed lifecycle state.

Context-feedback click handling was hardened in the same lifecycle sequence: `menuItemId`, the selected target URL, and optional `frameId` are detached from one descriptor-safe event snapshot, and both the normalized local rule key and retained cleanup target are derived from that same snapshot. Mutable event descriptors therefore cannot split the committed rule identity from the DOM cleanup target.

Supporting optional-feature teardown admission now requires ordinary/null-prototype registration records; a present `dispose` must be an own enumerable data function and is captured/bound once into a detached registration record.

Coverage includes `tests/runtime-core-listener-teardown-v421.test.js`, `tests/context-feedback-click-snapshot-v419.test.js`, and `tests/background-bootstrap-optional-disposer-boundary-v422.test.js` (historical filenames retained where numbering moved during concurrent consolidation).

## Milestone 423 — Captured context-feedback browser collaborators

Context feedback captures and receiver-binds its action-title collaborator plus optional badge, tab-message, and local-state-read collaborators once during installation. Later mutation of the injected/browser API namespace cannot redirect visible-status updates, exact-target cleanup, or repeated-block state recovery to a different method or receiver.

Existing failure isolation remains unchanged: synchronous throws and rejected browser calls stay inside the reviewed status/cleanup fallback paths; the **128 pending / 128 visible / 60,000 ms** ceilings remain in force; browser-owned Protection-actions behavior remains independent; no request events or browsing/request history are observed or retained.

Coverage: `tests/context-feedback-browser-collaborators-v423.test.js`.

## Release-gate status

PR #7 remains draft and Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate. Repository regression coverage is preflight only. No `npm ci`, `npm run check`, package/release verification, reproducibility verification, source qualification, qualification-record generation, or real-browser qualification result is claimed from connector-only changes.

No milestone in this block introduces telemetry, analytics, browsing/request history, retained blocked-request or matched-element history, page/DOM snapshots, identifiers, cookie-database access, a custom Drop Ads backend, remote executable code, or permission expansion.
