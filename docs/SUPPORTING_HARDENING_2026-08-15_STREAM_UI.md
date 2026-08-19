# Supporting hardening — stream, collaborator, and UI recovery block

This note records a concurrent hardening block that landed while canonical milestone numbering was being reconciled. It intentionally does not redefine the canonical ROADMAP sequence or overwrite `docs/MILESTONES_456_460.md`.

## Streamed remote-list work bounds

- Nonterminal streamed response chunks are capped at **65,536**. The one-over chunk is rejected before byte accounting / UTF-8 decode work and the reader is cancelled best effort.
- Terminal reader results do not consume the chunk budget.
- Captured readers may expose an optional receiver-bound `releaseLock`; when present it is called best effort from the outer read `finally` on success and contained failure paths.
- Lock-release failure cannot replace the primary read result or error.
- Existing **5,000,000-byte** download, fatal UTF-8, **30,000 ms default / 120,000 ms maximum** timeout, bounded response-header, Content-Length, parser line/rule, and public-source admission limits remain unchanged.

Focused repository coverage includes `tests/remote-list-chunk-count-v458.test.js` and `tests/list-updates-reader-release-v459.test.js`.

## Browser collaborator ownership

- Optional background feature registrations retain captured disposer records rather than caller-owned registration objects. Registration bookkeeping uses intrinsic Map branding and intrinsic `set` / `entries` / `clear` operations so later Map instance/prototype mutation cannot redirect teardown.
- Context-feedback captures browser namespaces, events, and methods through bounded descriptor/prototype data inspection and invokes captured methods with their original receivers through `Reflect.apply`.
- Session persistence similarly captures `storage`, `storage.session`, and required `get` / `set` methods without normal getter access or callback-owned `.bind`.
- Guarded runtime forwarding preserves the runtime receiver with `Reflect.apply` rather than reading function-owned `.bind`; `onMessage` remains the sole guarded substitution.

Focused repository coverage includes `tests/background-bootstrap-map-teardown-v452.test.js`, `tests/context-feedback-namespace-capture-v453.test.js`, `tests/session-storage-collaborators-v450.test.js`, and `tests/message-guard-runtime-forward-v459.test.js`.

## Country Settings recovery

Country remove/mode mutations retain the owning row/control during the operation, expose row `aria-busy`, and release the original control in `finally` only when it remains connected. A successful rerender replaces the row, so detached controls are not mutated. This prevents a failed post-commit refresh from leaving a stale country control permanently disabled while preserving committed-success status wording and policy transaction behavior.

Focused repository coverage: `tests/country-control-recovery-v463.test.js`.

## Validation statement

Connector-created or connector-edited regression coverage in this block was **not executed** here. No claim is made that `npm ci`, `npm run check`, packaging, release verification, reproducibility, source qualification, qualification-record generation, Chromium behavior, or Firefox behavior passed on this head.

PR #7 remains draft and Issue #10 remains the authoritative exact-head Chromium + Firefox release gate. No telemetry, analytics, browsing/request history, retained matched-rule statistics, identifiers, custom backend, permission expansion, polling, or retention expansion was introduced.
