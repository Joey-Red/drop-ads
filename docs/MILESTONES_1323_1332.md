# Milestones 1323–1332 — Generated-verification read/privacy hardening

This tranche strengthens source-only generated-verification evidence. It does not create, infer, import, or retain Chromium or Firefox observations. **Issue #10 remains the authoritative exact-head browser qualification gate.**

## M1323 — Shared hardening/result read ceilings

The immutable generated-verification audit-limits contract gained exact hardening source/regression ceilings of 256 KiB/128 KiB and result-contract source/regression ceilings of 256 KiB/128 KiB. The existing exact limits regression was reconciled to the expanded contract.

## M1324 — Hardening/result read-limit binding

The legacy generated-verification hardening audit and result-contract audit now consume those shared read ceilings instead of maintaining duplicate numeric authorities. Historical audit result markers remain unchanged.

## M1325 — Shared guidance/privacy/preflight read ceilings

The same immutable limits authority gained the qualification-guide 32 KiB source ceiling, privacy 192 KiB per-source ceiling, audit/preflight 192 KiB source ceiling, and audit/preflight 64 KiB regression ceiling.

## M1326 — Guidance/privacy contract read-limit binding

The canonical qualification-guide contract now derives its byte ceiling from the shared limits authority. Every reviewed privacy-source contract entry likewise uses the shared privacy per-source ceiling while preserving exact deterministic membership/order and the historical aggregate compatibility alias.

## M1327 — Dynamic-execution surface refusal

Reviewed generated-verification audit/support sources now fail closed if they expose `eval`, Function construction, dynamic `import()`, `importScripts`, runtime WebAssembly compile/instantiate, or CommonJS `require()` execution surfaces. The privacy matcher source remains excluded from self-scanning because it intentionally contains the forbidden-pattern literals.

## M1328 — Environment/host-identity surface refusal

Reviewed audit/support sources now fail closed on `process.env`, `process.cwd()`, `node:os`, and hostname/userInfo/homedir identity collection. Normal source-only CLI use of `process.argv` and `process.exitCode` remains available. No environment dump, username, hostname, home directory, or cwd becomes qualification evidence.

## M1329 — Source-derived exact privacy results

The dedicated privacy-result module became the single authority for exact privacy source-result inventory admission. `snapshotGeneratedVerificationPrivacySourceResults` requires complete canonical contract order and descriptor-safe exact `{ path, source, bytes }` snapshots. `freezeGeneratedVerificationPrivacyResultFromSourceResults` computes files and aggregate bytes from that evidence rather than trusting a caller-supplied aggregate.

## M1330 — Live source-derived privacy result binding

Live privacy-audit success now publishes through the source-derived privacy-result constructor and then through descriptor-safe privacy-result resnapshotting. The duplicate local source-result schema was removed. Streaming aggregate accounting remains only as an early fail-closed bound; final published files/bytes are recomputed from exact canonical source evidence.

## M1331 — Composed hardening integration

The bounded audit/preflight hardening gate now derives its own source/regression read ceilings from the shared limits contract, checks the M1323–M1330 source markers/regressions, and preserves the historical frozen M1261 result object plus all prior integration/closeout markers. The source-only integration marker is `canonical M1331 generated verification read/privacy hardening tranche integrated`.

## M1332 — Closeout synchronization

Canonical documentation, result-qualification guidance, the bounded audit/preflight hardening gate, roadmap numbering, and Issue #10 supporting evidence are synchronized through this tranche. The closeout marker is `canonical M1332 generated verification read/privacy hardening closeout verified`.

## Tranche invariants

- Source-only audits, tests, fixtures, marker strings, and generated records never become browser observations or a browser pass.
- Exact-head Chromium and Firefox observations must still be performed and recorded through Issue #10 on the same qualifying source/candidate identity.
- Read ceilings come from one immutable reviewed authority instead of drifting duplicate numeric constants.
- Reviewed generated-verification support code remains bounded, local, read-only, and free of network/process execution, filesystem mutation, dynamic execution, browser persistence/DOM access, and environment/host-identity collection surfaces covered by the privacy audit.
- Privacy success is based on exact canonical source-result snapshots; file membership/order and aggregate bytes are derived from that evidence and fail closed on mismatch.
- Zero telemetry/tracking, browsing/request-history retention, page/DOM snapshots, retained statistics, timestamps, user/device identifiers, embedded credentials, and owned Drop Ads backend behavior remain prohibited.

Connector-created regressions in this tranche were not represented as executed local or browser validation.
