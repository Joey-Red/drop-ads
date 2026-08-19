# Remote stream boundary reconciliation

This note records a set of remote-list streaming hardening changes that landed while multiple independent milestone writers were extending `agent/bootstrap-core`. It deliberately does **not** renumber or replace the canonical milestone sequence in `ROADMAP.md` or the existing `docs/MILESTONES_*.md` records.

## Stream byte accounting

Streamed `Uint8Array` chunks are still admitted non-coercively, but byte accounting no longer reads a caller-shadowable `chunk.byteLength` property. The implementation invokes the intrinsic typed-array byte-length getter against the admitted view. This preserves normal `Uint8Array`/subclass behavior while proxy-wrapped, detached, or invalid views fail closed. The existing **5,000,000-byte** remote body ceiling remains authoritative.

Coverage includes `tests/list-updates-chunk-byte-length-v456.test.js` and `tests/remote-stream-byte-length-v456.test.js`.

## Response-header preflight

Captured remote response header values are primitive strings and are capped at **8,192 raw characters** before `content-type` normalization or `content-length` trim/regex/number parsing. Missing headers remain supported, and existing document-media rejection plus Content-Length byte preflight semantics are unchanged.

Coverage includes `tests/list-updates-header-bound-v457.test.js` and `tests/remote-response-header-bound-v457.test.js`.

## Stream fragmentation work bound

A remote streamed body may contain at most **65,536 admitted nonterminal byte chunks**. Terminal reader results do not consume this budget. One-over is rejected before byte accounting and UTF-8 decoding and triggers best-effort reader cancellation. This complements, rather than replaces, the total-byte, timeout, UTF-8, line, and supported-rule ceilings.

Coverage includes `tests/list-updates-chunk-count-v458.test.js`, `tests/remote-stream-chunk-count-v458.test.js`, and later runtime-alignment coverage.

## Reader lock release

The streamed-reader boundary captures optional receiver-bound `releaseLock` with the already captured `read` and `cancel` operations. The reader lock is released best effort from the outer read cleanup path after both successful and failed reads. Release failure cannot replace the primary result/error, and synthetic readers are not required to expose `releaseLock`.

Coverage includes `tests/list-updates-reader-release-v459.test.js`, `tests/remote-reader-release-lock-v459.test.js`, `tests/remote-stream-reader-lock-v459.test.js`, and later runtime-alignment coverage.

## Validation and privacy status

The coverage above is repository coverage only. Connector-created or connector-edited tests were **not executed** in this workflow. No `npm ci`, repository test suite, package/release verification, reproducibility verification, source qualification, Chromium run, or Firefox run is claimed.

These changes add no telemetry, analytics, browsing/request history, retained matched-rule statistics, identifiers, custom backend, remote executable code, permission expansion, or retention expansion. Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate and PR #7 remains draft until that gate is satisfied.
