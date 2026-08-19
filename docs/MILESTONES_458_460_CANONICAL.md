# Milestones 458–460 — Canonical remote-stream continuation

This concurrency-safe record follows the canonical M451–457 block. It intentionally avoids replacing `ROADMAP.md` from a stale whole-file snapshot while other continuation writers are active. Connector-created or connector-edited regression coverage described here is repository coverage only and was **not executed locally or in a browser**.

## Milestone 458 — Bound streamed remote-list chunk count

Streamed remote-list bodies admit at most **65,536 nonterminal byte chunks**. Terminal reader results are not counted. The one-over chunk is rejected before byte accounting or UTF-8 decoding and the captured reader cancellation operation is attempted best effort.

The existing **5,000,000-byte** body limit, fatal UTF-8 behavior, timeout, Content-Length, line, line-length, and supported-rule ceilings remain unchanged.

Coverage: `tests/remote-list-chunk-count-v458.test.js`.

## Milestone 459 — Release streamed reader locks on every exit

Reader collaborator admission captures optional receiver-bound `releaseLock` alongside `read` and optional `cancel`. The outer streamed-read cleanup releases the lock best effort after success and every contained failure path. Synthetic readers remain valid without `releaseLock`, and release failure cannot replace the primary read result or error.

Coverage: `tests/remote-reader-release-lock-v459.test.js`.

## Milestone 460 — Canonical remote-stream record and release-gate handoff

This file is the canonical detailed M458–460 record. Supporting remote-stream hardening already present on the branch — intrinsic typed-array byte accounting and the **8,192-character** raw response-header preflight — remains documented in `docs/REMOTE_STREAM_BOUNDARY_RECONCILIATION.md` without consuming canonical milestone numbers.

Draft PR #7 links this record and Issue #10 remains the authoritative exact-head Chromium + Firefox gate. No `npm ci`, `npm run check`, package/release verification, reproducibility verification, source qualification, qualification-record generation, Chromium run, or Firefox run is claimed by this connector-only synchronization.

## Privacy invariants

No telemetry, analytics, browsing/request history, retained blocked-request or matched-element history, page/DOM history, identifiers, cookie-database access, custom backend, new permissions, polling, or remote executable code is introduced.
