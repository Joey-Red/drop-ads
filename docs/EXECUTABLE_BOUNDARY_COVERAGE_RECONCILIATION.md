# Executable boundary coverage reconciliation

Multiple continuation writers extended `agent/bootstrap-core` concurrently around the remote-stream, message-guard, and import-guard hardening blocks. This note records additional executable repository coverage without changing or renumbering the canonical milestone history in `ROADMAP.md` or the existing detailed milestone records.

## Message-guard runtime ownership

`tests/message-guard-runtime-ownership-v458.test.js` exercises the already-landed captured `runtime.onMessage` ownership boundary. It verifies that captured add/remove operations retain the original event receiver after later collaborator mutation and that an accessor-backed runtime namespace is rejected without executing its getter.

Canonical message-guard behavior remains documented in `docs/MILESTONES_461_465.md`.

## Remote-stream fragmentation

`tests/list-stream-chunk-runtime-v459.test.js` exercises the exact **65,536 nonterminal chunk** boundary at runtime: the exact limit followed by terminal completion is accepted, while one-over fails closed and invokes captured cancellation best effort. The independent **5,000,000-byte**, timeout, header, fatal UTF-8, parser, and supported-rule bounds remain unchanged.

The remote-stream implementation record remains `docs/REMOTE_STREAM_BOUNDARY_RECONCILIATION.md` and the existing detailed stream notes.

## Streamed reader lock release

`tests/list-stream-release-lock-runtime-v460.test.js` exercises successful and failure-path reader-lock release. It verifies the originally captured `releaseLock` operation is used even after later mutation, invalid streamed data still performs best-effort cancellation plus lock release, and cleanup failure cannot replace the primary successful result.

## Import-guard runtime ownership

`tests/import-guard-runtime-ownership-runtime-v461.test.js` exercises captured import-guard runtime/event ownership and forwarding. It verifies add/remove listener operations retain their original event receiver, forwarded runtime methods use receiver-preserving invocation without reading callback-owned `.bind`, and accessor-backed runtime namespace admission fails without getter execution.

## Validation and privacy status

These files were added through the GitHub connector and are **repository coverage only**. They were not executed locally or in a browser in this workflow. No `npm ci`, `npm run check`, package/release verification, reproducibility verification, source qualification, qualification-record generation, Chromium run, or Firefox run is claimed.

No telemetry, analytics, browsing/request history, retained match/page/DOM history, identifiers, custom backend, permission expansion, remote executable code, or retention expansion is introduced. Draft PR #7 remains draft and Issue #10 remains the authoritative exact-head Chromium + Firefox qualification gate.
