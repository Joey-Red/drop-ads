# Milestones 1389–1398 — Qualification observation writer/privacy/result integrity

This tranche hardens local qualification-observation support code. It is source/preflight evidence only. Issue #10 remains the authoritative exact-head Chromium + Firefox runtime qualification gate; none of these milestones create browser observations.

## M1389 — Canonical writer option values

Atomic observation writer options now require canonical absolute repository roots and well-formed bounded expected-current text before publication work.

## M1390 — Fsynced temporary byte readback

The fsynced temporary observation is identity-safely reread and must equal canonical serialization exactly before rename, with temporary identity revalidated around the read.

## M1391 — Final published byte readback

The renamed final target is identity-safely reread and must equal canonical serialization exactly, then its identity is reverified against the fsynced temporary file before success.

## M1392 — Dynamic execution/subprocess refusal

The observation privacy audit refuses child-process and worker-thread modules, dynamic import, eval, Function constructors, and direct process termination surfaces through the existing immutable stateless matcher machinery.

## M1393 — Complete privacy source evidence

Privacy success now publishes a frozen canonical `{ path, bytes }` source-evidence array covering every hardening-contract source in exact order.

## M1394 — Descriptor-safe privacy child result

The canonical hardening gate descriptor-snapshots the complete frozen privacy result, revalidates its evidence/count/aggregate, and requires exact historical and M1392/M1393 markers before consuming them.

## M1395 — Descriptor-safe publication child result

The canonical hardening gate descriptor-snapshots the exact frozen publication child result and requires its reviewed-source count plus exact historical publication markers before consumption.

## M1396 — Writer normalization/readback integration

The hardening gate explicitly locks canonical writer-root/expected-current normalization and the fsync/temp-readback/rename/final-readback identity ordering.

## M1397 — Descriptor-safe hardening source contract

The nine-source hardening inventory is constructed through a frozen dense descriptor-safe snapshot with exact canonical `path`/`maxBytes` entries, duplicate/path alias refusal, and an aggregate ceiling derived from validated membership.

## M1398 — Closeout synchronization

The hardening gate exposes `canonical M1397 qualification observation hardening source contract verified` and `canonical M1398 qualification observation writer/privacy/result/source-contract integrity closeout verified`; ROADMAP and Issue #10 supporting evidence are synchronized.

## Tranche invariants

- Issue #10 remains authoritative for real exact-head Chromium and Firefox observations.
- Connector-created source tests/audits are not represented as executed browser evidence.
- No telemetry, analytics, browsing/request history, page/DOM snapshots, retained statistics, timestamps, user/device identifiers, host/user/environment profiling, embedded credentials/tokens, or owned Drop Ads backend behavior is introduced.
- Qualification observation publication remains local, bounded, strict-UTF8, identity-bound, and fail-closed.
